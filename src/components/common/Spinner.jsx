import "./Spinner.css";

/**
 * @param {string} size  — 'sm' | 'md' (default) | 'lg'
 * @param {string} label — accessible label
 */
export function Spinner({ size = "md", label = "Cargando..." }) {
  return (
    <div className={`spinner spinner_${size}`} role="status" aria-label={label}>
      <div className="spinner_ring" />
    </div>
  );
}
