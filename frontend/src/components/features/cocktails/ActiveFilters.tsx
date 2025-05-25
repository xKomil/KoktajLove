import React from 'react';
import { Ingredient, Tag } from '@/types/cocktailTypes'; // Assuming cocktailTypes.ts or similar defines these types
import Button from '@/components/ui/Button/Button'; // UI component for buttons

/**
 * Interface for the props of the ActiveFilters component.
 */
interface ActiveFiltersProps {
  nameFilter?: string; // Current filter for cocktail name
  ingredientFilters: Ingredient[]; // Array of currently selected ingredient filters
  tagFilters: Tag[]; // Array of currently selected tag filters
  minRatingFilter: number | null; // Current filter for minimum rating
  onRemoveFilter: (type: 'name' | 'ingredient' | 'tag' | 'rating', value?: any) => void; // Callback to remove a specific filter
  onClearAll: () => void; // Callback to clear all active filters
}

/**
 * ActiveFilters component.
 * Displays the currently active filters and allows users to remove them individually or clear all.
 */
const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  nameFilter,
  ingredientFilters,
  tagFilters,
  minRatingFilter,
  onRemoveFilter,
  onClearAll
}) => {
  // Check if any filters are currently active
  const hasAnyFilters = nameFilter ||
    ingredientFilters.length > 0 ||
    tagFilters.length > 0 ||
    minRatingFilter !== null;

  // If no filters are active, don't render the component
  if (!hasAnyFilters) {
    return null;
  }

  /**
   * FilterItem sub-component.
   * Renders a single filter item with a label and a remove button.
   */
  const FilterItem: React.FC<{
    label: string; // Label for aria-label, used for accessibility
    onRemove: () => void; // Callback function when the remove button is clicked
    children: React.ReactNode; // The content to display as the filter text
  }> = ({ label, onRemove, children }) => (
    <div className="inline-flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200">
      <span className="mr-2">{children}</span> {/* Display the filter text */}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
        aria-label={`Remove filter: ${label}`} // Accessibility label for the remove button
      >
        {/* Close icon (X) */}
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
          <h3 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {/* Display Name filter if active */}
            {nameFilter && (
              <FilterItem
                label={`Name: ${nameFilter}`}
                onRemove={() => onRemoveFilter('name')}
              >
                Name: "{nameFilter}"
              </FilterItem>
            )}

            {/* Display Rating filter if active */}
            {minRatingFilter !== null && (
              <FilterItem
                label={`Rating: ${minRatingFilter}+`}
                onRemove={() => onRemoveFilter('rating')}
              >
                Rating: {minRatingFilter}+ ★
              </FilterItem>
            )}

            {/* Display Ingredient filters if any are active */}
            {ingredientFilters.map((ingredient) => (
              <FilterItem
                key={`ingredient-${ingredient.id}`}
                label={`Ingredient: ${ingredient.name}`}
                onRemove={() => onRemoveFilter('ingredient', ingredient)}
              >
                {ingredient.name}
              </FilterItem>
            ))}

            {/* Display Tag filters if any are active */}
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

        {/* Button to clear all filters */}
        <Button
          variant="ghost" // Style variant for the button
          size="sm" // Size of the button
          onClick={onClearAll}
          className="ml-4 text-gray-600 hover:text-gray-800 text-sm"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default ActiveFilters;