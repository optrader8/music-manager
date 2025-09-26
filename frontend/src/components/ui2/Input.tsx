import React from 'react';
import { cn } from '@/utils/cn';
import styles from '@/components/ui2/Input.module.scss';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(styles.input, className)} ref={ref} {...props} />;
  }
);

Input.displayName = 'Input';
