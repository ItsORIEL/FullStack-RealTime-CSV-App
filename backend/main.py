import os
import shutil
import pandas as pd
from typing import List
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

# Internal Imports
from database import create_db_and_tables, get_session
from models import User, UserCreate, Token, UserRead, FileMetadata
from auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, get_current_admin
)
from sockets import manager

# --- CONFIGURATION ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="CSV Real-Time App",
    lifespan=lifespan,
    swagger_ui_init_oauth={"clientId": "client-id", "clientSecret": "client-secret"}
)

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =======================
# 🔐 AUTHENTICATION
# =======================

@app.post("/signup", response_model=UserRead)
def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    # Check if exists
    existing_user = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create User (Default role is always 'user')
    new_user = User(
        username=user_data.username, 
        password_hash=get_password_hash(user_data.password),
        role="user"
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserRead)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

# =======================
# 📡 REAL-TIME SOCKET
# =======================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# =======================
# 📂 FILE MANAGEMENT
# =======================

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin) # Admins only
):
    # Save to disk
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save to DB
    new_file = FileMetadata(
        filename=file.filename,
        filepath=path,
        size_bytes=os.path.getsize(path),
        uploaded_by=current_user.username
    )
    session.add(new_file)
    session.commit()
    
    # Notify Frontend
    await manager.broadcast("file_uploaded")
    return {"info": "File saved", "id": new_file.id}

@app.get("/files", response_model=List[FileMetadata])
def list_files(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(select(FileMetadata)).all()

@app.delete("/files/{file_id}")
async def delete_file(
    file_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_admin) # Admins only
):
    file_record = session.get(FileMetadata, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    if os.path.exists(file_record.filepath):
        os.remove(file_record.filepath)
        
    session.delete(file_record)
    session.commit()

    # Notify Frontend
    await manager.broadcast("file_deleted")
    return {"ok": True}

@app.get("/files/{file_id}/content")
def read_csv_content(file_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    file_record = session.get(FileMetadata, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        df = pd.read_csv(file_record.filepath)
        df = df.where(pd.notnull(df), None) # Handle NaNs
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"❌ ERROR READING CSV: {e}")  # Print to terminal
        raise HTTPException(status_code=500, detail=f"Could not parse CSV: {str(e)}")