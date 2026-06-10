from fastapi import FastAPI,HTTPException
from prediction_helper import predict
from pydantic import BaseModel, Field

app = FastAPI()
class CreditRiskInput(BaseModel):
    age: int= Field(ge=18, lt=100)
    income: float=Field(gt=0)
    loan_amount: float=Field(gt=0)
    loan_tenure_months: int=Field(gt=0)
    credit_utilization_ratio: float
    total_loan_months:int=Field(gt=0)
    delinquent_months:int=Field(ge=0)
    total_dpd:int=Field(ge=0)
    num_open_accounts: int=Field(ge=0)
    residence_type: str
    loan_purpose: str
    loan_type: str
    
class CreditRiskOutput(BaseModel):
    default_probability: float
    credit_score: int
    rating: str
    
    

@app.post("/predict_credit_risk", response_model=CreditRiskOutput)
def predict_credit_risk(input: CreditRiskInput):
    try:
        loan_to_income_ratio = (input.loan_amount / input.income) if input.income > 0 else 0
        delinquent_ratio = (input.delinquent_months / input.total_loan_months *100) if input.total_loan_months > 0 else 0
        avg_dpd_per_delinquency = (input.total_dpd / input.delinquent_months) if input.delinquent_months > 0 else 0
        probability, credit_score, rating = predict(
            input.age, input.income, input.loan_amount, input.loan_tenure_months,input.credit_utilization_ratio, delinquent_ratio,avg_dpd_per_delinquency, input.num_open_accounts,
            input.residence_type, input.loan_purpose, input.loan_type)
        return CreditRiskOutput(
            default_probability=probability,
            credit_score=credit_score,
            rating=rating
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))