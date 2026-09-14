import React, { useState } from 'react';
import { ArrowRight, Scissors, Feather, Compass, Sun, Home } from 'lucide-react';

export default function CraftsmanshipStory() {
  const [activeStep, setActiveStep] = useState(2); // default to HANDCRAFT (weaving)

  const steps = [
    {
      id: 0,
      stepNumber: '01',
      title: 'DESIGN & TALIM',
      subtitle: 'Architectural Blueprinting',
      icon: Compass,
      image: '/images/bespoke-atelier.jpg',
      headline: 'Translating Architectural Geometry into Sacred Graph Notations',
      desc: 'Every carpet begins with hand-drawn Talim scripts—the ancient coded notation system sung aloud in Kashmir and Bhadohi workshops. Master draftsmen plot knot positions millimeter by millimeter, calibrating tension and medallion scale for optimal spatial resonance.'
    },
    {
      id: 1,
      stepNumber: '02',
      title: 'RAW MATERIAL & DYEING',
      subtitle: 'Living Botanical Alchemy',
      icon: Feather,
      image: '/images/craft-yarn.jpg',
      headline: 'High-Altitude Himalayan Fleece & Madder Root Pigments',
      desc: 'We harvest virgin fleece shorn from high-plateau sheep, rich in protective lanolin. In open courtyard vats, master dyers immerse hand-spun skeins in fermented indigo, wild pomegranate rinds, walnut hulls, and madder roots, creating subtle organic abrash color nuances.'
    },
    {
      id: 2,
      stepNumber: '03',
      title: 'HAND-KNOTTING',
      subtitle: 'Months on the Master Loom',
      icon: Scissors,
      image: '/images/craft-weaving.jpg',
      headline: 'Up to 500,000 Individual Hand-Tied Symmetrical Knots',
      desc: 'Three generations of master weavers sit side by side at towering timber looms. Each individual knot is tied around warp strings by hand, beaten into place with iron combs, and trimmed with curved shearing knives. A single heirloom requires between 6 and 14 continuous months.'
    },
    {
      id: 3,
      stepNumber: '04',
      title: 'FINISHING & SUN WASHING',
      subtitle: 'River Washing & Herbal Luster',
      icon: Sun,
      image: '/images/carpet-macro.jpg',
      headline: 'Repeated Gentle Washes & Natural Terrace Curing',
      desc: 'Once cut from the loom, carpets undergo extensive herbal washes with natural soapnuts and pure mountain water. They are laid flat on sunlit stone terraces to soften color intensity and naturally polish the raw silk fibers, developing their signature antique cashmere sheen.'
    },
    {
      id: 4,
      stepNumber: '05',
      title: 'YOUR SANCTUARY',
      subtitle: 'Generational Legacy',
      icon: Home,
      image: '/images/room-after.jpg',
      headline: 'Grounded Elegance Made to Outlive Us All',
      desc: 'The finished heirloom is personally inspected, certified with an engraved brass provenance plaque, and transported with white-glove care directly into your private residence. Over decades of footfall, the wool fibers become softer and more radiant.'
    }
  ];

  const current = steps[activeStep];

  return (
    <section id="story" className="py-24 md:py-32 bg-[#EFE8DC] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#BA9977]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8F6E50] font-sans font-semibold">
              THE ARTISANAL ODYSSEY
            </span>
            <span className="w-8 h-[2px] bg-[#BA9977]" />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
            Made by Hands. <br />
            <span className="italic text-[#8F6E50] font-normal">Designed for Generations.</span>
          </h2>

          <p className="font-sans text-sm md:text-base text-[#544131]/80 font-normal leading-relaxed">
            Follow the meticulous five-chapter pilgrimage from design blueprinting to your residence.
          </p>
        </div>

        {/* Step Progression Tabs */}
        <div className="flex items-stretch overflow-x-auto gap-3 border-b border-[#DACDB3] pb-6 sm:pb-8 mb-8 sm:mb-12 scrollbar-none md:grid md:grid-cols-5">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition-all duration-300 relative group border min-w-[160px] sm:min-w-[180px] md:min-w-0 flex-shrink-0 md:flex-shrink ${
                  isActive
                    ? 'bg-[#FAF7F0] border-[#BA9977] shadow-xl -translate-y-0.5'
                    : 'bg-[#FAF7F0]/60 border-[#DACDB3]/70 hover:border-[#BA9977]/60 hover:bg-[#FAF7F0]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-[#8F6E50]' : 'text-[#8F6E50]/60'}`}>
                    {step.stepNumber}
                  </span>
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#8F6E50]' : 'text-[#8F6E50]/50 group-hover:text-[#8F6E50]'}`} />
                </div>
                <h4 className={`font-serif text-sm md:text-base tracking-wide transition-colors ${isActive ? 'text-[#362B21] font-medium' : 'text-[#544131]/80'}`}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-[#7A634E] mt-1 font-sans hidden sm:block font-medium">
                  {step.subtitle}
                </p>

                {isActive && (
                  <span className="hidden md:block absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FAF7F0] rotate-45 border-r border-b border-[#BA9977]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF7F0] rounded-2xl border border-[#DACDB3] p-5 sm:p-10 md:p-14 shadow-2xl">
          {/* Step Image */}
          <div className="lg:col-span-7 rounded-xl overflow-hidden shadow-2xl border border-[#DACDB3] max-h-[480px] aspect-[4/3] bg-[#EFE8DC]">
            <img
              src={current.image}
              alt={current.headline}
              className="w-full h-full object-cover object-center scale-[1.01] hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Step Text */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 text-[#8F6E50] text-xs uppercase tracking-widest font-sans font-semibold">
              <span>Chapter {current.stepNumber}</span>
              <span>&bull;</span>
              <span>{current.subtitle}</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#362B21] leading-tight font-light">
              {current.headline}
            </h3>

            <p className="font-sans text-sm text-[#544131]/85 font-normal leading-relaxed">
              {current.desc}
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => setActiveStep((activeStep + 1) % steps.length)}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#8F6E50] hover:text-[#362B21] border-b border-[#8F6E50] pb-1 transition-colors font-sans font-semibold"
              >
                <span>Next Chapter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
