import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { Spinner } from '../components/common/Spinner';
import { tradeService } from '../services/TradeService';
import { useAuth } from '../contexts/AuthContext';
import type { Coin } from '../types/crypto';
import './TradePage.css';

type OperationType = 'buy' | 'sell';

interface PortfolioEntry {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
}

interface Transaction {
  id: string;
  type: OperationType;
  coinId: string;
  symbol: string;
  name: string;
  usdAmount: number;
  cryptoAmount: number;
  priceAtTime: number;
  timestamp: Date;
}

const INITIAL_CASH = 10000;

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtCrypto(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function TradePage() {
  const { user } = useAuth();
  const username = user?.username ?? '';

  const { coins, loading, error } = useMarketData({ perPage: 50 });

  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [operation, setOperation] = useState<OperationType>('buy');
  const [usdInput, setUsdInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  const [cash, setCash] = useState<number>(INITIAL_CASH);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);

  // ── Carga inicial desde Supabase ────────────────────────────────────────────
  const loadUserData = useCallback(async () => {
    if (!username) return;
    setDbLoading(true);
    try {
      const [cashBalance, portfolioRows, transactionRows] = await Promise.all([
        tradeService.getCash(username),
        tradeService.getPortfolio(username),
        tradeService.getTransactions(username),
      ]);

      setCash(cashBalance);

      setPortfolio(
        portfolioRows.map(r => ({
          coinId: r.coin_id,
          symbol: r.symbol,
          name: r.name,
          amount: r.amount,
        })),
      );

      setHistory(
        transactionRows.map(r => ({
          id: r.id,
          type: r.type,
          coinId: r.coin_id,
          symbol: r.symbol,
          name: r.name,
          usdAmount: r.usd_amount,
          cryptoAmount: r.crypto_amount,
          priceAtTime: r.price_at_time,
          timestamp: new Date(r.created_at),
        })),
      );
    } catch {
      setFeedback({ type: 'error', msg: 'Error al cargar los datos del usuario.' });
    } finally {
      setDbLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const selectedCoin: Coin | undefined = useMemo(
    () => coins.find(c => c.id === selectedCoinId),
    [coins, selectedCoinId],
  );

  const usdAmount = parseFloat(usdInput) || 0;
  const cryptoAmount =
    selectedCoin && selectedCoin.current_price > 0 ? usdAmount / selectedCoin.current_price : 0;

  const portfolioEntry = portfolio.find(p => p.coinId === selectedCoinId);
  const ownedCryptoValue = portfolioEntry && selectedCoin
    ? portfolioEntry.amount * selectedCoin.current_price
    : 0;

  // ── Ejecutar operación ──────────────────────────────────────────────────────
  async function handleExecute() {
    if (!selectedCoin) {
      setFeedback({ type: 'error', msg: 'Selecciona una criptomoneda.' });
      return;
    }
    if (usdAmount <= 0) {
      setFeedback({ type: 'error', msg: 'Ingresa un monto válido en USD.' });
      return;
    }

    setExecuting(true);
    try {
      if (operation === 'buy') {
        if (usdAmount > cash) {
          setFeedback({ type: 'error', msg: 'Fondos insuficientes en cash.' });
          return;
        }

        const newCash = cash - usdAmount;
        const existing = portfolio.find(p => p.coinId === selectedCoinId);
        const newAmount = (existing?.amount ?? 0) + cryptoAmount;

        try {
          await tradeService.executeBuy({
            username,
            newCash,
            coinId: selectedCoin.id,
            symbol: selectedCoin.symbol,
            name: selectedCoin.name,
            newAmount,
            usdAmount,
            cryptoAmount,
            priceAtTime: selectedCoin.current_price,
          });
        } catch {
          setFeedback({ type: 'error', msg: 'Error al guardar en la base de datos.' });
          return;
        }

        const newPortfolio = existing
          ? portfolio.map(p => p.coinId === selectedCoinId ? { ...p, amount: newAmount } : p)
          : [...portfolio, { coinId: selectedCoin.id, symbol: selectedCoin.symbol, name: selectedCoin.name, amount: newAmount }];

        const newTx: Transaction = {
          id: crypto.randomUUID(),
          type: 'buy',
          coinId: selectedCoin.id,
          symbol: selectedCoin.symbol,
          name: selectedCoin.name,
          usdAmount,
          cryptoAmount,
          priceAtTime: selectedCoin.current_price,
          timestamp: new Date(),
        };

        setCash(newCash);
        setPortfolio(newPortfolio);
        setHistory(prev => [newTx, ...prev]);
        setFeedback({ type: 'success', msg: `Compraste ${fmtCrypto(cryptoAmount)} ${selectedCoin.symbol.toUpperCase()} por ${fmtUSD(usdAmount)}.` });

      } else {
        if (!portfolioEntry || portfolioEntry.amount < cryptoAmount) {
          setFeedback({ type: 'error', msg: 'No tienes suficientes fondos de esta moneda para vender.' });
          return;
        }

        const newCash = cash + usdAmount;
        const newAmount = portfolioEntry.amount - cryptoAmount;

        try {
          await tradeService.executeSell({
            username,
            newCash,
            coinId: selectedCoin.id,
            symbol: selectedCoin.symbol,
            name: selectedCoin.name,
            newAmount,
            usdAmount,
            cryptoAmount,
            priceAtTime: selectedCoin.current_price,
          });
        } catch {
          setFeedback({ type: 'error', msg: 'Error al guardar en la base de datos.' });
          return;
        }

        const newPortfolio = newAmount > 1e-10
          ? portfolio.map(p => p.coinId === selectedCoinId ? { ...p, amount: newAmount } : p)
          : portfolio.filter(p => p.coinId !== selectedCoinId);

        const newTx: Transaction = {
          id: crypto.randomUUID(),
          type: 'sell',
          coinId: selectedCoin.id,
          symbol: selectedCoin.symbol,
          name: selectedCoin.name,
          usdAmount,
          cryptoAmount,
          priceAtTime: selectedCoin.current_price,
          timestamp: new Date(),
        };

        setCash(newCash);
        setPortfolio(newPortfolio);
        setHistory(prev => [newTx, ...prev]);
        setFeedback({ type: 'success', msg: `Vendiste ${fmtCrypto(cryptoAmount)} ${selectedCoin.symbol.toUpperCase()} por ${fmtUSD(usdAmount)}.` });
      }

      setUsdInput('');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setExecuting(false);
    }
  }

  const totalPortfolioValue = portfolio.reduce((acc, entry) => {
    const coin = coins.find(c => c.id === entry.coinId);
    return acc + (coin ? entry.amount * coin.current_price : 0);
  }, 0);

  return (
    <div className="trade_page">
      <div className="page_header">
        <div className="width_full">
          <h2 className="page_title">Trading</h2>
          <p className="page_subtitle">Compra y vende criptomonedas con tu balance virtual</p>
        </div>
      </div>

      {dbLoading ? (
        <div className="trade_spinner">
          <Spinner size="lg" />
          <span>Cargando datos...</span>
        </div>
      ) : (
        <>
          <div className="trade_layout">
            {/* Panel izquierdo: operación */}
            <section className="trade_panel">
              <h3 className="trade_panel_title">Operar Mercado</h3>

              {loading && (
                <div className="trade_spinner">
                  <Spinner size="sm" />
                  <span>Cargando precios...</span>
                </div>
              )}
              {error && <p className="trade_error">Error al cargar datos: {error}</p>}

              {!loading && !error && (
                <>
                  <div className="trade_field">
                    <label htmlFor="coin_select" className="trade_label">Criptomoneda</label>
                    <select
                      id="coin_select"
                      className="trade_select"
                      value={selectedCoinId}
                      onChange={e => { setSelectedCoinId(e.target.value); setFeedback(null); }}
                    >
                      <option value="">— Selecciona una moneda —</option>
                      {coins.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.symbol.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCoin && (
                    <div className="trade_price_info">
                      <img
                        src={selectedCoin.image}
                        alt={selectedCoin.name}
                        width={28}
                        height={28}
                        className="trade_coin_icon"
                      />
                      <div>
                        <p className="trade_price_label">Precio actual</p>
                        <p className="trade_price_value">{fmtUSD(selectedCoin.current_price)}</p>
                      </div>
                      <div>
                        <p className="trade_price_label">Tu saldo ({selectedCoin.symbol.toUpperCase()})</p>
                        <p className="trade_price_value">
                          {fmtCrypto(portfolioEntry?.amount ?? 0)}
                          <span className="trade_price_sub"> ≈ {fmtUSD(ownedCryptoValue)}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="trade_field">
                    <label className="trade_label">Tipo de Operación</label>
                    <div className="trade_op_toggle">
                      <button
                        className={`trade_op_btn trade_op_buy${operation === 'buy' ? ' active' : ''}`}
                        onClick={() => { setOperation('buy'); setFeedback(null); }}
                        type="button"
                      >
                        Comprar
                      </button>
                      <button
                        className={`trade_op_btn trade_op_sell${operation === 'sell' ? ' active' : ''}`}
                        onClick={() => { setOperation('sell'); setFeedback(null); }}
                        type="button"
                      >
                        Vender
                      </button>
                    </div>
                  </div>

                  <div className="trade_field">
                    <label htmlFor="usd_input" className="trade_label">
                      Monto en USD {operation === 'sell' && selectedCoin && (
                        <span className="trade_label_hint">
                          (máx. {fmtUSD(ownedCryptoValue)})
                        </span>
                      )}
                    </label>
                    <input
                      id="usd_input"
                      type="number"
                      min="0"
                      step="0.01"
                      className="trade_input"
                      placeholder="0.00"
                      value={usdInput}
                      onChange={e => { setUsdInput(e.target.value); setFeedback(null); }}
                    />
                  </div>

                  {usdAmount > 0 && selectedCoin && (
                    <div className="trade_preview">
                      <span className="trade_preview_label">Recibirás</span>
                      <span className="trade_preview_value">
                        {fmtCrypto(cryptoAmount)} {selectedCoin.symbol.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {feedback && (
                    <div className={`trade_feedback trade_feedback_${feedback.type}`} role="alert">
                      {feedback.msg}
                    </div>
                  )}

                  <button
                    className="trade_execute_btn"
                    onClick={() => { void handleExecute(); }}
                    disabled={!selectedCoinId || usdAmount <= 0 || executing}
                    type="button"
                  >
                    {executing ? 'Procesando...' : 'Ejecutar Operación'}
                  </button>
                </>
              )}
            </section>

            {/* Panel derecho: resumen y portafolio */}
            <aside className="trade_sidebar">
              <section className="trade_balance_card">
                <p className="trade_balance_label">Cash disponible</p>
                <p className="trade_balance_cash">{fmtUSD(cash)}</p>
                <p className="trade_balance_label" style={{ marginTop: '0.75rem' }}>
                  Valor del portafolio
                </p>
                <p className="trade_balance_portfolio">{fmtUSD(totalPortfolioValue)}</p>
                <hr className="trade_divider" />
                <p className="trade_balance_label">Valor total</p>
                <p className="trade_balance_total">{fmtUSD(cash + totalPortfolioValue)}</p>
              </section>

              {portfolio.length > 0 && (
                <section className="trade_holdings">
                  <h4 className="trade_holdings_title">Mis Activos</h4>
                  <ul className="trade_holdings_list">
                    {portfolio.map(entry => {
                      const coin = coins.find(c => c.id === entry.coinId);
                      return (
                        <li key={entry.coinId} className="trade_holding_item">
                          {coin && (
                            <img src={coin.image} alt={coin.name} width={20} height={20} className="trade_coin_icon" />
                          )}
                          <span className="trade_holding_name">{entry.name}</span>
                          <span className="trade_holding_amount font_mono">
                            {fmtCrypto(entry.amount)} {entry.symbol.toUpperCase()}
                          </span>
                          {coin && (
                            <span className="trade_holding_value text_muted">
                              {fmtUSD(entry.amount * coin.current_price)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </aside>
          </div>

          {/* Historial de transacciones */}
          {history.length > 0 && (
            <section className="trade_history">
              <h3 className="trade_history_title">Historial de Transacciones</h3>
              <div className="trade_history_wrap">
                <table className="trade_history_table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Moneda</th>
                      <th>Cantidad</th>
                      <th>USD</th>
                      <th>Precio</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(tx => (
                      <tr key={tx.id} className={`trade_tx_row trade_tx_${tx.type}`}>
                        <td>
                          <span className={`trade_tx_badge trade_tx_badge_${tx.type}`}>
                            {tx.type === 'buy' ? 'Compra' : 'Venta'}
                          </span>
                        </td>
                        <td className="trade_tx_coin">
                          {tx.name}
                          <span className="coin_symbol"> {tx.symbol.toUpperCase()}</span>
                        </td>
                        <td className="font_mono">{fmtCrypto(tx.cryptoAmount)}</td>
                        <td className="font_mono">{fmtUSD(tx.usdAmount)}</td>
                        <td className="font_mono text_muted">{fmtUSD(tx.priceAtTime)}</td>
                        <td className="text_muted">
                          {tx.timestamp.toLocaleDateString('es-CR')}{' '}
                          {tx.timestamp.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
