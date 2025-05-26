// frontend/src/components/features/cocktails/CocktailForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, useFieldArray, Controller, FieldError } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  CocktailCreate,
  CocktailUpdate,
  CocktailWithDetails,
  Ingredient,
  Tag,
  UnitEnum,
} from '@/types'; // Assuming types are defined in @/types
import * as cocktailService from '@/services/cocktailService'; // Service for cocktail API calls
import * as ingredientService from '@/services/ingredientService'; // Service for ingredient API calls
import * as tagService from '@/services/tagService'; // Service for tag API calls
import Button from '@/components/ui/Button/Button'; // UI Button component
import Input from '@/components/ui/Input/Input'; // UI Input component
import styles from './CocktailForm.module.css'; // CSS module for styling

// Type for individual ingredient form field within the form
type IngredientFormField = { ingredient_id: string; quantity: string; unit: UnitEnum };

// Type for the entire cocktail form data structure
type CocktailFormData = {
  name: string;
  description: string;
  instructions: string;
  image_url?: string;
  is_public: boolean;
  ingredients: IngredientFormField[];
  tag_ids: string[]; // Array of tag IDs as strings
};

/**
 * Props for the CocktailForm component.
 */
interface CocktailFormProps {
  cocktail?: CocktailWithDetails; // Optional: Existing cocktail data for editing
  onSubmitSuccess?: (savedCocktail: CocktailWithDetails) => void; // Optional: Callback on successful submission
}

/**
 * CocktailForm component.
 * Handles creation and updating of cocktails.
 */
const CocktailForm: React.FC<CocktailFormProps> = ({ cocktail, onSubmitSuccess }) => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset, // Function to reset form state
  } = useForm<CocktailFormData>({
    // Set default form values based on whether it's an edit or create operation
    defaultValues: cocktail
      ? {
          name: cocktail.name,
          description: cocktail.description,
          instructions: cocktail.instructions,
          image_url: cocktail.image_url || '',
          is_public: cocktail.is_public,
          ingredients: cocktail.ingredients.map(ci => ({
            ingredient_id: String(ci.ingredient.id),
            quantity: String(ci.amount),
            unit: ci.unit,
          })),
          tag_ids: cocktail.tags.map(t => String(t.id)),
        }
      : {
          name: '',
          description: '',
          instructions: '',
          image_url: '',
          is_public: true, // Default to public
          ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ML }], // Start with one empty ingredient
          tag_ids: [],
        },
  });

  // `useFieldArray` for managing dynamic ingredient fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  // State for available ingredients and tags fetched from the API
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  // State for displaying general form errors (e.g., API errors)
  const [formError, setFormError] = useState<string | null>(null);

  // Regular expression for URL validation
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  // Effect to fetch available ingredients and tags when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsResponse, tagsResponse] = await Promise.all([
          ingredientService.getIngredients(),
          tagService.getTags(),
        ]);

        // Handle potentially paginated or direct array responses for ingredients
        if (ingredientsResponse && 'items' in ingredientsResponse) {
          setAvailableIngredients(ingredientsResponse.items);
        } else if (Array.isArray(ingredientsResponse)) {
          setAvailableIngredients(ingredientsResponse);
        } else {
          setAvailableIngredients([]); // Default to empty if response is unexpected
        }

        // Handle potentially paginated or direct array responses for tags
        if (tagsResponse && 'items' in tagsResponse) {
          setAvailableTags(tagsResponse.items);
        } else if (Array.isArray(tagsResponse)) {
          setAvailableTags(tagsResponse);
        } else {
          setAvailableTags([]); // Default to empty if response is unexpected
        }
      } catch (error) {
        console.error('Failed to fetch ingredients or tags', error);
        setFormError('Unable to load form data. Please refresh the page and try again.');
      }
    };
    fetchData();
  }, []);

  // Effect to reset the form when the `cocktail` prop changes (e.g., navigating to edit another cocktail)
  useEffect(() => {
    if (cocktail) {
      reset({
        name: cocktail.name,
        description: cocktail.description,
        instructions: cocktail.instructions,
        image_url: cocktail.image_url || '',
        is_public: cocktail.is_public,
        ingredients: cocktail.ingredients.map(ci => ({
          ingredient_id: String(ci.ingredient.id),
          quantity: String(ci.amount),
          unit: ci.unit,
        })),
        tag_ids: cocktail.tags.map(t => String(t.id)),
      });
    } else {
       // Reset to default empty state if no cocktail prop (create mode)
       reset({
        name: '',
        description: '',
        instructions: '',
        image_url: '',
        is_public: true,
        ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ML }],
        tag_ids: [],
      });
    }
  }, [cocktail, reset]);

  // Handler for form submission
  const onSubmit: SubmitHandler<CocktailFormData> = async (data) => {
    setFormError(null); // Clear previous form errors

    // Process ingredients data for the backend
    const processedIngredients = data.ingredients
      .map(ing => ({
        ingredient_id: parseInt(ing.ingredient_id, 10),
        amount: parseInt(ing.quantity, 10), // Use 'amount' as per backend expectation
        unit: ing.unit as UnitEnum,
      }))
      // Filter out ingredients that are incomplete or invalid
      .filter(ing => ing.ingredient_id && !isNaN(ing.ingredient_id) && !isNaN(ing.amount) && ing.amount > 0);

    // Process tags data for the backend
    const processedTags = data.tag_ids
      ? data.tag_ids.map(idStr => ({ tag_id: parseInt(idStr, 10) })).filter(tag => !isNaN(tag.tag_id))
      : [];

    // Construct the payload for creating a cocktail
    const payloadForBackend: CocktailCreate = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      is_public: data.is_public,
      image_url: data.image_url ? data.image_url : null, // Send null if empty string
      ingredients: processedIngredients,
      tags: processedTags,
    };

    console.log("--- DEBUG [CocktailForm FRONTEND] --- Payload sent to the service:", JSON.stringify(payloadForBackend, null, 2));

    try {
      let savedCocktail;
      if (cocktail?.id) {
        // If editing an existing cocktail, prepare an update payload
        const updatePayload: CocktailUpdate = {
            // Conditionally include fields only if they have values to avoid overwriting with empty strings
            ...(data.name && { name: data.name }),
            ...(data.description && { description: data.description }),
            ...(data.instructions && { instructions: data.instructions }),
            ...(data.image_url !== undefined && { image_url: data.image_url ? data.image_url : null }),
            ...(data.is_public !== undefined && { is_public: data.is_public }),
            ingredients: processedIngredients, // Always send ingredients and tags arrays
            tags: processedTags,
        };
        savedCocktail = await cocktailService.updateCocktail(cocktail.id, updatePayload);
      } else {
        // If creating a new cocktail
        savedCocktail = await cocktailService.createCocktail(payloadForBackend);
      }

      // Handle successful submission
      if (onSubmitSuccess) {
        onSubmitSuccess(savedCocktail);
      } else {
        // Default navigation to the detail page of the saved cocktail
        navigate(`/cocktails`);
      }
    } catch (error: any) {
      console.error('Failed to save cocktail:', error);
      
      let displayMessage = 'An error occurred while saving the cocktail. Please try again.';
      
      // Handle specific HTTP error statuses from the backend
      if (error.response?.status === 422 && error.response.data?.detail) { // Unprocessable Entity (Validation Error)
        const detail = error.response.data.detail;
        
        if (typeof detail === 'string') {
          displayMessage = detail;
        } else if (Array.isArray(detail)) {
          // Extract and format validation error messages from the API response
          const errorMessages = detail
            .map((err: any) => err.msg || 'Invalid field data') // Use 'msg' or a generic message
            .filter((msg, index, array) => array.indexOf(msg) === index) // Remove duplicate messages
            .join('. ');
          displayMessage = errorMessages || 'Please check your form data and try again.';
        }
      } else if (error.response?.status === 409) { // Conflict (e.g., cocktail name already exists)
        displayMessage = 'A cocktail with this name already exists. Please choose a different name.';
      } else if (error.response?.status >= 500) { // Server errors
        displayMessage = 'A server error occurred. Please try again later.';
      } else if (error.message) { // Other network or client-side errors
        displayMessage = `Failed to save cocktail: ${error.message}`;
      }
      
      setFormError(displayMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>{cocktail ? 'Edit Cocktail' : 'Add New Cocktail'}</h2>
      
      {/* Display general form errors */}
      {formError && (
        <div className={styles.formErrorContainer} role="alert">
          <p className={styles.errorMessage}>{formError}</p>
        </div>
      )}

      {/* Name Field */}
      <div className={styles.formGroup}>
        <Input
          id="name"
          label="Name"
          placeholder="Enter cocktail name..."
          {...register('name', {
            required: 'Cocktail name is required.',
            minLength: {
              value: 3,
              message: 'Cocktail name must be at least 3 characters long.'
            },
            maxLength: {
              value: 100,
              message: 'Cocktail name cannot exceed 100 characters.'
            },
            pattern: {
              value: /^[a-zA-Z0-9\s\-'&.()]+$/, // Allow letters, numbers, spaces, and some special characters
              message: 'Cocktail name contains invalid characters.'
            }
          })}
          error={errors.name?.message}
        />
      </div>

      {/* Description Field */}
      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Describe your cocktail..."
          {...register('description', {
            required: 'Please provide a description of your cocktail.',
            minLength: {
              value: 10,
              message: 'Description must be at least 10 characters long.'
            },
            maxLength: {
              value: 500,
              message: 'Description cannot exceed 500 characters.'
            }
          })}
        />
        {errors.description && <p className={styles.errorMessage} role="alert">{errors.description.message}</p>}
      </div>

      {/* Instructions Field */}
      <div className={styles.formGroup}>
        <label htmlFor="instructions">Instructions</label>
        <textarea
          id="instructions"
          placeholder="How to make this cocktail..."
          {...register('instructions', {
            required: 'Please provide instructions on how to make the cocktail.',
            minLength: {
              value: 20,
              message: 'Instructions must be at least 20 characters long.'
            },
            maxLength: {
              value: 1000,
              message: 'Instructions cannot exceed 1000 characters.'
            }
          })}
        />
        {errors.instructions && <p className={styles.errorMessage} role="alert">{errors.instructions.message}</p>}
      </div>

      {/* Image URL Field */}
      <div className={styles.formGroup}>
        <Input
          id="image_url"
          type="url"
          label="Image URL (optional)"
          placeholder="https://example.com/image.jpg"
          {...register('image_url', {
            validate: (value) => {
              if (!value || value.trim() === '') return true; // Optional field, valid if empty
              if (!urlPattern.test(value)) {
                return 'Please enter a valid URL (must start with http:// or https://).';
              }
              return true;
            }
          })}
          error={errors.image_url?.message}
        />
      </div>
      
      {/* Publicly Visible Checkbox */}
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register('is_public')} defaultChecked={cocktail?.is_public ?? true} />
          <span className={styles.checkboxText}> Publicly Visible</span>
        </label>
      </div>

      {/* Ingredients Section */}
      <section className={styles.ingredientsSection}>
        <h3>Ingredients</h3>
        <div className={styles.ingredientsContainer}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.ingredientItem}>
              {/* Ingredient Select */}
              <Controller
                name={`ingredients.${index}.ingredient_id`}
                control={control}
                rules={{
                  required: 'Please select an ingredient.',
                  validate: (value) => value !== '' || 'Please select an ingredient.'
                }}
                render={({ field: controllerField }) => (
                  <div className={styles.ingredientField}>
                    <select {...controllerField} aria-label={`Ingredient ${index + 1}`}>
                      <option value="">Select Ingredient</option>
                      {availableIngredients.map(ing => (
                        <option key={ing.id} value={String(ing.id)}>{ing.name}</option>
                      ))}
                    </select>
                    {errors.ingredients?.[index]?.ingredient_id && (
                      <p className={styles.errorMessage} role="alert">
                        {errors.ingredients[index]?.ingredient_id?.message}
                      </p>
                    )}
                  </div>
                )}
              />
              {/* Quantity Input */}
              <div className={styles.ingredientField}>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Amount"
                  aria-label={`Amount for ingredient ${index + 1}`}
                  {...register(`ingredients.${index}.quantity`, {
                    required: 'Amount is required.',
                    validate: (value) => {
                      const num = parseInt(value, 10);
                      if (isNaN(num)) return 'Amount must be a valid number.';
                      if (num <= 0) return 'Amount must be greater than 0.';
                      if (num > 9999) return 'Amount cannot exceed 9999.';
                      return true;
                    }
                  })}
                />
                {errors.ingredients?.[index]?.quantity && (
                  <p className={styles.errorMessage} role="alert">
                    {errors.ingredients[index]?.quantity?.message}
                  </p>
                )}
              </div>
              {/* Unit Select */}
              <Controller
                name={`ingredients.${index}.unit`}
                control={control}
                rules={{
                  required: 'Please select a unit.',
                  validate: (value) => Object.values(UnitEnum).includes(value as UnitEnum) || 'Please select a valid unit.'
                }}
                render={({ field: controllerField }) => (
                  <div className={styles.ingredientField}>
                    <select {...controllerField} aria-label={`Unit for ingredient ${index + 1}`}>
                      {Object.values(UnitEnum).map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    {errors.ingredients?.[index]?.unit && (
                      <p className={styles.errorMessage} role="alert">
                        {errors.ingredients[index]?.unit?.message}
                      </p>
                    )}
                  </div>
                )}
              />
              {/* Remove Ingredient Button */}
              <Button
                type="button"
                onClick={() => remove(index)}
                variant="danger"
                size="sm"
                disabled={fields.length === 1} // Cannot remove if it's the only ingredient
                title={fields.length === 1 ? "At least one ingredient is required" : "Remove ingredient"}
                aria-label={`Remove ingredient ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        
        {/* General error message for the ingredients array itself (e.g., if minLength rule applied to array) */}
        {errors.ingredients && !Array.isArray(errors.ingredients) && (errors.ingredients as FieldError)?.message && (
            <div className={styles.errorMessage} role="alert">
                <p>{(errors.ingredients as FieldError).message}</p>
            </div>
        )}

        {/* Add Ingredient Button */}
        <Button
          type="button"
          onClick={() => append({ ingredient_id: '', quantity: '', unit: UnitEnum.ML })}
          variant="secondary"
          className={styles.addIngredientButton}
        >
          Add Ingredient
        </Button>
      </section>

      {/* Tags Section */}
      <section className={styles.tagsSection}>
        <h3>Tags (optional)</h3>
        <div className={styles.tagsContainer}>
          <div className={styles.tagsGrid}>
            {availableTags.map(tag => (
              <label key={tag.id} className={styles.checkboxLabel} htmlFor={`tag-${tag.id}`}>
                <input
                  type="checkbox"
                  id={`tag-${tag.id}`}
                  value={String(tag.id)}
                  {...register('tag_ids')} // Register each checkbox to the 'tag_ids' array
                />
                <span className={styles.checkboxText}>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>
        {errors.tag_ids && <p className={styles.errorMessage} role="alert">{errors.tag_ids.message}</p>}
      </section>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? (cocktail ? 'Saving...' : 'Adding...') : (cocktail ? 'Save Changes' : 'Add Cocktail')}
      </Button>
    </form>
  );
};

export default CocktailForm;