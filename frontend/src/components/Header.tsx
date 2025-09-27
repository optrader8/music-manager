import { Link, NavLink } from 'react-router-dom';

import { useAuthContext } from '../context/AuthContext';

const navItems = [
  { to: '/', label: '대시보드' },
  { to: '/library', label: '라이브러리' },
  { to: '/playlists', label: '플레이리스트' },
  { to: '/metadata', label: '메타데이터' },
];

export function Header(): JSX.Element {
  const { user } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link className="app-logo" to="/">
          Music Manager
        </Link>
        <nav className="app-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="app-header__right">
        {user ? (
          <div className="user-menu">
            <div className="user-meta">
              <span className="user-name">{user.displayName}</span>
              <span className="user-role">{ability.isAdmin ? '관리자' : '사용자'}</span>
            </div>
            <button type="button" className="ghost-button" onClick={handleSignOut}>
              로그아웃
            </button>
          </div>
        ) : (
          <Link to="/login" className="ghost-button">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
