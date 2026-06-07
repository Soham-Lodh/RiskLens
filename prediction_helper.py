import joblib
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np

MODEL_PATH = 'artifacts/credit_risk.joblib'
model_data = joblib.load(MODEL_PATH)
model = model_data['model']
scaler = model_data['scaler']
features = model_data['features']
cols_to_scale = model_data['cols_to_scale']

def prepare_df(age,income,loan_amount,loan_tenure_months,credit_utilization_ratio,delinquent_ratio,avg_dpd_per_delinquency,num_open_accounts,residence_type,loan_purpose,loan_type):
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

        # Additional Features (required by scaler only)
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
    df=pd.DataFrame([input_data])
    df[cols_to_scale] = scaler.transform(df[cols_to_scale])
    df = df[features]
    return df
    
def calculate_credit_score(input_df,base_score=300,scale_length=600):
    x=np.dot(input_df.values, model.coef_.T)+model.intercept_
    default_probability=1/(1+np.exp(-x))
    non_default_probability=1-default_probability
    credit_score=base_score+ non_default_probability.flatten()*scale_length
    def get_rating(score):
        if 900 >= score > 750:
            return 'Excellent'
        elif 750>=score > 650:
            return 'Good'
        elif 650>=score > 500:
            return 'Average'
        elif 500>=score >= 300:
            return 'Poor'
        else:
            return 'Undefined'
    rating=get_rating(credit_score[0])
    return default_probability.flatten()[0], int(credit_score[0]), rating

def predict(age,income,loan_amount,loan_tenure_months,credit_utilization_ratio,delinquent_ratio,avg_dpd_per_delinquency,num_open_accounts,residence_type,loan_purpose,loan_type):
    df=prepare_df(age,income,loan_amount,loan_tenure_months,credit_utilization_ratio,delinquent_ratio,avg_dpd_per_delinquency,num_open_accounts,residence_type,loan_purpose,loan_type)
    probability,credit_score,rating=calculate_credit_score(df)
    
    return probability,credit_score,rating