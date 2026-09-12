import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// Sections
import Hero from '../components/sections/Hero';
import TransitionSection from '../components/sections/TransitionSection';
import CollectionShowcase from '../components/sections/CollectionShowcase';
import Interactive3DSection from '../components/sections/Interactive3DSection';
import FeaturedCarpets from '../components/sections/FeaturedCarpets';
import CraftsmanshipStory from '../components/sections/CraftsmanshipStory';
import TextureExperience from '../components/sections/TextureExperience';
import RoomTransformation from '../components/sections/RoomTransformation';
import HomeDecorSection from '../components/sections/HomeDecorSection';
import BrandStory from '../components/sections/BrandStory';
import CustomCarpetCTA from '../components/sections/CustomCarpetCTA';
import Testimonials from '../components/sections/Testimonials';
import InspirationJournal from '../components/sections/InspirationJournal';
import SocialGallery from '../components/sections/SocialGallery';
import FinalCTA from '../components/sections/FinalCTA';

export default function HomePage({
  onOpenQuickView,
  onOpenConsultation,
  onShowToast
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const [activeCollectionFilter, setActiveCollectionFilter] = useState('all');

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product);
      if (onShowToast) {
        onShowToast('cart', 'Acquisition Added', `${product.name} placed in your Atelier Bag.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Cart Error', err.message);
      }
    }
  };

  const handleToggleWishlist = async (product) => {
    try {
      const res = await toggleWishlist(product);
      if (onShowToast) {
        onShowToast('wishlist', res.saved ? 'Saved to Wishlist' : 'Removed from Wishlist', res.message);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Wishlist Error', err.message);
      }
    }
  };

  const handleNavigate = (e, href) => {
    if (e) e.preventDefault();
    if (href.startsWith('#')) {
      const elem = document.querySelector(href);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  const handleCategorySelection = (catId) => {
    setActiveCollectionFilter(catId);
    const elem = document.querySelector('#featured');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO
        title="POTTERY RUGS & HOME DECOR | Manufacturer & Exporter | Bhadohi"
        description="Luxury handcrafted rugs and architectural home decor direct from our Bhadohi atelier. Discover Hand Knotted, Hand Tufted, and Bespoke commissions."
        path="/"
      />

      <main>
        {/* Section 3: Hero (Video 1) */}
        <Hero
          onExploreClick={(e) => handleNavigate(e, '#collections')}
          onStoryClick={(e) => handleNavigate(e, '#story')}
        />

        {/* Section 4: Cinematic Transition Bridge */}
        <TransitionSection />

        {/* Section 5: Collection Showcase (Video 2) */}
        <CollectionShowcase
          onSelectCategory={handleCategorySelection}
          onExploreAll={(e) => handleNavigate(e, '#featured')}
        />

        {/* Section 6: Interactive 3D Carpet Inspection */}
        <Interactive3DSection
          onOpenQuickView={onOpenQuickView}
        />

        {/* Section 7: Curated Featured Carpets */}
        <FeaturedCarpets
          onQuickView={onOpenQuickView}
          onToggleWishlist={handleToggleWishlist}
          wishlistIds={wishlistItems.map(i => i.slug || i.id || i._id)}
          activeCollectionFilter={activeCollectionFilter}
          onSelectCollectionFilter={setActiveCollectionFilter}
        />

        {/* Section 8: Craftsmanship Story */}
        <CraftsmanshipStory />

        {/* Section 9: Carpet Macro Texture Experience */}
        <TextureExperience />

        {/* Section 10: Interactive Before / After Room Transformation */}
        <RoomTransformation />

        {/* Section 11: Architectural Home Decor */}
        <HomeDecorSection
          onAddToCart={handleAddToCart}
          onQuickView={onOpenQuickView}
        />

        {/* Section 12: Brand Heritage Story */}
        <BrandStory
          onOpenConsultation={onOpenConsultation}
        />

        {/* Section 13: Custom Carpet / Bespoke Atelier CTA */}
        <CustomCarpetCTA
          onOpenConsultation={onOpenConsultation}
        />

        {/* Section 14: Client Perspectives / Testimonials */}
        <Testimonials />

        {/* Section 15: Spaces That Inspire / Inspiration Journal */}
        <InspirationJournal />

        {/* Section 16: Instagram Social Archive */}
        <SocialGallery />

        {/* Section 17: Final Cinematic Invitation */}
        <FinalCTA
          onExploreCollection={(e) => handleNavigate(e, '#featured')}
          onContactUs={onOpenConsultation}
        />
      </main>
    </>
  );
}
