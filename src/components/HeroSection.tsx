import React from 'react';
import {
  GraduationCap,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpenCheck,
} from 'lucide-react';
import heroStudentsImg from '../assets/images/hero_students_1788498815939.jpg';
import { instituteInfo } from '../data/instituteData';

interface HeroSectionProps {
  onOpenCourses: () => void;
  onOpenDemoBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCourses,
  onOpenDemoBooking,
}) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50 pt-8 pb-16 md:pt-12 md:pb-20 lg:pt-16 lg:pb-24">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tag Badge */}
            <div
              id="hero-tag-badge"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0f4c81] text-xs sm:text-sm font-semibold mb-5 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Learning Today, Leading Tomorrow</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-main-heading"
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0a192f] tracking-tight leading-[1.12] mb-4"
            >
              From Basics to Brilliance <br />
              <span className="text-[#0f4c81] relative inline-block">
                We Guide Every Step!
                <svg
                  className="absolute -bottom-1.5 left-0 w-full h-2.5 text-amber-400 -z-10 opacity-80"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  fill="currentColor"
                >
                  <path d="M0,8 Q50,0 100,6 L100,12 Q50,6 0,12 Z" />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              id="hero-subtitle"
              className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed mb-8"
            >
              {instituteInfo.leadParagraph}
            </p>

            {/* 4 Feature Pills in a 2x2 grid */}
            <div
              id="hero-feature-pills"
              className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xl mb-8"
            >
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0f4c81] shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Expert Faculty
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Personalized Attention
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Proven Results
                </span>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Safe & Supportive Environment
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div id="hero-cta-group" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <a
                id="hero-explore-courses-btn"
                href="#courses"
                onClick={onOpenCourses}
                className="px-7 py-3.5 rounded-xl bg-[#0e2a47] hover:bg-[#071626] text-white font-bold text-sm sm:text-base text-center shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                id="hero-book-demo-btn"
                onClick={onOpenDemoBooking}
                className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-300 shadow-xs hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Book a Free Demo Class</span>
              </button>
            </div>
          </div>

          {/* Right Column - Hero Visual */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            {/* Warm Golden Glow Backdrop */}
            <div className="relative w-full max-w-md">
              <div className="absolute -top-6 -left-6 w-72 h-72 rounded-full bg-gradient-to-tr from-amber-300/40 via-amber-200/30 to-yellow-100/10 -z-10 blur-xl" />
              <div className="absolute bottom-4 -right-4 w-60 h-60 rounded-full bg-blue-400/20 -z-10 blur-xl" />

              {/* Decorative Yellow Arc from template */}
              <div className="absolute inset-0 -m-4 sm:-m-6 bg-gradient-to-br from-amber-200/50 via-amber-100/40 to-transparent rounded-[2.5rem] -rotate-2 -z-10" />

              {/* Main Image Container */}
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white">
                <img
                  id="hero-students-photo"
                  src={heroStudentsImg}
                  alt="BrightPath Institute happy smiling students with study books and thumbs up"
                  className="w-full h-auto object-cover aspect-[4/3] sm:aspect-square md:aspect-[4/3] transform hover:scale-102 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />

                {/* Gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Badge (1st to 12th Standard, All Boards, JEE) */}
              <div
                id="hero-floating-badge"
                className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5 z-20 whitespace-nowrap"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0f4c81] text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-[#0a192f] leading-tight">
                    1st to 12th Standard
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="text-blue-600">All Boards</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">JEE</span>
                    <span>•</span>
                    <span>More</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
