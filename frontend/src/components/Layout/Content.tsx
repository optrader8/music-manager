import React, { useState } from 'react';
import * as Label from '@radix-ui/react-label';
import { Button } from '@/components/ui2/Button';
import { Input } from '@/components/ui2/Input';
import styles from '@/components/Layout/Content.module.scss';
import type { ContentProps, LoginFormData } from '@/types';

export const Content: React.FC<ContentProps> = ({ onLogin, onSignUp, isLoading = false }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleInputChange =
    (field: keyof LoginFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin?.(formData);
  };

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>Welcome back</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <Label.Root htmlFor="email" className={styles.label}>
            Email
          </Label.Root>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <Label.Root htmlFor="password" className={styles.label}>
            Password
          </Label.Root>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange('password')}
            disabled={isLoading}
            required
          />
        </div>

        <div className={styles.buttonContainer}>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isLoading}
            className={styles.signInButton}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </form>

      <p className={styles.signUpText}>Don't have an account?</p>

      <div className={styles.buttonContainer}>
        <Button variant="secondary" size="sm" onClick={onSignUp} disabled={isLoading}>
          Sign Up
        </Button>
      </div>
    </div>
  );
};
