import os
import shutil
import uuid
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select

from database import get_session
from models import FileMetadata, User
from auth_utils import get_current_user, get_current_admin
from sockets import manager 

router = APIRouter(tags=["Files"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    unique_storage_name = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, unique_storage_name)
    
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_file = FileMetadata(
        filename=file.filename,
        filepath=path,
        size_bytes=os.path.getsize(path),
        uploaded_by=current_user.username
    )
    session.add(new_file)
    session.commit()
    
    await manager.broadcast("file_uploaded")
    return {"info": "File saved", "id": new_file.id}

@router.get("/files", response_model=List[FileMetadata])
def list_files(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    return session.exec(select(FileMetadata)).all()

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_admin)
):
    file_record = session.get(FileMetadata, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Remove the specific unique file from disk
    if os.path.exists(file_record.filepath):
        try: os.remove(file_record.filepath)
        except: pass
        
    session.delete(file_record)
    session.commit()

    await manager.broadcast("file_deleted")
    return {"ok": True}

@router.get("/files/{file_id}/content")
def read_csv_content(file_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    file_record = session.get(FileMetadata, file_id)
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        df = pd.read_csv(file_record.filepath)
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not parse CSV: {str(e)}")