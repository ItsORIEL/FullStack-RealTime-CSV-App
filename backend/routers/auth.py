from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from database import get_session
from models import User, UserCreate, UserRead, Token
from auth_utils import (
    get_password_hash, verify_password, create_access_token, get_current_user
)

router = APIRouter(tags=["Authentication"])

@router.post("/signup", response_model=UserRead)
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user_data.username, 
        password_hash=get_password_hash(user_data.password),
        role="user"
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user