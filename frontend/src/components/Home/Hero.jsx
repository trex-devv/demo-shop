import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

import hero1 from "/hero-1.jpg";
import hero2 from "/hero-2.jpg";
import hero3 from "/hero-3.jpg";
import hero4 from "/hero-4.jpg";
import hero5 from "/hero-5.jpg";

import siteConfig from "../../config/site.config";

const SLIDE_DURATION = 5000;

const ACCENTS = ["#FFB020", "#FF4D4D", "#00E5FF", "#FFD23F"];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const resumeTimeout = useRef(null);
  const touchStartX = useRef(null);

  const siteName = siteConfig?.siteName;

  const slides = [
    {
      image: hero1,
      title: "PUBG Mobile",
      subtitle: "UC Top-up",
      cta: "Top Up Now",
      link: "/collection/pubg-mobile",
      accent: "#FFB020",
    },
    {
      image: hero2,
      title: "Free Fire",
      subtitle: "Diamonds",
      cta: "Top Up Now",
      link: "/collection/freefire",
      accent: "#FF4D4D",
    },
    {
      image: hero3,
      title: "Mobile Legends",
      subtitle: "Diamonds & Skins",
      cta: "Top Up Now",
      link: "/collection/mlbb",
      accent: "#00E5FF",
    },
    {
      image: hero4,
      title: "Clash of Clans",
      subtitle: "Gems & Gold Pass",
      cta: "Top Up Now",
      link: "/collection/coc",
      accent: "#FFB020",
    },
    {
      image: hero5,
      title: "TikTok",
      subtitle: "Coins",
      cta: "Top Up Now",
      link: "/collection/tiktok",
      accent: "#FF4D4D",
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const pauseThenResume = () => {
    setIsAutoPlaying(false);
    clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => setIsAutoPlaying(true), SLIDE_DURATION);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    pauseThenResume();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    pauseThenResume();
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    pauseThenResume();
  };

  // Touch swipe support for mobile, since nav arrows are hidden below md
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD) {
      prevSlide();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      nextSlide();
    }
    touchStartX.current = null;
  };

  const active = slides[currentSlide];

  const tickerPhrases = ["MADE FOR GAMERS", `BY ${siteName.toUpperCase()}`];
  const tickerItems = Array.from({ length: 5 }).flatMap(() => tickerPhrases);

  return (
    <>
      <section className="relative bg-[#0A0D17]">
        <style>{`
          @keyframes hudFill {
            from { width: 0%; }
            to { width: 100%; }
          }
          .hud-fill {
            animation: hudFill ${SLIDE_DURATION}ms linear forwards;
          }
          .hud-fill.paused {
            animation-play-state: paused;
          }
          .hud-scanlines {
            background-image: repeating-linear-gradient(
              transparent, transparent 2px, rgba(255,255,255,0.025) 3px, transparent 4px
            );
          }
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .ticker-track {
            animation: marquee 26s linear infinite;
          }
          .ticker-wrap:hover .ticker-track {
            animation-play-state: paused;
          }
          @keyframes edgeScan {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 100% 0%; }
          }
          .edge-scan {
            background-size: 200% 100%;
            animation: edgeScan 6s ease-in-out infinite;
          }
          @keyframes blinkCursor {
            0%, 45% { opacity: 1; }
            50%, 95% { opacity: 0; }
            100% { opacity: 1; }
          }
          .blink-cursor {
            animation: blinkCursor 1.1s steps(1) infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .hud-fill { animation: none; width: 100%; }
            .ticker-track { animation: none; }
            .edge-scan { animation: none; }
            .blink-cursor { animation: none; }
          }
        `}</style>

        <div
          className="relative min-h-[280px] overflow-hidden
            h-[62vh] max-h-[380px]
            xs:h-[65vh]
            sm:h-[60vh] sm:max-h-[480px]
            md:h-[62vh] md:max-h-[560px]
            lg:h-[74vh] lg:max-h-[720px]
            xl:max-h-[800px]
            landscape:max-h-[340px] landscape:md:max-h-[560px] landscape:lg:max-h-[720px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slides */}
          <div
            className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="relative h-full min-w-full">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D17] via-[#0A0D17]/50 to-[#0A0D17]/10" />
                <div className="hud-scanlines pointer-events-none absolute inset-0" />
              </div>
            ))}
          </div>

          {/* HUD corner brackets */}
          <div
            className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 border-l-2 border-t-2 transition-colors duration-500 sm:left-4 sm:top-4 sm:h-6 sm:w-6 md:h-8 md:w-8"
            style={{ borderColor: active.accent }}
          />
          <div
            className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 border-r-2 border-t-2 transition-colors duration-500 sm:right-4 sm:top-4 sm:h-6 sm:w-6 md:h-8 md:w-8"
            style={{ borderColor: active.accent }}
          />
          <div
            className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 border-b-2 border-l-2 transition-colors duration-500 sm:bottom-4 sm:left-4 sm:h-6 sm:w-6 md:h-8 md:w-8"
            style={{ borderColor: active.accent }}
          />
          <div
            className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 border-b-2 border-r-2 transition-colors duration-500 sm:bottom-4 sm:right-4 sm:h-6 sm:w-6 md:h-8 md:w-8"
            style={{ borderColor: active.accent }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex items-end sm:items-center">
            <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 sm:px-8 sm:pb-0 md:px-14 lg:px-20 xl:px-24">
              <h2 className="max-w-[15rem] text-xl font-extrabold uppercase leading-[0.95] tracking-tight text-white xs:max-w-[17rem] xs:text-2xl sm:max-w-md sm:text-3xl md:max-w-lg md:text-4xl lg:max-w-xl lg:text-5xl xl:text-6xl [font-family:'Orbitron',sans-serif]">
                {active.title}
              </h2>

              <p className="mt-1.5 text-xs font-medium text-slate-300 sm:mt-3 sm:text-base lg:text-lg">
                {active.subtitle}
              </p>

              <Link
                to={active.link}
                className="group relative mt-3 inline-flex items-center gap-2 overflow-hidden bg-white px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#0A0D17] transition-colors duration-300 hover:text-white active:scale-95 sm:mt-6 sm:px-8 sm:py-3 sm:text-sm"
                style={{ clipPath: "polygon(0 0, 100% 0, 92% 100%, 0% 100%)" }}
              >
                <span
                  className="absolute inset-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0"
                  style={{ backgroundColor: active.accent }}
                />
                <span className="relative">{active.cta}</span>
              </Link>
            </div>
          </div>

          {/* Nav arrows - shown from sm up with generous tap targets; hidden on the smallest screens where swipe takes over */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 border border-white/15 bg-black/40 p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white active:scale-95 sm:block md:left-3 lg:left-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 border border-white/15 bg-black/40 p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white active:scale-95 sm:block md:right-3 lg:right-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* HUD segmented progress bar - generous tap target, thin visual track */}
          <div className="absolute bottom-2.5 left-1/2 flex w-28 -translate-x-1/2 gap-1 xs:w-36 sm:bottom-4 sm:w-56 sm:gap-1.5 md:bottom-6 md:w-72">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to ${slide.title} slide`}
                className="group relative h-5 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 block h-[2px] -translate-y-1/2 overflow-hidden bg-white/15 transition-colors group-hover:bg-white/25 sm:h-[3px]">
                  {index === currentSlide && (
                    <span
                      key={currentSlide}
                      className={`hud-fill absolute inset-y-0 left-0 block ${
                        isAutoPlaying ? "" : "paused"
                      }`}
                      style={{
                        backgroundColor: active.accent,
                        width: isAutoPlaying ? undefined : "100%",
                      }}
                    />
                  )}
                  {index < currentSlide && (
                    <span className="absolute inset-0 bg-white/70" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MADE FOR GAMERS BY {NAME} - scrolling HUD ticker */}
        <div className="ticker-wrap relative overflow-hidden border-y border-white/10 bg-[#0D1120] py-2.5 sm:py-4">
          <div
            className="edge-scan absolute inset-x-0 top-0 h-[2px]"
            style={{
              backgroundImage: `linear-gradient(90deg, ${ACCENTS.join(", ")}, ${ACCENTS[0]})`,
            }}
          />
          <div
            className="edge-scan absolute inset-x-0 bottom-0 h-[2px]"
            style={{
              backgroundImage: `linear-gradient(90deg, ${ACCENTS[2]}, ${ACCENTS[1]}, ${ACCENTS[3]}, ${ACCENTS[0]})`,
              animationDelay: "1.5s",
            }}
          />

          <div
            className="flex overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            }}
          >
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="ticker-track flex shrink-0 items-center whitespace-nowrap"
              >
                {tickerItems.map((phrase, i) => {
                  const color = ACCENTS[i % ACCENTS.length];
                  const isLast = copy === 0 && i === tickerItems.length - 1;
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-2 pr-2 sm:gap-4 sm:pr-4"
                    >
                      <span
                        className="text-base font-extrabold uppercase tracking-wider sm:text-2xl md:text-3xl [font-family:'Orbitron',sans-serif]"
                        style={{ color: "#F4F6FF" }}
                      >
                        {phrase}
                        {isLast && (
                          <span
                            className="blink-cursor ml-1"
                            style={{ color: ACCENTS[0] }}
                          >
                            _
                          </span>
                        )}
                      </span>
                      <Zap
                        className="h-3.5 w-3.5 shrink-0 sm:h-5 sm:w-5"
                        style={{ color }}
                        fill={color}
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;