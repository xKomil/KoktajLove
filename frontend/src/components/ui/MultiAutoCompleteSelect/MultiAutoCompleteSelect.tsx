// frontend/src/components/ui/MultiAutoCompleteSelect/MultiAutoCompleteSelect.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './MultiAutoCompleteSelect.module.css';

interface MultiAutoCompleteSelectProps<T> {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  items: T[];
  selectedItems: T[];
  onSelectionChange: (selectedItems: T[]) => void;
  getItemLabel: (item: T) => string;
  getItemValue: (item: T) => string | number;
  noOptionsText?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  maxSelectedDisplay?: number;
}

const MultiAutoCompleteSelect = <T,>({
  label,
  placeholder = "Select options...", // TRANSLATED
  searchPlaceholder = "Search...", // TRANSLATED
  items,
  selectedItems,
  onSelectionChange,
  getItemLabel,
  getItemValue,
  noOptionsText = "No options", // TRANSLATED
  disabled = false,
  error,
  helperText,
  maxSelectedDisplay = 3
}: MultiAutoCompleteSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter items based on search value, excluding already selected items
  const filteredItems = items.filter(item => {
    const isAlreadySelected = selectedItems.some(selected => 
      getItemValue(selected) === getItemValue(item)
    );
    const matchesSearch = getItemLabel(item)
      .toLowerCase()
      .includes(searchValue.toLowerCase());
    return !isAlreadySelected && matchesSearch;
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
        }
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
        }
        break;
      
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredItems[focusedIndex]) {
          handleItemSelect(filteredItems[focusedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchValue('');
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      
      case 'Backspace':
        if (searchValue === '' && selectedItems.length > 0) {
          // Remove last selected item when backspace is pressed and search is empty
          const newSelected = selectedItems.slice(0, -1);
          onSelectionChange(newSelected);
        }
        break;
    }
  }, [isOpen, focusedIndex, filteredItems, searchValue, selectedItems, onSelectionChange, disabled]);

  const handleItemSelect = (item: T) => {
    const newSelected = [...selectedItems, item];
    onSelectionChange(newSelected);
    setSearchValue('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleItemRemove = (itemToRemove: T) => {
    const newSelected = selectedItems.filter(item => 
      getItemValue(item) !== getItemValue(itemToRemove)
    );
    onSelectionChange(newSelected);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Reset focused index when filtered items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchValue]);

  const getDisplayText = () => {
    if (selectedItems.length === 0) {
      return placeholder;
    }
    
    if (selectedItems.length <= maxSelectedDisplay) {
      return selectedItems.map(getItemLabel).join(', ');
    }
    
    const displayedItems = selectedItems.slice(0, maxSelectedDisplay);
    const remainingCount = selectedItems.length - maxSelectedDisplay;
    return `${displayedItems.map(getItemLabel).join(', ')} +${remainingCount}`;
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      
      <div className={`${styles.inputContainer} ${error ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        {/* Selected items as pills */}
        {selectedItems.length > 0 && (
          <div className={styles.selectedItems}>
            {selectedItems.map((item) => (
              <div key={getItemValue(item)} className={styles.selectedItem}>
                <span className={styles.selectedItemLabel}>
                  {getItemLabel(item)}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleItemRemove(item)}
                    aria-label={`Remove ${getItemLabel(item)}`} // TRANSLATED
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={isOpen ? searchPlaceholder : (selectedItems.length > 0 ? '' : placeholder)}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {/* Dropdown arrow */}
        <button
          type="button"
          className={`${styles.dropdownButton} ${isOpen ? styles.open : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="Open options list" // TRANSLATED
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Dropdown list */}
        {isOpen && (
          <ul
            ref={listRef}
            className={styles.dropdownList}
            role="listbox"
            aria-multiselectable="true"
          >
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <li
                  key={getItemValue(item)}
                  className={`${styles.dropdownItem} ${
                    index === focusedIndex ? styles.focused : ''
                  }`}
                  onClick={() => handleItemSelect(item)}
                  role="option"
                  aria-selected={false}
                >
                  {getItemLabel(item)}
                </li>
              ))
            ) : (
              <li className={styles.noOptions}>
                {searchValue ? `No results for "${searchValue}"` : noOptionsText} 
                {/* TRANSLATED "Brak wyników dla" */}
              </li>
            )}
          </ul>
        )}
      </div>
      
      {/* Helper text or error */}
      {(error || helperText) && (
        <div className={styles.bottomText}>
          {error ? (
            <span className={styles.error}>{error}</span>
          ) : (
            <span className={styles.helperText}>{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiAutoCompleteSelect;