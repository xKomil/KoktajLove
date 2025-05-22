// frontend/src/components/ui/Input/Input.tsx
import React, { forwardRef, InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // You can add custom props here if needed, e.g., error states, label, etc.
  // For react-hook-form, it's common to just spread {...register(...)}
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const inputClasses = `${styles.input} ${className}`.trim();

    return (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input'; // Helpful for debugging

export default Input;