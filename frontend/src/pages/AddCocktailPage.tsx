// frontend/src/pages/AddCocktailPage.tsx
import React from 'react';
import CocktailForm from '@/components/features/cocktails/CocktailForm';
import styles from './PageStyles.module.css'; // Optional: create a shared page style

const AddCocktailPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      {/* You can add a page-specific title or breadcrumbs here */}
      {/* <h1 className={styles.pageTitle}>Add New Cocktail</h1> */}
      <CocktailForm />
    </div>
  );
};

export default AddCocktailPage;