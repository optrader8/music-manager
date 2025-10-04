import React from 'react';
import { Home, BarChart, Music, Library, Settings, Server, Disc, Folder } from 'lucide-react';
import type { NavigationItem } from '../types/index';

export const navigationItems: NavigationItem[] = [
  {
    id: 'folder-albums',
    label: 'Folder Albums',
    icon: <Home />,
    href: '/',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart />,
    href: '/dashboard',
  },
  {
    id: 'server',
    label: 'Server',
    icon: <Server size={24} />,
    href: '/server',
    active: false,
  },
  {
    id: 'statistics',
    label: 'Statistics',
    icon: <BarChart size={24} />,
    href: '/statistics',
    active: false,
  },
  {
    id: 'files',
    label: 'Files',
    icon: <Folder size={24} />,
    href: '/files',
    active: false,
  },
  {
    id: 'albums',
    label: 'DB Albums',
    icon: <Disc size={24} />,
    href: '/albums',
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
