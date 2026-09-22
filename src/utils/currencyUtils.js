// Centralized Currency & Exchange Rate Utilities
// Brand: House of Loom & Craft
// Canonical Store Currency: INR

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG' }
];

export const DEFAULT_CURRENCY = 'INR';

export const BASELINE_FALLBACK_RATES = {
  INR: 1,
  USD: 0.0118,
  EUR: 0.0108,
  GBP: 0.0093,
  AED: 0.0433,
  AUD: 0.0182,
  CAD: 0.0162,
  SGD: 0.0157
};

/**
 * Convert a base INR price to the target currency amount
 */
export function convertPrice(amountINR, targetCurrency = 'INR', rates = BASELINE_FALLBACK_RATES) {
  const numericAmount = Number(amountINR) || 0;
  const code = (targetCurrency || 'INR').toUpperCase();

  if (code === 'INR') {
    return Math.round(numericAmount);
  }

  const rate = rates && typeof rates[code] === 'number' ? rates[code] : (BASELINE_FALLBACK_RATES[code] || 1);
  return Math.round(numericAmount * rate);
}

/**
 * Format a converted numeric amount into its proper luxury currency representation
 */
export function formatCurrencyAmount(amount, currencyCode = 'INR') {
  const code = (currencyCode || 'INR').toUpperCase();
  const numericAmount = Number(amount) || 0;

  switch (code) {
    case 'INR':
      return `₹${numericAmount.toLocaleString('en-IN')}`;
    case 'USD':
      return `$${numericAmount.toLocaleString('en-US')}`;
    case 'EUR':
      return `€${numericAmount.toLocaleString('en-IE')}`;
    case 'GBP':
      return `£${numericAmount.toLocaleString('en-GB')}`;
    case 'AED':
      return `د.إ${numericAmount.toLocaleString('en-US')}`;
    case 'AUD':
      return `A$${numericAmount.toLocaleString('en-AU')}`;
    case 'CAD':
      return `C$${numericAmount.toLocaleString('en-CA')}`;
    case 'SGD':
      return `S$${numericAmount.toLocaleString('en-SG')}`;
    default:
      return `${code} ${numericAmount.toLocaleString('en-US')}`;
  }
}

/**
 * Format a base INR amount directly into the target currency display string
 */
export function formatPrice(amountINR, targetCurrency = 'INR', rates = BASELINE_FALLBACK_RATES) {
  const converted = convertPrice(amountINR, targetCurrency, rates);
  return formatCurrencyAmount(converted, targetCurrency);
}
