import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function CurrencySelector({
  variant = 'editorial',
  showLabel = true,
  className = ''
}) {
  const { currency, setCurrency, supportedCurrencies, currentCurrencyMeta } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    setCurrency(code);
    setIsOpen(false);
  };

  // Dark / Navbar-like variant if ever required
  if (variant === 'dark') {
    return (
      <div className={`relative ${className}`} ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-xs font-sans font-medium select-none shadow-xs"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Currency: ${currentCurrencyMeta.code} ${currentCurrencyMeta.symbol}`}
        >
          <span className="text-xs select-none">{currentCurrencyMeta.flag}</span>
          <span className="font-mono tracking-wider font-semibold text-[11px]">
            {currentCurrencyMeta.code}
          </span>
          <span className="text-[#D4BC9F] text-[11px] font-serif">
            {currentCurrencyMeta.symbol}
          </span>
          <ChevronDown className={`w-3 h-3 text-[#FAF7F0]/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 mt-2 w-52 bg-[#576D4B] border border-[#89A17A] rounded-2xl shadow-2xl py-2 px-1 z-50 text-[#FAF7F0] animate-fade-in backdrop-blur-md"
            role="listbox"
            aria-label="Supported Currencies"
          >
            <div className="px-3 py-1 border-b border-[#7A936C] mb-1 flex items-center justify-between">
              <span className="text-[9.5px] uppercase tracking-wider text-[#D4BC9F] font-bold">
                Currency
              </span>
              <span className="text-[8.5px] text-[#FAF7F0]/60 uppercase font-mono">
                Base: INR
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#7A936C]/40">
              {supportedCurrencies.map((c) => {
                const isSelected = c.code === currency;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-[#3E4F35] text-[#D4BC9F] font-bold'
                        : 'hover:bg-[#4E6243] text-[#FAF7F0]'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base select-none">{c.flag}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="font-mono font-bold tracking-wider">{c.code}</span>
                          <span className="text-[#D4BC9F] font-serif">{c.symbol}</span>
                        </div>
                        <span className="text-[10px] text-[#FAF7F0]/70 font-sans truncate max-w-[110px]">
                          {c.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D4BC9F] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Editorial / Product-Browsing Toolbar Variant (Default)
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`} ref={containerRef}>
      {showLabel && (
        <span className="text-[11px] sm:text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold select-none whitespace-nowrap">
          Currency:
        </span>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFE8D8] hover:bg-[#EAE2D0] active:scale-95 text-[#362B21] border border-[#DACDB3] hover:border-[#55694A] transition-all text-xs font-sans font-medium select-none shadow-xs"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select display currency, currently ${currentCurrencyMeta.code} (${currentCurrencyMeta.symbol})`}
        title={`Current display currency: ${currentCurrencyMeta.name}`}
      >
        <span className="text-xs leading-none select-none">{currentCurrencyMeta.flag}</span>
        <span className="font-mono font-bold tracking-wider text-[11px] text-[#362B21]">
          {currentCurrencyMeta.code}
        </span>
        <span className="text-[#55694A] font-serif text-[11px] font-semibold">
          {currentCurrencyMeta.symbol}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#55694A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-[#FAF7F0] border border-[#DACDB3] rounded-2xl shadow-2xl py-2 px-1 z-50 text-[#362B21] animate-fade-in"
          role="listbox"
          aria-label="Supported Currencies"
        >
          <div className="px-3 py-1.5 border-b border-[#DACDB3]/70 mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#55694A] font-bold">
              Display Currency
            </span>
            <span className="text-[9px] text-[#4E3C2B]/60 uppercase font-mono">
              Store: INR
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#DACDB3]/40">
            {supportedCurrencies.map((c) => {
              const isSelected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors text-xs ${
                    isSelected
                      ? 'bg-[#EAE2D0] text-[#55694A] font-bold'
                      : 'hover:bg-[#EFE8D8] text-[#362B21]'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">{c.flag}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="font-mono font-bold tracking-wider text-[#362B21]">
                          {c.code}
                        </span>
                        <span className="text-[#55694A] font-serif font-medium">
                          {c.symbol}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#4E3C2B]/75 font-sans truncate max-w-[120px]">
                        {c.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#55694A] stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
