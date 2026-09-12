import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/common/SEO';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] flex items-center justify-center px-6 pt-24 pb-20">
      <SEO
        title="404 - Piece Not Found | Pottery Rugs & Home Decor"
        description="The requested page could not be located in our atelier catalog."
        path="/404"
      />

      <div className="text-center space-y-6 max-w-lg p-10 bg-[#EFE8D8] rounded-3xl border border-[#DACDB3] shadow-xl">
        <span className="text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
          404 ARCHIVE NOTICE
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl text-[#362B21] font-light">
          Page Not Located
        </h1>
        <p className="text-xs sm:text-sm text-[#4E3C2B] leading-relaxed">
          The atelier address you navigated to does not exist or has been relocated within our private collection.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Atelier Home</span>
        </Link>
      </div>
    </div>
  );
}
