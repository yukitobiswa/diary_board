from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

from ..db import SessionLocal, UserTable, TitleTable, get_db
from ..dependencies import get_current_active_user # UserCreateをUserTableに変更
from BM import UserCreate # UserCreateはBMからインポート

router = APIRouter()
logger = logging.getLogger(__name__) 

@router.get("/get_quiz_ranking")
async def get_ranking(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # current_userと同じteam_idを持つユーザーを取得し、answer_countで降順ソート
            users = (
                session.query(UserTable)
                .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
                .order_by(UserTable.answer_count.desc())  # answer_countの降順
                .limit(5)  # 上位5人を取得
                .all()
            )

            # ユーザーの称号を取得
            ranking = []
            for user in users:
                title = session.query(TitleTable).filter(
                    TitleTable.title_id == user.nickname,
                    TitleTable.language_id == current_user.main_language
                ).first()
                title_name = title.title_name if title else "Unknown"
                
                ranking.append({
                    "id": user.user_id,
                    "name": user.name,
                    "nickname": title_name,  # 称号名を取得
                    "answer_count": user.answer_count
                })

            logger.info(f"Ranking fetched: {ranking}")  # ランキングデータをログに記録

            return JSONResponse(content={"ranking": ranking, "current_user_id": current_user.user_id})

    except Exception as e:
        logger.error(f"Error fetching ranking: {str(e)}")  # エラーの詳細をログに記録
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/get_diary_ranking")
async def get_diary_ranking(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # current_userと同じteam_idを持つユーザーを取得し、diary_countで降順ソート
            users = (
                session.query(UserTable)
                .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
                .order_by(UserTable.diary_count.desc())  # diary_countの降順
                .limit(5)  # 上位5人を取得
                .all()
            )

            # ユーザーの称号を取得
            ranking = []
            for user in users:
                title = session.query(TitleTable).filter(
                    TitleTable.title_id == user.nickname,
                    TitleTable.language_id == current_user.main_language
                ).first()
                title_name = title.title_name if title else "Unknown"
                
                ranking.append({
                    "id": user.user_id,
                    "name": user.name,
                    "nickname": title_name,  # 称号名を取得
                    "diary_count": user.diary_count
                })

            logger.info(f"Diary ranking fetched: {ranking}")  # ランキングデータをログに記録

            return JSONResponse(content={"ranking": ranking, "current_user_id": current_user.user_id})

    except Exception as e:
        logger.error(f"Error fetching diary ranking: {str(e)}")  # エラーの詳細をログに記録
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/get_combined_ranking")
async def get_combined_ranking(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # クイズの正解数と日記の投稿数を取得
            quiz_users = (
                session.query(UserTable)
                .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
                .all()
            )

            # ユーザーごとの合計スコア（quiz_answer_count + diary_count * 5）を計算
            user_scores = []
            for user in quiz_users:
                combined_score = user.answer_count + user.diary_count * 5  # 正解数と日記数を足す
                title = session.query(TitleTable).filter(
                    TitleTable.title_id == user.nickname,
                    TitleTable.language_id == current_user.main_language
                ).first()
                title_name = title.title_name if title else "Unknown"
                
                user_scores.append({
                    "id": user.user_id,
                    "name": user.name,
                    "nickname": title_name,  # 称号名を取得
                    "answer_count": user.answer_count,
                    "diary_count": user.diary_count,
                    "combined_score": combined_score
                })

            # 合計スコアで降順にソートし、上位5人を取得
            user_scores.sort(key=lambda x: x["combined_score"], reverse=True)

            # 上位5人のデータを取得
            top_5_ranking = user_scores[:5]

            logger.info(f"Combined Ranking fetched: {top_5_ranking}")  # ランキングデータをログに記録

            return JSONResponse(content={"ranking": top_5_ranking, "current_user_id": current_user.user_id})

    except Exception as e:
        logger.error(f"Error fetching combined ranking: {str(e)}")  # エラーの詳細をログに記録
        raise HTTPException(status_code=500, detail="Internal Server Error") 