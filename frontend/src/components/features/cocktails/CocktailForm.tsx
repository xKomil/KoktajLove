// frontend/src/components/features/cocktails/CocktailForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, useFieldArray, Controller, FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';
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
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CocktailFormData>({
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
          is_public: true,
          ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ML }],
          tag_ids: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

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
      } catch (error) {
        console.error('Failed to fetch ingredients or tags', error);
        setFormError('Could not load necessary data for the form.');
      }
    };
    fetchData();
  }, []);

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

    const payloadForBackend: CocktailCreate = {
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      is_public: data.is_public,
      image_url: data.image_url ? data.image_url : null,
      ingredients: processedIngredients,
      tags: processedTags,
    };

    console.log("--- DEBUG [CocktailForm FRONTEND] --- Payload wysyłany do serwisu:", JSON.stringify(payloadForBackend, null, 2));

    try {
      let savedCocktail;
      if (cocktail?.id) {
        const updatePayload: CocktailUpdate = {
            ...(data.name && { name: data.name }),
            ...(data.description && { description: data.description }),
            ...(data.instructions && { instructions: data.instructions }),
            ...(data.image_url !== undefined && { image_url: data.image_url ? data.image_url : null }),
            ...(data.is_public !== undefined && { is_public: data.is_public }),
            ingredients: processedIngredients,
            tags: processedTags,
        };
        savedCocktail = await cocktailService.updateCocktail(cocktail.id, updatePayload);
      } else {
        savedCocktail = await cocktailService.createCocktail(payloadForBackend);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(savedCocktail);
      } else {
        navigate(`/cocktail/${savedCocktail.id}`);
      }
    } catch (error: any) {
      console.error('Pełny obiekt błędu (Failed to save cocktail):', error);
      let displayMessage = 'An error occurred while saving the cocktail.';
      if (error.response && error.response.data && error.response.data.detail) {
        const detail = error.response.data.detail;
        console.error(">>> WAŻNE: Dane błędu 422 (Failed to save cocktail):", error.response.data);
        if (typeof detail === 'string') {
          displayMessage = detail;
        } else if (Array.isArray(detail)) {
          displayMessage = detail.map((err: any) => `${err.loc.join('.')} - ${err.msg}`).join('; ');
        } else {
          displayMessage = 'An unexpected error occurred with the server response.';
        }
      } else if (error.message) {
        displayMessage = error.message;
      }
      setFormError(displayMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>{cocktail ? 'Edit Cocktail' : 'Add New Cocktail'}</h2>
      
      {formError && (
        <div className={styles.formErrorContainer} role="alert">
          <p className={styles.errorMessage}>{formError}</p>
        </div>
      )}

      <div className={styles.formGroup}>
        <Input 
          id="name" 
          label="Name"
          placeholder="Enter cocktail name..."
          {...register('name', { required: 'Name is required' })} 
          error={errors.name?.message}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea 
          id="description" 
          placeholder="Describe your cocktail..."
          {...register('description', { required: 'Description is required' })} 
        />
        {errors.description && <p className={styles.errorMessage} role="alert">{errors.description.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="instructions">Instructions</label>
        <textarea 
          id="instructions" 
          placeholder="How to make this cocktail..."
          {...register('instructions', { required: 'Instructions are required' })} 
        />
        {errors.instructions && <p className={styles.errorMessage} role="alert">{errors.instructions.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <Input 
          id="image_url" 
          type="url" 
          label="Image URL (optional)"
          placeholder="https://example.com/image.jpg"
          {...register('image_url')} 
          error={errors.image_url?.message}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register('is_public')} defaultChecked={cocktail?.is_public ?? true} />
          <span className={styles.checkboxText}> Publicly Visible</span>
        </label>
      </div>

      <section className={styles.ingredientsSection}>
        <h3>Ingredients</h3>
        <div className={styles.ingredientsContainer}>
          {fields.map((field, index) => (
            <div key={field.id} className={styles.ingredientItem}>
              <Controller
                name={`ingredients.${index}.ingredient_id`}
                control={control}
                rules={{ required: 'Ingredient is required' }}
                render={({ field: controllerField }) => (
                  <select {...controllerField}>
                    <option value="">Select Ingredient</option>
                    {availableIngredients.map(ing => (
                      <option key={ing.id} value={String(ing.id)}>{ing.name}</option>
                    ))}
                  </select>
                )}
              />
              <Input
                type="number"
                step="1"
                placeholder="Amount"
                {...register(`ingredients.${index}.quantity`, { 
                  required: 'Amount is required', 
                  valueAsNumber: false,
                  validate: value => {
                      const num = parseInt(value, 10);
                      return !isNaN(num) && num > 0 || "Amount must be greater than 0";
                  }
                })}
              />
              <Controller
                name={`ingredients.${index}.unit`}
                control={control}
                rules={{ required: 'Unit is required' }}
                render={({ field: controllerField }) => (
                  <select {...controllerField}>
                    {Object.values(UnitEnum).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                )}
              />
              <Button 
                type="button" 
                onClick={() => remove(index)} 
                variant="danger" 
                size="sm"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        
        {/* Błędy dla ingredients */}
        {errors.ingredients && Array.isArray(errors.ingredients) && (
          errors.ingredients.map((itemError, index) => {
            if (!itemError) return null;

            const ingredientIdMsg = (itemError.ingredient_id as FieldError)?.message;
            const quantityMsg = (itemError.quantity as FieldError)?.message;
            const unitMsg = (itemError.unit as FieldError)?.message;
            const rootMsg = (itemError as FieldError)?.message;

            if (ingredientIdMsg || quantityMsg || unitMsg || rootMsg) {
              return (
                <div key={`error-ing-${index}`} className={styles.errorMessage}>
                  {ingredientIdMsg && <p role="alert">Ingredient: {ingredientIdMsg}</p>}
                  {quantityMsg && <p role="alert">Quantity: {quantityMsg}</p>}
                  {unitMsg && <p role="alert">Unit: {unitMsg}</p>}
                  {rootMsg && !ingredientIdMsg && !quantityMsg && !unitMsg && <p role="alert">{rootMsg}</p>}
                </div>
              );
            }
            return null;
          })
        )}
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

      <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? (cocktail ? 'Saving...' : 'Adding...') : (cocktail ? 'Save Changes' : 'Add Cocktail')}
      </Button>
    </form>
  );
};

export default CocktailForm;