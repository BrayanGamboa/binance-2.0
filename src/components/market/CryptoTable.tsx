import type { Coin } from '../../types/crypto';
import './CryptoTable.css';

function fmt(n: number | null | undefined, opts: Intl.NumberFormatOptions = {}): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CR', opts).format(n);
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return fmt(n, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n >= 1 ? 2 : 6,
    maximumFractionDigits: n >= 1 ? 2 : 6,
  });
}

function fmtLarge(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return fmtPrice(n);
}

function PctBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="pct pct_neutral">—</span>;
  const isUp = value >= 0;
  return (
    <span className={`pct ${isUp ? 'pct_up' : 'pct_down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

interface CryptoTableProps {
  coins?: Coin[];
  compact?: boolean;
}

export function CryptoTable({ coins = [], compact = false }: CryptoTableProps) {
  if (!coins.length) {
    return <p className="table_empty">No hay datos disponibles.</p>;
  }

  return (
    <div className="crypto_table_wrap">
      <table className="crypto_table">
        <thead>
          <tr>
            <th className="col_rank">#</th>
            <th className="col_name">Nombre</th>
            <th className="col_price">Precio</th>
            <th className="col_pct">24 h %</th>
            {!compact && <th className="col_cap">Cap. Mercado</th>}
            {!compact && <th className="col_vol">Volumen 24 h</th>}
          </tr>
        </thead>
        <tbody>
          {coins.map(coin => (
            <tr key={coin.id} className="crypto_row">
              <td className="col_rank text_muted">{coin.market_cap_rank}</td>
              <td className="col_name">
                <div className="coin_name">
                  <img
                    src={coin.image}
                    alt={coin.name}
                    width={24}
                    height={24}
                    loading="lazy"
                    className="coin_icon"
                  />
                  <span className="coin_fullname">{coin.name}</span>
                  <span className="coin_symbol">{coin.symbol?.toUpperCase()}</span>
                </div>
              </td>
              <td className="col_price font_mono">{fmtPrice(coin.current_price)}</td>
              <td className="col_pct">
                <PctBadge value={coin.price_change_percentage_24h} />
              </td>
              {!compact && (
                <td className="col_cap text_secondary font_mono">
                  {fmtLarge(coin.market_cap)}
                </td>
              )}
              {!compact && (
                <td className="col_vol text_secondary font_mono">
                  {fmtLarge(coin.total_volume)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
