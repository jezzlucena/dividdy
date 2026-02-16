/**
 * Currency Service
 * 
 * Handles currency conversion using exchange rates.
 * Uses a free exchange rate API with caching to minimize API calls.
 */

interface ExchangeRateCache {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// In-memory cache
let rateCache: ExchangeRateCache | null = null;

// Fallback rates (approximate, for when API is unavailable)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.15,
  ARS: 850,
  COP: 3950,
  CLP: 880,
  PEN: 3.72,
  BRL: 4.97,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CNY: 7.24,
  INR: 83.12,
};

export class CurrencyService {
  /**
   * Get exchange rates from base currency to target currencies
   */
  static async getExchangeRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): Promise<Record<string, number>> {
    try {
      const allRates = await this.getAllRates(baseCurrency);
      
      const rates: Record<string, number> = {};
      for (const currency of targetCurrencies) {
        rates[currency] = allRates[currency] || 1;
      }
      
      // Always include base currency
      rates[baseCurrency] = 1;
      
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return this.getFallbackRates(baseCurrency, targetCurrencies);
    }
  }

  /**
   * Get all exchange rates for a base currency
   */
  static async getAllRates(baseCurrency: string): Promise<Record<string, number>> {
    // Check cache
    if (
      rateCache &&
      rateCache.base === baseCurrency &&
      Date.now() - rateCache.timestamp < CACHE_DURATION
    ) {
      return rateCache.rates;
    }

    try {
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      
      // If no API key, use fallback rates
      if (!apiKey || apiKey === 'your_api_key_here') {
        console.log('No exchange rate API key configured, using fallback rates');
        return this.convertFallbackRates(baseCurrency);
      }

      // Fetch from API
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json() as { 
        result: string; 
        'error-type'?: string;
        conversion_rates: Record<string, number>;
      };

      if (data.result !== 'success') {
        throw new Error(data['error-type'] || 'API error');
      }

      // Update cache
      rateCache = {
        rates: data.conversion_rates,
        base: baseCurrency,
        timestamp: Date.now(),
      };

      return data.conversion_rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates from API:', error);
      return this.convertFallbackRates(baseCurrency);
    }
  }

  /**
   * Convert an amount from one currency to another
   */
  static async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getAllRates(fromCurrency);
    const rate = rates[toCurrency] || 1;
    
    return amount * rate;
  }

  /**
   * Get fallback rates when API is unavailable
   */
  private static getFallbackRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): Record<string, number> {
    const converted = this.convertFallbackRates(baseCurrency);
    
    const rates: Record<string, number> = {};
    for (const currency of targetCurrencies) {
      rates[currency] = converted[currency] || 1;
    }
    rates[baseCurrency] = 1;
    
    return rates;
  }

  /**
   * Convert fallback rates to a different base currency
   */
  private static convertFallbackRates(baseCurrency: string): Record<string, number> {
    const baseRate = FALLBACK_RATES[baseCurrency] || 1;
    
    const converted: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
      converted[currency] = rate / baseRate;
    }
    
    return converted;
  }
}
