import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Menu } from 'lucide-react';
import { Button } from '../ui2/Button';
import styles from './Header.module.scss';
import type { HeaderProps } from '../../types';

interface ExtendedHeaderProps extends HeaderProps {
  onToggleSidebar?: () => void;
  isAuthenticated?: boolean;
}

export const Header: React.FC<ExtendedHeaderProps> = ({
  user,
  onSignIn,
  onSignOut,
  onToggleSidebar,
  isAuthenticated = false,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {/* Mobile Menu Button */}
        {isAuthenticated && (
          <button
            className={styles.menuButton}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        )}

        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className={styles.logoText}>Music Manager</h2>
        </div>
      </div>

      <div className={styles.navigation}>
        {!user && (
          <NavigationMenu.Root className={styles.navigationRoot}>
            <NavigationMenu.List className={styles.navigationList}>
              <NavigationMenu.Item>
                <NavigationMenu.Link className={styles.navigationLink} href="#">
                  Features
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link className={styles.navigationLink} href="#">
                  Pricing
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link className={styles.navigationLink} href="#">
                  Support
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu.Root>
        )}

        {user ? (
          <Button variant="secondary" size="sm" onClick={onSignOut}>
            Sign Out
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onSignIn}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
