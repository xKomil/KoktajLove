import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children }) => {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trapElement = trapRef.current;
    if (!trapElement) return;

    const focusableElements = trapElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // If shift + tab and on first element, move to last
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // If tab and on last element, move to first
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }

      // Handle escape key
      if (e.key === 'Escape') {
        const closeButton = trapElement.querySelector<HTMLElement>('[aria-label="Close modal"]');
        if (closeButton) {
          e.preventDefault();
          closeButton.click();
        }
      }
    };

    // Focus first focusable element when trap is mounted
    firstFocusable?.focus();

    // Add event listener for keyboard navigation
    trapElement.addEventListener('keydown', handleKeyDown);

    return () => {
      trapElement.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={trapRef}>
      {children}
    </div>
  );
}; 