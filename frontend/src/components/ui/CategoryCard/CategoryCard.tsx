// frontend/src/components/ui/CategoryCard/CategoryCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  name: string;
  description: string;
  imageGradient: string;
  link: string;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  description,
  imageGradient,
  link,
  className = ''
}) => {
  const cardClasses = [
    styles.categoryCard,
    className
  ].filter(Boolean).join(' ');

  return (
    <Link to={link} className={cardClasses}>
      <div 
        className={styles.imageSection}
        style={{ background: imageGradient }}
      >
        <div className={styles.overlay} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.arrow}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;