// Input.tsx - Znacznie ulepszona wersja
import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'flushed';
  isRequired?: boolean;
  isInvalid?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    size = 'md',
    variant = 'default',
    isRequired = false,
    isInvalid = false,
    className = '',
    onClear,
    showClearButton = false,
    type = 'text',
    value,
    startIcon,
    endIcon,
    fullWidth = false,
    inputSize = 'md',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const hasError = isInvalid || !!error;
    const hasValue = value !== undefined && value !== '';
    
    const inputClasses = [
      styles.input,
      styles[size],
      styles[variant],
      hasError && styles.error,
      isFocused && styles.focused,
      leftIcon && styles.hasLeftIcon,
      (rightIcon || showClearButton || type === 'password') && styles.hasRightIcon,
      className,
    ].filter(Boolean).join(' ');

    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    const containerClasses = [
      styles.container,
      fullWidth && styles.fullWidth,
      error && styles.hasError,
      styles[inputSize],
      styles[variant],
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </label>
        )}
        
        <div className={styles.inputWrapper}>
          {startIcon && (
            <span className={styles.startIcon} aria-hidden="true">
              {startIcon}
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            value={value}
            className={`${inputClasses} ${startIcon ? styles.hasStartIcon : ''} ${endIcon ? styles.hasEndIcon : ''}`}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={hasError}
            aria-describedby={
              [
                error && `${inputId}-error`,
                helperText && `${inputId}-helper`,
              ].filter(Boolean).join(' ') || undefined
            }
            {...props}
          />
          
          <div className={styles.rightIconWrapper}>
            {showClearButton && hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.clearButton}
                aria-label="Clear input"
              >
                ✕
              </button>
            )}
            
            {type === 'password' && (
              <button
                type="button"
                onClick={handleTogglePassword}
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
            
            {endIcon && <span>{endIcon}</span>}
          </div>
        </div>
        
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText}>
            {error}
          </span>
        )}
        
        {helperText && !error && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;