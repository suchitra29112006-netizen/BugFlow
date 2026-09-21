from pydantic import BaseModel, ConfigDict


class LabelBase(BaseModel):
    name: str
    color: str = "#10b981"


class LabelCreate(LabelBase):
    pass


class LabelResponse(LabelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
