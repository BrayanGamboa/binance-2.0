import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import './Header.css';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header_brand">
        <span className="header_logo" aria-hidden="true">₿</span>
        <span className="header_name">Binance 2.0</span>
      </div>

      <nav className="header_nav" aria-label="Navegación principal">
        <NavLink to="/dashboard" className="header_link">Dashboard</NavLink>
        <NavLink to="/market" className="header_link">Mercado</NavLink>
      </nav>

      <div className="header_actions">
        <ThemeToggle />
        <div className="header_user">
          <span className="header_username">{user?.username}</span>
          <button className="header_logout btn_ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
