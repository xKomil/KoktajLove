// Spinner.tsx - Znacznie ulepszona wersja
import React from 'react';
import styles from './Spinner.module.css';

type SpinnerVariant = 'border' | 'dots' | 'pulse' | 'bars' | 'circle';
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  color?: string;
  speed?: 'slow' | 'normal' | 'fast';
  label?: string;
  className?: string;
  centered?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  variant = 'border',
  size = 'md',
  color,
  speed = 'normal',
  label = 'Loading...',
  className = '',
  centered = false,
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[variant],
    styles[size],
    styles[speed],
    className,
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    styles.wrapper,
    centered && styles.centered,
  ].filter(Boolean).join(' ');

  const spinnerStyle: React.CSSProperties = color ? { 
    color,
    borderColor: variant === 'border' ? `transparent transparent transparent ${color}` : undefined 
  } : {};

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={spinnerClasses} style={spinnerStyle}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={spinnerClasses} style={spinnerStyle}>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseCore}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={spinnerClasses} style={spinnerStyle}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        );
      
      case 'circle':
        return (
          <div className={spinnerClasses} style={spinnerStyle}>
            <svg viewBox="0 0 50 50" className={styles.circularSvg}>
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
                className={styles.circularPath}
              />
            </svg>
          </div>
        );
      
      default: // border
        return <div className={spinnerClasses} style={spinnerStyle}></div>;
    }
  };

  return (
    <div className={wrapperClasses} role="status" aria-label={label}>
      {renderSpinner()}
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
};

export default Spinner;