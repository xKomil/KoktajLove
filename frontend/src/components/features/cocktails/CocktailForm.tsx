// frontend/src/components/features/cocktails/CocktailForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CocktailCreate, CocktailUpdate, CocktailWithDetails, Ingredient, Tag, UnitEnum } from '@/types';
import * as cocktailService from '@/services/cocktailService';
import * as ingredientService from '@/services/ingredientService';
import * as tagService from '@/services/tagService';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import styles from './CocktailForm.module.css';

// Form data type, includes all fields including those for react-hook-form
type CocktailFormData = Omit<CocktailCreate, 'ingredients' | 'tag_ids'> & {
  ingredients: { ingredient_id: string; quantity: string; unit: UnitEnum }[];
  tag_ids: string[]; // RHF works better with string array for multi-select or checkboxes
};

interface CocktailFormProps {
  cocktail?: CocktailWithDetails; // For editing
  onSubmitSuccess?: (cocktail: CocktailWithDetails) => void;
}

const CocktailForm: React.FC<CocktailFormProps> = ({ cocktail, onSubmitSuccess }) => {
  const navigate = useNavigate();
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors, isSubmitting },
    setValue,
    reset 
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
            quantity: String(ci.quantity),
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
          ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ml }],
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
        const [ingredientsRes, tagsRes] = await Promise.all([
          ingredientService.getIngredients(),
          tagService.getTags(),
        ]);
        setAvailableIngredients(ingredientsRes);
        setAvailableTags(tagsRes);
      } catch (error) {
        console.error('Failed to fetch ingredients or tags', error);
        setFormError('Could not load necessary data for the form.');
      }
    };
    fetchData();
  }, []);

  useEffect(() => { // Reset form if cocktail prop changes (e.g. for editing)
    if (cocktail) {
        reset({
            name: cocktail.name,
            description: cocktail.description,
            instructions: cocktail.instructions,
            image_url: cocktail.image_url || '',
            is_public: cocktail.is_public,
            ingredients: cocktail.ingredients.map(ci => ({
              ingredient_id: String(ci.ingredient.id),
              quantity: String(ci.quantity),
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
            ingredients: [{ ingredient_id: '', quantity: '', unit: UnitEnum.ml }],
            tag_ids: [],
          });
    }
  }, [cocktail, reset]);


  const onSubmit: SubmitHandler<CocktailFormData> = async (data) => {
    setFormError(null);
    const payload: CocktailCreate | CocktailUpdate = {
      ...data,
      ingredients: data.ingredients.map(ing => ({
        ingredient_id: parseInt(ing.ingredient_id, 10),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
      })).filter(ing => !isNaN(ing.ingredient_id) && !isNaN(ing.quantity)), // Filter out invalid entries
      tag_ids: data.tag_ids.map(id => parseInt(id, 10)),
      is_public: data.is_public === undefined ? true : data.is_public, // Default to true if undefined
    };

    try {
      let savedCocktail;
      if (cocktail?.id) {
        savedCocktail = await cocktailService.updateCocktail(cocktail.id, payload as CocktailUpdate);
      } else {
        savedCocktail = await cocktailService.createCocktail(payload as CocktailCreate);
      }
      
      if (onSubmitSuccess) {
        onSubmitSuccess(savedCocktail);
      } else {
        navigate(`/cocktail/${savedCocktail.id}`);
      }
    } catch (error: any) {
      console.error('Failed to save cocktail', error);
      setFormError(error.response?.data?.detail || 'An error occurred while saving the cocktail.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>{cocktail ? 'Edit Cocktail' : 'Add New Cocktail'}</h2>
      {formError && <p className={styles.errorMessage}>{formError}</p>}

      <div className={styles.formGroup}>
        <label htmlFor="name">Name</label>
        <Input id="name" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className={styles.errorMessage}>{errors.name.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea id="description" {...register('description', { required: 'Description is required' })} />
        {errors.description && <p className={styles.errorMessage}>{errors.description.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="instructions">Instructions</label>
        <textarea id="instructions" {...register('instructions', { required: 'Instructions are required' })} />
        {errors.instructions && <p className={styles.errorMessage}>{errors.instructions.message}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="image_url">Image URL (optional)</label>
        <Input id="image_url" type="url" {...register('image_url')} />
        {errors.image_url && <p className={styles.errorMessage}>{errors.image_url.message}</p>}
      </div>
      
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" {...register('is_public')} defaultChecked={cocktail?.is_public ?? true} />
          Publicly Visible
        </label>
      </div>

      <section className={styles.ingredientsSection}>
        <h3>Ingredients</h3>
        {fields.map((field, index) => (
          <div key={field.id} className={styles.ingredientItem}>
            <Controller
              name={`ingredients.${index}.ingredient_id`}
              control={control}
              rules={{ required: 'Ingredient is required' }}
              render={({ field }) => (
                <select {...field}>
                  <option value="">Select Ingredient</option>
                  {availableIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              )}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Qty"
              {...register(`ingredients.${index}.quantity`, { 
                required: 'Quantity is required', 
                valueAsNumber: true,
                min: { value: 0.1, message: "Quantity must be positive" }
              })}
            />
            <Controller
              name={`ingredients.${index}.unit`}
              control={control}
              rules={{ required: 'Unit is required' }}
              render={({ field }) => (
                <select {...field}>
                  {Object.values(UnitEnum).map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              )}
            />
            <Button type="button" onClick={() => remove(index)} variant="danger" size="small">Remove</Button>
          </div>
        ))}
         {errors.ingredients && errors.ingredients.map((error, index) => (
            <div key={index} className={styles.errorMessage}>
              {error?.ingredient_id && <p>{error.ingredient_id.message}</p>}
              {error?.quantity && <p>{error.quantity.message}</p>}
              {error?.unit && <p>{error.unit.message}</p>}
            </div>
          ))}
        <Button type="button" onClick={() => append({ ingredient_id: '', quantity: '', unit: UnitEnum.ml })} variant="secondary">
          Add Ingredient
        </Button>
      </section>

      <section className={styles.tagsSection}>
        <h3>Tags (optional)</h3>
        <div className={styles.formGroup}>
            {availableTags.map(tag => (
                <label key={tag.id} className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        value={tag.id}
                        {...register('tag_ids')}
                    />
                    {tag.name}
                </label>
            ))}
        </div>
        {errors.tag_ids && <p className={styles.errorMessage}>{errors.tag_ids.message}</p>}
      </section>

      <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? (cocktail ? 'Saving...' : 'Adding...') : (cocktail ? 'Save Changes' : 'Add Cocktail')}
      </Button>
    </form>
  );
};

export default CocktailForm;