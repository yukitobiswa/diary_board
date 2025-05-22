from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime
import logging
import time # for save_quiz timing
import io # for audio generation
import zipfile # for audio generation
from gtts import gTTS # for audio generation

from ..db import (
    SessionLocal, MDiaryTable, UserTable, TeamTable, CashQuizTable, 
    QuizTable, MQuizTable, AnswerTable, TitleTable, get_db
)
from ..dependencies import get_current_active_user
from BM import (
    Category, SelectedQuiz, AnswerCreate, UserCreate, 
    UserRequest # UserRequestを追加
)
from create_quiz import make_quiz
from translate_quiz import translate_question, translate_quizz
from quiz_hiragana import convert_question
from ..utils import age_map, quiz_to_dict, answer_dic, language_map

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/generate_quiz")
async def generate_quiz_endpoint(category: Category, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        result = (
            db.query(MDiaryTable)
            .filter(MDiaryTable.language_id == current_user.main_language, MDiaryTable.user_id == current_user.user_id, MDiaryTable.team_id == current_user.team_id)
            .order_by(MDiaryTable.diary_time.desc())
            .first()
        )
        if not result:
            return JSONResponse(status_code=404, content={"error": "No diary found for this user."}) 

        team_info = db.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
        if not team_info:
            raise HTTPException(status_code=404, detail="Team information not found.")
        
        country = team_info.country
        age = team_info.age
        quizzes = make_quiz(result.content, category.category1, category.category2, country, age)

        if len(quizzes) < 10:
            return JSONResponse(status_code=404, content={"error": "No quizzes generated. : もう一度お試しください"})
        
        db.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id, CashQuizTable.team_id == current_user.team_id).delete()
        db.commit()

        for i, quiz_data in enumerate(quizzes):
            new_cache = CashQuizTable(
                cash_quiz_id=i + 1,
                team_id=current_user.team_id,
                diary_id=result.diary_id,
                user_id=current_user.user_id,
                question=quiz_data['question'],
                correct=quiz_data['answer'],
                a=quiz_data['choices'][0],
                b=quiz_data['choices'][1],
                c=quiz_data['choices'][2],
                d=quiz_data['choices'][3]
            )
            db.add(new_cache)
        db.commit()
        return JSONResponse(content={"message": "Quizzes generated and cached successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error generating quiz: {e}")
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}"})

@router.post("/save_quiz")
async def save_quiz_endpoint(selected_quizzes: SelectedQuiz, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        if len(selected_quizzes.selected_quizzes) != 5:
            return JSONResponse(status_code=400, content={"error": "You must select exactly 5 questions."})

        team_age_entry = db.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
        if not team_age_entry or team_age_entry.age not in age_map:
            logger.error(f"Invalid team age: {team_age_entry.age if team_age_entry else 'None'}")
            raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")
        age_group = age_map[team_age_entry.age]

        quizzes_to_save = db.query(CashQuizTable).filter(
            CashQuizTable.cash_quiz_id.in_(selected_quizzes.selected_quizzes),
            CashQuizTable.user_id == current_user.user_id,
            CashQuizTable.team_id == current_user.team_id
        ).all()

        if len(quizzes_to_save) != 5:
            return JSONResponse(status_code=404, content={"error": "Selected quizzes not found in cache."})

        quizzes_to_save_list_for_translation = []
        original_quizzes_for_db = []

        for quiz_in_cash in quizzes_to_save:
            original_quizzes_for_db.append(quiz_in_cash) # 元のCashQuizTableオブジェクトを保存
            quizzes_to_save_list_for_translation.append([quiz_in_cash.question, quiz_in_cash.a, quiz_in_cash.b, quiz_in_cash.c, quiz_in_cash.d])
        
        flattened_quizzes_list = [item for sublist in quizzes_to_save_list_for_translation for item in sublist]
        translated_quizzes_to_save = await translate_quizz(flattened_quizzes_list, age_group)
        
        # diary_idは最初に選択されたクイズから取得 (全てのクイズは同じ日記に基づいているはず)
        # main_diary_id = original_quizzes_for_db[0].diary_id if original_quizzes_for_db else None
        # if not main_diary_id:
        #     raise HTTPException(status_code=404, detail="Diary ID not found for the selected quizzes.")

        # 新しいQuizTableエントリを作成して保存
        saved_quiz_ids_map = {} # cash_quiz_idを新しいquiz_idにマッピング
        for i, original_quiz_obj in enumerate(original_quizzes_for_db):
            new_quiz_entry = QuizTable(
                # quiz_id は自動インクリメントか、またはここで新しいIDを生成する必要がある
                diary_id=original_quiz_obj.diary_id, # ここを修正
                question=original_quiz_obj.question,
                correct=original_quiz_obj.correct,
                a=original_quiz_obj.a,
                b=original_quiz_obj.b,
                c=original_quiz_obj.c,
                d=original_quiz_obj.d
            )
            db.add(new_quiz_entry)
            db.flush() # new_quiz_entry.quiz_id を取得するため
            saved_quiz_ids_map[original_quiz_obj.cash_quiz_id] = new_quiz_entry.quiz_id
            # MQuizTableへの保存
            if isinstance(translated_quizzes_to_save, list) and len(translated_quizzes_to_save) > i:
                quiz_translations = translated_quizzes_to_save[i]
                for lang_id, translated_quiz_parts in enumerate(quiz_translations, start=1):
                    new_mquiz_entry = MQuizTable(
                        quiz_id=new_quiz_entry.quiz_id, # 新しく保存されたQuizTableのIDを使用
                        diary_id=original_quiz_obj.diary_id, # ここも修正
                        language_id=lang_id,
                        question=translated_quiz_parts[0],
                        correct=original_quiz_obj.correct, # 正解は元の言語のまま
                        a=translated_quiz_parts[1],
                        b=translated_quiz_parts[2],
                        c=translated_quiz_parts[3],
                        d=translated_quiz_parts[4]
                    )
                    db.add(new_mquiz_entry)

        db.commit()
        db.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id, CashQuizTable.team_id == current_user.team_id).delete()
        db.commit()

        logger.info("Successfully saved selected quizzes.")
        end_time = time.time()
        execution_time = end_time - start_time
        logger.info(f"Execution time for save_quiz: {execution_time} seconds")
        return JSONResponse(content={"message": "Quizzes saved successfully!"})
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving quizzes: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"message": "An error occurred while saving the quizzes."})

@router.get("/get_quizzes")
async def get_quizzes_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        quizzes = db.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id, CashQuizTable.team_id == current_user.team_id).all()
        team_age_entry = db.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
        if not team_age_entry or team_age_entry.age not in age_map:
            logger.error(f"Invalid team age for get_quizzes: {team_age_entry.age if team_age_entry else 'None'}")
            raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")
        age_group = age_map[team_age_entry.age]

        quizzes_dict_list = [quiz_to_dict(q) for q in quizzes]
        if current_user.main_language == 1: # 日本語の場合
            for quiz_item in quizzes_dict_list:
                quiz_item['question'] = convert_question(quiz_item['question'], age_group)
        else:
            for quiz_item in quizzes_dict_list:
                quiz_item['question'] = await translate_question(quiz_item['question'], current_user.main_language)
        return JSONResponse(content={"quizzes": quizzes_dict_list})
    except Exception as e:
        logger.error(f"Error fetching quizzes: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}"})

@router.get("/get_same_quiz/{diary_id}")
async def get_same_quiz_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        quiz_results = (
            db.query(MQuizTable)
            .filter(MQuizTable.diary_id == diary_id)
            .filter(MQuizTable.language_id == current_user.main_language)
            .order_by(MQuizTable.quiz_id.asc()) # ID順で取得 (quiz_idはMQuizTableの主キーの一部であると仮定)
            .all()
        )
        if not quiz_results:
            logger.warning(f"No quizzes found for diary_id {diary_id} and language {current_user.main_language}")
            return JSONResponse(content={"quizzes": []})

        quizzes_data = [
            {
                "diary_id": q.diary_id,
                "quiz_id": q.quiz_id,
                "question": q.question,
                "choices": {"a": q.a, "b": q.b, "c": q.c, "d": q.d}
            }
            for q in quiz_results
        ]
        return JSONResponse(content={"quizzes": quizzes_data})
    except Exception as e:
        logger.error(f"Error during getting same quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting same quiz: {str(e)}")

@router.get("/get_different_quiz/{diary_id}")
async def get_different_quiz_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        quiz_results = (
            db.query(MQuizTable)
            .filter(MQuizTable.diary_id == diary_id)
            .filter(MQuizTable.language_id == current_user.learn_language) # 学習言語でフィルタ
            .order_by(MQuizTable.quiz_id.asc())
            .all()
        )
        if not quiz_results:
            logger.warning(f"No quizzes found for diary_id {diary_id} and learn_language {current_user.learn_language}")
            return JSONResponse(content={"quizzes": []})

        quizzes_data = [
            {
                "diary_id": q.diary_id,
                "quiz_id": q.quiz_id,
                "question": q.question,
                "choices": {"a": q.a, "b": q.b, "c": q.c, "d": q.d}
            }
            for q in quiz_results
        ]
        return JSONResponse(content={"quizzes": quizzes_data})
    except Exception as e:
        logger.error(f"Error during getting different quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting different quiz: {str(e)}")

# --- Audio Endpoints --- 
async def generate_quiz_audio_zip(db: Session, diary_id: int, learn_language_id: int, quiz_offset: int):
    quiz_result = (
        db.query(MQuizTable)
        .filter(MQuizTable.diary_id == diary_id)
        .filter(MQuizTable.language_id == learn_language_id)
        .order_by(MQuizTable.quiz_id.asc())
        .offset(quiz_offset)
        .first()
    )
    if not quiz_result:
        logger.warning(f"No quiz found for audio generation: diary_id={diary_id}, lang={learn_language_id}, offset={quiz_offset}")
        raise HTTPException(status_code=404, detail="クイズが見つかりませんでした")

    choices_text = {1: quiz_result.a, 2: quiz_result.b, 3: quiz_result.c, 4: quiz_result.d}
    lang_code = language_map.get(learn_language_id)
    if not lang_code:
        raise HTTPException(status_code=400, detail="Invalid language ID for audio generation")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for i in range(1, 5):
            text_to_speak = choices_text[i]
            if not text_to_speak: continue # 空の選択肢はスキップ
            tts = gTTS(text=text_to_speak, lang=lang_code)
            audio_fp = io.BytesIO()
            tts.write_to_fp(audio_fp)
            audio_fp.seek(0)
            choice_filename = f"{chr(96 + i)}.mp3" # a.mp3, b.mp3, ...
            zip_file.writestr(choice_filename, audio_fp.read())
    zip_buffer.seek(0)
    return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

@router.get("/get_quiz_audio1/{diary_id}")
async def get_quiz_audio1_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await generate_quiz_audio_zip(db, diary_id, current_user.learn_language, 0)
    except Exception as e:
        logger.error(f"Error generating quiz audio 1: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "音声生成に失敗しました"})

@router.get("/get_quiz_audio2/{diary_id}")
async def get_quiz_audio2_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await generate_quiz_audio_zip(db, diary_id, current_user.learn_language, 1)
    except Exception as e:
        logger.error(f"Error generating quiz audio 2: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "音声生成に失敗しました"})

@router.get("/get_quiz_audio3/{diary_id}")
async def get_quiz_audio3_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await generate_quiz_audio_zip(db, diary_id, current_user.learn_language, 2)
    except Exception as e:
        logger.error(f"Error generating quiz audio 3: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "音声生成に失敗しました"})

@router.get("/get_quiz_audio4/{diary_id}")
async def get_quiz_audio4_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await generate_quiz_audio_zip(db, diary_id, current_user.learn_language, 3)
    except Exception as e:
        logger.error(f"Error generating quiz audio 4: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "音声生成に失敗しました"})

@router.get("/get_quiz_audio5/{diary_id}")
async def get_quiz_audio5_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await generate_quiz_audio_zip(db, diary_id, current_user.learn_language, 4)
    except Exception as e:
        logger.error(f"Error generating quiz audio 5: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": "音声生成に失敗しました"})

# --- Judgement Endpoints --- 
async def get_quiz_judgement(db: Session, diary_id: int, user_id: str, team_id: str, quiz_offset: int):
    # ユーザーの最新の回答を取得
    answer_result = db.query(AnswerTable).filter(
        AnswerTable.user_id == user_id, 
        AnswerTable.team_id == team_id, 
        AnswerTable.diary_id == diary_id,
        # AnswerTable.quiz_id に相当する情報が QuizTable の offset で決まるため、ここでは quiz_id を直接指定しない
    ).order_by(AnswerTable.answer_date.desc()).first() # 最新の回答セットを取得

    if not answer_result:
        return {"judgement": None, "selected_choice": None, "correct_choice": None}

    # 対応するクイズを取得 (QuizTableからオフセットで)
    quiz_entry = db.query(QuizTable).filter(
        QuizTable.diary_id == diary_id
    ).order_by(QuizTable.quiz_id.asc()).offset(quiz_offset).first()

    if not quiz_entry:
        logger.warning(f"No quiz entry found for judgement: diary_id={diary_id}, offset={quiz_offset}")
        return {"judgement": None, "selected_choice": answer_result.choices, "correct_choice": None}

    correct_choice_char = None
    if quiz_entry.correct:
        correct_choice_char = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }.get(str(quiz_entry.correct))
    
    # judgement は AnswerTable の quiz_id と QuizTable の quiz_id が一致するもので判断するべきだが、
    # 現在の /get_judgementX のロジックは offset に依存しているため、その挙動を維持する。
    # より正確には、AnswerTable に保存された quiz_id と QuizTable の quiz_id で紐づけるべき。
    # ここでは、AnswerTableの最新のレコードのjudgementとchoicesを使う。
    # ただし、どのクイズに対するjudgementかは answer_result.quiz_id で特定される。
    # この関数はX番目の問題の正誤を返すので、answer_result.quiz_id == quiz_entry.quiz_id かどうかを確認する必要がある。
    # しかし、現在のエンドポイントの仕様では、最新の解答セットの特定のオフセットの解答の正誤を返すため、
    # AnswerTableから取得したjudgementが、指定されたquiz_offsetに対応するクイズのものかは保証されない。
    # ここでは、AnswerTableの最新のレコードのjudgementをそのまま使う（元のコードの挙動を踏襲）
    # 本来は、AnswerTableを user_id, team_id, diary_id, quiz_id でフィルタリングすべき。
    related_answer = db.query(AnswerTable).filter(
        AnswerTable.user_id == user_id,
        AnswerTable.team_id == team_id,
        AnswerTable.diary_id == diary_id,
        AnswerTable.quiz_id == quiz_entry.quiz_id # quiz_offsetに対応するquiz_idでフィルタ
    ).order_by(AnswerTable.answer_date.desc()).first()

    if not related_answer:
         return {"judgement": None, "selected_choice": None, "correct_choice": correct_choice_char}

    return {
        "judgement": True if related_answer.judgement == 1 else False,
        "selected_choice": related_answer.choices,
        "correct_choice": correct_choice_char
    }

@router.get("/get_judgement1/{diary_id}")
async def get_judgement1_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await get_quiz_judgement(db, diary_id, current_user.user_id, current_user.team_id, 0)
    except Exception as e:
        logger.error(f"Error getting judgement 1: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")

@router.get("/get_judgement2/{diary_id}")
async def get_judgement2_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await get_quiz_judgement(db, diary_id, current_user.user_id, current_user.team_id, 1)
    except Exception as e:
        logger.error(f"Error getting judgement 2: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")

@router.get("/get_judgement3/{diary_id}")
async def get_judgement3_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await get_quiz_judgement(db, diary_id, current_user.user_id, current_user.team_id, 2)
    except Exception as e:
        logger.error(f"Error getting judgement 3: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")

@router.get("/get_judgement4/{diary_id}")
async def get_judgement4_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await get_quiz_judgement(db, diary_id, current_user.user_id, current_user.team_id, 3)
    except Exception as e:
        logger.error(f"Error getting judgement 4: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")

@router.get("/get_judgement5/{diary_id}")
async def get_judgement5_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        return await get_quiz_judgement(db, diary_id, current_user.user_id, current_user.team_id, 4)
    except Exception as e:
        logger.error(f"Error getting judgement 5: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")

# --- Answer Endpoints --- 
@router.post("/create_answer")
async def create_answer_endpoint(answer: AnswerCreate, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        answer_time = datetime.now()
        quiz = db.query(QuizTable).filter(
            QuizTable.diary_id == answer.diary_id,
            QuizTable.quiz_id == answer.quiz_id
        ).first()

        if not quiz:
            logger.error(f"Quiz with id {answer.quiz_id} not found for diary {answer.diary_id}.")
            raise HTTPException(status_code=404, detail=f"Quiz with id {answer.quiz_id} not found.")

        judgement = 1 if str(quiz.correct) == str(answer_dic.get(answer.choices)) else 0

        new_answer = AnswerTable(
            team_id=current_user.team_id,
            user_id=current_user.user_id,
            quiz_id=answer.quiz_id,
            diary_id=answer.diary_id,
            language_id=current_user.main_language,
            answer_date=answer_time,
            choices=answer.choices,
            judgement=judgement
        )
        db.add(new_answer)

        db_user = db.query(UserTable).filter(
            UserTable.user_id == current_user.user_id,
            UserTable.team_id == current_user.team_id
        ).first()

        is_title_updated = False
        updated_title_name = ""

        if db_user:
            current_nickname_level = db_user.nickname if isinstance(db_user.nickname, int) else 0
            if judgement == 1:
                db_user.answer_count = (db_user.answer_count or 0) + 1
                thresholds = [0, 5, 10, 15, 100, 150, 300, 500, 700, 1000, 1500] # 称号の閾値
                # 現在の称号レベルが thresholds の範囲内であり、かつ answer_count が次の閾値以上の場合に更新
                if current_nickname_level < len(thresholds) -1 and db_user.answer_count >= thresholds[current_nickname_level + 1]:
                    db_user.nickname = current_nickname_level + 1
                    is_title_updated = True
            db.add(db_user) # 変更をセッションに追加
        
        db.commit()

        if is_title_updated and db_user:
            db.refresh(db_user) # 更新されたユーザー情報をリフレッシュ
            title_entry = db.query(TitleTable).filter(
                TitleTable.title_id == db_user.nickname,
                TitleTable.language_id == current_user.main_language
            ).first()
            updated_title_name = title_entry.title_name if title_entry else "Unknown Title"

        return JSONResponse({
            "message": "Answer Created Successfully!",
            "is_title_updated": is_title_updated,
            "updated_title": updated_title_name
        })
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating answer: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during creating answer: {str(e)}")

@router.get("/get_answer")
async def get_answer_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        # このエンドポイントは直近5件の正解数を返すものと解釈。ユーザーの総正解数は更新しない。
        results = db.query(AnswerTable).filter(
            AnswerTable.user_id == current_user.user_id, 
            AnswerTable.team_id == current_user.team_id
        ).order_by(AnswerTable.answer_date.desc()).limit(5).all()
        
        correct_count_last_5 = sum(1 for r in results if r.judgement == 1)
        
        # ユーザーの総正解数は別途 /get_profile などで取得するか、このエンドポイントの責務を見直す。
        # ここでは、元のコードにあった user.answer_count の更新は行わない。
        # logger.info(f"Correct answers in last 5 for user {current_user.user_id}: {correct_count_last_5}")
        return JSONResponse(content={"correct_count": correct_count_last_5})
    except Exception as e:
        logger.error(f"Error getting answers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")

@router.get("/get_answer_quiz")
async def get_answer_quiz_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        user_id = current_user.user_id
        team_id = current_user.team_id
        main_lang = current_user.main_language
        
        all_answers_by_user = db.query(AnswerTable).filter(
            AnswerTable.user_id == user_id,
            AnswerTable.team_id == team_id
        ).order_by(AnswerTable.diary_id.asc(), AnswerTable.quiz_id.asc()).all()

        results_by_diary = {}
        for ans in all_answers_by_user:
            if ans.diary_id not in results_by_diary:
                diary_info = db.query(MDiaryTable.title, UserTable.name).join(
                    UserTable, 
                    and_(UserTable.user_id == MDiaryTable.user_id, UserTable.team_id == MDiaryTable.team_id)
                ).filter(
                    MDiaryTable.diary_id == ans.diary_id,
                    MDiaryTable.language_id == main_lang # 日記タイトルと投稿者名はユーザーの母語で
                ).first()
                if not diary_info:
                    continue # 日記情報が見つからなければスキップ

                results_by_diary[ans.diary_id] = {
                    "title": diary_info.title,
                    "name": diary_info.name,
                    "answer_date": ans.answer_date.strftime('%Y-%m-%d %H:%M:%S'), # 最初の回答の日付
                    "questions": []
                }
            
            quiz_detail = db.query(MQuizTable).filter(
                MQuizTable.diary_id == ans.diary_id,
                MQuizTable.quiz_id == ans.quiz_id,
                MQuizTable.language_id == main_lang # クイズ内容はユーザーの母語で
            ).first()
            if not quiz_detail:
                continue # クイズ詳細が見つからなければスキップ

            results_by_diary[ans.diary_id]["questions"].append({
                'quiz_id': ans.quiz_id,
                'question': quiz_detail.question,
                'a': quiz_detail.a,
                'b': quiz_detail.b,
                'c': quiz_detail.c,
                'd': quiz_detail.d,
                'correct': quiz_detail.correct, # MQuizTableのcorrectは元の言語のはずなのでそのまま
                'choice': ans.choices
            })
        return JSONResponse(content={"correct_count": results_by_diary}) # キー名を維持
    except Exception as e:
        logger.error(f"Error in get_answer_quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting answered quizzes: {str(e)}")

@router.get("/already_quiz/{diary_id}")
async def already_quiz_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        first_quiz_for_diary = db.query(QuizTable.quiz_id).filter(
            QuizTable.diary_id == diary_id
        ).order_by(QuizTable.quiz_id.asc()).first()

        if not first_quiz_for_diary:
            return {"already": False} # その日記にクイズがなければ未回答扱い
        
        first_quiz_id = first_quiz_for_diary.quiz_id

        answered = db.query(AnswerTable).filter(
            AnswerTable.user_id == current_user.user_id,
            AnswerTable.team_id == current_user.team_id,
            AnswerTable.diary_id == diary_id,
            AnswerTable.quiz_id == first_quiz_id
        ).first()
        return {"already": bool(answered)}
    except Exception as e:
        logger.error(f"Error checking if quiz is already answered: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error checking quiz status: {str(e)}")

@router.post("/get_individual_quiz") # UserRequestを使用
async def get_individual_quiz_endpoint(request: UserRequest, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        target_user_id = request.user_id # リクエストされたユーザーID
        team_id = current_user.team_id # ログインユーザーのチームID (セキュリティのため)
        main_lang = current_user.main_language # ログインユーザーの母語で表示

        all_answers_by_target_user = db.query(AnswerTable).filter(
            AnswerTable.user_id == target_user_id,
            AnswerTable.team_id == team_id # 対象ユーザーも同じチームである必要がある
        ).order_by(AnswerTable.diary_id.asc(), AnswerTable.quiz_id.asc()).all()

        results_by_diary = {}
        for ans in all_answers_by_target_user:
            if ans.diary_id not in results_by_diary:
                diary_info = db.query(MDiaryTable.title, UserTable.name).join(UserTable, and_(UserTable.user_id == MDiaryTable.user_id, UserTable.team_id == MDiaryTable.team_id)).filter(
                    MDiaryTable.diary_id == ans.diary_id,
                    MDiaryTable.language_id == main_lang,
                    MDiaryTable.user_id == target_user_id # 日記の投稿者が対象ユーザーであること
                ).first()
                if not diary_info:
                    continue
                results_by_diary[ans.diary_id] = {
                    "title": diary_info.title,
                    "name": diary_info.name, # 日記投稿者の名前
                    "answer_date": ans.answer_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "questions": []
                }
            
            quiz_detail = db.query(MQuizTable).filter(
                MQuizTable.diary_id == ans.diary_id,
                MQuizTable.quiz_id == ans.quiz_id,
                MQuizTable.language_id == main_lang
            ).first()
            if not quiz_detail:
                continue

            results_by_diary[ans.diary_id]["questions"].append({
                'quiz_id': ans.quiz_id,
                'question': quiz_detail.question,
                'a': quiz_detail.a,
                'b': quiz_detail.b,
                'c': quiz_detail.c,
                'd': quiz_detail.d,
                'correct': quiz_detail.correct,
                'choice': ans.choices
            })
        return JSONResponse(content={"correct_count": results_by_diary}) # キー名を維持
    except Exception as e:
        logger.error(f"Error in get_individual_quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting individual answered quizzes: {str(e)}")

@router.get("/get_total_answer")
async def get_total_answer_endpoint(current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        correct_answers = db.query(AnswerTable).filter(
            AnswerTable.user_id == current_user.user_id,
            AnswerTable.team_id == current_user.team_id,
            AnswerTable.judgement == 1
        ).count()
        total_answered_quizzes = db.query(AnswerTable).filter(
            AnswerTable.user_id == current_user.user_id,
            AnswerTable.team_id == current_user.team_id
        ).count()

        percent = round((correct_answers / total_answered_quizzes) * 100, 1) if total_answered_quizzes > 0 else 0
        return JSONResponse({
            "correct_count": correct_answers,
            "total_quiz": total_answered_quizzes,
            "persent": percent
        })
    except Exception as e:
        logger.error(f"Error getting total answers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting total answers: {str(e)}")

@router.post("/get_individual_answer") # UserRequestを使用
async def get_individual_answer_endpoint(request: UserRequest, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    target_user_id = request.user_id
    try:
        correct_answers = db.query(AnswerTable).filter(
            AnswerTable.user_id == target_user_id,
            AnswerTable.team_id == current_user.team_id, # チームはカレントユーザーに合わせる
            AnswerTable.judgement == 1
        ).count()
        total_answered_quizzes = db.query(AnswerTable).filter(
            AnswerTable.user_id == target_user_id,
            AnswerTable.team_id == current_user.team_id
        ).count()
        
        percent = round((correct_answers / total_answered_quizzes) * 100, 1) if total_answered_quizzes > 0 else 0
        return JSONResponse({
            "correct_count": correct_answers,
            "total_quiz": total_answered_quizzes,
            "persent": percent
        })
    except Exception as e:
        logger.error(f"Error getting individual total answers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error during getting individual total answers: {str(e)}")

@router.get("/quiz_correct_count/{diary_id}")
async def quiz_correct_count_endpoint(diary_id: int, current_user: UserTable = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        correct_count = db.query(AnswerTable).filter(
            AnswerTable.user_id == current_user.user_id,
            AnswerTable.team_id == current_user.team_id,
            AnswerTable.diary_id == diary_id,
            AnswerTable.judgement == 1
        ).count()
        return JSONResponse(content={"correct_count": correct_count})
    except Exception as e:
        logger.error(f"Error getting quiz correct count for diary {diary_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}") 