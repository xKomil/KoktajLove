import React from 'react';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import MultiAutoCompleteSelect from '@/components/ui/MultiAutoCompleteSelect/MultiAutoCompleteSelect';
import StarRatingInput from '@/components/ui/StarRatingInput/StarRatingInput';
import { Ingredient, Tag } from '@/types/cocktailTypes';

interface SearchFiltersProps {
  nameValue: string;
  selectedIngredients: Ingredient[];
  selectedTags: Tag[];
  currentMinRating: number | null;
  availableIngredients: Ingredient[];
  availableTags: Tag[];
  onNameChange: (value: string) => void;
  onIngredientChange: (ingredients: Ingredient[]) => void;
  onTagChange: (tags: Tag[]) => void;
  onRatingChange: (rating: number | null) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  nameValue,
  selectedIngredients,
  selectedTags,
  currentMinRating,
  availableIngredients,
  availableTags,
  onNameChange,
  onIngredientChange,
  onTagChange,
  onRatingChange,
  onReset,
  isLoading = false
}) => {
  const hasActiveFilters = nameValue ||
    selectedIngredients.length > 0 ||
    selectedTags.length > 0 ||
    currentMinRating !== null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Name Search */}
        <div className="space-y-2">
          <Input
            label="Search by name"
            placeholder="Enter cocktail name..."
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            fullWidth
            className="w-full"
          />
        </div>

        {/* Ingredients Filter */}
        <div className="space-y-2">
          <MultiAutoCompleteSelect<Ingredient>
            label="Ingredients"
            placeholder="Select ingredients..."
            items={availableIngredients}
            selectedItems={selectedIngredients}
            onSelectionChange={onIngredientChange}
            getItemLabel={(item) => item.name}
            getItemValue={(item) => item.id.toString()}
            noOptionsText="No ingredients found"
            searchPlaceholder="Search ingredient..."
          />
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <MultiAutoCompleteSelect<Tag>
            label="Tags"
            placeholder="Select tags..."
            items={availableTags}
            selectedItems={selectedTags}
            onSelectionChange={onTagChange}
            getItemLabel={(item) => item.name}
            getItemValue={(item) => item.id.toString()}
            noOptionsText="No tags found"
            searchPlaceholder="Search tag..."
          />
        </div>

        {/* Rating Filter */}
        <div className="space-y-1">
          <StarRatingInput
            label=" ."
            value={currentMinRating}
            onChange={onRatingChange}
            size="sm"
            className="w-full"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={!hasActiveFilters || isLoading}
          className="text-gray-600 hover:text-gray-800"
        >
          Reset filters
        </Button>

        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Filtering...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;