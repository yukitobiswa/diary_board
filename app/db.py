from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.automap import automap_base
from .core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata = MetaData()
metadata.reflect(bind=engine)

Base = automap_base()
Base.prepare(autoload_with=engine)

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
TitleTable = Base.classes.title if "title" in Base.classes else None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 