// frontend/src/pages/CocktailsPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CocktailList from '@/components/features/cocktails/CocktailList';
import SearchFilters from '@/components/features/cocktails/SearchFilters';
// import ActiveFilters from '@/components/features/cocktails/ActiveFilters'; // Zakomentowany lub usunięty import
import Pagination from '@/components/ui/Pagination/Pagination';
import Button from '@/components/ui/Button/Button';
import { getCocktails, CocktailFilters } from '@/services/cocktailService';
import { getIngredients } from '@/services/ingredientService';
import { getTags } from '@/services/tagService';
import { CocktailWithDetails, Ingredient, Tag, PaginatedResponse } from '@/types/cocktailTypes';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './CocktailsPage.module.css';

interface FilterState {
  name: string;
  selectedIngredients: Ingredient[];
  selectedTags: Tag[];
  minRating: number | null;
}

const INITIAL_FILTERS: FilterState = {
  name: '',
  selectedIngredients: [],
  selectedTags: [],
  minRating: null
};

const ITEMS_PER_PAGE = 12;

const CocktailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cocktails, setCocktails] = useState<CocktailWithDetails[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const isInitialUrlLoad = useRef(true);
  const isInitializingFromUrl = useRef(false);

  const debouncedSearchName = useDebounce(filters.name, 500);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const ingredientsResponse = await getIngredients({ size: 1000 });
        const tagsResponse = await getTags({ size: 1000 });
        const ingredientsList = Array.isArray(ingredientsResponse) ? ingredientsResponse : ingredientsResponse.items;
        const tagsList = Array.isArray(tagsResponse) ? tagsResponse : tagsResponse.items;
        setIngredients(ingredientsList || []);
        setTags(tagsList || []);
        setInitialDataLoaded(true);
      } catch (err) {
        console.error('Failed to load filter data:', err);
        setError(err as Error);
        setInitialDataLoaded(true);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!initialDataLoaded || !isInitialUrlLoad.current) return;
    isInitializingFromUrl.current = true;
    const nameParam = searchParams.get('name') || '';
    const ingredientIdsParam = searchParams.get('ingredients');
    const tagIdsParam = searchParams.get('tags');
    const minRatingParam = searchParams.get('min_rating');
    const pageParam = searchParams.get('page');
    const ingredientIds = ingredientIdsParam ? ingredientIdsParam.split(',').map(Number).filter(Boolean) : [];
    const tagIds = tagIdsParam ? tagIdsParam.split(',').map(Number).filter(Boolean) : [];
    const minRatingValue = minRatingParam ? parseInt(minRatingParam, 10) : null;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const resolvedIngredients = ingredients.filter(ing => ingredientIds.includes(ing.id));
    const resolvedTags = tags.filter(tag => tagIds.includes(tag.id));
    setFilters({
      name: nameParam,
      selectedIngredients: resolvedIngredients,
      selectedTags: resolvedTags,
      minRating: (minRatingValue && minRatingValue >= 1 && minRatingValue <= 5) ? minRatingValue : null,
    });
    setCurrentPage(page);
    isInitialUrlLoad.current = false;
    setTimeout(() => { isInitializingFromUrl.current = false; }, 0);
  }, [searchParams, initialDataLoaded, ingredients, tags]);

  const apiFilters = useMemo((): CocktailFilters => {
    const filtersObj: CocktailFilters = { page: currentPage, size: ITEMS_PER_PAGE };
    if (debouncedSearchName?.trim()) filtersObj.name = debouncedSearchName.trim();
    if (filters.selectedIngredients.length > 0) filtersObj.ingredient_ids = filters.selectedIngredients.map(ing => ing.id);
    if (filters.selectedTags.length > 0) filtersObj.tag_ids = filters.selectedTags.map(tag => tag.id);
    if (filters.minRating !== null && filters.minRating > 0) filtersObj.min_avg_rating = filters.minRating;
    return filtersObj;
  }, [debouncedSearchName, filters.selectedIngredients, filters.selectedTags, filters.minRating, currentPage]);

  useEffect(() => {
    if (!initialDataLoaded) return;
    const fetchCocktails = async () => {
      if (!isInitialUrlLoad.current) setIsFiltering(true);
      setError(null);
      try {
        const response = await getCocktails(apiFilters);
        if ('items' in response && 'total' in response) {
          setCocktails(response.items);
          setTotalCount(response.total);
          setTotalPages(response.pages ?? Math.ceil(response.total / ITEMS_PER_PAGE));
        } else {
          const items = response as unknown as CocktailWithDetails[];
          setCocktails(items);
          setTotalCount(items.length);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Failed to fetch cocktails:', err);
        setError(err as Error);
        setCocktails([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
        setIsFiltering(false);
      }
    };
    fetchCocktails();
  }, [apiFilters, initialDataLoaded]);

  const updateUrl = useCallback((newFilters: FilterState, page: number) => {
    if (isInitializingFromUrl.current) return;
    const params = new URLSearchParams();
    if (newFilters.name?.trim()) params.set('name', newFilters.name.trim());
    if (newFilters.selectedIngredients.length > 0) params.set('ingredients', newFilters.selectedIngredients.map(ing => ing.id).join(','));
    if (newFilters.selectedTags.length > 0) params.set('tags', newFilters.selectedTags.map(tag => tag.id).join(','));
    if (newFilters.minRating !== null && newFilters.minRating > 0) params.set('min_rating', newFilters.minRating.toString());
    if (page > 1) params.set('page', page.toString());
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleNameChange = useCallback((name: string) => {
    const newFilters = { ...filters, name };
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
  }, [filters, updateUrl]);

  const handleIngredientChange = useCallback((selectedIngredients: Ingredient[]) => {
    const newFilters = { ...filters, selectedIngredients };
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
  }, [filters, updateUrl]);

  const handleTagChange = useCallback((selectedTags: Tag[]) => {
    const newFilters = { ...filters, selectedTags };
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
  }, [filters, updateUrl]);

  const handleRatingChange = useCallback((rating: number | null) => {
    const newFilters = { ...filters, minRating: rating };
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
  }, [filters, updateUrl]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleRemoveFilter = useCallback((type: 'name' | 'ingredient' | 'tag' | 'rating', value?: any) => {
    let newFilters = { ...filters };
    switch (type) {
      case 'name':
        newFilters.name = '';
        break;
      case 'ingredient':
        newFilters.selectedIngredients = filters.selectedIngredients.filter(ing => ing.id !== (value as Ingredient).id);
        break;
      case 'tag':
        newFilters.selectedTags = filters.selectedTags.filter(tag => tag.id !== (value as Tag).id);
        break;
      case 'rating':
        newFilters.minRating = null;
        break;
    }
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
  }, [filters, updateUrl]);

  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    updateUrl(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, currentPage, updateUrl]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
  }, []);

  const handleAddCocktail = useCallback(() => {
    navigate('/add-cocktail');
  }, [navigate]);

  // `hasActiveFilters` nie jest już potrzebne do warunkowego renderowania ActiveFilters,
  // ale może być przydatne gdzie indziej, np. do decydowania, czy pokazać przycisk "Resetuj" w SearchFilters
  const hasActiveFilters = useMemo(() =>
    filters.name?.trim() !== '' ||
    filters.selectedIngredients.length > 0 ||
    filters.selectedTags.length > 0 ||
    filters.minRating !== null,
    [filters]
  );

  const showInitialSpinner = isLoading && cocktails.length === 0 && !error;

  return (
    <div className={styles.pageContainer || "container mx-auto px-4 py-8"}>
      <div className={styles.header || "text-center mb-12"}>
        <div className={styles.headerContent || ""}>
          <h1 className={styles.pageTitle || "text-4xl font-bold text-gray-800 mb-2"}>
            Odkryj Koktajle
          </h1>
          <p className={styles.pageSubtitle || "text-lg text-gray-600"}>
            Przeglądaj naszą kolekcję {totalCount > 0 ? `ponad ${totalCount}` : ''} przepisów na koktajle
          </p>
          <Button
            variant="primary"
            onClick={handleAddCocktail}
            className={styles.addButton || "mt-6"}
          >
            Dodaj Nowy Koktajl
          </Button>
        </div>
      </div>

      <div className={styles.filtersSection || "mb-8"}>
        <SearchFilters
          nameValue={filters.name}
          selectedIngredients={filters.selectedIngredients}
          selectedTags={filters.selectedTags}
          currentMinRating={filters.minRating}
          availableIngredients={ingredients}
          availableTags={tags}
          onNameChange={handleNameChange}
          onIngredientChange={handleIngredientChange}
          onTagChange={handleTagChange}
          onRatingChange={handleRatingChange}
          onReset={handleResetFilters} 
          isLoading={isFiltering && !showInitialSpinner}
        />

        {}
        {}
      </div>

      <div className={styles.resultsSection}>
        {!showInitialSpinner && !error && totalCount > 0 && (
          <div className={styles.resultsHeader || "mb-4 text-sm text-gray-600"}>
            <p className={styles.resultsCount}>
              {hasActiveFilters 
                ? `Znaleziono ${totalCount} koktajl${totalCount === 1 ? '' : (totalCount % 10 > 1 && totalCount % 10 < 5 && (totalCount < 10 || totalCount > 20) ? 'e' : 'i')}`
                : `Wszystkie koktajle (${totalCount})`}
              {totalPages > 1 && ` - strona ${currentPage} z ${totalPages}`}
            </p>
          </div>
        )}

        <CocktailList
          cocktails={cocktails}
          isLoading={showInitialSpinner}
          isFiltering={isFiltering && !showInitialSpinner}
          error={error}
          onRetry={handleRetry}
          onAddCocktail={handleAddCocktail}
        />

        {!showInitialSpinner && !error && totalPages > 1 && (
          <div className={styles.paginationContainer || "mt-8 flex justify-center"}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CocktailsPage;