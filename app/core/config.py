DATABASE_URL = "mysql+pymysql://user:6213ryoy@mysql:3306/demo"
# DATABASE_URL = "mysql+pymysql://root:6213ryoy@127.0.0.1/exam"

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SS_TOKEN_EXPIRE_MINUTES = 30

ORIGINS = [
   "http://localhost", 
   "http://localhost:3000",
   "https://si-lab.org",
   "https://si-lab.org/diaryboard"
] 