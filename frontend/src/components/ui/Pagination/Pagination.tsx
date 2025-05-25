// frontend/src/components/ui/Pagination/Pagination.tsx
import React from 'react';
import Button from '../Button/Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className
}) => {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const delta = 2; // Number of pages to show around current page
    const range: (number | 'ellipsis')[] = [];
    const rangeWithDots: (number | 'ellipsis')[] = [];

    // Always include first page
    range.push(1);

    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always include last page (if not already included)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Add ellipsis where needed
    let prev = 0;
    for (const page of range) {
      if (typeof page === 'number') {
        if (page - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (page - prev !== 1) {
          rangeWithDots.push('ellipsis');
        }
        rangeWithDots.push(page);
        prev = page;
      }
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className={`${styles.pagination} ${className || ''}`}>
      {/* Items info */}
      <div className={styles.info}>
        <span className={styles.infoText}>
          Wyświetlane {startItem}-{endItem} z {totalItems} elementów
        </span>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={styles.navButton}
          aria-label="Poprzednia strona"
        >
          <span className={styles.navButtonText}>
            <span className={styles.navArrow}>‹</span>
            <span className={styles.navLabel}>Poprzednia</span>
          </span>
        </Button>

        {/* Page numbers */}
        <div className={styles.pageNumbers}>
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`${styles.pageButton} ${
                  pageNum === currentPage ? styles.pageButtonActive : ''
                }`}
                aria-label={`Strona ${pageNum}`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={styles.navButton}
          aria-label="Następna strona"
        >
          <span className={styles.navButtonText}>
            <span className={styles.navLabel}>Następna</span>
            <span className={styles.navArrow}>›</span>
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Pagination;