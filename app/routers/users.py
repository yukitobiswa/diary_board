from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from ..db import SessionLocal, UserTable, TeamTable, LanguageTable, TitleTable, get_db
from ..core.security import get_password_hash
from ..dependencies import get_current_active_user
from BM import UserCreate, Change_User, UserResponse # BM.pyから必要なモデルをインポート
from ..utils import language_map # utils.pyからlanguage_mapをインポート

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register")
async def user_register(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)

    existing_user = db.query(UserTable).filter(UserTable.user_id == user.user_id, UserTable.team_id == user.team_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="このユーザーIDはすでに登録されています。")

    team_exists = db.query(TeamTable).filter(TeamTable.team_id == user.team_id).first()
    if not team_exists:
        raise HTTPException(status_code=400, detail="指定されたチームが存在しません。")

    try:
        new_user = UserTable(
            user_id=user.user_id,
            team_id=user.team_id,
            password=hashed_password,
            name=user.name,
            main_language=user.main_language,
            learn_language=user.learn_language,
            is_admin=False # 通常のユーザー登録ではis_adminはFalse
        )
        db.add(new_user)
        db.commit()
        logger.info(f"User registered successfully: {user.user_id}")
        return JSONResponse({"message": "Register Successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Registration failed: {e}")
        raise HTTPException(status_code=500, detail="登録処理中にエラーが発生しました。")

@router.post("/teacher_register")
async def teacher_register(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)

    existing_user = db.query(UserTable).filter(UserTable.user_id == user.user_id, UserTable.team_id == user.team_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="このユーザーIDはすでに登録されています。")

    team_exists = db.query(TeamTable).filter(TeamTable.team_id == user.team_id).first()
    if not team_exists:
        raise HTTPException(status_code=400, detail="指定されたチームが存在しません。")

    try:
        new_user = UserTable(
            user_id=user.user_id,
            team_id=user.team_id,
            password=hashed_password,
            name=user.name,
            main_language=user.main_language,
            learn_language=user.learn_language,
            is_admin=True, # 教師登録ではis_adminはTrue
        )
        db.add(new_user)
        db.commit()
        logger.info(f"Teacher registered successfully: {user.user_id}")
        return JSONResponse({"message": "Register Successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Teacher registration failed: {e}")
        raise HTTPException(status_code=500, detail="登録処理中にエラーが発生しました。")

@router.get("/get_profile")
async def get_profile(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    learn_language_code = language_map.get(current_user.learn_language, "")
    
    title_entry = db.query(TitleTable).filter(TitleTable.title_id == current_user.nickname, TitleTable.language_id == current_user.main_language).first()
    nickname = title_entry.title_name if title_entry else ""
    
    return {
        "user_name": current_user.name,
        "learn_language": learn_language_code,
        "nickname": nickname
    }
    
@router.put("/change_profile")
async def change_profile(
    profile_update: Change_User,
    current_user: UserTable = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info("Received profile update request: %s", profile_update)
        user_to_update = db.query(UserTable).filter(UserTable.user_id == current_user.user_id, UserTable.team_id == current_user.team_id).first()
        if not user_to_update:
            raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

        if profile_update.user_name is not None:
            user_to_update.name = profile_update.user_name
        if profile_update.learn_language is not None:
            language_exists = db.query(LanguageTable).filter(LanguageTable.language_id == profile_update.learn_language).first()
            if not language_exists:
                raise HTTPException(status_code=400, detail="指定された学習言語は存在しません")
            user_to_update.learn_language = profile_update.learn_language
        # nicknameの更新ロジックはここに含めない（称号はシステムが付与するため）
        db.commit()
        db.refresh(user_to_update)
        logger.info("Profile updated successfully for user: %s", current_user.user_id)
        return {"message": "プロフィールが正常に更新されました！"}
    except Exception as e:
        db.rollback()
        logger.error("Error updating profile: %s", str(e))
        raise HTTPException(status_code=500, detail="プロフィール更新中にエラーが発生しました")

@router.get("/get_all_user", response_model=list[UserResponse]) # response_modelを追加
async def get_all_user_endpoint(db: Session = Depends(get_db)):
    try:
        users = db.query(UserTable).all()
        user_list = []
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
            
            user_list.append(
                UserResponse(
                    user_id=user.user_id,
                    team_id=user.team_id,
                    name=user.name,
                    password=user.password, # API仕様上は返すが、実際の運用では注意
                    main_language=user.main_language,
                    learn_language=user.learn_language,
                    answer_count=user.answer_count if user.answer_count is not None else 0,
                    diary_count=user.diary_count if user.diary_count is not None else 0,
                    nickname=title_name, 
                    is_admin=user.is_admin if user.is_admin is not None else False
                )
            )
        return user_list
    except Exception as e:
        logger.error(f"Error during getting users: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting users: {str(e)}") 