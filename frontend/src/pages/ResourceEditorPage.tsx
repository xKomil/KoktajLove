// frontend/src/pages/ResourceEditorPage.tsx
import React, { useState, useEffect } from 'react';
import { Tag, TagCreate, TagUpdate, Ingredient, IngredientCreate, IngredientUpdate, PaginatedResponse } from '@/types';
import { getTags, createTag, updateTag, deleteTag } from '@/services/tagService';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/services/ingredientService';
import styles from './ResourceEditorPage.module.css'; // Import CSS Modules

const ResourceEditorPage: React.FC = () => {
  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagActionLoading, setTagActionLoading] = useState<boolean>(false);

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState<boolean>(false);
  const [ingredientsError, setIngredientsError] = useState<string | null>(null);
  const [ingredientActionLoading, setIngredientActionLoading] = useState<boolean>(false);

  // Fetch tags
  const fetchTags = async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const response = await getTags();
      if (Array.isArray(response)) {
        setTags(response);
      } else {
        setTags((response as PaginatedResponse<Tag>).items);
      }
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      setTagsError(error.message || 'Błąd podczas pobierania tagów');
    } finally {
      setTagsLoading(false);
    }
  };

  // Fetch ingredients
  const fetchIngredients = async () => {
    setIngredientsLoading(true);
    setIngredientsError(null);
    try {
      const response = await getIngredients();
      if (Array.isArray(response)) {
        setIngredients(response);
      } else {
        setIngredients((response as PaginatedResponse<Ingredient>).items);
      }
    } catch (error: any) {
      console.error('Error fetching ingredients:', error);
      setIngredientsError(error.message || 'Błąd podczas pobierania składników');
    } finally {
      setIngredientsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchIngredients();
  }, []);

  // Tag handlers
  const handleAddTag = async () => {
    const name = window.prompt('Podaj nazwę nowego tagu:');
    if (!name || name.trim() === '') return;

    setTagActionLoading(true);
    try {
      const tagData: TagCreate = { name: name.trim() };
      await createTag(tagData);
      await fetchTags();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      alert(`Błąd podczas tworzenia tagu: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleEditTag = async (tag: Tag) => {
    const newName = window.prompt('Podaj nową nazwę tagu:', tag.name);
    if (!newName || newName.trim() === '' || newName.trim() === tag.name) return;

    setTagActionLoading(true);
    try {
      const updateData: TagUpdate = { name: newName.trim() };
      await updateTag(tag.id, updateData);
      await fetchTags();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      alert(`Błąd podczas edycji tagu: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setTagActionLoading(false);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    const confirmed = window.confirm(`Czy na pewno chcesz usunąć tag "${tag.name}"?`);
    if (!confirmed) return;

    setTagActionLoading(true);
    try {
      await deleteTag(tag.id);
      await fetchTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      alert(`Błąd podczas usuwania tagu: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setTagActionLoading(false);
    }
  };

  // Ingredient handlers
  const handleAddIngredient = async () => {
    const name = window.prompt('Podaj nazwę nowego składnika:');
    if (!name || name.trim() === '') return;

    const description = window.prompt('Podaj opis składnika (opcjonalnie):');

    setIngredientActionLoading(true);
    try {
      const ingredientData: IngredientCreate = {
        name: name.trim(),
        description: description && description.trim() !== '' ? description.trim() : null
      };
      await createIngredient(ingredientData);
      await fetchIngredients();
    } catch (error: any) {
      console.error('Error creating ingredient:', error);
      alert(`Błąd podczas tworzenia składnika: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setIngredientActionLoading(false);
    }
  };

  const handleEditIngredient = async (ingredient: Ingredient) => {
    const newName = window.prompt('Podaj nową nazwę składnika:', ingredient.name);
    if (!newName || newName.trim() === '') return;

    const newDescription = window.prompt('Podaj nowy opis składnika (pozostaw puste, aby usunąć):', ingredient.description || '');

    if (newName.trim() === ingredient.name && 
        (newDescription || '').trim() === (ingredient.description || '')) {
      return;
    }

    setIngredientActionLoading(true);
    try {
      const updateData: IngredientUpdate = {
        name: newName.trim(),
        description: newDescription && newDescription.trim() !== '' ? newDescription.trim() : null
      };
      await updateIngredient(ingredient.id, updateData);
      await fetchIngredients();
    } catch (error: any) {
      console.error('Error updating ingredient:', error);
      alert(`Błąd podczas edycji składnika: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setIngredientActionLoading(false);
    }
  };

  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    const confirmed = window.confirm(`Czy na pewno chcesz usunąć składnik "${ingredient.name}"?`);
    if (!confirmed) return;

    setIngredientActionLoading(true);
    try {
      await deleteIngredient(ingredient.id);
      await fetchIngredients();
    } catch (error: any) {
      console.error('Error deleting ingredient:', error);
      alert(`Błąd podczas usuwania składnika: ${error.message || 'Nieznany błąd'}`);
    } finally {
      setIngredientActionLoading(false);
    }
  };

  const isLoadingAnyAction = tagActionLoading || ingredientActionLoading;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Zarządzanie Katalogiem</h1>

      {/* Tags Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tagi</h2>
          <button
            onClick={handleAddTag}
            disabled={isLoadingAnyAction || tagsLoading}
            className={styles.addButton}
          >
            {tagActionLoading ? 'Przetwarzanie...' : 'Dodaj nowy Tag'}
          </button>
        </div>

        {tagsLoading && <p className={styles.loadingText}>Ładowanie tagów...</p>}
        
        {tagsError && (
          <div className={styles.errorText}>
            {tagsError}
          </div>
        )}

        {!tagsLoading && !tagsError && tags.length === 0 && (
          <p className={styles.emptyText}>
            Nie znaleziono tagów. Kliknij "Dodaj nowy Tag", aby utworzyć pierwszy!
          </p>
        )}

        {!tagsLoading && !tagsError && tags.length > 0 && (
          <div className={styles.itemsList}>
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={styles.itemCard}
              >
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{tag.name}</h3>
                  <span className={styles.itemId}>ID: {tag.id}</span>
                </div>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleEditTag(tag)}
                    disabled={isLoadingAnyAction}
                    className={styles.editButton}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    disabled={isLoadingAnyAction}
                    className={styles.deleteButton}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ingredients Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Składniki</h2>
          <button
            onClick={handleAddIngredient}
            disabled={isLoadingAnyAction || ingredientsLoading}
            className={styles.addButton}
          >
            {ingredientActionLoading ? 'Przetwarzanie...' : 'Dodaj nowy Składnik'}
          </button>
        </div>

        {ingredientsLoading && <p className={styles.loadingText}>Ładowanie składników...</p>}
        
        {ingredientsError && (
          <div className={styles.errorText}>
            {ingredientsError}
          </div>
        )}

        {!ingredientsLoading && !ingredientsError && ingredients.length === 0 && (
          <p className={styles.emptyText}>
            Nie znaleziono składników. Kliknij "Dodaj nowy Składnik", aby utworzyć pierwszy!
          </p>
        )}

        {!ingredientsLoading && !ingredientsError && ingredients.length > 0 && (
          <div className={styles.itemsList}>
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className={styles.itemCard}
              >
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{ingredient.name}</h3>
                  <span className={styles.itemId}>ID: {ingredient.id}</span>
                  {ingredient.description && (
                    <p className={styles.itemDescription}>
                      {ingredient.description}
                    </p>
                  )}
                </div>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleEditIngredient(ingredient)}
                    disabled={isLoadingAnyAction}
                    className={styles.editButton}
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDeleteIngredient(ingredient)}
                    disabled={isLoadingAnyAction}
                    className={styles.deleteButton}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ResourceEditorPage;