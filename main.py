import streamlit as st
from prediction_helper import predict

st.set_page_config(
    page_title="Credit Default Prediction",
    page_icon="💳",
    layout="wide"
)

st.title("💳 Credit Default Risk Assessment")

st.caption(
    "Estimate the probability of credit default using customer, loan, and credit history information."
)

# ------------------------
# CUSTOMER PROFILE
# ------------------------

st.subheader("Customer Profile")

col1, col2, col3 = st.columns(3)

with col1:
    age = st.number_input(
        "Age",
        min_value=18,
        max_value=100,
        value=30
    )

with col2:
    income = st.number_input(
        "Annual Income (₹)",
        min_value=0.0,
        value=50000.0,
        step=1000.0
    )

with col3:
    num_open_accounts = st.number_input(
        "Open Loan Accounts",
        min_value=1,
        value=2
    )

# ------------------------
# LOAN DETAILS
# ------------------------

st.subheader("Loan Details")

col1, col2, col3 = st.columns(3)

with col1:
    loan_amount = st.number_input(
        "Loan Amount (₹)",
        min_value=0.0,
        value=10000.0,
        step=1000.0
    )

with col2:
    loan_tenure_months = st.number_input(
        "Loan Tenure (Months)",
        min_value=1,
        value=36
    )

with col3:
    credit_utilization_ratio = st.slider(
        "Credit Utilization (%)",
        0,
        100,
        30
    )

# ------------------------
# CREDIT HISTORY
# ------------------------

st.subheader("Credit History")

col1, col2, col3 = st.columns(3)

with col1:
    total_loan_months = st.number_input(
        "Total Loan Months",
        min_value=1,
        value=24
    )

with col2:
    delinquent_months = st.number_input(
        "Delinquent Months",
        min_value=0,
        value=2
    )

with col3:
    total_dpd = st.number_input(
        "Total DPD",
        min_value=0,
        value=40
    )

# ------------------------
# LOAN ATTRIBUTES
# ------------------------

st.subheader("Loan Attributes")

col1, col2, col3 = st.columns(3)

with col1:
    residence_type = st.selectbox(
        "Residence Type",
        ["Owned", "Rented", "Mortgage"]
    )

with col2:
    loan_purpose = st.selectbox(
        "Loan Purpose",
        ["Education", "Home", "Auto", "Personal"]
    )

with col3:
    loan_type = st.selectbox(
        "Loan Type",
        ["Secured", "Unsecured"]
    )

# ------------------------
# ENGINEERED FEATURES
# ------------------------

loan_to_income = (
    loan_amount / income
    if income > 0 else 0
)

delinquent_ratio = (
    delinquent_months / total_loan_months * 100
    if total_loan_months > 0 else 0
)

avg_dpd_per_delinquency = (
    total_dpd / delinquent_months
    if delinquent_months > 0 else 0
)

st.subheader("Derived Risk Metrics")

m1, m2, m3 = st.columns(3)

m1.metric(
    "Loan-to-Income Ratio",
    f"{loan_to_income:.2f}"
)

m2.metric(
    "Delinquent Ratio",
    f"{delinquent_ratio:.2f}%"
)

m3.metric(
    "Avg DPD / Delinquency",
    f"{avg_dpd_per_delinquency:.2f}"
)

st.divider()

# ------------------------
# PREDICTION
# ------------------------

if st.button(
    "Predict Default Risk",
    use_container_width=True
):
    probability, credit_score, rating = predict(
        age,
        income,
        loan_amount,
        loan_tenure_months,
        credit_utilization_ratio,
        delinquent_ratio,
        avg_dpd_per_delinquency,
        num_open_accounts,
        residence_type,
        loan_purpose,
        loan_type
    )

    st.subheader("Prediction Results")

    c1, c2, c3 = st.columns(3)

    c1.metric(
        "Default Probability",
        f"{probability*100:.2f}%"
    )

    c2.metric(
        "Credit Score",
        credit_score
    )

    c3.metric(
        "Risk Rating",
        rating
    )