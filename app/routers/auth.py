from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import logging

from ..db import SessionLocal, UserTable, get_db
from ..core.security import oauth2_scheme, verify_password, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash
from ..dependencies import get_current_user
from BM import Token, OAuth2PasswordRequestFormWithTeam, UserCreate, PasswordResetRequest
from datetime import timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# ユーザーの認証関数
def authenticate_user(db_session: Session, team_id: str, user_id: str, password: str):
    # チームIDの存在チェック
    team_exists = db_session.query(UserTable).filter(UserTable.team_id == team_id).first()
    if not team_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Team ID: チームIDがありません。",
        )

    # ユーザーIDの存在チェック
    user = db_session.query(UserTable).filter(UserTable.user_id == user_id, UserTable.team_id == team_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No User ID: ユーザーIDがありません。",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # パスワードのチェック
    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Incorrect Password: パスワードが違います。",
        )
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestFormWithTeam = Depends(), db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form_data.team_id, form_data.username, form_data.password)
    except HTTPException as e:
        raise e

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": user.user_id, "team_id": user.team_id, "is_admin": user.is_admin},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")

@router.post("/verify_token")
async def verify_token_endpoint(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        team_id = payload.get("team_id")
        is_admin = payload.get("is_admin")

        if not user_id or not team_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 無効なトークンです。")

        return {"valid": True, "user_id": user_id, "team_id": team_id, "is_admin": is_admin}

    except JWTError:
        logger.error("Token verification failed: トークンの検証に失敗しました。")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 無効なトークンです。")

@router.put("/reset_password")
async def reset_password_endpoint(request: PasswordResetRequest, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(request.new_password) 

    try:
        user = db.query(UserTable).filter(
            UserTable.team_id == request.team_id, 
            UserTable.user_id == request.user_id
        ).first()
        
        if not user:
            team_exists = db.query(UserTable).filter(UserTable.team_id == request.team_id).first()
            if not team_exists:
                raise HTTPException(status_code=404, detail="チームIDがありません")
            raise HTTPException(status_code=400, detail="ユーザーIDがありません。")
        
        user.password = hashed_password
        db.commit()
        db.refresh(user)
        return {"message": "パスワードがリセットされました！"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=422, detail=f"入力データが無効です: {str(e)}") 