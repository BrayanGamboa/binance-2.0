import { ApiService } from './ApiService';
import type { Coin, GetMarketsOptions } from '../types/crypto';

// Integración con la API de CoinGecko: https://www.coingecko.com/api/documentation
class CryptoService extends ApiService {
  constructor() {
    super('https://api.coingecko.com/api/v3');
  }

  getMarkets({ vsCurrency = 'usd', perPage = 20, page = 1 }: GetMarketsOptions = {}): Promise<Coin[]> {
    return this.get<Coin[]>('/coins/markets', {
      vs_currency: vsCurrency,
      order: 'market_cap_desc',
      per_page: perPage,
      page,
      sparkline: false,
      price_change_percentage: '24h',
    });
  }

  getGlobalStats(): Promise<unknown> {
    return this.get('/global');
  }

  getTrending(): Promise<unknown> {
    return this.get('/search/trending');
  }

  getCoinDetail(id: string): Promise<unknown> {
    return this.get(`/coins/${id}`, {
      localization: false,
      tickers: false,
      community_data: false,
      developer_data: false,
    });
  }
}

export const cryptoService = new CryptoService();
