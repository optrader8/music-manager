import React from 'react';
import { Home, BarChart, Music, Library, Settings } from 'lucide-react';
import type { NavigationItem } from '../types';

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home />,
    href: '/',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: <BarChart size={24} />,
    href: '/statistics',
    active: false,
  },
  {
    id: 'music',
    label: 'MusicList',
    icon: <Music size={24} />,
    href: '/music/list',
    active: false,
  },
  {
    id: 'playlists',
    label: 'Playlists',
    icon: <Library size={24} />,
    href: '/playlists',
    active: false,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={24} />,
    href: '/settings',
    active: false,
  },
];
