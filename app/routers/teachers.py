from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from ..db import SessionLocal, UserTable, TeamTable, TitleTable, get_db # TeamTableとTitleTableを追加
from ..dependencies import get_current_active_user
from BM import UserResponse, TeacherLogin # UserResponseとTeacherLoginをBMからインポート

router = APIRouter()
logger = logging.getLogger(__name__) 

@router.post("/teacher_login")
async def teacher_login_endpoint(teacher_login: TeacherLogin):
    # パスワードは平文で比較（本来はハッシュ化すべきだが元のロジックを踏襲）
    if teacher_login.password == "1111": 
        return JSONResponse(content={"message": "Successful"})
    else:
        return JSONResponse(content={"message": "Invalid password"}, status_code=400)

@router.get("/get_student_inf", response_model=list[UserResponse]) # response_modelを修正
async def get_student_inf_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # current_userのteam_idと同じteam_idを持つすべてのユーザー情報を取得
    users = db.query(UserTable).filter(UserTable.team_id == current_user.team_id).all()
    
    response_users = []
    for user in users:
        # 称号名を取得（存在しない場合は "Unknown"）
        title_name = "Unknown"
        if user.nickname is not None and user.main_language is not None:
            title_entry = db.query(TitleTable).filter(
                TitleTable.title_id == user.nickname, 
                TitleTable.language_id == user.main_language
            ).first()
            if title_entry:
                title_name = title_entry.title_name

        response_users.append(UserResponse(
            user_id=user.user_id,
            team_id=user.team_id,
            name=user.name,
            password=user.password, # API仕様上は返すが、実際の運用では注意
            main_language=user.main_language,
            learn_language=user.learn_language,
            answer_count=user.answer_count if user.answer_count is not None else 0,
            diary_count=user.diary_count if user.diary_count is not None else 0,
            nickname=title_name, # 取得した称号名を設定
            is_admin=user.is_admin if user.is_admin is not None else False
        ))
    return response_users 