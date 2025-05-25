// frontend/src/pages/CocktailsPage.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CocktailList from '@/components/features/cocktails/CocktailList';
import SearchFilters from '@/components/features/cocktails/SearchFilters';
import ActiveFilters from '@/components/features/cocktails/ActiveFilters';
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
}

const INITIAL_FILTERS: FilterState = {
  name: '',
  selectedIngredients: [],
  selectedTags: []
};

const ITEMS_PER_PAGE = 12;

const CocktailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
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
  
  // Ref to track if this is the first URL initialization
  const isInitialUrlLoad = useRef(true);
  // Ref to prevent URL updates during initial filter setup
  const isInitializingFromUrl = useRef(false);

  // Debounced search value to avoid too many API calls
  const debouncedSearchName = useDebounce(filters.name, 500);

  // Load initial data (ingredients and tags for filters)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [ingredientsData, tagsData] = await Promise.all([
          getIngredients({ size: 1000 }), 
          getTags({ size: 1000 }) 
        ]);
        
        const ingredientsList = Array.isArray(ingredientsData) ? ingredientsData : ingredientsData.items;
        const tagsList = Array.isArray(tagsData) ? tagsData : tagsData.items;
        
        setIngredients(ingredientsList);
        setTags(tagsList);
        setInitialDataLoaded(true);
        console.log('Initial data loaded:', { ingredientsCount: ingredientsList.length, tagsCount: tagsList.length });
      } catch (err) {
        console.error('Failed to load filter data:', err);
        setError(err as Error);
        setInitialDataLoaded(true); // Still set to true to allow rest of logic to proceed
      }
    };

    loadInitialData();
  }, []); // Empty dependency array - runs only once

  // Initialize filters from URL params only ONCE after initial data is loaded
  useEffect(() => {
    if (!initialDataLoaded || !isInitialUrlLoad.current) return;

    console.log("Initializing filters from URL...");
    isInitializingFromUrl.current = true;

    const nameParam = searchParams.get('name') || '';
    const ingredientIdsParam = searchParams.get('ingredients');
    const tagIdsParam = searchParams.get('tags');
    const pageParam = searchParams.get('page');

    const ingredientIds = ingredientIdsParam ? ingredientIdsParam.split(',').map(Number).filter(Boolean) : [];
    const tagIds = tagIdsParam ? tagIdsParam.split(',').map(Number).filter(Boolean) : [];
    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;

    // Find actual ingredient and tag objects based on IDs from URL
    const resolvedIngredients = ingredients.filter(ing => ingredientIds.includes(ing.id));
    const resolvedTags = tags.filter(tag => tagIds.includes(tag.id));

    // Set filters and page from URL parameters
    setFilters({
      name: nameParam,
      selectedIngredients: resolvedIngredients,
      selectedTags: resolvedTags
    });
    setCurrentPage(page);
    
    console.log('Filters initialized from URL:', {
      name: nameParam,
      ingredientIds,
      tagIds,
      selectedIngredients: resolvedIngredients,
      selectedTags: resolvedTags,
      page
    });

    // Mark initial URL load as complete
    isInitialUrlLoad.current = false;
    
    // Allow URL updates after initialization
    setTimeout(() => {
      isInitializingFromUrl.current = false;
    }, 0);

  }, [searchParams, initialDataLoaded, ingredients, tags]);

  // Build API filters from current state
  const apiFilters = useMemo((): CocktailFilters => {
    const filtersObj: CocktailFilters = {
      page: currentPage,
      size: ITEMS_PER_PAGE
    };
    
    if (debouncedSearchName?.trim()) {
      filtersObj.name = debouncedSearchName.trim();
    }
    if (filters.selectedIngredients.length > 0) {
      filtersObj.ingredient_ids = filters.selectedIngredients.map(ing => ing.id);
    }
    if (filters.selectedTags.length > 0) {
      filtersObj.tag_ids = filters.selectedTags.map(tag => tag.id);
    }
    
    console.log('API Filters constructed:', filtersObj);
    return filtersObj;
  }, [debouncedSearchName, filters.selectedIngredients, filters.selectedTags, currentPage]);

  // Fetch cocktails when apiFilters changes (and initial data is loaded)
  useEffect(() => {
    if (!initialDataLoaded) {
      console.log("Skipping fetchCocktails: initial data not loaded");
      return;
    }

    const fetchCocktails = async () => {
      // Don't show filtering indicator on initial load
      if (!isLoading) {
        setIsFiltering(true);
      }
      setError(null);
      
      console.log('Fetching cocktails with filters:', apiFilters);
      
      try {
        const response = await getCocktails(apiFilters);
        
        if (Array.isArray(response)) {
          setCocktails(response);
          setTotalCount(response.length);
          setTotalPages(1);
        } else {
          const paginatedResponse = response as PaginatedResponse<CocktailWithDetails>;
          setCocktails(paginatedResponse.items);
          setTotalCount(paginatedResponse.total);
          setTotalPages(paginatedResponse.pages ?? Math.ceil(paginatedResponse.total / ITEMS_PER_PAGE));
        }
        
        console.log('Cocktails fetched successfully:', { 
          count: Array.isArray(response) ? response.length : response.items.length,
          total: Array.isArray(response) ? response.length : response.total
        });
      } catch (err) {
        console.error('Failed to fetch cocktails:', err);
        setError(err as Error);
        setCocktails([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false); // Initial loading done after first fetch
        setIsFiltering(false); // Filtering process ends
      }
    };

    fetchCocktails();
  }, [apiFilters, initialDataLoaded]);

  // Update URL when filters or currentPage change (but not during initial URL loading)
  const updateUrl = useCallback((newFilters: FilterState, page: number) => {
    // Don't update URL during initial loading from URL or if we're still initializing
    if (isInitializingFromUrl.current) {
      console.log('Skipping URL update: initializing from URL');
      return;
    }

    const params = new URLSearchParams();
    
    if (newFilters.name?.trim()) {
      params.set('name', newFilters.name.trim());
    }
    if (newFilters.selectedIngredients.length > 0) {
      params.set('ingredients', newFilters.selectedIngredients.map(ing => ing.id).join(','));
    }
    if (newFilters.selectedTags.length > 0) {
      params.set('tags', newFilters.selectedTags.map(tag => tag.id).join(','));
    }
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    // Only update if new params are different from current searchParams
    const newParamsString = params.toString();
    const currentParamsString = searchParams.toString();
    
    if (newParamsString !== currentParamsString) {
      setSearchParams(params);
      console.log('URL updated:', { from: currentParamsString, to: newParamsString });
    }
  }, [searchParams, setSearchParams]);

  // Filter handlers
  const handleNameChange = useCallback((name: string) => {
    const newFilters = { ...filters, name };
    setFilters(newFilters);
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateUrl(newFilters, 1);
    } else {
      updateUrl(newFilters, currentPage);
    }
    console.log('Name filter changed to:', name);
  }, [filters, currentPage, updateUrl]);

  const handleIngredientChange = useCallback((selectedIngredients: Ingredient[]) => {
    const newFilters = { ...filters, selectedIngredients };
    setFilters(newFilters);
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateUrl(newFilters, 1);
    } else {
      updateUrl(newFilters, currentPage);
    }
    console.log('Ingredient filter changed to:', selectedIngredients.map(ing => ing.name));
  }, [filters, currentPage, updateUrl]);

  const handleTagChange = useCallback((selectedTags: Tag[]) => {
    const newFilters = { ...filters, selectedTags };
    setFilters(newFilters);
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateUrl(newFilters, 1);
    } else {
      updateUrl(newFilters, currentPage);
    }
    console.log('Tag filter changed to:', selectedTags.map(tag => tag.name));
  }, [filters, currentPage, updateUrl]);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    setSearchParams({}); // Clear all URL params
    console.log('All filters reset');
  }, [setSearchParams]);

  const handleRemoveFilter = useCallback((type: 'name' | 'ingredient' | 'tag', value?: any) => {
    let newFilters = { ...filters };
    
    switch (type) {
      case 'name':
        newFilters.name = '';
        break;
      case 'ingredient':
        newFilters.selectedIngredients = filters.selectedIngredients.filter(ing => ing.id !== value.id);
        break;
      case 'tag':
        newFilters.selectedTags = filters.selectedTags.filter(tag => tag.id !== value.id);
        break;
    }
    
    setFilters(newFilters);
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateUrl(newFilters, 1);
    } else {
      updateUrl(newFilters, currentPage);
    }
    console.log('Filter removed:', { type, value: value?.name || value });
  }, [filters, currentPage, updateUrl]);

  // Page handlers
  const handlePageChange = useCallback((page: number) => {
    if (page === currentPage) return;
    
    setCurrentPage(page);
    updateUrl(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Page changed to:', page);
  }, [filters, currentPage, updateUrl]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // fetchCocktails will be triggered by useEffect when isLoading changes
  }, []);

  const handleAddCocktail = useCallback(() => {
    navigate('/add-cocktail');
  }, [navigate]);

  // Computed values
  const hasActiveFilters = useMemo(() => 
    filters.name?.trim() || 
    filters.selectedIngredients.length > 0 || 
    filters.selectedTags.length > 0,
    [filters]
  );
  
  const showInitialSpinner = isLoading && cocktails.length === 0;

  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Odkryj Koktajle</h1>
          <p className={styles.pageSubtitle}>
            Przeglądaj naszą kolekcję {totalCount > 0 ? totalCount : ''} przepisów na koktajle
          </p>
          <Button
            variant="primary"
            onClick={handleAddCocktail}
            className={styles.addButton}
          >
            Dodaj Koktajl
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <SearchFilters
          nameValue={filters.name}
          selectedIngredients={filters.selectedIngredients}
          selectedTags={filters.selectedTags}
          availableIngredients={ingredients}
          availableTags={tags}
          onNameChange={handleNameChange}
          onIngredientChange={handleIngredientChange}
          onTagChange={handleTagChange}
          onReset={handleResetFilters}
          isLoading={isFiltering && !showInitialSpinner}
        />
        
        {hasActiveFilters && (
          <ActiveFilters
            nameFilter={filters.name}
            ingredientFilters={filters.selectedIngredients}
            tagFilters={filters.selectedTags}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleResetFilters}
          />
        )}
      </div>

      {/* Results Section */}
      <div className={styles.resultsSection}>
        {!showInitialSpinner && !error && (
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>
              {hasActiveFilters 
                ? `Znaleziono ${totalCount} koktajl${totalCount === 1 ? '' : (totalCount > 1 && totalCount < 5 ? 'e' : 'i')}${totalPages > 1 ? ` (strona ${currentPage} z ${totalPages})` : ''}`
                : `Wszystkie koktajle (${totalCount})`
              }
            </p>
          </div>
        )}

        <CocktailList
          cocktails={cocktails}
          isLoading={showInitialSpinner}
          error={error}
          onRetry={handleRetry}
          onAddCocktail={handleAddCocktail}
        />

        {/* Pagination */}
        {!showInitialSpinner && !error && totalPages > 1 && (
          <div className={styles.paginationContainer}>
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