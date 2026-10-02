import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  Sparkles,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { testimonialsData } from '../data/instituteData';

interface ResultsAndTestimonialsProps {
  onViewMoreResults?: () => void;
}

export const ResultsAndTestimonials: React.FC<ResultsAndTestimonialsProps> = ({
  onViewMoreResults,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalReviews = testimonialsData.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalReviews - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalReviews - 1 ? 0 : prev + 1));
  };

  // Visible items for 3-column desktop view (sliding window of 3)
  const getVisibleDesktopIndices = () => {
    return [
      currentIndex % totalReviews,
      (currentIndex + 1) % totalReviews,
      (currentIndex + 2) % totalReviews,
    ];
  };

  const visibleIndices = getVisibleDesktopIndices();

  return (
    <section id="success-stories" className="py-14 sm:py-20 md:py-24 bg-slate-50/60 relative overflow-hidden">
      <div id="gallery" className="-mt-20 pt-20" aria-hidden="true" />

      {/* Subtle ambient light accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header (Without top arrows) */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div
            id="success-stories-tag"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 mb-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Success Stories</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0a2540] tracking-tight">
            What Parents & Students Say
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-2 leading-relaxed">
            Real experiences from families and learners who transformed their academic confidence with us.
          </p>
        </div>

        {/* Review Box Container with Left & Right Arrows Mounted Directly on the Box */}
        <div className="relative max-w-6xl mx-auto">
          
          {/* Left Arrow Button (Mounted on Review Box) */}
          <button
            id="testimonial-prev-btn"
            onClick={handlePrev}
            aria-label="Previous review"
            className="absolute -left-3 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-slate-50 text-[#0a2540] border border-slate-200/90 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right Arrow Button (Mounted on Review Box) */}
          <button
            id="testimonial-next-btn"
            onClick={handleNext}
            aria-label="Next review"
            className="absolute -right-3 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-slate-50 text-[#0a2540] border border-slate-200/90 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Desktop & Tablet Multi-Card View (3 Cards Window) */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 lg:gap-6 px-4">
            {visibleIndices.map((idx) => {
              const item = testimonialsData[idx];
              return (
                <div
                  key={`${item.id}-${idx}`}
                  id={`testimonial-card-${item.id}`}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
                >
                  {/* Decorative Quote watermark */}
                  <Quote className="w-8 h-8 text-blue-100/80 absolute top-4 right-4 pointer-events-none group-hover:text-blue-200/80 transition-colors" />

                  <div>
                    {/* User profile */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0a2540] truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {item.role}
                        </p>
                        {item.boardOrClass && (
                          <span className="inline-block px-2 py-0.5 mt-1 rounded-md bg-blue-50 text-[#0a2540] text-[10px] font-semibold border border-blue-100">
                            {item.boardOrClass}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5 Stars Rating */}
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>

                    {/* Review text */}
                    <p className="text-xs sm:text-[13.5px] text-slate-600 leading-relaxed italic relative z-10">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Verified badge */}
                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Review
                    </span>
                    <span>5.0 / 5.0</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Carousel View: Single Focused Card */}
          <div className="md:hidden px-2">
            {(() => {
              const currentItem = testimonialsData[currentIndex];
              return (
                <div
                  id={`mobile-testimonial-${currentItem.id}`}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-md relative min-h-[220px] flex flex-col justify-between"
                >
                  <Quote className="w-8 h-8 text-blue-100 absolute top-4 right-4 pointer-events-none" />

                  <div>
                    {/* User profile */}
                    <div className="flex items-center gap-3 mb-3.5">
                      <img
                        src={currentItem.avatar}
                        alt={currentItem.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-[#0a2540]">
                          {currentItem.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {currentItem.role}
                        </p>
                        {currentItem.boardOrClass && (
                          <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-blue-50 text-[#0a2540] text-[10px] font-semibold border border-blue-100">
                            {currentItem.boardOrClass}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(currentItem.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>

                    {/* Quote text */}
                    <p className="text-sm text-slate-700 italic leading-relaxed">
                      "{currentItem.text}"
                    </p>
                  </div>

                  {/* Card bottom footer */}
                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Parent / Student
                    </span>
                    <span className="font-semibold text-slate-400">
                      {currentIndex + 1} of {totalReviews}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Dots Indicator beneath the review box */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonialsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  i === currentIndex
                    ? 'w-7 bg-[#0a2540]'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>

          {/* Optional link to view full results modal */}
          {onViewMoreResults && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onViewMoreResults}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0a2540] hover:text-blue-700 hover:underline cursor-pointer transition-colors"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>View Board Toppers & Detailed Results Gallery</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
