import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { journalArticles } from '../../data/journal';

export default function InspirationJournal() {
  return (
    <section className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                DESIGN & CRAFT JOURNAL
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              Spaces That Inspire.
            </h2>
          </div>

          <p className="font-sans text-sm md:text-base text-[#4E3C2B] max-w-md font-medium leading-relaxed">
            Essays on interior architecture, chromatic restraint, and the timeless rituals of textile living.
          </p>
        </div>

        {/* Magazine Style Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {journalArticles.map((article, idx) => (
            <article
              key={article.id}
              className="group cursor-pointer flex flex-col justify-between space-y-4 p-4 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] card-hover-lift shadow-sm"
            >
              <div className="overflow-hidden rounded-xl aspect-[16/11] bg-[#4C5D41] relative border border-[#DACDB3]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 left-4 bg-[#4C5D41]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider text-[#FAF7F0] font-sans font-medium border border-[#6D7F62]/50">
                  {article.category}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-[#4E3C2B] font-sans font-bold">
                  <span>0{idx + 1} &bull; Editorial</span>
                  <span>{article.readTime}</span>
                </div>

                <h3 className="font-serif text-2xl text-[#362B21] group-hover:text-[#55694A] transition-colors leading-snug font-medium">
                  {article.title}
                </h3>

                <p className="text-xs text-[#4E3C2B] font-sans font-medium leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-1 text-xs uppercase tracking-widest text-[#55694A] font-bold group-hover:translate-x-1 transition-transform font-sans">
                <span>Read Story</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
