import joblib
import pandas as pd
import numpy as np

MODEL_PATH = 'artifacts/credit_risk.joblib'
model_data = joblib.load(MODEL_PATH)
model = model_data['model']
scaler = model_data['scaler']
features = model_data['features']
cols_to_scale = model_data['cols_to_scale']

LOGIT_MIN = -10.0
LOGIT_MAX = 10.0


def prepare_df(
    age, income, loan_amount, loan_tenure_months,
    credit_utilization_ratio, delinquent_ratio,
    avg_dpd_per_delinquency, num_open_accounts,
    residence_type, loan_purpose, loan_type
):
    input_data = {
        'age': age,
        'loan_tenure_months': loan_tenure_months,
        'number_of_open_accounts': num_open_accounts,
        'credit_utilization_ratio': credit_utilization_ratio,
        'loan_to_income': loan_amount / income if income > 0 else 0,
        'delinquent_ratio': delinquent_ratio,
        'avg_dpd_per_delinquency': avg_dpd_per_delinquency,

        'residence_type_Owned': 1 if residence_type == 'Owned' else 0,
        'residence_type_Rented': 1 if residence_type == 'Rented' else 0,
        'loan_purpose_Education': 1 if loan_purpose == 'Education' else 0,
        'loan_purpose_Home': 1 if loan_purpose == 'Home' else 0,
        'loan_purpose_Personal': 1 if loan_purpose == 'Personal' else 0,
        'loan_type_Unsecured': 1 if loan_type == 'Unsecured' else 0,

        'number_of_dependants': 0,
        'years_at_current_address': 5,
        'zipcode': 12345,
        'sanction_amount': loan_amount,
        'processing_fee': 0,
        'gst': 0,
        'net_disbursement': loan_amount,
        'principal_outstanding': loan_amount,
        'bank_balance_at_application': 100000,
        'number_of_closed_accounts': 0,
        'enquiry_count': 0,
    }

    df = pd.DataFrame([input_data])

    df[cols_to_scale] = scaler.transform(df[cols_to_scale])

    df = df[features]

    return df


def calculate_credit_score(input_df, base_score=300, scale_length=600):
    # Use model's own probability — don't recompute manually
    default_probability = model.predict_proba(input_df)[:, 1][0]

    # Back-derive logit from probability (single source of truth)
    # Clip probability away from 0/1 to avoid log(0)
    prob_clipped = np.clip(default_probability, 1e-10, 1 - 1e-10)
    logit = np.log(prob_clipped / (1 - prob_clipped))

    # Clip logit for score normalization
    logit_clipped = np.clip(logit, LOGIT_MIN, LOGIT_MAX)

    # Higher logit = higher default risk = lower score
    normalized = (LOGIT_MAX - logit_clipped) / (LOGIT_MAX - LOGIT_MIN)

    credit_score = base_score + normalized * scale_length

    rating = _get_rating(credit_score)

    return default_probability, int(credit_score), rating


def _get_rating(score):
    if score > 750:
        return 'Excellent'
    elif score > 650:
        return 'Good'
    elif score > 500:
        return 'Average'
    elif score >= 300:
        return 'Poor'
    else:
        return 'Undefined'


def predict(
    age, income, loan_amount, loan_tenure_months,
    credit_utilization_ratio, delinquent_ratio,
    avg_dpd_per_delinquency, num_open_accounts,
    residence_type, loan_purpose, loan_type
):
    df = prepare_df(
        age, income, loan_amount, loan_tenure_months,
        credit_utilization_ratio, delinquent_ratio,
        avg_dpd_per_delinquency, num_open_accounts,
        residence_type, loan_purpose, loan_type
    )

    probability, credit_score, rating = calculate_credit_score(df)

    return probability, credit_score, rating