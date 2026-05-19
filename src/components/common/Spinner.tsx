import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label = 'Cargando...' }: SpinnerProps) {
  return (
    <div className={`spinner spinner_${size}`} role="status" aria-label={label}>
      <div className="spinner_ring" />
    </div>
  );
}
