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
} from '@/types';
import * as cocktailService from '@/services/cocktailService';
import * as ingredientService from '@/services/ingredientService';
import * as tagService from '@/services/tagService';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './CocktailForm.module.css';

type IngredientFormField = { ingredient_id: string; quantity: string; unit: UnitEnum };

type CocktailFormData = {
  name: string;
  description: string;
  instructions: string;
  image_url?: string;
  is_public: boolean;
  ingredients: IngredientFormField[];
  tag_ids: string[];
};

interface CocktailFormProps {
  cocktail?: CocktailWithDetails;
  onSubmitSuccess?: (savedCocktail: CocktailWithDetails) => void;
}

const CocktailForm: React.FC<CocktailFormProps> = ({ cocktail, onSubmitSuccess }) => {
  const navigate = useNavigate();
  const isEditMode = Boolean(cocktail?.id);
  
  // Create default values based on mode
  const getDefaultValues = (): CocktailFormData => {
    if (cocktail) {
      // Debug logging for ingredients
      console.log('--- DEBUG [CocktailForm] --- Cocktail ingredients:', cocktail.ingredients);
      
      return {
        name: cocktail.name,
        description: cocktail.description,
        instructions: cocktail.instructions,
        image_url: cocktail.image_url || '',
        is_public: cocktail.is_public,
        ingredients: cocktail.ingredients && cocktail.ingredients.length > 0 
          ? cocktail.ingredients
              .filter(ci => ci.ingredient && ci.ingredient.id) // Filter out ingredients without valid ingredient data
              .map(ci => ({
                ingredient_id: String(ci.ingredient.id),
                quantity: String(ci.amount),
                unit: ci.unit,
              }))
          : [{ ingredient_id: '', quantity: '', unit: UnitEnum.ML }],
        tag_ids: cocktail.tags ? cocktail.tags.map(t => String(t.id)) : [],
      };
    }
    
    return {
      name: '',
      description: '',
      instructions: '',
      image_url: '',
      is_public: true,
      ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ML }],
      tag_ids: [],
    };
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CocktailFormData>({
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

  // Fetch available ingredients and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ingredientsResponse, tagsResponse] = await Promise.all([
          ingredientService.getIngredients(),
          tagService.getTags(),
        ]);

        if (ingredientsResponse && 'items' in ingredientsResponse) {
          setAvailableIngredients(ingredientsResponse.items);
        } else if (Array.isArray(ingredientsResponse)) {
          setAvailableIngredients(ingredientsResponse);
        } else {
          setAvailableIngredients([]);
        }

        if (tagsResponse && 'items' in tagsResponse) {
          setAvailableTags(tagsResponse.items);
        } else if (Array.isArray(tagsResponse)) {
          setAvailableTags(tagsResponse);
        } else {
          setAvailableTags([]);
        }
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Failed to fetch ingredients or tags', error);
        setFormError('Unable to load form data. Please refresh the page and try again.');
        setIsDataLoaded(true);
      }
    };
    
    fetchData();
  }, []);

  // Reset form when cocktail prop changes
  useEffect(() => {
    if (isDataLoaded) {
      const newDefaultValues = getDefaultValues();
      reset(newDefaultValues);
    }
  }, [cocktail, isDataLoaded, reset]);

  // Form submission handler
  const onSubmit: SubmitHandler<CocktailFormData> = async (data) => {
    setFormError(null);

    const processedIngredients = data.ingredients
      .map(ing => ({
        ingredient_id: parseInt(ing.ingredient_id, 10),
        amount: parseInt(ing.quantity, 10),
        unit: ing.unit as UnitEnum,
      }))
      .filter(ing => ing.ingredient_id && !isNaN(ing.ingredient_id) && !isNaN(ing.amount) && ing.amount > 0);

    const processedTags = data.tag_ids
      ? data.tag_ids.map(idStr => ({ tag_id: parseInt(idStr, 10) })).filter(tag => !isNaN(tag.tag_id))
      : [];

    try {
      let savedCocktail;
      
      if (isEditMode && cocktail?.id) {
        // Update existing cocktail
        const updatePayload: CocktailUpdate = {
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          image_url: data.image_url || null,
          is_public: data.is_public,
          ingredients: processedIngredients,
          tags: processedTags,
        };
        
        console.log("--- DEBUG [CocktailForm EDIT] --- Update payload:", JSON.stringify(updatePayload, null, 2));
        savedCocktail = await cocktailService.updateCocktail(cocktail.id, updatePayload);
      } else {
        // Create new cocktail
        const createPayload: CocktailCreate = {
          name: data.name,
          description: data.description,
          instructions: data.instructions,
          is_public: data.is_public,
          image_url: data.image_url || null,
          ingredients: processedIngredients,
          tags: processedTags,
        };
        
        console.log("--- DEBUG [CocktailForm CREATE] --- Create payload:", JSON.stringify(createPayload, null, 2));
        savedCocktail = await cocktailService.createCocktail(createPayload);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(savedCocktail);
      } else {
        navigate(`/cocktails/${savedCocktail.id}`);
      }
    } catch (error: any) {
      console.error('Failed to save cocktail:', error);
      
      let displayMessage = `An error occurred while ${isEditMode ? 'updating' : 'creating'} the cocktail. Please try again.`;
      
      if (error.response?.status === 422 && error.response.data?.detail) {
        const detail = error.response.data.detail;
        
        if (typeof detail === 'string') {
          displayMessage = detail;
        } else if (Array.isArray(detail)) {
          const errorMessages = detail
            .map((err: any) => err.msg || 'Invalid field data')
            .filter((msg, index, array) => array.indexOf(msg) === index)
            .join('. ');
          displayMessage = errorMessages || 'Please check your form data and try again.';
        }
      } else if (error.response?.status === 409) {
        displayMessage = 'A cocktail with this name already exists. Please choose a different name.';
      } else if (error.response?.status >= 500) {
        displayMessage = 'A server error occurred. Please try again later.';
      } else if (error.message) {
        displayMessage = `Failed to save cocktail: ${error.message}`;
      }
      
      setFormError(displayMessage);
    }
  };

  // Show loading state while data is being fetched
  if (!isDataLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>
        {isEditMode ? `Edit "${cocktail?.name}"` : 'Add New Cocktail'}
      </h2>
      
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
              value: /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-'&.()]+$/,
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
              if (!value || value.trim() === '') return true;
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
          <input 
            type="checkbox" 
            {...register('is_public')} 
          />
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
                disabled={fields.length === 1}
                title={fields.length === 1 ? "At least one ingredient is required" : "Remove ingredient"}
                aria-label={`Remove ingredient ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        
        {errors.ingredients && !Array.isArray(errors.ingredients) && (errors.ingredients as FieldError)?.message && (
          <div className={styles.errorMessage} role="alert">
            <p>{(errors.ingredients as FieldError).message}</p>
          </div>
        )}

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
                  {...register('tag_ids')}
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
        {isSubmitting 
          ? (isEditMode ? 'Saving Changes...' : 'Adding Cocktail...') 
          : (isEditMode ? 'Save Changes' : 'Add Cocktail')
        }
      </Button>
    </form>
  );
};

export default CocktailForm;