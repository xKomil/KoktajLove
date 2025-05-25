import React from 'react';
import { Ingredient, Tag } from '@/types/cocktailTypes';
import Button from '@/components/ui/Button/Button';

interface ActiveFiltersProps {
  nameFilter?: string;
  ingredientFilters: Ingredient[];
  tagFilters: Tag[];
  minRatingFilter: number | null;
  onRemoveFilter: (type: 'name' | 'ingredient' | 'tag' | 'rating', value?: any) => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  nameFilter,
  ingredientFilters,
  tagFilters,
  minRatingFilter,
  onRemoveFilter,
  onClearAll
}) => {
  const hasAnyFilters = nameFilter || 
    ingredientFilters.length > 0 || 
    tagFilters.length > 0 ||
    minRatingFilter !== null;

  if (!hasAnyFilters) {
    return null;
  }

  const FilterItem: React.FC<{ 
    label: string; 
    onRemove: () => void; 
    children: React.ReactNode 
  }> = ({ label, onRemove, children }) => (
    <div className="inline-flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200">
      <span className="mr-2">{children}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
        aria-label={`Usuń filtr: ${label}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Aktywne filtry:</h3>
          <div className="flex flex-wrap gap-2">
            {/* Name filter */}
            {nameFilter && (
              <FilterItem 
                label={`Nazwa: ${nameFilter}`}
                onRemove={() => onRemoveFilter('name')}
              >
                Nazwa: "{nameFilter}"
              </FilterItem>
            )}

            {/* Rating filter */}
            {minRatingFilter !== null && (
              <FilterItem 
                label={`Ocena: ${minRatingFilter}+`}
                onRemove={() => onRemoveFilter('rating')}
              >
                Ocena: {minRatingFilter}+ ★
              </FilterItem>
            )}

            {/* Ingredient filters */}
            {ingredientFilters.map((ingredient) => (
              <FilterItem 
                key={`ingredient-${ingredient.id}`}
                label={`Składnik: ${ingredient.name}`}
                onRemove={() => onRemoveFilter('ingredient', ingredient)}
              >
                {ingredient.name}
              </FilterItem>
            ))}

            {/* Tag filters */}
            {tagFilters.map((tag) => (
              <FilterItem 
                key={`tag-${tag.id}`}
                label={`Tag: ${tag.name}`}
                onRemove={() => onRemoveFilter('tag', tag)}
              >
                #{tag.name}
              </FilterItem>
            ))}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="ml-4 text-gray-600 hover:text-gray-800 text-sm"
        >
          Wyczyść wszystkie
        </Button>
      </div>
    </div>
  );
};

export default ActiveFilters;