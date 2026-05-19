import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: '▦', label: 'Dashboard' },
  { to: '/market', icon: '◈', label: 'Mercado' },
  { to: '/profile', icon: '◉', label: 'Perfil' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar_nav" aria-label="Menú lateral">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className="sidebar_link">
            <span className="sidebar_icon" aria-hidden="true">
              {icon}
            </span>
            <span className="sidebar_label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar_footer">
        <p className="sidebar_version">v2.0</p>
      </div>
    </aside>
  );
}
