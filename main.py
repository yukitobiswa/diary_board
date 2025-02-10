from fastapi import FastAPI, Depends, HTTPException, Request, Form, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, MetaData, desc
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, timezone
from fastapi_login import LoginManager
from passlib.context import CryptContext
from sqlalchemy.ext.automap import automap_base
import logging
from fastapi import Depends, HTTPException, status, Request
from jose import jwt, JWTError
from diary_language import translate_diary
from create_quiz import make_quiz
from translate_quiz import translate_question,translate_quizz
from testgpt import filter_diary_entry
from wordcount import count_words
from quiz_hiragana import convert_question
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Union
from fastapi import Request
from fastapi.responses import JSONResponse,StreamingResponse
from gtts import gTTS
import io
import zipfile
from BM import (
    Token,
    OAuth2PasswordRequestFormWithTeam,
    UserCreate,
    TeamCreate,
    DiaryCreate,
    AnswerCreate,
    Change_User,
    Category,
    SelectedQuiz,
    UserInDB,
    ReactionRequest,
    TeacherLogin,
    UserResponse,
    UserRequest,
    PasswordResetRequest,
    Change_team
)


# Database URL
DATABASE_URL = "mysql+pymysql://root:6213ryoy@127.0.0.1/demo"
# FastAPI app
app = FastAPI()
logger = logging.getLogger(__name__)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
login_manager = LoginManager("your_secret_key", token_url="/token")
# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()
metadata.reflect(bind=engine)
# Set up logging
logging.basicConfig(level=logging.INFO)

# Reflect database tables
Base = automap_base()
Base.prepare(autoload_with=engine)
print(Base.classes.keys())  # これで反映されているテーブル名を確認

# Table mappings
UserTable = Base.classes.user if 'user' in Base.classes else None
DiaryTable = Base.classes.diary if 'diary' in Base.classes else None
LanguageTable = Base.classes.language if 'language' in Base.classes else None
TeamTable = Base.classes.team if 'team' in Base.classes else None
AnswerTable = Base.classes.answer if 'answer' in Base.classes else None
QuizTable = Base.classes.quiz if 'quiz' in Base.classes else None
MQuizTable = Base.classes.multilingual_quiz if 'multilingual_quiz' in Base.classes else None
MDiaryTable = Base.classes.multilingual_diary if 'multilingual_diary' in Base.classes else None
CashQuizTable = Base.classes.cash_quiz if 'cash_quiz' in Base.classes else None
ASetTable = Base.classes.answer_set if 'answer_set' in Base.classes else None
# シークレットキーとアルゴリズム
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# パスワードの検証関数
def verify_password(plain_password, hashed_password):
   return pwd_context.verify(plain_password, hashed_password)

# パスワードのハッシュ化関数
def get_password_hash(password):
   return pwd_context.hash(password)

# ユーザー名からユーザー情報を取得する関数
def get_user(db, username: str):
   if username in db:
       user_dict = db[username]
       return UserInDB(**user_dict)
SS_TOKEN_EXPIRE_MINUTES = 30

@app.put("/reset_password")
async def reset_password(request: PasswordResetRequest):
    request.hash_password()  # パスワードをハッシュ化

    with SessionLocal() as db:
        try:
            # チームIDとユーザーIDでユーザーを検索
            user = db.query(UserTable).filter(
                UserTable.team_id == request.team_id, 
                UserTable.user_id == request.user_id
            ).first()
            
            if not user:
                # チームIDまたはユーザーIDが見つからない場合
                # チームIDが存在するかどうかを確認
                team_exists = db.query(UserTable).filter(UserTable.team_id == request.team_id).first()
                if not team_exists:
                    # チームIDが存在しない場合
                    raise HTTPException(status_code=404, detail="チームIDがありません")
                # ユーザーIDが存在しない場合
                raise HTTPException(status_code=400, detail="ユーザーIDがありません。")
            
            # パスワードをリセット
            user.password = request.new_password
            db.commit()
            db.refresh(user)
            return {"message": "パスワードがリセットされました！"}
        
        except HTTPException as e:
            # HTTPExceptionの場合はそのまま返す
            raise e
        except Exception as e:
            # その他のエラーの場合は422エラーを返す
            raise HTTPException(status_code=422, detail=f"入力データが無効です: {str(e)}")


# ユーザーの認証関数
def authenticate_user(db_session, team_id: str, user_id: str, password: str):
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


# アクセストークンの生成関数
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 現在のユーザーを取得する関数
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

# 現在のアクティブなユーザーを取得する関数
async def get_current_active_user(current_user: UserCreate = Depends(get_current_user)):
    if not current_user.user_id or not current_user.team_id:
        raise HTTPException(status_code=400, detail="Inactive user: 無効なユーザーです。")
    return current_user

# ログインしてアクセストークンを発行するエンドポイント
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestFormWithTeam = Depends()):
    with SessionLocal() as session:
        try:
            user = authenticate_user(session, form_data.team_id, form_data.username, form_data.password)
        except HTTPException as e:
            raise e

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"user_id": user.user_id, "team_id": user.team_id, "is_admin": user.is_admin},
            expires_delta=access_token_expires,
        )

        return Token(access_token=access_token, token_type="bearer")

# トークンを検証するエンドポイント
@app.post("/verify_token")
async def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        team_id = payload.get("team_id")
        is_admin = payload.get("is_admin")

        if not user_id or not team_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 無効なトークンです。")

        return {"valid": True, "user_id": user_id, "team_id": team_id, "is_admin": is_admin}

    except JWTError:
        logging.error("Token verification failed: トークンの検証に失敗しました。")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 無効なトークンです。")
@app.post("/register")
async def user_register(user: UserCreate):
    user.hash_password()  # パスワードのハッシュ化

    with SessionLocal() as session:
        # `user_id` の存在チェック（どのチームでも同じ user_id は登録不可）
        existing_user = session.query(UserTable).filter(UserTable.user_id == user.user_id,UserTable.team_id == user.team_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="このユーザーIDはすでに登録されています。")

        # `team_id` の存在チェック
        team_exists = session.query(TeamTable).filter(TeamTable.team_id == user.team_id).first()
        if not team_exists:
            raise HTTPException(status_code=400, detail="指定されたチームが存在しません。")

        # ユーザー登録処理
        try:
            new_user = UserTable(
                user_id=user.user_id,
                team_id=user.team_id,
                password=user.password,
                name=user.name,
                main_language=user.main_language,
                learn_language=user.learn_language,
                nickname="駆け出しのクイズ好き"  # デフォルトのニックネーム
            )
            session.add(new_user)
            session.commit()
            logging.info(f"User registered successfully: {user.user_id}")
            return JSONResponse({"message": "Register Successfully!"})

        except Exception as e:
            session.rollback()  # ロールバック処理
            logging.error(f"Registration failed: {e}")
            raise HTTPException(status_code=500, detail="登録処理中にエラーが発生しました。")

@app.post("/teacher_register")
async def user_register(user: UserCreate):
    user.hash_password()  # パスワードのハッシュ化

    with SessionLocal() as session:
        # `user_id` の存在チェック（どのチームでも同じ user_id は登録不可）
        existing_user = session.query(UserTable).filter(UserTable.user_id == user.user_id,UserTable.team_id == user.team_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="このユーザーIDはすでに登録されています。")

        # `team_id` の存在チェック
        team_exists = session.query(TeamTable).filter(TeamTable.team_id == user.team_id).first()
        if not team_exists:
            raise HTTPException(status_code=400, detail="指定されたチームが存在しません。")

        # ユーザー登録処理
        try:
            new_user = UserTable(
                user_id=user.user_id,
                team_id=user.team_id,
                password=user.password,
                name=user.name,
                main_language=user.main_language,
                learn_language=user.learn_language,
                nickname="駆け出しのクイズ好き",  # デフォルトのニックネーム
                is_admin = True,
            )
            session.add(new_user)
            session.commit()
            logging.info(f"User registered successfully: {user.user_id}")
            return JSONResponse({"message": "Register Successfully!"})

        except Exception as e:
            session.rollback()  # ロールバック処理
            logging.error(f"Registration failed: {e}")
            raise HTTPException(status_code=500, detail="登録処理中にエラーが発生しました。")
    

@app.get("/get_profile")
async def get_profile(current_user: UserCreate = Depends(get_current_active_user)):
    # 数字と言語コードのマッピング
    language_map = {
        1: "ja",  # 日本語
        2: "en",  # 英語
        3: "pt",  # ポルトガル語
        4: "es",  # スペイン語
        5: "zh-CN",  # 簡体中文
        6: "zh-TW",  # 繁体中文
        7: "ko",  # 韓国語
        8: "tl",  # タガログ語
        9: "vi",  # ベトナム語
        10: "id",  # インドネシア語
        11: "ne",  # ネパール語
    }

    # 対応する言語コードを取得
    learn_language_code = language_map.get(current_user.learn_language, "")

    return {
        "user_name": current_user.name,
        "learn_language": learn_language_code,  # 言語コードを返す
        "nickname" : current_user.nickname
    }
    
@app.put("/change_profile")
async def change_profile(
    profile_update: Change_User,  # 変更したい情報
    current_user: UserCreate= Depends(get_current_active_user)
):
    try:
        logger.info("Received profile update request: %s", profile_update)  # 受け取ったデータをログ出力

        with SessionLocal() as session:
            user_current = session.query(UserTable).filter(UserTable.user_id == current_user.user_id).first()
            if not user_current:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

            # 入力されている場合のみ更新
            if profile_update.user_name is not None:
                user_current.name = profile_update.user_name
            if profile_update.learn_language is not None:
                # 学習言語の存在確認
                language_exists = session.query(LanguageTable).filter(LanguageTable.language_id == profile_update.learn_language).first()
                if not language_exists:
                    raise HTTPException(status_code=400, detail="指定された学習言語は存在しません")
                user_current.learn_language = profile_update.learn_language

            session.commit()

    except Exception as e:
        logger.error("Error updating profile: %s", str(e))  # エラーをログ出力
        raise HTTPException(status_code=500, detail="プロフィール更新中にエラーが発生しました")

    return {"message": "プロフィールが正常に更新されました！"}

@app.put("/change_team_set")
async def change_team_set(
    team_update: Change_team,  # 変更したい情報
    current_user: UserCreate = Depends(get_current_active_user)
):
    try:
        logger.info("Received team set update request: %s", team_update)  # 受け取ったデータをログ出力

        with SessionLocal() as session:
            team_current = session.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
            if not team_current:
                raise HTTPException(status_code=404, detail="チームが見つかりません")
            if team_update.country is not None:
                team_current.country = ','.join(team_update.country)  # 有効な国名をカンマ区切りで保存
            if team_update.age is not None:
                team_current.age = team_update.age  # 年齢の更新
            session.commit()

    except Exception as e:
        logger.error("Error updating team set: %s", str(e))  # エラーをログ出力
        raise HTTPException(status_code=500, detail="チーム設定更新中にエラーが発生しました")

    return {"message": "チーム設定が正常に更新されました！"}

@app.post('/team_register')
async def team_register(team: TeamCreate):
    try:
        with SessionLocal() as session:
            # countryリストをカンマ区切りの文字列に変換
            country_str = ",".join(team.country)  # ['Japan', 'Brazil', 'Indonesia', 'Vietnam'] -> 'Japan,Brazil,Indonesia,Vietnam'
            
            # 新しいチームを作成
            new_team = TeamTable(
                team_id=team.team_id,
                team_name=team.team_name,
                team_time=datetime.now(),
                country=country_str,  # 変換した文字列を保存
                age=team.age,  # age をそのまま設定
                member_count=team.member_count  # member_count をそのまま設定
            )
            session.add(new_team)
            session.commit()
            logging.info(f"Team registered successfully: {team.team_id}")
        
        return JSONResponse({"message": "Register Successfully!"})
    
    except Exception as e:
        logging.error(f"Error during registration: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during registration: {str(e)}")

@app.post("/generate_quiz")
async def generate_quiz(category: Category, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            result = (session.query(MDiaryTable)
                      .filter(MDiaryTable.language_id == current_user.main_language)
                      .order_by(MDiaryTable.diary_time.desc())
                      .first())

            # 日記が存在しない場合の処理
            if result is None:
                return JSONResponse(status_code=404, content={"error": "No diary found."})
            user_with_team = session.query(UserTable).filter(UserTable.user_id == current_user.user_id).first()
            team = session.query(TeamTable).filter(TeamTable.team_id == user_with_team.team_id).first()
            print(f"Team Name: {team.team_name}, Country: {team.country}")
            country = team.country
            print(country)
            age = team.age
            # クイズを生成
            quizzes = make_quiz(result.content, category.category1, category.category2,country,age)

            # クイズが生成されなかった場合の処理
            if len(quizzes) < 10:
                return JSONResponse(status_code=404, content={"error": "No quizzes generated. : もう一度お試しください"})
            # 既存のキャッシュを削除（同じユーザーの古いキャッシュがある場合）
            session.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id).delete()
            session.commit()
            # キャッシュテーブルに保存
            for  i, quiz_data in enumerate(quizzes):
                new_cache = CashQuizTable(
                    cash_quiz_id = i + 1,
                    team_id = current_user.team_id,
                    diary_id=result.diary_id,
                    user_id=current_user.user_id,
                    question=quiz_data['question'],
                    correct=quiz_data['answer'],
                    a=quiz_data['choices'][0],
                    b=quiz_data['choices'][1],
                    c=quiz_data['choices'][2],
                    d=quiz_data['choices'][3]
                )
                session.add(new_cache)
            session.commit()

    except Exception as e:
        # エラーが発生した場合は500エラーを返す
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}"})
import time
import logging

@app.post("/save_quiz")
async def save_quiz(selected_quizzes: SelectedQuiz, current_user: UserCreate = Depends(get_current_active_user)):
    start_time = time.time()  # 処理開始時刻を記録

    try:
        with SessionLocal() as session:
            # クイズ情報が5問選ばれているかを確認
            if len(selected_quizzes.selected_quizzes) != 5:
                return JSONResponse(status_code=400, content={"error": "You must select exactly 5 questions."})
            team = current_user.team_id
             # チームの年齢情報を取得
            team_age = session.query(TeamTable).filter(TeamTable.team_id == team).first()
            if team_age is None or team_age.age not in age_map:
                logging.error(f"Invalid team age: {team_age.age if team_age else 'None'}")
                raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")
            age_group = age_map[team_age.age]  # 年齢グループを取得
            # キャッシュテーブルから選ばれたクイズ情報を取得
            selected_quiz_ids = selected_quizzes.selected_quizzes
            quizzes_to_save = session.query(CashQuizTable).filter(
                CashQuizTable.cash_quiz_id.in_(selected_quiz_ids),
                CashQuizTable.user_id == current_user.user_id
            ).all()
            if len(quizzes_to_save) != 5:
                return JSONResponse(status_code=404, content={"error": "Selected quizzes not found in cache."})

            quizzes_to_save_list = []
            for quiz in quizzes_to_save:
                quizzes_to_save_list.append([quiz.question, quiz.a, quiz.b, quiz.c, quiz.d])
            
            # translate_quizzに渡すために、リストをフラットな文字列リストに変換
            flattened_quizzes_list = [item for sublist in quizzes_to_save_list for item in sublist]
            
            # translate_quizzがリストの形式で返されると仮定
            translated_quizzes_to_save = await translate_quizz(flattened_quizzes_list,age_group)
            
            # クイズ情報を正式なテーブルに保存
            for i, quiz in enumerate(quizzes_to_save):
                new_quiz = QuizTable(
                    quiz_id=i + 1,
                    diary_id=quiz.diary_id,
                    question=quiz.question,
                    correct=quiz.correct,
                    a=quiz.a,
                    b=quiz.b,
                    c=quiz.c,
                    d=quiz.d
                )
                session.add(new_quiz)

            session.commit()

            # 翻訳結果がリストのリストとして返されるため、二重ループを使う
            if isinstance(translated_quizzes_to_save, list):
                for i, quiz_translations in enumerate(translated_quizzes_to_save, start=1):
                    # 各言語の翻訳結果を処理
                    for lang_id, translated_quiz in enumerate(quiz_translations, start=1):
                        new_translate_quiz = MQuizTable(
                            quiz_id=i,
                            diary_id=quizzes_to_save[i-1].diary_id,  # 修正: quizzes_to_save[i-1]でdiary_idを取得
                            language_id=lang_id,
                            question=translated_quiz[0],
                            correct=quizzes_to_save[i-1].correct,  # 修正: quizzes_to_save[i-1]でcorrectを取得
                            a=translated_quiz[1],
                            b=translated_quiz[2],
                            c=translated_quiz[3],
                            d=translated_quiz[4]
                        )
                        session.add(new_translate_quiz)
                session.commit()

            # キャッシュをクリア
            session.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id).delete()
            session.commit()

        logging.info("Successfully saved selected quizzes.")

        # 処理終了時刻を記録
        end_time = time.time()

        # 実行時間をログに出力
        execution_time = end_time - start_time
        logging.info(f"Execution time: {execution_time} seconds")
    except Exception as e:
        logging.error(f"Error saving quizzes: {e}")
        return JSONResponse(status_code=500, content={"message": "An error occurred while saving the quizzes."})

@app.post("/add_reaction")
def add_reaction(reaction: ReactionRequest):
    try:
        with SessionLocal() as session:
            diary = session.query(DiaryTable).filter(DiaryTable.diary_id == reaction.diary_id).first()
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

            session.commit()
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
        logging.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logging.error(f"Error adding reaction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding reaction: {str(e)}")

age_map = {
    "Elementary1": 1, "Elementary2": 2, "Elementary3": 3,
    "Elementary4": 4, "Elementary5": 5, "Elementary6": 6,
    "Junior1": 7, "Junior2": 7, "Junior3": 7,
    "Other": 8
}

@app.post("/add_diary")
async def add_diary(diary: DiaryCreate, current_user: UserCreate = Depends(get_current_active_user)):
    """
    現在ログインしているユーザーの情報を利用して日記を追加します。
    """
    diary_time = datetime.now()  # 現在時刻を取得

    with SessionLocal() as session:
        team = current_user.team_id

        # チームの年齢情報を取得
        team_age = session.query(TeamTable).filter(TeamTable.team_id == team).first()

        if team_age is None or team_age.age not in age_map:
            logging.error(f"Invalid team age: {team_age.age if team_age else 'None'}")
            raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")

        age_group = age_map[team_age.age]  # 年齢グループを取得

        # 悪口チェック
        try:
            complaining = filter_diary_entry(diary.content)
        except ValueError:
            raise HTTPException(status_code=400, detail="不正なレスポンスを受け取りました。")
        except Exception as e:
            logging.error(f"Error in filtering diary entry: {e}")
            raise HTTPException(status_code=500, detail="フィルタリング中にエラーが発生しました。")

        # 文字数チェック
        try:
            wordcount = count_words(diary.content, current_user.main_language, age_group)
        except Exception as e:
            logging.error(f"Error in counting words: {e}")
            raise HTTPException(status_code=500, detail="文字数カウント中にエラーが発生しました。")

        # 悪口や文字数不足の場合の処理
        if complaining in {1, 2} or wordcount < 200:
            return {
                "status": False,
                "message": "There might be bad words, or the text is less than 200 words : 悪口が含まれている可能性があるか、文字数が200文字に達していません。書き直してください。"
            }

        try:
            # 日記を保存
            new_diary = DiaryTable(
                team_id=current_user.team_id,
                user_id=current_user.user_id,
                title=diary.title,
                diary_time=diary_time,
                content=diary.content,
                main_language=current_user.main_language
            )
            session.add(new_diary)
            session.commit()
            session.refresh(new_diary)  # 新しい日記の ID を取得可能に

            # 翻訳された日記を追加
            diary_id = new_diary.diary_id
            diary_list = translate_diary(diary.title, diary.content, current_user.main_language, age_group)

            translated_entries = [
                MDiaryTable(
                    diary_id=diary_id,
                    language_id=i,
                    team_id=current_user.team_id,
                    user_id=current_user.user_id,
                    title=title,
                    diary_time=diary_time,
                    content=content,
                )
                for i, (title, content) in enumerate(diary_list, start=1)
            ]

            session.add_all(translated_entries)
            session.commit()

            # ユーザーの日記カウントを更新
            current_user.diary_count += 1
            session.merge(current_user)
            session.commit()

            logging.info(f"Diary added successfully: user_id={current_user.user_id}, diary_id={diary_id}")

        except Exception as e:
            session.rollback()
            logging.error(f"Error while adding diary: {e}")
            raise HTTPException(status_code=500, detail="日記の追加中にエラーが発生しました。")

    return {"status": True, "message": "Diary added successfully!"}
@app.get("/get_team_name")
async def get_team_name(current_user: UserCreate = Depends(get_current_active_user)):
    """
    チーム名を取得します。
    """
    with SessionLocal() as session:
        team = session.query(TeamTable).filter(TeamTable.team_id == current_user.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        return {"team_name": team.team_name}
    
@app.get("/get_diaries")
async def get_diaries(current_user: UserCreate = Depends(get_current_active_user)):
    """
    チームに所属する全てのユーザーの日記を取得し、
    現在ログインしているユーザーの main_language で出力します。
    """
    team_id = current_user.team_id
    main_language = current_user.main_language

    with SessionLocal() as session:
        result = (
            session.query(
                UserTable.name.label("user_name"),  # ユーザー名
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
            .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)  # 日記と翻訳を結合
            .join(UserTable, DiaryTable.user_id == UserTable.user_id)  # 日記の投稿者情報を結合
            .filter(UserTable.team_id == team_id) 
            .filter(MDiaryTable.team_id == team_id)  # MDiaryTable の team_id が current_user の team_id と一致
            .filter(MDiaryTable.language_id == main_language)  # 言語フィルタ
            .filter(MDiaryTable.is_visible == 1)  # 翻訳が可視状態
            .filter(DiaryTable.is_visible == 1)  # 元の日記も可視状態
            .order_by(MDiaryTable.diary_time.asc())  # 日付順に並び替え
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

@app.get("/get_my_diary")
async def get_my_diary(current_user: UserCreate = Depends(get_current_active_user)):
    """
    ログインユーザー自身の日記を取得する。
    """
    team_id = current_user.team_id
    main_language = current_user.main_language
    user_id = current_user.user_id

    with SessionLocal() as session:
        result = (
            session.query(
                UserTable.name.label("user_name"),  # ユーザー名
                UserTable.diary_count,  # ユーザーの日記数
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
            .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)  # multilingual_diary と diary を結合
            .join(UserTable, (DiaryTable.user_id == UserTable.user_id) & (DiaryTable.team_id == UserTable.team_id))  # user と diary を結合
            .filter(UserTable.team_id == team_id)  # チーム ID でフィルタ
            .filter(UserTable.user_id == user_id)  # ユーザー ID でフィルタ
            .filter(DiaryTable.team_id == team_id)  # チーム ID でフィルタ
            .filter(DiaryTable.user_id == user_id)  # 自分の日記のみ
            .filter(MDiaryTable.language_id == main_language)  # main_language でフィルタ
            .filter(MDiaryTable.is_visible == 1)  # multilingual_diary の可視性チェック
            .filter(DiaryTable.is_visible == 1)  # diary の可視性チェック
            .order_by(DiaryTable.diary_time.asc())  # 日記の時間で並び替え
            .all()
        )

    if not result:
        return JSONResponse(content={"error": "No diaries found"}, status_code=404)

    return JSONResponse(content={
        "team_id": team_id,
        "diary_count": result[0].diary_count,  # ユーザーの日記数
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

@app.post("/get_individual_diaries")
async def get_individual_diaries(request: UserRequest, current_user: UserCreate = Depends(get_current_active_user)):
    """
    指定されたユーザーの日記を取得する。
    """
    user_id = request.user_id
    team_id = current_user.team_id
    main_language = current_user.main_language

    with SessionLocal() as session:
        result = (
            session.query(
                UserTable.name.label("user_name"),  # ユーザー名
                UserTable.diary_count,  # ユーザーの日記数
                MDiaryTable.diary_id,
                MDiaryTable.title,
                MDiaryTable.content,
                MDiaryTable.diary_time,
            )
            .join(DiaryTable, MDiaryTable.diary_id == DiaryTable.diary_id)  # multilingual_diary と diary を結合
            .join(UserTable, (UserTable.user_id == MDiaryTable.user_id) & (UserTable.team_id == MDiaryTable.team_id))  # user と multilingual_diary を結合
            .filter(UserTable.team_id == team_id)  # チーム ID でフィルタ
            .filter(UserTable.user_id == user_id)  # 指定ユーザーでフィルタ
            .filter(MDiaryTable.language_id == main_language)  # main_language でフィルタ
            .filter(MDiaryTable.is_visible == 1)  # multilingual_diary の可視性チェック
            .filter(DiaryTable.is_visible == 1)  # diary の可視性チェック
            .order_by(MDiaryTable.diary_time.asc())  # 日記の時間で並び替え
            .all()
        )

    if not result:
        return JSONResponse(content={"error": "No diaries found"}, status_code=404)

    return JSONResponse(content={
        "team_id": team_id,
        "diary_count": result[0].diary_count,  # ユーザーの日記数
        "diaries": [
            {
                "user_name": row.user_name,
                "diary_id": row.diary_id,
                "title": row.title,
                "content": row.content,
                "diary_time": row.diary_time.strftime('%Y-%m-%d %H:%M:%S'),
            }
            for row in result
        ],
    })
    
@app.get("/get_quizzes")
async def get_quizzes(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # ユーザーに関連するクイズデータを取得
            quizzes = session.query(CashQuizTable).filter(CashQuizTable.user_id == current_user.user_id).filter(CashQuizTable.team_id == current_user.team_id).all()
            team = current_user.team_id

             # チームの年齢情報を取得
            team_age = session.query(TeamTable).filter(TeamTable.team_id == team).first()

            if team_age is None or team_age.age not in age_map:
                logging.error(f"Invalid team age: {team_age.age if team_age else 'None'}")
                raise HTTPException(status_code=400, detail="チームの年齢情報が不正です。")

            age_group = age_map[team_age.age]  # 年齢グループを取得
            quizzes_dict = [quiz_to_dict(quiz) for quiz in quizzes]
            logging.info(f"Converted quizzes: {quizzes_dict}")
            # ユーザーの言語に応じてクイズの質問を翻訳
            if current_user.main_language == 1:
                for quiz in quizzes_dict:
                    quiz['question'] = convert_question(quiz['question'],age_group )
            else:
                for quiz in quizzes_dict:
                    quiz['question'] = await translate_question(quiz['question'], current_user.main_language)
            return JSONResponse(content={"quizzes": quizzes_dict})
    except Exception as e:
        logging.error(f"Error fetching quizzes: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"An error occurred: {str(e)}"})

def quiz_to_dict(quiz):
    return {
        "id": quiz.cash_quiz_id,  # cash_quiz_id を id に変換
        "question": quiz.question,
        "correct": quiz.correct,
        "a": quiz.a,
        "b": quiz.b,
        "c": quiz.c,
        "d": quiz.d,
        # 必要なフィールドをここに追加
    }
@app.get("/get_same_quiz/{diary_id}")
async def get_same_quiz(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 指定された日記IDに基づいて、関連する全てのクイズを取得
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)# diary_idでフィルタ
                .filter(MQuizTable.language_id == current_user.main_language)  # ユーザーの母国語でフィルタ
                .order_by(desc(MQuizTable.quiz_id))  # クイズIDで降順ソート
                .all()
            )

            if not quiz_results:
                logging.warning("No quizzes found.")
                return JSONResponse(content={"quizzes": []})

            quizzes_data = []
            for q in quiz_results:
                # ユーザーの母国語と一致する場合のみリストに追加
                    quizzes_data.append({
                        "diary_id": q.diary_id,
                        "quiz_id": q.quiz_id,
                        "question": q.question,
                        "choices": {
                            "a": q.a,
                            "b": q.b,
                            "c": q.c,
                            "d": q.d
                        }
                    })

            return JSONResponse(content={"quizzes": quizzes_data})
    except Exception as e:
        logging.error(f"Error during getting quiz: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting quiz: {str(e)}")
 
@app.get("/get_different_quiz/{diary_id}")
async def get_different_quiz(diary_id: int,current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 指定された日記IDに基づいて、関連する全てのクイズを取得
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)# diary_idでフィルタ
                .filter(MQuizTable.language_id == current_user.learn_language)  # ユーザーの母国語でフィルタ
                .order_by(desc(MQuizTable.quiz_id))  # クイズIDで降順ソート
                .all()
            )

            if not quiz_results:
                logging.warning("No quizzes found.")


            quizzes_data = []
            for q in quiz_results:
                # 問題文はユーザーの母国語で取得
                if q.language_id == current_user.learn_language:
                    question = q.question  # 自分の言語の問題文
                    choices = {
                        "a": q.a,
                        "b": q.b,
                        "c": q.c,
                        "d": q.d
                    }

                    # クイズデータをリストに追加
                    quizzes_data.append({
                        "diary_id": q.diary_id,
                        "quiz_id": q.quiz_id,
                        "question": question,
                        "choices": choices
                    })
                    
           

            if not quizzes_data:
                logging.warning("No quizzes found.")
            else:
                logging.info(f"Retrieved quizzes: {quizzes_data}")

            return JSONResponse(content={"quizzes": quizzes_data})
    except Exception as e:
        logging.error(f"Error during getting quiz: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting quiz: {str(e)}")
    raise HTTPException(status_code=400, detail=f"Error during getting quiz: {str(e)}")   


@app.get("/get_quiz_audio1/{diary_id}")
async def get_quiz_audio(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        language_map = {
            1: "ja",  # 日本語
            2: "en",  # 英語
            3: "pt",  # ポルトガル語
            4: "es",  # スペイン語
            5: "zh",  # 簡体中文
            6: "zh",  # 繁体中文
            7: "ko",  # 韓国語
            8: "tl",  # タガログ語
            9: "vi",  # ベトナム語
            10: "id",  # インドネシア語
            11: "ne",  # ネパール語
        }
        with SessionLocal() as session:
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)
                .filter(MQuizTable.language_id == current_user.learn_language)
                .order_by((MQuizTable.quiz_id.asc()))
                .first()
            )
            if not quiz_results:
                logging.warning("No quizzes found.")
                return {"error": "クイズが見つかりませんでした"}

            logging.info(f"Retrieved quiz: {quiz_results}")

            # Audio choice mapping
            choices = {
                1: quiz_results.a,
                2: quiz_results.b,
                3: quiz_results.c,
                4: quiz_results.d,
            }

            # Create a zip file in memory
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(1, 5):
                    text = choices[i]
                    tts = gTTS(text=text, lang=language_map[current_user.learn_language])
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)

                    # Save each choice as a separate file with the desired names
                    choice_filename = chr(96 + i) + ".mp3"  # 'a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'
                    
                    # Log the file name before saving
                    logging.info(f"Generating audio for choice {chr(96 + i)}: {choice_filename}, size: {len(audio_buffer.getvalue())} bytes")
                    
                    zip_file.writestr(choice_filename, audio_buffer.read())

            zip_buffer.seek(0)

            return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

    except Exception as e:
        logging.error(f"Error generating quiz audio: {e}")
        return {"error": "音声生成に失敗しました"}

@app.get("/get_quiz_audio2/{diary_id}")
async def get_quiz_audio(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        language_map = {
            1: "ja",  # 日本語
            2: "en",  # 英語
            3: "pt",  # ポルトガル語
            4: "es",  # スペイン語
            5: "zh",  # 簡体中文
            6: "zh",  # 繁体中文
            7: "ko",  # 韓国語
            8: "tl",  # タガログ語
            9: "vi",  # ベトナム語
            10: "id",  # インドネシア語
            11: "ne",  # ネパール語
        }
        with SessionLocal() as session:
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)
                .filter(MQuizTable.language_id == current_user.learn_language)
                .order_by((MQuizTable.quiz_id.asc()))
                .offset(1)
                .first()
            )
            if not quiz_results:
                logging.warning("No quizzes found.")
                return {"error": "クイズが見つかりませんでした"}

            logging.info(f"Retrieved quiz: {quiz_results}")

            # Audio choice mapping
            choices = {
                1: quiz_results.a,
                2: quiz_results.b,
                3: quiz_results.c,
                4: quiz_results.d,
            }

            # Create a zip file in memory
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(1, 5):
                    text = choices[i]
                    tts = gTTS(text=text, lang=language_map[current_user.learn_language])
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)

                    # Save each choice as a separate file with the desired names
                    choice_filename = chr(96 + i) + ".mp3"  # 'a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'
                    
                    # Log the file name before saving
                    logging.info(f"Generating audio for choice {chr(96 + i)}: {choice_filename}, size: {len(audio_buffer.getvalue())} bytes")
                    
                    zip_file.writestr(choice_filename, audio_buffer.read())

            zip_buffer.seek(0)

            return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

    except Exception as e:
        logging.error(f"Error generating quiz audio: {e}")
        return {"error": "音声生成に失敗しました"}
@app.get("/get_quiz_audio3/{diary_id}")
async def get_quiz_audio(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        language_map = {
            1: "ja",  # 日本語
            2: "en",  # 英語
            3: "pt",  # ポルトガル語
            4: "es",  # スペイン語
            5: "zh",  # 簡体中文
            6: "zh",  # 繁体中文
            7: "ko",  # 韓国語
            8: "tl",  # タガログ語
            9: "vi",  # ベトナム語
            10: "id",  # インドネシア語
            11: "ne",  # ネパール語
        }
        with SessionLocal() as session:
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)
                .filter(MQuizTable.language_id == current_user.learn_language)
                .order_by((MQuizTable.quiz_id.asc()))
                .offset(2)
                .first()
            )
            if not quiz_results:
                logging.warning("No quizzes found.")
                return {"error": "クイズが見つかりませんでした"}

            logging.info(f"Retrieved quiz: {quiz_results}")

            # Audio choice mapping
            choices = {
                1: quiz_results.a,
                2: quiz_results.b,
                3: quiz_results.c,
                4: quiz_results.d,
            }

            # Create a zip file in memory
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(1, 5):
                    text = choices[i]
                    tts = gTTS(text=text, lang=language_map[current_user.learn_language])
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)

                    # Save each choice as a separate file with the desired names
                    choice_filename = chr(96 + i) + ".mp3"  # 'a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'
                    
                    # Log the file name before saving
                    logging.info(f"Generating audio for choice {chr(96 + i)}: {choice_filename}, size: {len(audio_buffer.getvalue())} bytes")
                    
                    zip_file.writestr(choice_filename, audio_buffer.read())

            zip_buffer.seek(0)

            return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

    except Exception as e:
        logging.error(f"Error generating quiz audio: {e}")
        return {"error": "音声生成に失敗しました"}
@app.get("/get_quiz_audio4/{diary_id}")
async def get_quiz_audio(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        language_map = {
            1: "ja",  # 日本語
            2: "en",  # 英語
            3: "pt",  # ポルトガル語
            4: "es",  # スペイン語
            5: "zh",  # 簡体中文
            6: "zh",  # 繁体中文
            7: "ko",  # 韓国語
            8: "tl",  # タガログ語
            9: "vi",  # ベトナム語
            10: "id",  # インドネシア語
            11: "ne",  # ネパール語
        }
        with SessionLocal() as session:
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)
                .filter(MQuizTable.language_id == current_user.learn_language)
                .order_by((MQuizTable.quiz_id.asc()))
                .offset(3)
                .first()
            )
            if not quiz_results:
                logging.warning("No quizzes found.")
                return {"error": "クイズが見つかりませんでした"}

            logging.info(f"Retrieved quiz: {quiz_results}")

            # Audio choice mapping
            choices = {
                1: quiz_results.a,
                2: quiz_results.b,
                3: quiz_results.c,
                4: quiz_results.d,
            }

            # Create a zip file in memory
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(1, 5):
                    text = choices[i]
                    tts = gTTS(text=text, lang=language_map[current_user.learn_language])
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)

                    # Save each choice as a separate file with the desired names
                    choice_filename = chr(96 + i) + ".mp3"  # 'a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'
                    
                    # Log the file name before saving
                    logging.info(f"Generating audio for choice {chr(96 + i)}: {choice_filename}, size: {len(audio_buffer.getvalue())} bytes")
                    
                    zip_file.writestr(choice_filename, audio_buffer.read())

            zip_buffer.seek(0)

            return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

    except Exception as e:
        logging.error(f"Error generating quiz audio: {e}")
        return {"error": "音声生成に失敗しました"}
@app.get("/get_quiz_audio5/{diary_id}")
async def get_quiz_audio(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        language_map = {
            1: "ja",  # 日本語
            2: "en",  # 英語
            3: "pt",  # ポルトガル語
            4: "es",  # スペイン語
            5: "zh",  # 簡体中文
            6: "zh",  # 繁体中文
            7: "ko",  # 韓国語
            8: "tl",  # タガログ語
            9: "vi",  # ベトナム語
            10: "id",  # インドネシア語
            11: "ne",  # ネパール語
        }
        with SessionLocal() as session:
            quiz_results = (
                session.query(MQuizTable)
                .filter(MQuizTable.diary_id == diary_id)
                .filter(MQuizTable.language_id == current_user.learn_language)
                .order_by((MQuizTable.quiz_id.asc()))
                .offset(4)
                .first()
            )
            if not quiz_results:
                logging.warning("No quizzes found.")
                return {"error": "クイズが見つかりませんでした"}

            logging.info(f"Retrieved quiz: {quiz_results}")

            # Audio choice mapping
            choices = {
                1: quiz_results.a,
                2: quiz_results.b,
                3: quiz_results.c,
                4: quiz_results.d,
            }

            # Create a zip file in memory
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(1, 5):
                    text = choices[i]
                    tts = gTTS(text=text, lang=language_map[current_user.learn_language])
                    audio_buffer = io.BytesIO()
                    tts.write_to_fp(audio_buffer)
                    audio_buffer.seek(0)

                    # Save each choice as a separate file with the desired names
                    choice_filename = chr(96 + i) + ".mp3"  # 'a.mp3', 'b.mp3', 'c.mp3', 'd.mp3'
                    
                    # Log the file name before saving
                    logging.info(f"Generating audio for choice {chr(96 + i)}: {choice_filename}, size: {len(audio_buffer.getvalue())} bytes")
                    
                    zip_file.writestr(choice_filename, audio_buffer.read())

            zip_buffer.seek(0)

            return StreamingResponse(zip_buffer, media_type="application/zip", headers={"Content-Disposition": "attachment; filename=quiz_audio.zip"})

    except Exception as e:
        logging.error(f"Error generating quiz audio: {e}")
        return {"error": "音声生成に失敗しました"}

@app.get("/get_judgement1/{diary_id}")
async def get_judgement(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 解答日が一番最新のデータ1件を取得
            result = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.diary_id == diary_id).order_by(AnswerTable.answer_date.desc()).first()
        
        if result:
            # judgementを取り出し、1ならTrue、0ならFalseを返す
            selected_choice = result.choices  # `choices` フィールドから選択肢を取得

            # multilingual_quizテーブルからクイズを取得
            quiz_result = session.query(QuizTable).filter(QuizTable.diary_id == diary_id).first()
            correct_choice = None
            if quiz_result:
                correct_field = quiz_result.correct  # 正解の選択肢（1, 2, 3, 4）

                # 正解を選択肢番号として返す（a, b, c, d）
                if correct_field == '1':
                    correct_choice = 'A'
                elif correct_field == '2':
                    correct_choice = 'B'
                elif correct_field == '3':
                    correct_choice = 'C'
                elif correct_field == '4':
                    correct_choice = 'D'
            print({
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            })
            # 返すデータ
            return {
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            }
        else:
            return {"judgement": None, "selected_choice": None, "correct_choice": None}  # 解答が見つからない場合

    except Exception as e:
        logging.error(f"Error during getting judgement: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")



@app.get("/get_judgement2/{diary_id}")
async def get_judgement(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 解答日が一番最新のデータ1件を取得
            result = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.diary_id == diary_id).order_by(AnswerTable.answer_date.desc()).first()
        
        if result:
            # judgementを取り出し、1ならTrue、0ならFalseを返す
            selected_choice = result.choices  # `choices` フィールドから選択肢を取得

            # multilingual_quizテーブルからクイズを取得
            quiz_result = session.query(QuizTable).filter(QuizTable.diary_id == diary_id).offset(1).first()
            correct_choice = None
            if quiz_result:
                correct_field = quiz_result.correct  # 正解の選択肢（1, 2, 3, 4）

                # 正解を選択肢番号として返す（a, b, c, d）
                if correct_field == '1':
                    correct_choice = 'A'
                elif correct_field == '2':
                    correct_choice = 'B'
                elif correct_field == '3':
                    correct_choice = 'C'
                elif correct_field == '4':
                    correct_choice = 'D'
            print({
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            })
            # 返すデータ
            return {
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            }
        else:
            return {"judgement": None, "selected_choice": None, "correct_choice": None}  # 解答が見つからない場合

    except Exception as e:
        logging.error(f"Error during getting judgement: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")



@app.get("/get_judgement3/{diary_id}")
async def get_judgement(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 解答日が一番最新のデータ1件を取得
            result = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.diary_id == diary_id).order_by(AnswerTable.answer_date.desc()).first()
        
        if result:
            # judgementを取り出し、1ならTrue、0ならFalseを返す
            selected_choice = result.choices  # `choices` フィールドから選択肢を取得

            # multilingual_quizテーブルからクイズを取得
            quiz_result = session.query(QuizTable).filter(QuizTable.diary_id == diary_id).offset(2).first()

            correct_choice = None
            if quiz_result:
                correct_field = quiz_result.correct  # 正解の選択肢（1, 2, 3, 4）

                # 正解を選択肢番号として返す（a, b, c, d）
                if correct_field == '1':
                    correct_choice = 'A'
                elif correct_field == '2':
                    correct_choice = 'B'
                elif correct_field == '3':
                    correct_choice = 'C'
                elif correct_field == '4':
                    correct_choice = 'D'
            print({
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            })
            # 返すデータ
            return {
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            }
        else:
            return {"judgement": None, "selected_choice": None, "correct_choice": None}  # 解答が見つからない場合

    except Exception as e:
        logging.error(f"Error during getting judgement: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")



@app.get("/get_judgement4/{diary_id}")
async def get_judgement(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 解答日が一番最新のデータ1件を取得
            result = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.diary_id == diary_id).order_by(AnswerTable.answer_date.desc()).first()
        
        if result:
            # judgementを取り出し、1ならTrue、0ならFalseを返す
            selected_choice = result.choices  # `choices` フィールドから選択肢を取得

            # multilingual_quizテーブルからクイズを取得
            quiz_result = session.query(QuizTable).filter(QuizTable.diary_id == diary_id).offset(3).first()
            correct_choice = None
            if quiz_result:
                correct_field = quiz_result.correct  # 正解の選択肢（1, 2, 3, 4）

                # 正解を選択肢番号として返す（a, b, c, d）
                if correct_field == '1':
                    correct_choice = 'A'
                elif correct_field == '2':
                    correct_choice = 'B'
                elif correct_field == '3':
                    correct_choice = 'C'
                elif correct_field == '4':
                    correct_choice = 'D'
            print({
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            })
            # 返すデータ
            return {
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            }
        else:
            return {"judgement": None, "selected_choice": None, "correct_choice": None}  # 解答が見つからない場合

    except Exception as e:
        logging.error(f"Error during getting judgement: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")



@app.get("/get_judgement5/{diary_id}")
async def get_judgement(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 解答日が一番最新のデータ1件を取得
            result = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.diary_id == diary_id).order_by(AnswerTable.answer_date.desc()).first()
        
        if result:
            # judgementを取り出し、1ならTrue、0ならFalseを返す
            selected_choice = result.choices  # `choices` フィールドから選択肢を取得

            # multilingual_quizテーブルからクイズを取得
            quiz_result = session.query(QuizTable).filter(QuizTable.diary_id == diary_id).offset(4).first()

            correct_choice = None
            if quiz_result:
                correct_field = quiz_result.correct  # 正解の選択肢（1, 2, 3, 4）

                # 正解を選択肢番号として返す（a, b, c, d）
                if correct_field == '1':
                    correct_choice = 'A'
                elif correct_field == '2':
                    correct_choice = 'B'
                elif correct_field == '3':
                    correct_choice = 'C'
                elif correct_field == '4':
                    correct_choice = 'D'
            print({
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            })
            # 返すデータ
            return {
                "judgement": True if result.judgement == 1 else False,
                "selected_choice": selected_choice,  # ユーザーの選択肢を返す
                "correct_choice": correct_choice,    # 正解の選択肢（a, b, c, d）を返す
            }
        else:
            return {"judgement": None, "selected_choice": None, "correct_choice": None}  # 解答が見つからない場合

    except Exception as e:
        logging.error(f"Error during getting judgement: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting judgement: {str(e)}")


answer_dic = {
    "a" : 1,
    "b" : 2,
    "c" : 3,
    "d" : 4
}
@app.post("/create_answer")
async def create_answer(answer : AnswerCreate, current_user : UserCreate = Depends(get_current_active_user)):
    try:
        # フロントエンドから送信されたデータを表示
        logging.info(f"Received answer data: {answer.dict()}")  # 受け取ったデータをログに出力
        answer_time = datetime.now()  # 現在時刻を取得
        with SessionLocal() as session:
            quiz = session.query(QuizTable).filter(QuizTable.diary_id == answer.diary_id,QuizTable.quiz_id == answer.quiz_id).first()
            if not quiz:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Quiz with id {answer.quiz_id} not found."
                )
            if quiz.correct == str(answer_dic[answer.choices]):
                judgement = 1
            else:
                judgement = 0
                
            new_answer = AnswerTable(
                team_id = current_user.team_id,
                user_id=current_user.user_id,
                quiz_id=answer.quiz_id,
                diary_id=answer.diary_id,
                language_id=current_user.main_language,
                answer_date=answer_time,
                choices=answer.choices,
                judgement=judgement
            )
            session.add(new_answer)
            session.commit()
            logging.info(f"Answer created successfully for user_id: {current_user.user_id}")
        return JSONResponse({"message": "Answer Created Successfully!"})

    except Exception as e:
        logging.error(f"Error during creating answer: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during creating answer: {str(e)}")

@app.get("/already_quiz/{diary_id}")
async def already_quiz(
    diary_id: int,
    current_user: UserCreate = Depends(get_current_active_user)
):
    """
    Check if the quiz for the given diary_id has already been answered by the user.
    Return true if 6 or more answers exist for the given diary_id.
    """
    try:
        with SessionLocal() as session:
            team_id = current_user.team_id
            user = session.query(UserTable).filter(UserTable.team_id == team_id,
                                                      UserTable.user_id == current_user.user_id).first()
            # ユーザーIDと日記IDに基づき、AnswerTableをクエリ
            answer_count = session.query(AnswerTable).filter(
                AnswerTable.user_id == user.user_id,
                AnswerTable.diary_id == diary_id
            ).count()  # 回答数をカウント
            if answer_count >= 5:
                # 5つ以上の回答がある場合
                return {"already": True}
            else:
                # 5つ未満の場合
                return {"already": False}
    except Exception as e:
        # エラー発生時にログを出力し、HTTP 500 エラーを返す
        raise HTTPException(status_code=500, detail=f"Error checking quiz status: {str(e)}")

@app.get("/get_answer")
async def get_answer(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # Get the last 5 answers for the current user, ordered by diary_id descending
            results = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.team_id == current_user.team_id)\
                .order_by(AnswerTable.answer_date.desc()).limit(5).all()

            # Count the number of correct answers
            correct_count = sum(1 for answer in results if answer.judgement == 1)
            print(f"Correct answers count: {correct_count}")

            # Update the user's answer_count field
            current_user.answer_count += correct_count
            session.commit()  # Commit the changes to the database
            
        # Return the correct count and updated answer_count
        return JSONResponse(content={
            "correct_count": correct_count,
            "updated_answer_count": current_user.answer_count
        })

    except Exception as e:
        logging.error(f"Error during getting answers: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")
    
@app.get("/get_answer_quiz")
async def get_answer_quiz(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            results = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.team_id == current_user.team_id) \
                .order_by(AnswerTable.answer_date.asc()).all()

            set_answer = []
            temp_set = []
            set_num = 1

            for i, answer in enumerate(results):
                quiz_result = session.query(MQuizTable).filter(MQuizTable.diary_id == answer.diary_id, MQuizTable.quiz_id == answer.quiz_id, MQuizTable.language_id == current_user.main_language).first()
                
                if quiz_result is None:
                    continue  # もしクイズ結果が見つからなければスキップする
                
                temp_set.append({
                    'user_id': answer.user_id,
                    'quiz_id': answer.quiz_id,
                    'diary_id': answer.diary_id,
                    'answer_date': answer.answer_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "choice":answer.choices,
                    'judgement': answer.judgement,
                    'question': quiz_result.question,
                    'choices': {
                        "a": quiz_result.a,
                        "b": quiz_result.b,
                        "c": quiz_result.c,
                        "d": quiz_result.d,
                        "correct": quiz_result.correct
                    }
                })
                first_answer_date = None  # セットの最初の回答日を記録
                if len(temp_set) == 5 or i == len(results) - 1:
                    if not first_answer_date:
                        first_answer_date = answer.answer_date.strftime('%Y-%m-%d %H:%M:%S')
                
                    set_result = session.query(ASetTable).filter(ASetTable.user_id == current_user.user_id, ASetTable.team_id == current_user.team_id,ASetTable.diary_id == answer.diary_id).first()
                    set_title = session.query(MDiaryTable).filter(MDiaryTable.diary_id == answer.diary_id, MDiaryTable.language_id == current_user.main_language).first()
                    
                    if set_title is None:
                        continue  # set_titleが見つからない場合スキップする
                    
                    set_name = session.query(UserTable).filter(UserTable.name == set_title.user_id, UserTable.team_id == current_user.team_id).first()
                    
                    if set_name is None:
                        continue  # set_nameが見つからない場合スキップする
                    
                    set_result = {
                        "title": set_title.title,
                        "name": set_name.name,
                        "correct_set": set_result.correct_set if set_result else 0,
                        "answer_date": first_answer_date,
                        "questions": temp_set,
                    }
                    set_answer.append({set_num: set_result})
                    set_num += 1
                    temp_set = []

        return JSONResponse(content={
            "correct_count": set_answer,
        })

    except Exception as e:
        logging.error(f"Error during getting answers: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")

@app.post("/get_individual_quiz")
async def get_answer_quiz(request: UserRequest, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        userId = request.user_id
        with SessionLocal() as session:
            results = session.query(AnswerTable).filter(AnswerTable.user_id == userId).filter(AnswerTable.team_id == current_user.team_id) \
                .order_by(AnswerTable.answer_date.asc()).all()

            set_answer = []
            temp_set = []
            set_num = 1

            for i, answer in enumerate(results):
                quiz_result = session.query(MQuizTable).filter(MQuizTable.diary_id == answer.diary_id, MQuizTable.quiz_id == answer.quiz_id, MQuizTable.language_id == current_user.main_language).first()
                
                if quiz_result is None:
                    continue  # もしクイズ結果が見つからなければスキップする
                
                temp_set.append({
                    'user_id': answer.user_id,
                    'quiz_id': answer.quiz_id,
                    'diary_id': answer.diary_id,
                    'answer_date': answer.answer_date.strftime('%Y-%m-%d %H:%M:%S'),
                    "choice":answer.choices,
                    'judgement': answer.judgement,
                    'question': quiz_result.question,
                    'choices': {
                        "a": quiz_result.a,
                        "b": quiz_result.b,
                        "c": quiz_result.c,
                        "d": quiz_result.d,
                        "correct": quiz_result.correct
                    }
                })
                first_answer_date = None  # セットの最初の回答日を記録
                if len(temp_set) == 5 or i == len(results) - 1:
                    if not first_answer_date:
                        first_answer_date = answer.answer_date.strftime('%Y-%m-%d %H:%M:%S')
                
                    set_result = session.query(ASetTable).filter(ASetTable.user_id == userId, ASetTable.team_id == current_user.team_id,ASetTable.diary_id == answer.diary_id).first()
                    set_title = session.query(MDiaryTable).filter(MDiaryTable.diary_id == answer.diary_id, MDiaryTable.language_id == current_user.main_language).first()
                    
                    if set_title is None:
                        continue  # set_titleが見つからない場合スキップする
                    
                    set_name = session.query(UserTable).filter(UserTable.name == set_title.user_id, UserTable.team_id == current_user.team_id).first()
                    
                    if set_name is None:
                        continue  # set_nameが見つからない場合スキップする
                    
                    set_result = {
                        "title": set_title.title,
                        "name": set_name.name,
                        "correct_set": set_result.correct_set if set_result else 0,
                        "answer_date": first_answer_date,
                        "questions": temp_set,
                    }
                    set_answer.append({set_num: set_result})
                    set_num += 1
                    temp_set = []

        return JSONResponse(content={
            "correct_count": set_answer,
        })

    except Exception as e:
        logging.error(f"Error during getting answers: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")

@app.get("/get_total_answer")
async def get_total_answer(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            results = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.team_id == current_user.team_id) \
                .order_by(AnswerTable.answer_date.desc()).all()
            correct_count = sum(1 for answer in results if answer.judgement == 1)
            total_quiz = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.team_id == current_user.team_id).count()
            persent = round((correct_count / total_quiz) * 100, 1)
            return JSONResponse({"correct_count": correct_count,
                                 "total_quiz": total_quiz,
                                 "persent": persent})
    except Exception as e:
        logging.error(f"Error during getting answers: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")
    
@app.post("/create_answer_set")
async def create_answer_set(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        answer_time = datetime.now()
        with SessionLocal() as session:
            results = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id).filter(AnswerTable.team_id == current_user.team_id) \
                .order_by(AnswerTable.answer_date.desc()).limit(5).all()
            correct_count = sum(1 for answer in results if answer.judgement == 1)
            diary_id = results[0].diary_id if results else None
            new_answer_set = ASetTable(
                team_id = current_user.team_id,
                user_id=current_user.user_id,
                diary_id=diary_id,
                answer_time=answer_time,
                correct_set = (correct_count)

            )
            session.add(new_answer_set)
            session.commit()
            logging.info(f"Answer created successfully for user_id: {current_user.user_id}")
        return JSONResponse({"message": "Answer Set Created Successfully!"})

    except Exception as e:
        logging.error(f"Error during creating answer: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during creating answer: {str(e)}")
   
@app.post("/get_individual_answer")
async def get_individual_answer(request:UserRequest,current_user: UserCreate = Depends(get_current_active_user)):
    userId = request.user_id
    try:
        with SessionLocal() as session:
            results = session.query(AnswerTable).filter(AnswerTable.user_id == userId).filter(AnswerTable.team_id == current_user.team_id) \
                .order_by(AnswerTable.answer_date.desc()).all()
            correct_count = sum(1 for answer in results if answer.judgement == 1)
            total_quiz = session.query(AnswerTable).filter(AnswerTable.user_id == userId).filter(AnswerTable.team_id == current_user.team_id).count()
            persent = round((correct_count / total_quiz) * 100, 1)
            return JSONResponse({"correct_count": correct_count,
                                 "total_quiz": total_quiz,
                                 "persent": persent})
    except Exception as e:
        logging.error(f"Error during getting answers: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during getting answers: {str(e)}")
    
@app.post("/update_answer")
async def update_answer(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # 現在のユーザーの最新5件の解答を降順で取得
            results = session.query(AnswerTable).filter(AnswerTable.user_id == current_user.user_id) \
                .order_by(AnswerTable.answer_date.desc()).limit(5).all()
            
            # 正解数をカウント
            correct_count = sum(1 for answer in results if answer.judgement == 1)

            # 既存のユーザー情報を取得
            existing_user = session.query(UserTable).filter(UserTable.user_id == current_user.user_id).filter(UserTable.team_id == current_user.team_id).first()
            if not existing_user:
                raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
            print(f"Correct answers count: {correct_count}")
            # `answer_count` を更新
            existing_user.answer_count += correct_count

            # 称号の計算
            titles = [
                (0, "駆け出しのクイズ好き"),
                (10, "クイズビギナー"),
                (20, "知識コレクター"),
                (30, "クイズチャレンジャー"),
                (40, "知識のエキスパート"),
                (50, "クイズマスター"),
                (60, "スーパー頭脳"),
                (70, "知識ヒーロー"),
                (80, "クイズのエリート"),
                (90, "知識の天才"),
                (100, "クイズの神"),
            ]

            # 現在の称号を判定
            new_title = None
            for threshold, title in titles:
                if existing_user.answer_count >= threshold:
                    new_title = title

            # 称号の更新が必要かチェック
            is_title_updated = (existing_user.nickname or "") != new_title

            # 変更がある場合のみ更新
            if is_title_updated:
                existing_user.nickname = new_title

            # データベースに反映
            session.commit()

            # 更新後の情報を取得
            updated_user = session.query(UserTable).filter(UserTable.user_id == current_user.user_id).first()

        # 正解数、更新後の answer_count、および称号を返す
        return JSONResponse(content={
            "correct_count": correct_count,
            "updated_answer_count": updated_user.answer_count,
            "updated_title": updated_user.nickname,
            "is_title_updated": is_title_updated
        })

    except Exception as e:
        logging.error(f"エラー: {str(e)}")
        raise HTTPException(status_code=400, detail=f"エラー: {str(e)}")
    
@app.get("/get_quiz_ranking")
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

            # ランキングデータの準備
            ranking = [
                {"id": user.user_id, "name": user.name, "nickname": user.nickname, "answer_count": user.answer_count}
                for user in users
            ]

            logger.info(f"Ranking fetched: {ranking}")  # ランキングデータをログに記録

            return JSONResponse(content={"ranking": ranking, "current_user_id": current_user.user_id})

    except Exception as e:
        logger.error(f"Error fetching ranking: {str(e)}")  # エラーの詳細をログに記録
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@app.get("/get_diary_ranking")
async def get_diary_ranking(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # current_userと同じteam_idを持つユーザーを取得し、answer_countで降順ソート
            users = (
                session.query(UserTable)
                .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
                .order_by(UserTable.diary_count.desc())  # answer_countの降順
                .limit(5)  # 上位5人を取得
                .all()
            )

            # ランキングデータの準備
            ranking = [
                {"id": user.user_id, "name": user.name,"nickname":user.nickname, "answer_count": user.diary_count}
                for user in users
            ]

            logger.info(f"Ranking fetched: {ranking}")  # ランキングデータをログに記録

            return JSONResponse(content={"ranking": ranking, "current_user_id": current_user.user_id})

    except Exception as e:
        logger.error(f"Error fetching ranking: {str(e)}")
        
@app.get("/get_combined_ranking")
async def get_combined_ranking(current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # クイズの正解数と日記の投稿数を取得
            quiz_users = (
                session.query(UserTable)
                .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
                .all()
            )

            # ユーザーごとの合計スコア（quiz_answer_count + diary_count）を計算
            user_scores = []
            for user in quiz_users:
                combined_score = user.answer_count + user.diary_count * 5  # 正解数と日記数を足す
                user_scores.append({
                    "id": user.user_id,
                    "name": user.name,
                    "nickname": user.nickname,
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

@app.post("/teacher_login")
async def teacher_login(teacher_login: TeacherLogin):
    if teacher_login.password == "1111":  # Compare the password field
        return JSONResponse(content={"message": "Successful"})
    else:
        return JSONResponse(content={"message": "Invalid password"}, status_code=400)
    
@app.get("/get_student_inf")
async def get_student_inf(current_user: UserResponse = Depends(get_current_active_user)):
    with SessionLocal() as session:
        users = (
            session.query(UserTable)
            .filter(UserTable.team_id == current_user.team_id)  # 同じチームのユーザーを取得
            .all()
        )
    
    # UserTable を Pydantic の UserResponse に変換
    return [
        UserResponse(
            user_id=user.user_id,
            team_id=user.team_id,
            name=user.name,
            password=user.password,
            main_language=user.main_language,
            learn_language=user.learn_language,
            answer_count=user.answer_count,
            diary_count=user.diary_count,
            nickname=user.nickname,
            is_admin=user.is_admin
        )
        for user in users
    ]
    
@app.put("/delete_diary/{diary_id}")
async def delete_diary(diary_id: int, current_user: UserCreate = Depends(get_current_active_user)):
    try:
        with SessionLocal() as session:
            # `diary` テーブルのレコードを取得
            ori_diary = session.query(DiaryTable).filter(DiaryTable.diary_id == diary_id).first()
            if not ori_diary:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Diary with id {diary_id} not found"
                )
            ori_diary.is_visible = False  # DiaryTableのis_visibleをFalseにする
            # multilingual_diaryテーブルのis_visibleをFalseにする
            multi_diaries = session.query(MDiaryTable).filter(MDiaryTable.diary_id == diary_id).all()
            for d in multi_diaries:
                d.is_visible = False  # MDiaryTableのis_visibleをFalseにする

            # ユーザーの日記数を減らす
            user = session.query(UserTable).filter(UserTable.user_id == current_user.user_id).first()
            if user:
                user.diary_count -= 1  # 日記数を1減らす
                session.add(user)

            # 1回のcommitで変更を確定
            session.commit()
            
            return JSONResponse({"message": "Diary Deleted Successfully!"})

    except Exception as e:
        logging.error(f"Error during deleting diary: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error during deleting diary: {str(e)}")

        

@app.exception_handler(404)
async def page_not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Page not found"})

@app.exception_handler(500)
async def internal_server_error(request: Request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
