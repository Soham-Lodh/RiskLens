# RiskLens

> **Institutional-grade credit default risk prediction — end-to-end ML pipeline to deployed full-stack application.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-credit--default--risklens.vercel.app-blue)](https://credit-default-risklens.vercel.app/)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [ML Pipeline](#ml-pipeline)
4. [Model Performance](#model-performance)
5. [API Reference](#api-reference)
6. [Project Structure](#project-structure)
7. [Local Development](#local-development)
8. [Tech Stack](#tech-stack)

---

## Overview

**RiskLens** is a full-stack, production-deployed credit risk intelligence platform that predicts loan default probability using a rigorously engineered ML pipeline. The backend exposes a FastAPI REST API serving an Optuna-tuned Logistic Regression model (CV Macro F1: **0.9776**, AUC-ROC: **0.9834**, Gini: **0.9668**, KS Statistic: **85.91**) trained on 50,000 records across three relational data sources. The pipeline covers stratified splitting, domain-rule outlier removal, VIF-based multicollinearity elimination, WoE/IV feature selection, SMOTETomek class-imbalance resampling, Bayesian hyperparameter optimisation via Optuna (50 trials, TPE), SHAP explainability, and a logit-space credit scoring algorithm mapping default probability to a 300–900 scale. The React + Vite frontend is deployed on Vercel; the API is deployed on Render.

**Tech Stack:** Python · scikit-learn · XGBoost · Optuna · imbalanced-learn (SMOTETomek) · SHAP · pandas · NumPy · statsmodels · joblib · FastAPI · Pydantic · Uvicorn · React · Vite · Tailwind CSS · Vercel · Render

**Key capabilities:**

- Real-time default probability inference via REST API
- Logit-space credit score generation (300–900 scale)
- Four-tier risk classification aligned with institutional lending standards
- Full model explainability via SHAP values
- Pydantic-validated API with CORS support for cross-origin frontend access

---

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│        Frontend             │        │           Backend                │
│   React + Vite              │  HTTP  │   FastAPI + Uvicorn              │
│   Tailwind CSS              │ ──────▶│   prediction_helper.py           │
│   Deployed: Vercel          │  POST  │   artifacts/credit_risk.joblib   │
│                             │◀────── │   Deployed: Render               │
└─────────────────────────────┘  JSON  └──────────────────────────────────┘
                                                      │
                                         ┌────────────▼───────────┐
                                         │   credit_risk.joblib   │
                                         │   ├── model (LR)       │
                                         │   ├── scaler (MMS)     │
                                         │   ├── features (index) │
                                         │   └── cols_to_scale    │
                                         └────────────────────────┘
```

**Inference flow:**

1. Frontend submits 12 applicant fields via `POST /predict_credit_risk`
2. FastAPI computes two derived features (`delinquent_ratio`, `avg_dpd_per_delinquency`) before passing to the prediction helper
3. `prediction_helper.py` assembles the full feature vector, applies the fitted `MinMaxScaler`, aligns columns to the training schema, and calls `model.predict_proba()`
4. The raw probability is back-transformed through logit space and mapped to a 300–900 credit score
5. Response returns `default_probability`, `credit_score`, and `rating`

---

## ML Pipeline

The notebook (`Credit_Default_ML_Model_Documented.ipynb`) documents an 18-stage pipeline. Key decisions are explained below.

### Dataset

Three CSV files joined on `cust_id` (inner join, one-to-one):

| File | Contents | Shape |
|------|----------|-------|
| `customers.csv` | Demographics: age, gender, income, employment status, residence | (50000, 12) |
| `loans.csv` | Loan details: amount, tenure, processing fee, GST, disbursement date | (50000, 15) |
| `bureau_data.csv` | Credit bureau: DPD, delinquency months, open/closed accounts, utilisation | (50000, 8) |

**Target:** `default` — binary (1 = defaulted, 0 = did not default). Class distribution: 45,703 non-default / 4,297 default (~10.6% positive rate).

### Stage-by-Stage Summary

**Train-Test Split (Pre-EDA)**
Split performed *before* any EDA or imputation (70/30, stratified on `default`, `random_state=42`) to prevent data leakage. All downstream statistics derived exclusively from the training set.

**Missing Value Treatment**
`residence_type` had 44 missing values in the training split. Mode imputation applied (`'Owned'` = dominant category). Mode computed from training set only; applied identically to test.

**Outlier Removal (Domain-Rule Based)**
Statistical outlier methods (IQR, z-score) were rejected in favour of business-rule filtering:
- Records where `processing_fee / loan_amount > 0.03` removed (violates standard 1–3% lending cap). 5 records removed.
- GST verified to be within the 18% legal ceiling (no removals required).
- Typo `'Personaal'` in `loan_purpose` corrected to `'Personal'`.

**Feature Engineering**
Three domain-informed ratio features constructed:

| Feature | Formula | Rationale |
|---------|---------|-----------|
| `loan_to_income` | `loan_amount / income` | Debt burden relative to earnings |
| `delinquent_ratio` | `(delinquent_months / total_loan_months) × 100` | Proportion of loan life in arrears |
| `avg_dpd_per_delinquency` | `total_dpd / delinquent_months` (0 if no delinquency) | Severity of each missed payment |

Source columns used to construct these features were subsequently dropped to prevent multicollinearity.

**Multicollinearity Removal — VIF**
`MinMaxScaler` applied to numeric features; VIF computed via `statsmodels.variance_inflation_factor`. Five features with VIF > 10 dropped (`sanction_amount`, `processing_fee`, `gst`, `net_disbursement`, `principal_outstanding`) — all financially correlated with `loan_amount`.

**Feature Selection — Weight of Evidence & Information Value**
WoE/IV computed for all remaining features. Features with IV ≤ 0.02 dropped as non-predictive. 10 features retained:

| Feature | IV | Predictive Power |
|---------|----|-----------------|
| `credit_utilization_ratio` | 2.3821 | Very Strong |
| `delinquent_ratio` | 0.7103 | Strong |
| `loan_to_income` | 0.4704 | Strong |
| `avg_dpd_per_delinquency` | 0.4061 | Strong |
| `loan_purpose` | 0.3732 | Strong |
| `residence_type` | 0.2417 | Medium |
| `loan_tenure_months` | 0.2186 | Medium |
| `loan_type` | 0.1634 | Medium |
| `number_of_open_accounts` | 0.0852 | Weak |
| `age` | 0.0829 | Weak |

**Encoding**
Remaining categorical features one-hot encoded with `drop_first=True` to avoid the dummy variable trap. Final feature matrix: **(34,989 × 13)**.

**Class Imbalance — SMOTETomek**
Original training distribution: 31,981 non-default / 3,008 default. SMOTETomek (hybrid SMOTE oversampling + Tomek link undersampling) applied to training set only. Resampled distribution: 31,911 / 31,911.

**Baseline Modelling**
Four models evaluated at default hyperparameters on the imbalanced training set: Logistic Regression, Random Forest, XGBoost, Decision Tree (constrained). All achieved ~96% accuracy on the imbalanced test set; minority-class recall was the limiting factor, motivating resampling.

**Hyperparameter Tuning — RandomizedSearchCV**
`RandomizedSearchCV` (5-fold CV, F1 scoring, `n_iter=30–50`) run for LR, DT, and XGBoost. Best XGBoost CV F1: **0.7786**.

**Bayesian Optimisation — Optuna (TPE)**
Optuna with Tree-structured Parzen Estimator run for 50 trials per model on the SMOTETomek-balanced training set, maximising macro F1:

| Model | Optuna Best CV Macro F1 | Trials | CV Folds |
|-------|------------------------|--------|----------|
| Logistic Regression | **0.9776** | 50 | 5 |
| XGBoost | 0.9761 | 50 | 3 |

Logistic Regression selected as the final model — higher CV macro F1, faster inference, interpretable coefficients, and smaller memory footprint. Solver–penalty compatibility enforced by pruning invalid combinations (`lbfgs` + L1) via `optuna.TrialPruned()`.

**Final model parameters:** `solver='lbfgs'`, `penalty='l2'`, `C=95.15`, `tol=0.000113`, `max_iter=5000`

**SHAP Explainability**
`shap.Explainer` fitted on the SMOTETomek training set. SHAP summary plot generated on the test set, ranking features by mean absolute SHAP value. Boolean dummy columns explicitly cast to `int` before passing to SHAP.

**Model Export**
Serialised to `./artifacts/credit_risk.joblib` using `joblib`. Bundle contains: trained model, fitted `MinMaxScaler`, expected feature column index, and `cols_to_scale` index.

---

## Model Performance

Evaluated on the original (unresampled) held-out test set of **14,996 samples**.

### Final Model — Logistic Regression (Optuna-tuned, SMOTETomek)

| Metric | Value |
|--------|-------|
| CV Macro F1 (5-fold) | **0.9776** |
| AUC-ROC | **0.9834** |
| Gini Coefficient | **0.9668** |
| Max KS Statistic | **85.91** |
| Weighted F1 (test set) | 0.94 |
| Accuracy (test set) | 93.2% |
| Recall — Default class | 0.94 |
| Precision — Default class | 0.56 |

### Decile / Rank Order Table

| Decile | Event Rate | Cum Event Rate | KS |
|--------|-----------|----------------|----|
| 9 (Highest Risk) | 72.13% | 83.94% | 80.89 |
| 8 | 12.54% | 98.53% | **85.91** |
| 7 | 0.87% | 99.53% | 76.07 |
| 6 | 0.40% | 100.00% | 65.65 |
| 5–0 | 0.00% | 100.00% | — |

KS of **85.91** (benchmark: >60 = excellent) confirms the model concentrates nearly all defaults in the top two deciles.

### Credit Score Mapping

Default probability is converted to a credit score via a logit-space transformation:

```
logit = ln(p / (1 - p))         # back-derived from model probability
logit_clipped = clip(logit, -10, 10)
normalized = (10 - logit_clipped) / 20
credit_score = 300 + normalized × 600   # maps to 300–900
```

| Score Band | Rating | Classification |
|-----------|--------|----------------|
| > 750 | Excellent | Prime Borrower |
| 651–750 | Good | Near-Prime Borrower |
| 501–650 | Average | Sub-prime Risk |
| 300–500 | Poor | High Default Risk |

---

## API Reference

Base URL: configured via `VITE_API_URL` environment variable.

### `GET /model_status`

Health check confirming the model artifact is loaded.

**Response**
```json
{ "model": "credit_risk", "status": "loaded" }
```

---

### `POST /predict_credit_risk`

Accepts applicant data and returns default probability, credit score, and risk rating.

**Request Body**

| Field | Type | Constraints |
|-------|------|-------------|
| `age` | int | 18 ≤ age < 100 |
| `income` | float | > 0 |
| `loan_amount` | float | > 0 |
| `loan_tenure_months` | int | > 0 |
| `credit_utilization_ratio` | float | — |
| `total_loan_months` | int | > 0 |
| `delinquent_months` | int | ≥ 0 |
| `total_dpd` | int | ≥ 0 |
| `num_open_accounts` | int | ≥ 0 |
| `residence_type` | str | `"Owned"` \| `"Rented"` \| `"Mortgage"` |
| `loan_purpose` | str | `"Education"` \| `"Home"` \| `"Personal"` \| `"Auto"` |
| `loan_type` | str | `"Secured"` \| `"Unsecured"` |

**Response**

```json
{
  "default_probability": 0.043,
  "credit_score": 761,
  "rating": "Excellent"
}
```

**Example Request**

```bash
curl -X POST https://<your-api-url>/predict_credit_risk \
  -H "Content-Type: application/json" \
  -d '{
    "age": 34,
    "income": 900000,
    "loan_amount": 300000,
    "loan_tenure_months": 36,
    "credit_utilization_ratio": 22,
    "total_loan_months": 60,
    "delinquent_months": 0,
    "total_dpd": 0,
    "num_open_accounts": 2,
    "residence_type": "Owned",
    "loan_purpose": "Home",
    "loan_type": "Secured"
  }'
```

---

## Project Structure

```
risklens/
├── backend/
│   ├── main.py
│   ├── prediction_helper.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── Credit_Default_ML_Model_Documented.ipynb
│   └── artifacts/
│       └── credit_risk.joblib
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

---

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Frontend available at `http://localhost:5173`.

---

## Tech Stack

### Machine Learning & Data

| Library | Version | Role |
|---------|---------|------|
| scikit-learn | 1.7.2 | Logistic Regression, MinMaxScaler, cross-validation, metrics |
| XGBoost | 3.2.0 | Gradient boosting baseline and Optuna candidate |
| imbalanced-learn | 0.14.1 | SMOTETomek hybrid resampling |
| Optuna | 4.9.0 | Bayesian hyperparameter optimisation (TPE, 50 trials) |
| SHAP | 0.49.1 | Model explainability (Shapley values) |
| statsmodels | 0.14.6 | Variance Inflation Factor (VIF) |
| pandas | 2.2.3 | Data manipulation, WoE/IV computation, feature engineering |
| NumPy | 2.2.6 | Numerical operations, logit transformation |
| joblib | 1.5.3 | Model serialisation |

### Backend

| Library | Version | Role |
|---------|---------|------|
| FastAPI | 0.136.3 | REST API framework |
| Uvicorn | 0.32.0 | ASGI server |
| Pydantic | 2.9.2 | Request/response validation and schema enforcement |

### Frontend

| Library | Version | Role |
|---------|---------|------|
| React | 19.2.6 | UI framework |
| Vite | 8.0.12 | Build tool and dev server |
| Tailwind CSS | 4.3.0 | Utility-first styling |

### Deployment

| Service | Target |
|---------|--------|
| Vercel | React frontend |
| Render | FastAPI backend |

---

## License

MIT © 2026 Soham Lodh