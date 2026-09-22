import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  BASELINE_FALLBACK_RATES,
  convertPrice as utilConvertPrice,
  formatCurrencyAmount,
  formatPrice as utilFormatPrice
} from '../utils/currencyUtils';
import { currencyAPI } from '../services/api';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Persist selected currency using key 'selectedCurrency'
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedCurrency');
      if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved.toUpperCase())) {
        return saved.toUpperCase();
      }
    } catch (_) {}
    return DEFAULT_CURRENCY;
  });

  const [rates, setRates] = useState(BASELINE_FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);
  const [isFallbackINR, setIsFallbackINR] = useState(false);

  // Fetch live exchange rates from backend
  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const res = await currencyAPI.getRates();
        if (isMounted && res && res.success && res.rates) {
          setRates(res.rates);
          setIsFallbackINR(false);
          setRatesError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Currency] Live rates unavailable, continuing with store rates:', err.message);
          setRatesError('Currency conversion temporarily unavailable. Prices are currently shown in INR.');
          // If rates completely failed, fallback
          setRates(BASELINE_FALLBACK_RATES);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRates();
    return () => { isMounted = false; };
  }, []);

  // Update selected currency and persist
  const setCurrency = useCallback((newCurrency) => {
    const code = (newCurrency || DEFAULT_CURRENCY).toUpperCase();
    const found = SUPPORTED_CURRENCIES.find(c => c.code === code);
    const validCode = found ? found.code : DEFAULT_CURRENCY;
    setCurrencyState(validCode);
    try {
      localStorage.setItem('selectedCurrency', validCode);
    } catch (_) {}
  }, []);

  // Formatter for any INR base price into currently selected or target currency
  const formatPrice = useCallback((amountINR, target = currency) => {
    if (isFallbackINR) {
      return utilFormatPrice(amountINR, 'INR', rates);
    }
    return utilFormatPrice(amountINR, target, rates);
  }, [currency, rates, isFallbackINR]);

  // Numeric converter for any INR base price into currently selected or target currency
  const convertPrice = useCallback((amountINR, target = currency) => {
    if (isFallbackINR) {
      return utilConvertPrice(amountINR, 'INR', rates);
    }
    return utilConvertPrice(amountINR, target, rates);
  }, [currency, rates, isFallbackINR]);

  const currentCurrencyMeta = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
  const exchangeRate = rates[currency] || 1;

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        currentCurrencyMeta,
        exchangeRate,
        formatPrice,
        convertPrice,
        formatCurrencyAmount,
        isLoading,
        ratesError,
        isFallbackINR
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
