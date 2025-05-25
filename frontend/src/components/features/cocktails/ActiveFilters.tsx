// frontend/src/components/features/cocktails/ActiveFilters.tsx
import React from 'react';
import { Ingredient, Tag } from '@/types/cocktailTypes';
import Button from '@/components/ui/Button/Button';
import styles from './ActiveFilters.module.css';

interface ActiveFiltersProps {
  nameFilter?: string;
  ingredientFilters: Ingredient[];
  tagFilters: Tag[];
  onRemoveFilter: (type: 'name' | 'ingredient' | 'tag', value?: any) => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  nameFilter,
  ingredientFilters,
  tagFilters,
  onRemoveFilter,
  onClearAll
}) => {
  const hasAnyFilters = nameFilter || ingredientFilters.length > 0 || tagFilters.length > 0;

  if (!hasAnyFilters) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Aktywne filtry:</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className={styles.clearAllButton}
        >
          Wyczyść wszystkie
        </Button>
      </div>

      <div className={styles.filtersContainer}>
        {/* Name filter */}
        {nameFilter && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Nazwa:</span>
            <div className={styles.filterItem}>
              <span className={styles.filterValue}>"{nameFilter}"</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => onRemoveFilter('name')}
                aria-label={`Usuń filtr nazwy: ${nameFilter}`}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Ingredient filters */}
        {ingredientFilters.length > 0 && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Składniki:</span>
            <div className={styles.filterItems}>
              {ingredientFilters.map((ingredient) => (
                <div key={ingredient.id} className={styles.filterItem}>
                  <span className={styles.filterValue}>{ingredient.name}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => onRemoveFilter('ingredient', ingredient)}
                    aria-label={`Usuń składnik: ${ingredient.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tag filters */}
        {tagFilters.length > 0 && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tagi:</span>
            <div className={styles.filterItems}>
              {tagFilters.map((tag) => (
                <div key={tag.id} className={styles.filterItem}>
                  <span className={styles.filterValue}>{tag.name}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => onRemoveFilter('tag', tag)}
                    aria-label={`Usuń tag: ${tag.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;