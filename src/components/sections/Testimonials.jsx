import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { testimonials } from '../../data/journal';

export default function Testimonials() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prev = () => {
    setCurrentIdx((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIdx((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const t = testimonials[currentIdx];

  return (
    <section className="py-24 md:py-32 bg-[#EFE8D8] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        {/* Section Tag */}
        <div className="inline-flex items-center gap-3 mb-10">
          <span className="w-8 h-[2px] bg-[#6D7F62]" />
          <span className="text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
            CLIENT PERSPECTIVES
          </span>
          <span className="w-8 h-[2px] bg-[#6D7F62]" />
        </div>

        {/* Big Editorial Quote */}
        <div className="relative my-8">
          <Quote className="w-12 h-12 text-[#BA9977] mx-auto mb-6 rotate-180 opacity-80" />
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-[#362B21] leading-snug tracking-tight max-w-4xl mx-auto italic">
            "{t.quote}"
          </p>
        </div>

        {/* 5-star rating in Light Olive Green */}
        <div className="flex items-center justify-center gap-1 my-6 text-[#55694A]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
        </div>

        {/* Author Attribution */}
        <div className="space-y-1">
          <h4 className="font-serif text-2xl text-[#362B21] font-medium">
            {t.author}
          </h4>
          <p className="text-sm text-[#4E3C2B] font-sans font-medium tracking-wide">
            {t.role} &bull; <span className="text-[#55694A] font-bold">{t.location}</span>
          </p>
          <span className="text-xs uppercase tracking-widest text-[#4E3C2B] font-sans font-bold block pt-1">
            Purchased: {t.carpet}
          </span>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={prev}
            className="p-3 rounded-full border border-[#BA9977] text-[#362B21] hover:bg-[#55694A] hover:text-[#FAF7F0] hover:border-[#55694A] transition-colors shadow-sm"
            aria-label="Previous quote"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-xs font-mono font-bold text-[#4E3C2B]">
            0{currentIdx + 1} / 0{testimonials.length}
          </span>

          <button
            onClick={next}
            className="p-3 rounded-full border border-[#BA9977] text-[#362B21] hover:bg-[#55694A] hover:text-[#FAF7F0] hover:border-[#55694A] transition-colors shadow-sm"
            aria-label="Next quote"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
