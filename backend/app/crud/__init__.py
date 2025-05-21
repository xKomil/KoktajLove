from .crud_user import user
from .crud_cocktail import cocktail
from .crud_ingredient import ingredient
from .crud_tag import tag
from .crud_rating import rating
from .crud_favorite import favorite

# Jeśli używasz `from app import crud` do importowania,
# możesz chcieć zaimportować wszystkie obiekty CRUD tutaj, np.
# user = CRUDUser(User)
# cocktail = CRUDCocktail(Cocktail)
# ...