import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoService } from '../services/CryptoService';
import type { Coin, GetMarketsOptions } from '../types/crypto';

const REFRESH_INTERVAL = 600000;

interface UseMarketDataReturn {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

function useMarketData(options: GetMarketsOptions = {}): UseMarketDataReturn {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Las opciones cambian en cada render, se serializa para estabilizar la referencia
  const optionsKey = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    try {
      const data = await cryptoService.getMarkets(JSON.parse(optionsKey) as GetMarketsOptions);
      setCoins(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { coins, loading, error, lastUpdated, refresh: fetchData };
}

export { useMarketData };