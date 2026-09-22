// Centralized Currency & Exchange Rate Service
// Canonical Store Currency: INR
// Supported Currencies: INR, USD, EUR, GBP, AED, AUD, CAD, SGD

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', decimals: 0, subUnitMultiplier: 100 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 0, subUnitMultiplier: 100 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 0, subUnitMultiplier: 100 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 0, subUnitMultiplier: 100 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', decimals: 0, subUnitMultiplier: 100 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', decimals: 0, subUnitMultiplier: 100 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', decimals: 0, subUnitMultiplier: 100 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimals: 0, subUnitMultiplier: 100 }
];

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(c => c.code);

// Baseline rates used exclusively for non-transactional catalog browsing if external service is unreachable
const BASELINE_DISPLAY_RATES = {
  INR: 1,
  USD: 0.0118,
  EUR: 0.0108,
  GBP: 0.0093,
  AED: 0.0433,
  AUD: 0.0182,
  CAD: 0.0162,
  SGD: 0.0157
};

// In-memory cache with 1-hour TTL
let ratesCache = {
  rates: { ...BASELINE_DISPLAY_RATES },
  lastFetched: 0,
  isLive: false,
  ttlMs: 60 * 60 * 1000 // 1 hour
};

/**
 * Fetch live exchange rates against base currency INR
 */
export const fetchLiveRates = async (forceRefresh = false) => {
  const now = Date.now();
  // Return valid cache if still within TTL
  if (!forceRefresh && ratesCache.lastFetched > 0 && (now - ratesCache.lastFetched) < ratesCache.ttlMs) {
    return ratesCache;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const filteredRates = { INR: 1 };
        for (const curr of SUPPORTED_CURRENCY_CODES) {
          if (data.rates[curr] && typeof data.rates[curr] === 'number') {
            filteredRates[curr] = data.rates[curr];
          } else {
            filteredRates[curr] = BASELINE_DISPLAY_RATES[curr] || 1;
          }
        }

        ratesCache = {
          rates: filteredRates,
          lastFetched: now,
          isLive: true,
          ttlMs: ratesCache.ttlMs
        };

        return ratesCache;
      }
    }
  } catch (error) {
    console.warn('[CurrencyService] Live exchange-rate fetch failed:', error.message);
  }

  // If cache is expired or was never fetched, mark live as false
  if (ratesCache.lastFetched === 0 || (now - ratesCache.lastFetched) >= ratesCache.ttlMs) {
    ratesCache.isLive = false;
  }

  return ratesCache;
};

/**
 * Check if the exchange rate is verified and fresh for transactions
 */
export const isRateValidForTransaction = async (currency = 'INR') => {
  const code = (currency || 'INR').toUpperCase();
  if (code === 'INR') return true;
  const cache = await fetchLiveRates();
  const now = Date.now();
  return cache.isLive && cache.lastFetched > 0 && (now - cache.lastFetched) < cache.ttlMs;
};

/**
 * Get active exchange rates and supported currencies metadata
 */
export const getCurrencyData = async () => {
  const cache = await fetchLiveRates();
  return {
    success: true,
    baseCurrency: 'INR',
    rates: cache.rates,
    isLive: cache.isLive,
    lastUpdated: new Date(cache.lastFetched || Date.now()).toISOString(),
    currencies: SUPPORTED_CURRENCIES
  };
};

/**
 * Get exchange rate for a target currency (from base INR).
 * When `forTransaction` is true, NEVER uses arbitrary fallbacks; throws if rate is unverified.
 */
export const getExchangeRate = async (targetCurrency = 'INR', { forTransaction = false } = {}) => {
  const code = (targetCurrency || 'INR').toUpperCase();
  if (code === 'INR' || !SUPPORTED_CURRENCY_CODES.includes(code)) {
    return 1;
  }

  const cache = await fetchLiveRates();
  const now = Date.now();
  const isFresh = cache.isLive && cache.lastFetched > 0 && (now - cache.lastFetched) < cache.ttlMs;

  if (forTransaction && !isFresh) {
    throw new Error(`Exchange rate for ${code} is currently unverified. International payment cannot proceed.`);
  }

  return cache.rates[code] || BASELINE_DISPLAY_RATES[code] || 1;
};

/**
 * Authoritatively convert canonical INR amount to target currency amount.
 * When `forTransaction` is true, refuses to charge based on unverified/stale fallback rates.
 */
export const convertFromINR = async (amountINR, targetCurrency = 'INR', { forTransaction = false } = {}) => {
  const code = (targetCurrency || 'INR').toUpperCase();
  if (code === 'INR' || !SUPPORTED_CURRENCY_CODES.includes(code)) {
    return Math.round(Number(amountINR) || 0);
  }

  const rate = await getExchangeRate(code, { forTransaction });
  const rawConverted = (Number(amountINR) || 0) * rate;
  
  // Round to whole integer to match luxury pricing conventions (e.g. $1,480, €1,260)
  return Math.round(rawConverted);
};
