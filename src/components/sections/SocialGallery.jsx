import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { instagramPosts } from '../../data/journal';
import { companyInfo } from '../../data/carpets';

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function SocialGallery() {
  return (
    <section className="py-24 bg-[#EFE8D8] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              <InstagramIcon className="w-4 h-4" />
              <span>DIGITAL CATALOGUE & ARCHIVE</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl text-[#362B21] font-light">
              Follow Our Story.
            </h2>
          </div>

          <a
            href={companyInfo.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#362B21] hover:text-[#55694A] font-sans font-bold border-b-2 border-[#362B21] pb-1 transition-colors"
          >
            <span>{companyInfo.instagramHandle} on Instagram</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Gallery Grid (6 images) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href={companyInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden aspect-square shadow-sm bg-[#4C5D41] block border border-[#DACDB3] card-hover-lift"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-[#45563D]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 text-[#FAF7F0]">
                <InstagramIcon className="w-5 h-5 text-[#D4BC9F] self-end" />
                <div>
                  <span className="text-xs text-[#D4BC9F] font-sans font-bold">{post.tag}</span>
                  <p className="text-xs font-serif leading-snug line-clamp-2 mt-1">{post.title}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
