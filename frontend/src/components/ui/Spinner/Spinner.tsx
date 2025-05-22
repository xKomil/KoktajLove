// frontend/src/components/ui/Spinner/Spinner.tsx
import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number; // Optional: direct size in pixels
  color?: string; // Optional: direct color for the spinning part
  wrapperClassName?: string; // For custom wrapper styles if needed
}

const Spinner: React.FC<SpinnerProps> = ({ size, color, wrapperClassName }) => {
  const spinnerStyle: React.CSSProperties = {};
  if (size) {
    spinnerStyle.width = `${size}px`;
    spinnerStyle.height = `${size}px`;
    spinnerStyle.borderWidth = `${Math.max(2, Math.floor(size / 9))}px`; // Adjust border width based on size
  }
  if (color) {
    spinnerStyle.borderLeftColor = color;
  }

  return (
    <div className={wrapperClassName || styles.spinnerWrapper}>
      <div className={styles.spinner} style={spinnerStyle} role="status" aria-label="Loading...">
        {/* Visually hidden text for screen readers, though aria-label should suffice */}
        <span style={{ display: 'none' }}>Loading...</span> 
      </div>
    </div>
  );
};

export default Spinner;