import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Feather, Scissors, Sun, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';

export default function StudioPage() {
  const processSteps = [
    {
      num: '01',
      title: 'Graph & Talim Blueprinting',
      subtitle: 'Translating Architecture into Knot Coordinates',
      desc: 'Every piece begins with an architectural floorplan dialogue. Master draftsmen convert contemporary spatial layouts into precise Talim notation graphs, mapping every warp, weft, and knot coordinate to the exact millimeter.',
      image: '/images/bespoke-atelier.jpg'
    },
    {
      num: '02',
      title: 'Fiber Selection & Botanical Dye Vats',
      subtitle: 'Natural Wool & Pure Mulberry Silk',
      desc: 'We select hand-sorted mountain fleece from high plateaus and pure mulberry silk. In open courtyards, our master dyers brew natural mineral and botanical recipes—madder roots, walnut hulls, fermented indigo—yielding nuanced abrash color shifts.',
      image: '/images/craft-yarn.jpg'
    },
    {
      num: '03',
      title: 'The Master Loom',
      subtitle: 'Generational Hand-Knotting & Tufting',
      desc: 'Generational weavers work side by side at vertical timber looms in Bhadohi. Using curved shearing blades and iron beating combs, they hand-tie hundreds of thousands of symmetrical knots with rhythmic discipline.',
      image: '/images/craft-weaving.jpg'
    },
    {
      num: '04',
      title: 'Hand Shearing & Texture Sculpting',
      subtitle: 'Beveling High-Low Relief',
      desc: 'Once released from the loom tension, the rug surface is sheared by hand to reveal crisp edge transitions. Master carvers hand-sculpt dimensional pile heights, creating topographical depth and shadow under ambient light.',
      image: '/images/carpet-macro.jpg'
    },
    {
      num: '05',
      title: 'Terrace Sun-Curing & Washing',
      subtitle: 'River Washes for Cashmere Hand-Feel',
      desc: 'Repeated organic washing with natural soapnuts softens the wool fibers without stripping their protective lanolin. The carpets dry flat across sunlit stone terraces, setting their natural luster for decades to come.',
      image: '/images/room-after.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-20">
      <SEO
        title="Pottery Rugs Studio | Craft, Design & Process"
        description="Discover the design philosophy, craftsmanship process, and creative direction behind Pottery Rugs & Home Decor. Handcrafted in Bhadohi, India."
        path="/studio"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Studio', url: '/studio' }
        ]}
      />

      {/* Hero Header */}
      <section className="relative px-6 md:px-12 pt-10 pb-16 md:pb-24 border-b border-[#DACDB3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                THE DESIGN PHILOSOPHY
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
              Where Ancient Loom Weaves Meet Modern Architecture
            </h1>
            <p className="font-sans text-sm sm:text-base md:text-lg text-[#4E3C2B] font-medium leading-relaxed max-w-2xl">
              POTTERY RUGS & HOME DECOR functions as a design studio and manufacturer based in Bhadohi, Uttar Pradesh. We unite centuries of traditional Indian knotting mastery with understated contemporary minimalism.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-[#DACDB3] bg-[#EFE8DC] aspect-[4/3]">
              <img
                src="/images/bespoke-atelier.jpg"
                alt="Pottery Rugs Studio drafting and design process"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles Grid */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              FOUNDATIONS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
              Our Studio Pillars
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              Every creation balances tactile honesty, spatial harmony, and generational lineage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#EFE8D8] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <Compass className="w-7 h-7 text-[#55694A]" />
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Form Follows Fiber</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Rather than treating textiles as printed surfaces, our designs stem directly from the inherent grain of the fiber, whether the crimp of virgin wool or the luminous sheen of silk inlays.
              </p>
            </div>

            <div className="bg-[#EFE8D8] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <Layers className="w-7 h-7 text-[#55694A]" />
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Acoustic & Spatial Balance</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Handcrafted carpets serve as spatial acoustic dampeners in modern concrete, glass, and stone homes, absorbing reverberation while anchoring seating arrangements.
              </p>
            </div>

            <div className="bg-[#EFE8D8] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <Sparkles className="w-7 h-7 text-[#55694A]" />
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Bhadohi Craft Lineage</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Working directly from the carpet capital of India, our studio fosters direct collaboration between contemporary architects and multigenerational master weavers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* From Concept to Finished Piece (Interactive Journey) */}
      <section className="px-6 md:px-12 py-16 bg-[#EFE8DC] border-y border-[#DACDB3]/70">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              THE ARTISAN JOURNEY
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#362B21] font-light">
              From Concept to Finished Piece
            </h2>
            <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed">
              Step into the methodical five-phase journey of every Pottery Rugs creation.
            </p>
          </div>

          <div className="space-y-16">
            {processSteps.map((step, idx) => {
              const isEven = idx % 2 === 1;
              return (
                <div
                  key={step.num}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`lg:col-span-6 space-y-4 ${isEven ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#55694A] bg-[#FAF7F0] px-3 py-1 rounded-full border border-[#DACDB3]">
                        PHASE {step.num}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-[#4E3C2B] font-sans font-medium">
                        {step.subtitle}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-[#362B21] font-medium leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className={`lg:col-span-6 ${isEven ? 'lg:order-1' : ''}`}>
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-[#DACDB3] aspect-[16/10] bg-[#FAF7F0]">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Material Curation Story */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg border border-[#DACDB3] aspect-[4/3] bg-[#EFE8DC]">
            <img
              src="/images/craft-yarn.jpg"
              alt="Naturally dyed raw yarn hanks in Bhadohi studio"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="lg:col-span-6 space-y-5">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold block">
              SUSTAINABLE PURITY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light leading-tight">
              Texture, Form & Conscious Craft
            </h2>
            <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed">
              We reject petrochemical backings, synthetic latex, and artificial adhesives. Each rug breathes naturally with 100% biodegradable natural wool, organic cotton warps, and pure vegetable pigments.
            </p>
            <div className="pt-2">
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-sans font-bold transition-all shadow-md"
              >
                <span>Explore Studio Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Studio CTA */}
      <section className="px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto bg-[#3D4C35] text-[#FAF7F0] rounded-3xl p-8 sm:p-12 md:p-14 text-center space-y-6 shadow-2xl border border-[#5B6E51]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold block">
            COLLABORATIVE COMMISSION
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light">
            Design With Our Studio
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF7F0]/80 font-sans max-w-xl mx-auto leading-relaxed">
            We collaborate with architects, interior designers, and discerning homeowners worldwide to create custom-scale hand-knotted and hand-tufted works.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="bg-[#D4BC9F] hover:bg-[#FAF7F0] text-[#362B21] font-sans font-bold px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md"
            >
              Contact Studio Team
            </Link>
            <Link
              to="/carpets"
              className="border border-[#FAF7F0]/40 hover:border-[#FAF7F0] text-[#FAF7F0] font-sans font-medium px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all"
            >
              Browse Carpets
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
