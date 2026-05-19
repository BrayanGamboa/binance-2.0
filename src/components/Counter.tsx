import { useState } from 'react';
import './Counter.css';

interface CounterProps {
  initial?: number;
  step?: number;
}

function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial);

  return (
    <section className="counter_card">
      <h3>Contador interactivo</h3>
      <p className="counter_value">{count}</p>
      <div className="counter_buttons">
        <button onClick={() => setCount((prev) => prev - step)} aria-label="Disminuir">
          -
        </button>
        <button onClick={() => setCount((prev) => prev + step)} aria-label="Aumentar">
          +
        </button>
        <button className="secondary" onClick={() => setCount(initial)} aria-label="Reiniciar">
          Reiniciar
        </button>
      </div>
    </section>
  );
}

export default Counter;
