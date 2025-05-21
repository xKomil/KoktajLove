# backend/app/schemas/enums.py
from enum import Enum

class IngredientUnit(str, Enum):
    MILLILITER = "ml"
    LITER = "l"
    GRAM = "g"
    KILOGRAM = "kg"
    PIECE = "szt." # sztuka
    DASH = "dash"   # kropla/szczypta
    SPOON = "łyżeczka" # łyżeczka
    BAR_SPOON = "łyżeczka barmańska"
    OUNCE = "oz"
    COUNT = "ilość" # Ogólna "ilość", np. dla lodu w kostkach