from .user import User
from .cocktail import Cocktail, cocktail_ingredient_association, cocktail_tag_association
from .ingredient import Ingredient
from .tag import Tag
from .rating import Rating
from .favorite import Favorite

# Import Base z base_class, aby Alembic mógł go znaleźć
from app.db.base_class import Base