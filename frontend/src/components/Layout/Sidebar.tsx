import React from 'react';
import { Button } from '../ui2/Button';
import styles from './Sidebar.module.scss';
import type { SidebarProps } from '../../types';

export const Sidebar: React.FC<SidebarProps> = ({ navigationItems, onNavigate }) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            {/* <h1 className={styles.title}>Expense Tracker</h1> */}
            <p className={styles.subtitle}>Personal</p>
          </div>

          <div className={styles.navigation}>
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={item.active ? 'default' : 'ghost'}
                size="sm"
                className={`${styles.navigationItem} ${item.active ? styles.active : ''}`}
                onClick={() => onNavigate?.(item.id)}
              >
                <span className={styles.navigationIcon}>{item.icon}</span>
                <span className={styles.navigationLabel}>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
