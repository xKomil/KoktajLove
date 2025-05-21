from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings
from app.db.session import engine
from app.db import base_class # Importuj to, aby Base.metadata było dostępne

# Opcjonalnie: Utwórz tabele przy starcie aplikacji (dla dewelopmentu).
# W produkcji lepiej polegać na migracjach Alembic.
# Jeśli używasz Alembic, możesz to zakomentować.
# base_class.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Konfiguracja CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Witaj w KoktajLOVE API!"}

# Opcjonalnie: Możesz dodać tutaj logikę tworzenia pierwszego superużytkownika
# przy starcie aplikacji, jeśli zdefiniowano go w config.py
# from app.db.init_db import init_db
# from app.db.session import SessionLocal
# def main():
#     db = SessionLocal()
#     init_db(db)
# if __name__ == "__main__": # To nie jest typowe dla Uvicorn, ale pokazuje ideę
#      main()