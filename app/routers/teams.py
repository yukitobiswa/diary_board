from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from ..db import SessionLocal, TeamTable, UserTable, get_db, TitleTable
from ..dependencies import get_current_active_user
from BM import TeamCreate, Change_team, UserResponse, UserCreate # BM.pyから必要なモデルをインポート

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('/team_register')
async def team_register(team: TeamCreate, db: Session = Depends(get_db)):
    logger.info(f"Received team data: {team}")
    try:
        logger.info("Session started successfully")
        country_str = ",".join(team.country) if team.country else ""
        logger.info(f"Converted country list to string: {country_str}")

        new_team = TeamTable(
            team_id=team.team_id,
            team_name=team.team_name,
            team_time=datetime.now(),
            country=country_str,
            age=team.age,
            member_count=team.member_count
        )
        logger.info(f"New team object created: {new_team}")
        db.add(new_team)
        db.commit()
        logger.info(f"Team registered successfully: {team.team_id}")
        return JSONResponse({"message": "Register Successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error during registration: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during registration: {str(e)}")

@router.put("/change_team_set")
async def change_team_set(
    team_update: Change_team,
    current_user: UserTable = Depends(get_current_active_user), # UserTableを使用
    db: Session = Depends(get_db)
):
    try:
        logger.info("Received team set update request: %s", team_update)
        team_current = db.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
        if not team_current:
            raise HTTPException(status_code=404, detail="チームが見つかりません")
        if team_update.country is not None:
            team_current.country = ', '.join(team_update.country)
        if team_update.age is not None:
            team_current.age = team_update.age
        db.commit()
        logger.info("Team settings updated successfully for team: %s", current_user.team_id)
        return {"message": "チーム設定が正常に更新されました！"}
    except Exception as e:
        db.rollback()
        logger.error("Error updating team set: %s", str(e))
        raise HTTPException(status_code=500, detail="チーム設定更新中にエラーが発生しました")

@router.get("/get_team_name")
async def get_team_name(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    team = db.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"team_name": team.team_name, "user_name": current_user.name}

@router.get("/get_student_inf", response_model=list[UserResponse]) # response_modelを追加
async def get_student_inf(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    users = db.query(UserTable).filter(UserTable.team_id == current_user.team_id).all()
    
    response_users = []
    for user in users:
        # nicknameの取得
        title_name = "Unknown" # デフォルト値
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