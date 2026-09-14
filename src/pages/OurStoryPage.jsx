import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Heart, Users, Sparkles, MapPin, Feather } from 'lucide-react';
import SEO from '../components/common/SEO';
import { companyInfo } from '../data/carpets';

export default function OurStoryPage() {
  const brandValues = [
    {
      title: 'Artisan Preservation & Fair Wages',
      desc: 'We support master weavers and craftswomen across Bhadohi and surrounding craft clusters with dignified compensation, continuous loom commissions, and safe workshop environments.',
      icon: Users
    },
    {
      title: 'Biodegradable Pure Fibers',
      desc: 'Zero plastic yarns, petrochemical latex, or synthetic adhesive backings. Every rug is woven from 100% biodegradable natural wool, cotton warps, and pure silks.',
      icon: Feather
    },
    {
      title: 'Generational Lineage',
      desc: 'Honoring ancient Talim vocal graph chants and knotting disciplines passed down across generations in northern India.',
      icon: Sparkles
    },
    {
      title: 'Verified Origin & Transparency',
      desc: 'Manufactured and exported directly from our registered manufacturing premises on G.T. Road, Bhadohi, Uttar Pradesh.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-20">
      <SEO
        title="Our Story | Pottery Rugs & Home Decor"
        description="Discover the heritage of Pottery Rugs & Home Decor, handcrafted carpets and architectural accents from Bhadohi, Uttar Pradesh, India."
        path="/our-story"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Our Story', url: '/our-story' }
        ]}
      />

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-10 pb-16 md:pb-24 border-b border-[#DACDB3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                ESTABLISHED IN BHADOHI, INDIA
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-[1.12]">
              Rooted in Craft. <br />
              <span className="italic text-[#55694A] font-normal">Woven for Generations.</span>
            </h1>
            <p className="font-sans text-sm sm:text-base md:text-lg text-[#4E3C2B] font-medium leading-relaxed max-w-2xl">
              POTTERY RUGS & HOME DECOR is a manufacturer and exporter of handcrafted luxury rugs, architectural floorings, and sculpted interior objects based in Bhadohi, Uttar Pradesh.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#DACDB3] bg-[#EFE8DC] aspect-[4/3]">
              <img
                src="/images/craft-weaving.jpg"
                alt="Master weaver at timber loom in Bhadohi"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brand Heritage Narrative */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold block">
                THE BHADOHI CONNECTION
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light leading-tight">
                The Carpet Capital on the Historic G.T. Road
              </h2>
              <div className="space-y-4 font-sans text-xs sm:text-sm text-[#4E3C2B] leading-relaxed">
                <p>
                  Bhadohi, nestled along the historic Grand Trunk Road in eastern Uttar Pradesh, is renowned as South Asia's principal seat of hand-knotted carpet weaving. For centuries, the rhythmic sound of timber looms and musical Talim chanting has echoed through this region.
                </p>
                <p>
                  POTTERY RUGS & HOME DECOR was founded to connect this incomparable generational expertise with contemporary living spaces worldwide. Rather than mass manufacturing, we cultivate close, personal relationships with master knotters, tufters, and dyers.
                </p>
                <p>
                  Each piece that leaves our workshop is more than a floor covering—it is an authentic chronicle of human touch, patience, and artistic endurance.
                </p>
              </div>

              {/* Verified Address & Credentials */}
              <div className="p-5 rounded-xl bg-[#EFE8D8] border border-[#DACDB3] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#55694A] font-sans uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Workshop & Registered Office</span>
                </div>
                <p className="text-xs text-[#362B21] font-mono leading-relaxed">
                  {companyInfo.address}
                </p>
                <p className="text-[11px] text-[#4E3C2B] font-sans font-medium">
                  {companyInfo.companyType} &bull; Exporting Handcrafted Textiles Worldwide
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-[#DACDB3] aspect-[16/11] bg-[#EFE8DC]">
                <img
                  src="/images/craft-yarn.jpg"
                  alt="Sunlit botanical dyed yarn skeins"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF7F0] p-5 rounded-xl border border-[#DACDB3] space-y-1">
                  <span className="font-serif text-3xl text-[#55694A] font-light">100%</span>
                  <p className="text-xs font-sans text-[#4E3C2B] font-medium">Biodegradable Natural Fleece & Cotton</p>
                </div>
                <div className="bg-[#FAF7F0] p-5 rounded-xl border border-[#DACDB3] space-y-1">
                  <span className="font-serif text-3xl text-[#55694A] font-light">Zero</span>
                  <p className="text-xs font-sans text-[#4E3C2B] font-medium">Toxic Chemical Backings or Plastic Pile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Brand Values */}
      <section className="px-6 md:px-12 py-16 bg-[#EFE8DC] border-y border-[#DACDB3]/70">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              ETHICS & INTEGRITY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
              Our Core Principles
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              We measure our legacy by the sustainability of our materials and the well-being of the artisans who shape them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brandValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-[#FAF7F0] p-6 rounded-2xl border border-[#DACDB3] space-y-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl text-[#362B21] font-medium leading-snug">{val.title}</h3>
                  <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing Narrative & CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto bg-[#3D4C35] text-[#FAF7F0] rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl border border-[#5B6E51]">
          <div className="max-w-2xl space-y-6 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold">
              DISCOVER THE CREATIONS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight">
              Bring Bhadohi Craftsmanship into Your Home
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 font-sans leading-relaxed">
              Explore our hand-knotted heirlooms, modern tufted sculptures, and architectural accents—or speak with our team to commission a bespoke size.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/carpets"
                className="bg-[#D4BC9F] hover:bg-[#FAF7F0] text-[#362B21] font-sans font-bold px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
              >
                <span>Explore Carpets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="border border-[#FAF7F0]/40 hover:border-[#FAF7F0] text-[#FAF7F0] font-sans font-medium px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
