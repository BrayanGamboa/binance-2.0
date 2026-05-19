import { useMarketData } from '../hooks/useMarketData';
import { CryptoTable } from '../components/market/CryptoTable';
import { Spinner } from '../components/common/Spinner';
import type { Coin } from '../types/crypto';
import './DashboardPage.css';

function fmtLarge(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n >= 1 ? 2 : 6,
    maximumFractionDigits: n >= 1 ? 2 : 6,
  }).format(n);
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`stat_card ${accent ? 'stat_card_accent' : ''}`}>
      <p className="stat_card_label">{label}</p>
      <p className="stat_card_value">{value}</p>
      {sub && <p className="stat_card_sub">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { coins, loading, error, lastUpdated } = useMarketData({ perPage: 10 });

  const btc = coins.find((c: Coin) => c.id === 'bitcoin');
  const eth = coins.find((c: Coin) => c.id === 'ethereum');
  const totalCap = coins.reduce((acc, c) => acc + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((acc, c) => acc + (c.total_volume || 0), 0);

  return (
    <div className="dashboard">
      <div className="page_header">
        <div>
          <h2 className="page_title">Dashboard</h2>
          <p className="page_subtitle">Resumen del mercado de criptomonedas</p>
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

      {!loading && !error && (
        <div className="stats_grid">
          <StatCard
            label="Bitcoin"
            value={fmtPrice(btc?.current_price)}
            sub={`${btc?.price_change_percentage_24h?.toFixed(2) ?? '—'}% (24h)`}
            accent
          />
          <StatCard
            label="Ethereum"
            value={fmtPrice(eth?.current_price)}
            sub={`${eth?.price_change_percentage_24h?.toFixed(2) ?? '—'}% (24h)`}
          />
          <StatCard
            label="Cap. de Mercado (Top 10)"
            value={fmtLarge(totalCap)}
            sub="Suma de los 10 principales"
          />
          <StatCard
            label="Volumen 24h (Top 10)"
            value={fmtLarge(totalVol)}
            sub="Suma de los 10 principales"
          />
        </div>
      )}

      <section className="dashboard_section">
        <h3 className="section_title">Top 10 Criptomonedas</h3>

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
          <CryptoTable coins={coins} compact />
        )}
      </section>
    </div>
  );
}
