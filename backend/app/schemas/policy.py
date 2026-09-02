from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field, computed_field


class PolicyRuleReason(BaseModel):
    code: str
    message: str
    threshold_paise: Optional[int] = None
    observed_paise: Optional[int] = None


class PolicySummary(BaseModel):
    tier: str
    name: str
    description: Optional[str] = None
    max_single_transaction_paise: int
    max_cart_total_paise: int
    authorization_required: bool
    is_active: bool = True

    @computed_field
    @property
    def max_single_transaction_inr(self) -> float:
        return round(self.max_single_transaction_paise / 100.0, 2)

    @computed_field
    @property
    def max_cart_total_inr(self) -> float:
        return round(self.max_cart_total_paise / 100.0, 2)

    model_config = ConfigDict(from_attributes=True)


class PolicyEvaluationResponse(BaseModel):
    decision: Literal["ALLOW", "BLOCK", "AUTHORIZATION_REQUIRED"]
    policy_tier: str
    session_id: str
    cart_id: Optional[str] = None
    cart_total_paise: int
    max_single_transaction_paise: int
    max_cart_total_paise: int
    remaining_buffer_paise: int
    authorization_required: bool
    payment_initiated: bool = False
    reasons: List[PolicyRuleReason] = []

    @computed_field
    @property
    def cart_total_inr(self) -> float:
        return round(self.cart_total_paise / 100.0, 2)

    @computed_field
    @property
    def max_single_transaction_inr(self) -> float:
        return round(self.max_single_transaction_paise / 100.0, 2)

    @computed_field
    @property
    def max_cart_total_inr(self) -> float:
        return round(self.max_cart_total_paise / 100.0, 2)

    @computed_field
    @property
    def remaining_buffer_inr(self) -> float:
        return round(self.remaining_buffer_paise / 100.0, 2)

    model_config = ConfigDict(from_attributes=True)


class SetSessionPolicyRequest(BaseModel):
    tier: str = Field(..., description="Target policy tier: STANDARD, ELEVATED, or RESTRICTED")
