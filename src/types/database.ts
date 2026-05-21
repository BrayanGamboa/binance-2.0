export interface Database {
  public: {
    Tables: {
      trade_cash: {
        Row: {
          username: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          username: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          username?: string;
          balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      trade_portfolio: {
        Row: {
          id: string;
          username: string;
          coin_id: string;
          symbol: string;
          name: string;
          amount: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          coin_id: string;
          symbol: string;
          name: string;
          amount: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          coin_id?: string;
          symbol?: string;
          name?: string;
          amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      trade_transactions: {
        Row: {
          id: string;
          username: string;
          type: 'buy' | 'sell';
          coin_id: string;
          symbol: string;
          name: string;
          usd_amount: number;
          crypto_amount: number;
          price_at_time: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          type: 'buy' | 'sell';
          coin_id: string;
          symbol: string;
          name: string;
          usd_amount: number;
          crypto_amount: number;
          price_at_time: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          type?: 'buy' | 'sell';
          coin_id?: string;
          symbol?: string;
          name?: string;
          usd_amount?: number;
          crypto_amount?: number;
          price_at_time?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helpers para acceder fácilmente a los tipos de cada tabla
export type TradeCashRow = Database['public']['Tables']['trade_cash']['Row'];
export type TradePortfolioRow = Database['public']['Tables']['trade_portfolio']['Row'];
export type TradeTransactionRow = Database['public']['Tables']['trade_transactions']['Row'];

export type TradeCashInsert = Database['public']['Tables']['trade_cash']['Insert'];
export type TradePortfolioInsert = Database['public']['Tables']['trade_portfolio']['Insert'];
export type TradeTransactionInsert = Database['public']['Tables']['trade_transactions']['Insert'];
