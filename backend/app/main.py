# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="0.1.0",
    description=f"API dla aplikacji {settings.PROJECT_NAME}",
)

print(f"--- DEBUG [main.py PRZED MIDDLEWARE] ---")
print(f"Odczytana wartość settings.PROJECT_NAME: {settings.PROJECT_NAME}")
print(f"Typ settings.BACKEND_CORS_ORIGINS: {type(settings.BACKEND_CORS_ORIGINS)}")
print(f"Wartość settings.BACKEND_CORS_ORIGINS (obiekty AnyHttpUrl): {settings.BACKEND_CORS_ORIGINS}")

if settings.BACKEND_CORS_ORIGINS:
    allow_origins_list = []
    for origin_obj in settings.BACKEND_CORS_ORIGINS:
        # Konwertuj AnyHttpUrl na string i usuń ewentualny końcowy ukośnik
        origin_str = str(origin_obj).rstrip('/')
        allow_origins_list.append(origin_str)
        print(f"--- DEBUG [main.py] --- Przetworzony origin (z {origin_obj} na string bez /): {origin_str}")

    if allow_origins_list:
        print(f"--- DEBUG [main.py] --- Lista originów przekazywana do CORSMiddleware: {allow_origins_list}")
        try:
            app.add_middleware(
                CORSMiddleware,
                allow_origins=allow_origins_list, # Używamy listy stringów bez końcowych '/'
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"],
            )
            print(f"--- DEBUG [main.py] --- CORSMiddleware został pomyślnie dodany z allow_origins: {allow_origins_list}")
        except Exception as e:
            print(f"--- DEBUG [main.py] --- BŁĄD podczas dodawania CORSMiddleware: {e}")
            print(f"--- DEBUG [main.py] --- Oryginalna wartość settings.BACKEND_CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
            print(f"--- DEBUG [main.py] --- Lista przekazana do allow_origins, która spowodowała błąd: {allow_origins_list}")
    else:
        print(f"--- DEBUG [main.py] --- OSTRZEŻENIE: Brak poprawnych originów w settings.BACKEND_CORS_ORIGINS po przetworzeniu. CORSMiddleware NIE ZOSTAŁ DODANY.")
else:
    print(f"--- DEBUG [main.py] --- OSTRZEŻENIE: settings.BACKEND_CORS_ORIGINS jest puste lub None. CORSMiddleware nie został skonfigurowany.")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"], summary="Główny endpoint API")
async def read_root():
    return {"message": f"Witaj w {settings.PROJECT_NAME} API!"}