// frontend/src/components/features/cocktails/SearchFilters.tsx
import React from 'react';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import MultiAutoCompleteSelect from '@/components/ui/MultiAutoCompleteSelect/MultiAutoCompleteSelect';
import { Ingredient, Tag } from '@/types/cocktailTypes';
import styles from './SearchFilters.module.css';

interface SearchFiltersProps {
  nameValue: string;
  selectedIngredients: Ingredient[];
  selectedTags: Tag[];
  availableIngredients: Ingredient[];
  availableTags: Tag[];
  onNameChange: (value: string) => void;
  onIngredientChange: (ingredients: Ingredient[]) => void;
  onTagChange: (tags: Tag[]) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  nameValue,
  selectedIngredients,
  selectedTags,
  availableIngredients,
  availableTags,
  onNameChange,
  onIngredientChange,
  onTagChange,
  onReset,
  isLoading = false
}) => {
  const hasActiveFilters = nameValue || 
    selectedIngredients.length > 0 || 
    selectedTags.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.filtersGrid}>
        {/* Name Search */}
        <div className={styles.filterGroup}>
          <Input
            label="Szukaj po nazwie"
            placeholder="Wpisz nazwę koktajlu..."
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            startIcon="🔍"
            fullWidth
            className={styles.searchInput}
          />
        </div>

        {/* Ingredients Filter */}
        <div className={styles.filterGroup}>
          <MultiAutoCompleteSelect<Ingredient>
            label="Składniki"
            placeholder="Wybierz składniki..."
            items={availableIngredients}
            selectedItems={selectedIngredients}
            onSelectionChange={onIngredientChange}
            getItemLabel={(item) => item.name}
            getItemValue={(item) => item.id.toString()}
            noOptionsText="Brak składników"
            searchPlaceholder="Szukaj składnika..."
            className={styles.multiSelect}
          />
        </div>

        {/* Tags Filter */}
        <div className={styles.filterGroup}>
          <MultiAutoCompleteSelect<Tag>
            label="Tagi"
            placeholder="Wybierz tagi..."
            items={availableTags}
            selectedItems={selectedTags}
            onSelectionChange={onTagChange}
            getItemLabel={(item) => item.name}
            getItemValue={(item) => item.id.toString()}
            noOptionsText="Brak tagów"
            searchPlaceholder="Szukaj tagu..."
            className={styles.multiSelect}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={!hasActiveFilters || isLoading}
          className={styles.resetButton}
        >
          Resetuj filtry
        </Button>
        
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span className={styles.loadingSpinner}>⟳</span>
            Filtrowanie...
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;