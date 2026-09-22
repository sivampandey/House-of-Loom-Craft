import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function CurrencySelector({ variant = 'desktop', className = '' }) {
  const { currency, setCurrency, supportedCurrencies, currentCurrencyMeta } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
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

  // Mobile Drawer Dedicated View
  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#D4BC9F] font-bold">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#D4BC9F]" />
            Select Currency
          </span>
          <span className="font-mono text-[10px] text-[#FAF7F0]/80">Base: INR (₹)</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {supportedCurrencies.map((c) => {
            const isSelected = c.code === currency;
            return (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`py-2 px-1.5 rounded-xl text-center flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-[#D4BC9F] text-[#362B21] border-[#FAF7F0] shadow-sm font-bold'
                    : 'bg-[#4E6243]/70 text-[#FAF7F0] border-[#7E9670]/60 hover:bg-[#5C7251]'
                }`}
                title={`${c.name} (${c.code} ${c.symbol})`}
              >
                <span className="text-sm select-none leading-none mb-0.5">{c.flag}</span>
                <span className="text-[11px] font-mono leading-tight">{c.code}</span>
                <span className="text-[10px] opacity-80 leading-none">{c.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop / Header Dropdown View
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-xs font-sans font-medium select-none shadow-xs"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Currency: ${currentCurrencyMeta.code} ${currentCurrencyMeta.symbol}`}
        title={`Store Currency: ${currentCurrencyMeta.name}`}
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
              Currency Selector
            </span>
            <span className="text-[8.5px] text-[#FAF7F0]/60 uppercase font-mono">
              Store: INR
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

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#D4BC9F] stroke-[2.5]" />
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
