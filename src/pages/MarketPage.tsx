import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { CryptoTable } from '../components/market/CryptoTable';
import { Spinner } from '../components/common/Spinner';
import './MarketPage.css';

interface Currency {
  value: string;
  label: string;
}

const CURRENCIES: Currency[] = [
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (€)' },
  { value: 'btc', label: 'BTC (₿)' },
];

export function MarketPage() {
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [perPage] = useState(20);

  const { coins, loading, error, lastUpdated, refresh } = useMarketData({
    vsCurrency: currency,
    perPage,
  });

  const filtered = coins.filter(
    c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="market_page">
      <div className="page_header">
        <div className='width_full'>
          <h2 className="page_title">Mercado</h2>
          <p className="page_subtitle">
            Top {perPage} monedas · Se actualiza cada 5 s
          </p>
        </div>
        <div className="refresh_info">
          <span className="refresh_dot" aria-hidden="true" />
          <span className="refresh_text">
            {lastUpdated
              ? `Actualizado ${lastUpdated.toLocaleTimeString('es-CR')}`
              : 'Actualizando...'}
          </span>
        </div>
      </div>

      <div className="market_controls">
        <input
          type="search"
          className="market_search"
          placeholder="Buscar moneda..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Buscar moneda"
        />

        <select
          className="market_select"
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          aria-label="Moneda de cotización"
        >
          {CURRENCIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <button
          className="market_refresh_btn"
          onClick={refresh}
          disabled={loading}
          aria-label="Actualizar ahora"
        >
          ↻ Actualizar
        </button>
      </div>

      {loading && (
        <div className="centered">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="error_box" role="alert">
          <strong>Error al cargar datos:</strong> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {search && (
            <p className="market_results">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para&nbsp;
              <strong>"{search}"</strong>
            </p>
          )}
          <CryptoTable coins={filtered} />
        </>
      )}
    </div>
  );
}
