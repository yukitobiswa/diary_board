from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from .core.security import oauth2_scheme, SECRET_KEY, ALGORITHM
from .db import SessionLocal, UserTable
from BM import UserCreate # BM.pyからUserCreateをインポート

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials: 認証情報が無効です。",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        team_id: str = payload.get("team_id")
        if not user_id or not team_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    with SessionLocal() as session:
        user = session.query(UserTable).filter(UserTable.user_id == user_id, UserTable.team_id == team_id).first()
        if not user:
            raise credentials_exception
        return user

async def get_current_active_user(current_user: UserCreate = Depends(get_current_user)):
    if not current_user.user_id or not current_user.team_id: # UserCreateモデルの属性に合わせる
        raise HTTPException(status_code=400, detail="Inactive user: 無効なユーザーです。")
    return current_user 