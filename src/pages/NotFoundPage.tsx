import { Link } from 'react-router-dom';
import '../pages/NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="not_found">
      <span className="not_found_code">404</span>
      <h1 className="not_found_title">Página no encontrada</h1>
      <p className="not_found_text">
        La ruta que buscas no existe o fue movida. Por favor verifica la URL o regresa al dashboard.
      </p>
      <Link to="/dashboard" className="not_found_btn">
        Volver al Dashboard
      </Link>
    </div>
  );
}
