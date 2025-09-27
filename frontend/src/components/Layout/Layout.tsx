import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import cn from 'classnames';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { PlayerControls } from '@/components/AudioPlayer/PlayerControls';
import { PlayerQueue } from '@/components/AudioPlayer/PlayerQueue';
import { AudioPlayerProvider, useAudioPlayer } from '@/context/AudioPlayerContext';
import { navigationItems } from '@/constants/navigation';
import styles from './Layout.module.scss';
// Removed TanStack Router types

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
};

type ValidRoutes = string;

interface LayoutProps {
  children: ReactNode;
}

// Inner component that can access AudioPlayer context
const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  // 개발환경에서는 항상 인증된 상태로 처리
  const user = { id: 'dev-user', email: 'dev@test.com', name: 'Dev User' };
  const isAuthenticated = true;

  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 992px)');

  // Get audio player state
  const { currentTrack } = useAudioPlayer();

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSignIn = () => {
    navigate('/');
  };

  const handleSignOut = () => {
    // 개발환경에서는 로그아웃 기능 비활성화
    console.log('Dev mode: logout disabled');
    navigate('/');
  };

  const handleNavigate = (itemId: string) => {
    const routes: Record<string, ValidRoutes> = {
      home: '/',
      dashboard: '/dashboard',
      server: '/server',
      statistics: '/statistics',
      music: '/music/list',
      playlists: '/playlists',
      settings: '/settings',
    };

    const route = routes[itemId];
    if (route) {
      navigate(route);
    }
  };

  // Update navigation items with active state
  const updatedNavigationItems = navigationItems.map((item) => ({
    ...item,
    active: location.pathname === (item.href || '/'),
  }));

  const sidebarContent = (
    <Sidebar
      navigationItems={updatedNavigationItems}
      onNavigate={(itemId) => {
        handleNavigate(itemId);
        if (isMobile) {
          setIsSidebarVisible(false);
        }
      }}
    />
  );

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Header
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onToggleSidebar={toggleSidebar}
          isAuthenticated={isAuthenticated}
        />
        <div className={styles.mainContent}>
          {isAuthenticated && (
            <>
              {isMobile ? (
                <>
                  <div
                    className={cn(styles.mobileSidebarContainer, {
                      [styles.visible]: isSidebarVisible,
                    })}
                  >
                    {sidebarContent}
                  </div>
                  <div
                    className={cn(styles.overlay, {
                      [styles.visible]: isSidebarVisible,
                    })}
                    onClick={toggleSidebar}
                  />
                </>
              ) : (
                <div
                  className={cn(styles.sidebarContainer, {
                    [styles.hidden]: !isSidebarVisible,
                  })}
                >
                  {sidebarContent}
                </div>
              )}
            </>
          )}
          <div className={styles.content}>{children}</div>
        </div>

        {/* Persistent Audio Player - only show when there's a current track */}
        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <PlayerControls
              onToggleQueue={() => setIsQueueOpen(true)}
              showQueue={true}
              showVolume={true}
            />
          </div>
        )}

        {/* Player Queue Modal */}
        {currentTrack && <PlayerQueue isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />}
      </div>
    </div>
  );
};

// Main Layout component with AudioPlayerProvider wrapper
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <AudioPlayerProvider>
      <LayoutContent>{children}</LayoutContent>
    </AudioPlayerProvider>
  );
};
