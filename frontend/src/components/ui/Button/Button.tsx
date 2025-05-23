// Button.tsx - Znacznie ulepszona wersja
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonShape = 'square' | 'rounded' | 'pill';

interface BaseButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// Props for when the component is used as a standard HTML button
interface HtmlButtonProps extends BaseButtonProps {
  as?: 'button';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  href?: never;
}

// Props for when the component is used as a React Router Link
interface RouterLinkProps extends BaseButtonProps, Omit<LinkProps, 'className' | 'style' | 'children'> {
  as: 'link';
  to: LinkProps['to'];
}

type ButtonProps = HtmlButtonProps | RouterLinkProps;

const Button: React.FC<ButtonProps> = ({
  as = 'button',
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  fullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled = false,
  className = '',
  ...rest
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    styles[shape],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {isLoading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg
            className={styles.spinnerIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </span>
      )}
      {leftIcon && !isLoading && (
        <span className={styles.leftIcon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className={styles.content}>
        {isLoading && loadingText ? loadingText : children}
      </span>
      {rightIcon && !isLoading && (
        <span className={styles.rightIcon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </>
  );

  if (as === 'link') {
    const linkProps = rest as Omit<RouterLinkProps, keyof BaseButtonProps | 'as'>;
    return (
      <Link
        {...linkProps}
        className={buttonClasses}
        onClick={(e) => {
          if (disabled || isLoading) {
            e.preventDefault();
            return;
          }
          linkProps.onClick?.(e);
        }}
        aria-disabled={disabled || isLoading}
      >
        {content}
      </Link>
    );
  }

  const btnProps = rest as Omit<HtmlButtonProps, keyof BaseButtonProps | 'as'>;
  return (
    <button
      {...btnProps}
      className={buttonClasses}
      disabled={disabled || isLoading}
      type={btnProps.type || 'button'}
    >
      {content}
    </button>
  );
};

export default Button;