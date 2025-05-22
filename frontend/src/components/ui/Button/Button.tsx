// frontend/src/components/ui/Button/Button.tsx
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outlinePrimary';
type ButtonSize = 'small' | 'medium' | 'large';

interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

// Props for when the component is used as a standard HTML button
interface HtmlButtonProps extends BaseButtonProps {
  as?: 'button';
  href?: never; // Ensure href is not allowed for 'button'
}

// Props for when the component is used as a React Router Link
interface RouterLinkProps extends BaseButtonProps, Omit<LinkProps, 'className' | 'style' | 'children'> {
  as: 'link';
  to: LinkProps['to']; // 'to' is required for Link
}

type ButtonProps = HtmlButtonProps | RouterLinkProps;

const Button: React.FC<ButtonProps> = ({
  as = 'button',
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  fullWidth = false,
  ...rest // Catches 'to' for Link and other props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ].join(' ').trim();

  if (as === 'link') {
    const linkProps = rest as Omit<RouterLinkProps, keyof BaseButtonProps | 'as'>;
    return (
      <Link {...linkProps} className={buttonClasses} 
        // Prevent navigation on disabled link-like button
        onClick={(e) => { if (disabled) e.preventDefault(); }}
        aria-disabled={disabled}
      >
        {children}
      </Link>
    );
  }

  const btnProps = rest as Omit<HtmlButtonProps, keyof BaseButtonProps | 'as'>;
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...btnProps}
    >
      {children}
    </button>
  );
};

export default Button;