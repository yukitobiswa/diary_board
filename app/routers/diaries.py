from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
import logging

from ..db import SessionLocal, DiaryTable, MDiaryTable, UserTable, TeamTable, get_db
from ..dependencies import get_current_active_user
from BM import DiaryCreate, ReactionRequest, UserRequest, UserCreate # BM.pyから必要なモデルをインポート
from diary_language import translate_diary # 外部ファイルの関数
from testgpt import filter_diary_entry # 外部ファイルの関数
from wordcount import count_words # 外部ファイルの関数
from ..utils import age_map # utils.pyからage_mapをインポート

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/add_diary")
async def add_diary_endpoint(diary: DiaryCreate, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    diary_time = datetime.now()
    team_id = current_user.team_id

    team_age_entry = db.query(TeamTable).filter(TeamTable.team_id == team_id).first()
    if not team_age_entry or team_age_entry.age not in age_map:
        logger.error(f"Invalid team age: {team_age_entry.age if team_age_entry else 'None'}")
        raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")
    age_group = age_map[team_age_entry.age]

    try:
        complaining = filter_diary_entry(diary.content)
    except ValueError:
        raise HTTPException(status_code=400, detail="不正なレスポンスを受け取りました。")
    except Exception as e:
        logger.error(f"Error in filtering diary entry: {e}")
        raise HTTPException(status_code=500, detail="フィルタリング中にエラーが発生しました。")

    try:
        wordcount = count_words(diary.content, current_user.main_language, age_group)
    except Exception as e:
        logger.error(f"Error in counting words: {e}")
        raise HTTPException(status_code=500, detail="文字数カウント中にエラーが発生しました。")

    if complaining in {1, 2} or wordcount < 100:
        return {
            "status": False,
            "message": f"There might be bad words, or the text is less than 100 words : 悪口が含まれている可能性があるか、文字数が100文字に達していません。書き直してください。 現在の文字数: {wordcount}"
        }

    try:
        new_diary = DiaryTable(
            team_id=current_user.team_id,
            user_id=current_user.user_id,
            title=diary.title,
            diary_time=diary_time,
            content=diary.content,
            main_language=current_user.main_language
        )
        db.add(new_diary)
        db.commit()
        db.refresh(new_diary)

        diary_list = translate_diary(diary.title, diary.content, current_user.main_language, age_group)
        translated_entries = [
            MDiaryTable(
                diary_id=new_diary.diary_id,
                language_id=i,
                team_id=current_user.team_id,
                user_id=current_user.user_id,
                title=title,
                diary_time=diary_time,
                content=content,
            )
            for i, (title, content) in enumerate(diary_list, start=1)
        ]
        db.add_all(translated_entries)
        
        user_to_update = db.query(UserTable).filter(UserTable.user_id == current_user.user_id, UserTable.team_id == current_user.team_id).first()
        if user_to_update:
            user_to_update.diary_count = (user_to_update.diary_count or 0) + 1
            db.add(user_to_update)
        
        db.commit()
        logger.info(f"Diary added successfully: user_id={current_user.user_id}, diary_id={new_diary.diary_id}")
        return {"status": True, "message": "Diary added successfully!"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error while adding diary: {e}")
        raise HTTPException(status_code=500, detail="日記の追加中にエラーが発生しました。")

@router.get("/get_diaries")
async def get_diaries_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    team_id = current_user.team_id
    main_language = current_user.main_language

    result = (
        db.query(
            UserTable.name.label("user_name"),
            MDiaryTable.diary_id,
            MDiaryTable.title,
            MDiaryTable.content,
            MDiaryTable.diary_time,
            DiaryTable.thumbs_up,
            DiaryTable.love,
            DiaryTable.laugh,
            DiaryTable.surprised,
            DiaryTable.sad,
        )
        .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)
        .join(UserTable, DiaryTable.user_id == UserTable.user_id)
        .filter(UserTable.team_id == team_id)
        .filter(MDiaryTable.team_id == team_id)
        .filter(MDiaryTable.language_id == main_language)
        .filter(MDiaryTable.is_visible == 1)
        .filter(DiaryTable.is_visible == 1)
        .order_by(MDiaryTable.diary_time.asc())
        .all()
    )
    return {
        "team_id": team_id,
        "diaries": [
            {
                "user_name": row.user_name,
                "diary_id": row.diary_id,
                "title": row.title,
                "content": row.content,
                "diary_time": row.diary_time.strftime('%Y-%m-%d %H:%M:%S'),
                "reactions": {
                    "thumbs_up": row.thumbs_up,
                    "love": row.love,
                    "laugh": row.laugh,
                    "surprised": row.surprised,
                    "sad": row.sad,
                },
            }
            for row in result
        ],
    }

@router.get("/get_my_diary")
async def get_my_diary_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    team_id = current_user.team_id
    main_language = current_user.main_language
    user_id = current_user.user_id

    result = (
        db.query(
            UserTable.name.label("user_name"),
            UserTable.diary_count,
            MDiaryTable.diary_id,
            MDiaryTable.title,
            MDiaryTable.content,
            MDiaryTable.diary_time,
            DiaryTable.thumbs_up,
            DiaryTable.love,
            DiaryTable.laugh,
            DiaryTable.surprised,
            DiaryTable.sad,
        )
        .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)
        .join(UserTable, (DiaryTable.user_id == UserTable.user_id) & (DiaryTable.team_id == UserTable.team_id))
        .filter(UserTable.team_id == team_id)
        .filter(UserTable.user_id == user_id)
        .filter(DiaryTable.team_id == team_id)
        .filter(DiaryTable.user_id == user_id)
        .filter(MDiaryTable.language_id == main_language)
        .filter(MDiaryTable.is_visible == 1)
        .filter(DiaryTable.is_visible == 1)
        .order_by(DiaryTable.diary_time.asc())
        .all()
    )
    if not result:
        return JSONResponse(content={"error": "No diaries found"}, status_code=404)
    return JSONResponse(content={
        "team_id": team_id,
        "diary_count": result[0].diary_count if result else 0,
        "diaries": [
            {
                "user_name": row.user_name,
                "diary_id": row.diary_id,
                "title": row.title,
                "content": row.content,
                "diary_time": row.diary_time.strftime('%Y-%m-%d %H:%M:%S'),
                "reactions": {
                    "thumbs_up": row.thumbs_up,
                    "love": row.love,
                    "laugh": row.laugh,
                    "surprised": row.surprised,
                    "sad": row.sad,
                },
            }
            for row in result
        ],
    })

@router.post("/get_individual_diaries")
async def get_individual_diaries_endpoint(request: UserRequest, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    user_id_to_fetch = request.user_id
    team_id = current_user.team_id
    main_language = current_user.main_language

    # from ..db import MQuizTable # MQuizTableをインポート
    from ..db import MQuizTable # この行を関数の先頭またはモジュールレベルに移動

    result = (
        db.query(
            UserTable.name.label("user_name"),
            UserTable.diary_count,
            MDiaryTable.diary_id,
            MDiaryTable.title,
            MDiaryTable.content,
            MDiaryTable.diary_time,
        )
        .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)
        .join(UserTable, (UserTable.user_id == MDiaryTable.user_id) & (UserTable.team_id == MDiaryTable.team_id))
        .filter(UserTable.team_id == team_id)
        .filter(UserTable.user_id == user_id_to_fetch)
        .filter(MDiaryTable.language_id == main_language)
        .filter(MDiaryTable.is_visible == 1)
        .filter(DiaryTable.is_visible == 1)
        .order_by(MDiaryTable.diary_time.asc())
        .all()
    )
    if not result:
        return JSONResponse(content={"error": "No diaries found"}, status_code=404)

    diaries_with_quizzes = []
    for row in result:
        quizzes = (
            db.query(MQuizTable)
            .filter(MQuizTable.language_id == main_language)
            .filter(MQuizTable.diary_id == row.diary_id)
            .all()
        )
        diary_data = {
            "user_name": row.user_name,
            "diary_id": row.diary_id,
            "title": row.title,
            "content": row.content,
            "diary_time": row.diary_time.strftime('%Y-%m-%d %H:%M:%S'),
            "quizzes": [
                {
                    "quiz_id": quiz.quiz_id,
                    "diary_id": quiz.diary_id,
                    "language_id": quiz.language_id,
                    "question": quiz.question,
                    "correct": quiz.correct,
                    "a": quiz.a,
                    "b": quiz.b,
                    "c": quiz.c,
                    "d": quiz.d,
                }
                for quiz in quizzes
            ],
        }
        diaries_with_quizzes.append(diary_data)
    return JSONResponse(content={
        "team_id": team_id,
        "diary_count": result[0].diary_count if result else 0,
        "diaries": diaries_with_quizzes,
    })

@router.post("/add_reaction")
async def add_reaction_endpoint(reaction: ReactionRequest, db: Session = Depends(get_db)):
    try:
        diary = db.query(DiaryTable).filter(DiaryTable.diary_id == reaction.diary_id).first()
        if not diary:
            raise HTTPException(status_code=404, detail="Diary not found")
        
        if reaction.emoji == "👍":
            diary.thumbs_up = (diary.thumbs_up or 0) + 1
        elif reaction.emoji == "❤️":
            diary.love = (diary.love or 0) + 1
        elif reaction.emoji == "😂":
            diary.laugh = (diary.laugh or 0) + 1
        elif reaction.emoji == "😲":
            diary.surprised = (diary.surprised or 0) + 1
        elif reaction.emoji == "😢":
            diary.sad = (diary.sad or 0) + 1
        else:
            raise HTTPException(status_code=400, detail="Invalid emoji")
        db.commit()
        return {
            "status": "success",
            "reactions": {
                "thumbs_up": diary.thumbs_up,
                "love": diary.love,
                "laugh": diary.laugh,
                "surprised": diary.surprised,
                "sad": diary.sad,
            },
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding reaction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding reaction: {str(e)}")

@router.put("/delete_diary/{diary_id}")
async def delete_diary_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        ori_diary = db.query(DiaryTable).filter(DiaryTable.diary_id == diary_id, DiaryTable.user_id == current_user.user_id).first() # 自分の日記のみ削除可能
        if not ori_diary:
            raise HTTPException(status_code=404, detail=f"Diary with id {diary_id} not found or you don't have permission to delete it")
        
        ori_diary.is_visible = False
        multi_diaries = db.query(MDiaryTable).filter(MDiaryTable.diary_id == diary_id).all()
        for d_multi in multi_diaries:
            d_multi.is_visible = False

        user_to_update = db.query(UserTable).filter(UserTable.user_id == current_user.user_id, UserTable.team_id == current_user.team_id).first()
        if user_to_update and user_to_update.diary_count and user_to_update.diary_count > 0:
            user_to_update.diary_count -= 1
            db.add(user_to_update)

        db.commit()
        logger.info(f"Diary {diary_id} deleted successfully by user {current_user.user_id}")
        return JSONResponse({"message": "Diary Deleted Successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error during deleting diary: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during deleting diary: {str(e)}") 