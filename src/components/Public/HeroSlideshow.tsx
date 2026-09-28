import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Droplets, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface SlideItem {
  id: string;
  image: string;
  alt: string;
  titleKey: string;
  descKey: string;
  icon: 'droplets' | 'sparkles' | 'shield' | 'zap';
  rating: string;
}

const CAR_SLIDES: SlideItem[] = [
  {
    id: 'foam-wash',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=85',
    alt: 'High-pressure active foam wash on vehicle with rich cleaning suds',
    titleKey: 'home.slide1Title',
    descKey: 'home.slide1Desc',
    icon: 'droplets',
    rating: '5.0',
  },
  {
    id: 'gloss-ceramic',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1600&q=85',
    alt: 'Ultra-glossy pristine black luxury vehicle after ceramic gloss wash',
    titleKey: 'home.slide2Title',
    descKey: 'home.slide2Desc',
    icon: 'sparkles',
    rating: '5.0',
  },
  {
    id: 'express-tunnel',
    image: 'https://images.unsplash.com/photo-1605515298946-d062f2e9da53?auto=format&fit=crop&w=1600&q=85',
    alt: 'Modern automated car wash express tunnel with high-volume water rinse',
    titleKey: 'home.slide3Title',
    descKey: 'home.slide3Desc',
    icon: 'zap',
    rating: '4.9',
  },
  {
    id: 'exterior-polish',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85',
    alt: 'Professional exterior machine polish and swirl-free paint correction',
    titleKey: 'home.slide4Title',
    descKey: 'home.slide4Desc',
    icon: 'shield',
    rating: '5.0',
  },
  {
    id: 'interior-clean',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=85',
    alt: 'Meticulously detailed luxury vehicle interior and pristine dashboard',
    titleKey: 'home.slide5Title',
    descKey: 'home.slide5Desc',
    icon: 'sparkles',
    rating: '4.9',
  },
];

const AUTO_ROTATE_DELAY_MS = 4500;
const RESUME_AFTER_INTERACTION_MS = 6500;

export const HeroSlideshow: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const userInteractedRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = CAR_SLIDES.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Handle explicit user action (pause auto-rotation and resume after delay)
  const handleManualAction = (action: () => void) => {
    action();
    userInteractedRef.current = true;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      userInteractedRef.current = false;
    }, RESUME_AFTER_INTERACTION_MS);
  };

  // Auto-play interval
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (!userInteractedRef.current) {
        goToNext();
      }
    }, AUTO_ROTATE_DELAY_MS);

    return () => clearInterval(interval);
  }, [goToNext, isHovered]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const activeSlide = CAR_SLIDES[currentIndex];

  const renderIcon = (type: SlideItem['icon']) => {
    switch (type) {
      case 'droplets':
        return <Droplets className="w-5 h-5" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5" />;
      case 'zap':
        return <Zap className="w-5 h-5" />;
      default:
        return <Droplets className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="relative w-full group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Car wash gallery showcase"
    >
      {/* 16:9 Landscape Frame */}
      <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-blue-950/20 dark:shadow-cyan-950/25">
        {/* Slides stack with cross-fade */}
        {CAR_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                loading={idx === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              {/* Subtle cinematic gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/30" />
            </div>
          );
        })}

        {/* Previous Arrow */}
        <button
          type="button"
          onClick={() => handleManualAction(goToPrev)}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg shadow-black/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label={t('home.slideshowPrev')}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={() => handleManualAction(goToNext)}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-950/60 hover:bg-slate-900/90 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg shadow-black/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label={t('home.slideshowNext')}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Slide Feature Overlay Badge (Bottom Left) */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 max-w-[calc(100%-120px)] sm:max-w-sm p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-xl flex items-center justify-between gap-3 text-white transition-all duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/30">
              {renderIcon(activeSlide.icon)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white truncate">
                {t(activeSlide.titleKey)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-cyan-200/80 font-medium truncate">
                {t(activeSlide.descKey)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-amber-300 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{activeSlide.rating}</span>
          </div>
        </div>

        {/* Dots & Counter (Bottom Right) */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 shadow-lg">
          <div className="flex items-center gap-1.5">
            {CAR_SLIDES.map((slide, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleManualAction(() => setCurrentIndex(idx))}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'w-6 bg-cyan-400 shadow-sm shadow-cyan-400/80'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={t('home.slideshowGoTo', { number: idx + 1 })}
                />
              );
            })}
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-300 pl-1">
            0{currentIndex + 1} / 0{totalSlides}
          </span>
        </div>
      </div>
    </div>
  );
};
