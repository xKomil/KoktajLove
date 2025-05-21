from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, users, cocktails, ingredients, tags, ratings, favorites

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(cocktails.router, prefix="/cocktails", tags=["Cocktails"])
api_router.include_router(ingredients.router, prefix="/ingredients", tags=["Ingredients"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["Ratings"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])