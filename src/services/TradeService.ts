import { conexionBD } from './ConexionBD';
import type {
  TradeCashRow,
  TradePortfolioRow,
  TradeTransactionRow,
  TradeTransactionInsert,
} from '../types/database';

export interface ExecuteBuyParams {
  username: string;
  newCash: number;
  coinId: string;
  symbol: string;
  name: string;
  newAmount: number;
  usdAmount: number;
  cryptoAmount: number;
  priceAtTime: number;
}

export interface ExecuteSellParams {
  username: string;
  newCash: number;
  coinId: string;
  symbol: string;
  name: string;
  newAmount: number;
  usdAmount: number;
  cryptoAmount: number;
  priceAtTime: number;
}

class TradeService {
  async getCash(username: string): Promise<number> {
    const { data, error } = await conexionBD
      .from('trade_cash')
      .select('balance')
      .eq('username', username)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Pick<TradeCashRow, 'balance'> | null)?.balance ?? 10000;
  }

  async getPortfolio(username: string): Promise<TradePortfolioRow[]> {
    const { data, error } = await conexionBD
      .from('trade_portfolio')
      .select('id, username, coin_id, symbol, name, amount, updated_at')
      .eq('username', username);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getTransactions(username: string): Promise<TradeTransactionRow[]> {
    const { data, error } = await conexionBD
      .from('trade_transactions')
      .select('id, username, type, coin_id, symbol, name, usd_amount, crypto_amount, price_at_time, created_at')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async executeBuy(params: ExecuteBuyParams): Promise<void> {
    const { username, newCash, coinId, symbol, name, newAmount, usdAmount, cryptoAmount, priceAtTime } = params;

    const tx: TradeTransactionInsert = {
      username,
      type: 'buy',
      coin_id: coinId,
      symbol,
      name,
      usd_amount: usdAmount,
      crypto_amount: cryptoAmount,
      price_at_time: priceAtTime,
    };

    const [cashErr, portfolioErr, txErr] = await Promise.all([
      conexionBD
        .from('trade_cash')
        .upsert({ username, balance: newCash, updated_at: new Date().toISOString() }, { onConflict: 'username' })
        .then(r => r.error),
      conexionBD
        .from('trade_portfolio')
        .upsert(
          { username, coin_id: coinId, symbol, name, amount: newAmount, updated_at: new Date().toISOString() },
          { onConflict: 'username,coin_id' },
        )
        .then(r => r.error),
      conexionBD
        .from('trade_transactions')
        .insert(tx)
        .then(r => r.error),
    ]);

    const err = cashErr ?? portfolioErr ?? txErr;
    if (err) throw new Error(err.message);
  }

  async executeSell(params: ExecuteSellParams): Promise<void> {
    const { username, newCash, coinId, symbol, name, newAmount, usdAmount, cryptoAmount, priceAtTime } = params;

    const tx: TradeTransactionInsert = {
      username,
      type: 'sell',
      coin_id: coinId,
      symbol,
      name,
      usd_amount: usdAmount,
      crypto_amount: cryptoAmount,
      price_at_time: priceAtTime,
    };

    const portfolioOp = newAmount > 1e-10
      ? conexionBD
        .from('trade_portfolio')
        .upsert(
          { username, coin_id: coinId, symbol, name, amount: newAmount, updated_at: new Date().toISOString() },
          { onConflict: 'username,coin_id' },
        )
        .then(r => r.error)
      : conexionBD
        .from('trade_portfolio')
        .delete()
        .eq('username', username)
        .eq('coin_id', coinId)
        .then(r => r.error);

    const [cashErr, portfolioErr, txErr] = await Promise.all([
      conexionBD
        .from('trade_cash')
        .upsert({ username, balance: newCash, updated_at: new Date().toISOString() }, { onConflict: 'username' })
        .then(r => r.error),
      portfolioOp,
      conexionBD
        .from('trade_transactions')
        .insert(tx)
        .then(r => r.error),
    ]);

    const err = cashErr ?? portfolioErr ?? txErr;
    if (err) throw new Error(err.message);
  }
}

export const tradeService = new TradeService();
