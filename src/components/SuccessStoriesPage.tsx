import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  GraduationCap,
  Users,
  Heart,
  ArrowRight,
  UserCheck,
  Award,
} from 'lucide-react';
import { AdminSuccessStory } from '../types';
import { subscribeToRealtimeSuccessStories } from '../services/firebaseAuth';

interface SuccessStoriesPageProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onOpenEnquiry: () => void;
  onOpenDemoBooking?: () => void;
}

export const SuccessStoriesPage: React.FC<SuccessStoriesPageProps> = ({
  onNavigateHome,
  onOpenEnquiry,
}) => {
  const [dynamicStories, setDynamicStories] = useState<AdminSuccessStory[]>([]);

  useEffect(() => {
    // Real-time subscription to Firestore collection 'success_stories'
    const unsub = subscribeToRealtimeSuccessStories((stories) => {
      setDynamicStories(stories);
    });

    return () => unsub();
  }, []);
  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-amber-200 selection:text-slate-900">
      {/* =========================================================================
          1. HERO SECTION: "Success Stories" with Student Hero Visual & Doodles
         ========================================================================= */}
      <section className="relative bg-gradient-to-b from-[#eaf4fe] via-[#f4f9ff] to-white pt-6 pb-12 sm:pt-10 sm:pb-16 md:pb-20 overflow-hidden border-b border-blue-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Heading, Subheading, and Description */}
            <div className="lg:col-span-7 text-left">
              {/* Eyebrow in blue script/italic matching reference */}
              <p className="text-sm sm:text-base font-semibold text-[#1d4ed8] italic tracking-wide mb-2 select-none">
                Real Students &nbsp;•&nbsp; Real Growth &nbsp;•&nbsp; Bright Futures
              </p>

              {/* Main Heading: "Success Stories" */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
                <span className="text-[#0c2340]">Success </span>
                <span className="text-amber-500">Stories</span>
              </h1>

              {/* Secondary Bold Subheading */}
              <h2 className="text-lg sm:text-xl font-bold text-[#0c2340] mt-3 sm:mt-4">
                Every achievement inspires us to do better.
              </h2>

              {/* Descriptive Paragraph */}
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-normal">
                At Kumari Institute in Indira Nagar, we believe in nurturing every child's potential. Here are some of our proud moments — stories of students who dreamed, learned and achieved with our support.
              </p>
            </div>

            {/* Right Column: Hero Girl Visual with Doodles */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-md flex items-center justify-center">
                {/* Hero Student Photo */}
                <div className="relative z-10 w-10/12 sm:w-11/12 rounded-[32px] overflow-hidden shadow-lg border-4 border-white bg-white">
                  <img
                    src="/images/success/hero_girl.jpg"
                    alt="Student studying with books and notebook at Kumari Institute"
                    className="w-full h-64 sm:h-76 md:h-84 object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Top-Left Sunshine Doodle Rays overhead */}
                <div className="absolute top-0 left-6 sm:left-8 z-20 pointer-events-none select-none">
                  <svg className="w-12 sm:w-14 h-8 text-slate-800" viewBox="0 0 70 35" fill="none">
                    <line x1="35" y1="32" x2="35" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="20" y1="32" x2="8" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="50" y1="32" x2="62" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Right Whimsical Note: "Small steps today, big dreams tomorrow ♡" */}
                <div className="absolute -right-2 sm:-right-4 top-4 sm:top-6 z-20 flex flex-col items-center select-none pointer-events-none drop-shadow-xs">
                  <span className="font-handwriting text-xl sm:text-2xl md:text-3xl text-[#1e40af] font-bold tracking-wide transform rotate-3 leading-tight text-center">
                    Small steps<br />
                    today,<br />
                    big dreams<br />
                    tomorrow <span className="inline-block text-xl">♡</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FEATURED SUCCESS STORY: Aaradhya Sahu + Sticky Note
         ========================================================================= */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#fffefc] rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-200/90 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
              {/* Left Column: Student Portrait + "Top Performer" Badge */}
              <div className="lg:col-span-3 flex flex-col items-center">
                <div className="relative w-full max-w-[240px] rounded-2xl overflow-hidden shadow-md border-2 border-white group">
                  <img
                    src="/images/success/aaradhya.jpg"
                    alt="Aaradhya Sahu - Top Performer at Kumari Institute"
                    className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Top Performer Badge overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-11/12 bg-amber-400 text-slate-900 font-black text-xs sm:text-sm py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-md">
                    <Trophy className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                    <span>Top Performer</span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Student Story, Quote, and Achievement Badges */}
              <div className="lg:col-span-6 text-left">
                {/* Featured Tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-800 text-xs font-bold mb-2">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Featured Success Story</span>
                </div>

                {/* Student Name & Grade */}
                <h3 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
                  Aaradhya Sahu
                </h3>
                <div className="mt-1 mb-3">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold">
                    5th Standard
                  </span>
                </div>

                {/* Student Quote */}
                <div className="my-3">
                  <p className="text-sm sm:text-base italic text-[#1d4ed8] font-semibold leading-relaxed">
                    <span className="text-amber-500 font-serif font-black text-lg not-italic">“ </span>
                    Before joining Kumari Institute, I was a little afraid to speak in class. Now I am more confident, I love learning, and I even help my friends with their studies.
                    <span className="text-amber-500 font-serif font-black text-lg not-italic"> ”</span>
                  </p>
                </div>

                {/* Narrative Details */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  Aaradhya joined our 1st to 5th standard program and has shown excellent progress in both academics and confidence. Her parents share that she is now more focused, curious and happy.
                </p>

                {/* 3 Achievement Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#0c2340] leading-snug">
                      Improved English &amp; Math Scores
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-[#0c2340] leading-snug">
                      Confident in Class Participation
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#0c2340] leading-snug">
                      Very Active in Co-Curricular Activities
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Note from Parents */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="w-full max-w-[260px] bg-[#fef9c3] p-5 sm:p-6 rounded-2xl shadow-sm border border-yellow-200/90 relative transform rotate-1 sm:rotate-2 hover:rotate-0 transition-transform duration-300">
                  {/* Tape decoration at top-right corner */}
                  <div className="absolute -top-2.5 right-6 w-12 h-5 bg-amber-200/70 backdrop-blur-xs rounded-xs transform -rotate-6 border border-amber-300/40" />

                  <p className="font-handwriting text-lg sm:text-xl text-[#1e3a8a] font-bold leading-relaxed">
                    “The teachers are very supportive and caring. We are truly thankful to Kumari Institute.”
                  </p>

                  <p className="mt-4 text-xs font-bold text-amber-800 text-right">
                    — Aaradhya's Parents
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MORE SUCCESS STORIES: 4 Student Cards Grid
         ========================================================================= */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header with flanking golden accent lines */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3">
              <span className="w-8 sm:w-12 h-1 bg-amber-400 rounded-full" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0c2340] tracking-tight">
                More Success Stories
              </h2>
              <span className="w-8 sm:w-12 h-1 bg-amber-400 rounded-full" />
            </div>
            <p className="mt-2 text-sm sm:text-base text-slate-600 font-normal">
              Here are a few more inspiring stories from our students and their families.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Card 1: Rohit Kumar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-left">
              <div>
                {/* Circular Portrait with soft cyan background */}
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-sky-100 border-2 border-white shadow-xs mb-4">
                  <img
                    src="/images/success/rohit.jpg"
                    alt="Rohit Kumar - 3rd Standard Student"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h4 className="text-base font-black text-[#0c2340]">
                  Rohit Kumar
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  3rd Standard
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  <span className="text-amber-500 font-serif font-bold">“</span>
                  My son's handwriting and reading skills have improved so much. Thank you for your consistent support!
                  <span className="text-amber-500 font-serif font-bold">”</span>
                </p>
              </div>

              <p className="text-[11px] font-bold text-slate-400 mt-4 pt-3 border-t border-slate-50">
                — Rohit Kumar's Father
              </p>
            </div>

            {/* Card 2: Saniya Patel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-left">
              <div>
                {/* Circular Portrait */}
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-sky-100 border-2 border-white shadow-xs mb-4">
                  <img
                    src="/images/success/saniya.jpg"
                    alt="Saniya Patel - 5th Standard Student"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h4 className="text-base font-black text-[#0c2340]">
                  Saniya Patel
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  5th Standard
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  <span className="text-amber-500 font-serif font-bold">“</span>
                  The online classes are very well organized and the teachers explain everything in a simple way. My daughter loves it!
                  <span className="text-amber-500 font-serif font-bold">”</span>
                </p>
              </div>

              <p className="text-[11px] font-bold text-slate-400 mt-4 pt-3 border-t border-slate-50">
                — Saniya's Mother
              </p>
            </div>

            {/* Card 3: Aditya Reddy */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-left">
              <div>
                {/* Circular Portrait */}
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-sky-100 border-2 border-white shadow-xs mb-4">
                  <img
                    src="/images/success/aditya.jpg"
                    alt="Aditya Reddy - 8th Standard Student"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h4 className="text-base font-black text-[#0c2340]">
                  Aditya Reddy
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  8th Standard
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  <span className="text-amber-500 font-serif font-bold">“</span>
                  The institute helped me improve my maths and science concepts. I scored well in my last exams.
                  <span className="text-amber-500 font-serif font-bold">”</span>
                </p>
              </div>

              <p className="text-[11px] font-bold text-slate-400 mt-4 pt-3 border-t border-slate-50">
                — Aditya's Father
              </p>
            </div>

            {/* Card 4: Meghana Das */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-left">
              <div>
                {/* Circular Portrait */}
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-sky-100 border-2 border-white shadow-xs mb-4">
                  <img
                    src="/images/success/meghana.jpg"
                    alt="Meghana Das - 10th Standard Student"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <h4 className="text-base font-black text-[#0c2340]">
                  Meghana Das
                </h4>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  10th Standard
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                  <span className="text-amber-500 font-serif font-bold">“</span>
                  The guidance and mock tests really helped me prepare for my board exams. I am now more confident about my future.
                  <span className="text-amber-500 font-serif font-bold">”</span>
                </p>
              </div>

              <p className="text-[11px] font-bold text-slate-400 mt-4 pt-3 border-t border-slate-50">
                — Meghana's Mother
              </p>
            </div>

            {/* Dynamic Stories Added by Admin */}
            {dynamicStories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between text-left relative overflow-hidden"
              >
                {story.badge && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1 border border-amber-300">
                    <Award className="w-3 h-3 text-amber-700" />
                    <span>{story.badge}</span>
                  </div>
                )}
                <div>
                  <div className="w-28 h-28 rounded-full overflow-hidden mx-auto bg-amber-50 border-2 border-amber-200 shadow-xs mb-4">
                    <img
                      src={story.image || '/images/success/hero_girl.jpg'}
                      alt={story.studentName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <h4 className="text-base font-black text-[#0c2340]">
                    {story.studentName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 mt-0.5">
                    {story.score && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[11px] rounded-md">
                        {story.score}
                      </span>
                    )}
                    {story.exam && (
                      <span className="text-[11px] text-slate-500 font-medium truncate">
                        {story.exam}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    <span className="text-amber-500 font-serif font-bold">“</span>
                    {story.testimonial}
                    <span className="text-amber-500 font-serif font-bold">”</span>
                  </p>
                </div>

                <p className="text-[11px] font-bold text-slate-500 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span>— {story.parentName ? `${story.parentName}'s Family` : "Parent's Feedback"}</span>
                  {story.school && <span className="text-[10px] text-slate-400 truncate max-w-[110px]">{story.school}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. OUR PROUD ACHIEVEMENTS: Numbers that reflect commitment + 4 Stat Cards
         ========================================================================= */}
      <section className="py-6 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#f0f7fe] rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-100/80 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left Column: Trophy icon, title, subtitle & button */}
              <div className="lg:col-span-4 text-left">
                {/* Golden Trophy Icon */}
                <div className="mb-2">
                  <Trophy className="w-8 h-8 text-amber-500 fill-amber-400" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
                  Our Proud Achievements
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 mb-4 leading-relaxed font-normal">
                  Numbers that reflect our commitment to your child's success.
                </p>

                <button
                  type="button"
                  onClick={onOpenEnquiry}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>View More Stories</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Right Column: 4 Stat Cards */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Stat 1: 500+ Happy Students */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                    500+
                  </span>
                  <span className="text-xs text-slate-600 font-medium mt-0.5">
                    Happy Students
                  </span>
                </div>

                {/* Stat 2: 95% Academic Improvement */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                    95%
                  </span>
                  <span className="text-xs text-slate-600 font-medium mt-0.5">
                    Academic Improvement
                  </span>
                </div>

                {/* Stat 3: 100+ Top Performers */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                    100+
                  </span>
                  <span className="text-xs text-slate-600 font-medium mt-0.5">
                    Top Performers
                  </span>
                </div>

                {/* Stat 4: 100% Parent Satisfaction */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-2xs text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight">
                    100%
                  </span>
                  <span className="text-xs text-slate-600 font-medium mt-0.5">
                    Parent Satisfaction
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. WHAT PARENTS SAY: Family Portrait + Testimonial + Whimsical Doodle
         ========================================================================= */}
      <section className="py-6 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#fffdf7] rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-200/70 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* Left: Circular Family Photo with 3 Sunshine Rays on the Left */}
              <div className="lg:col-span-3 relative flex items-center justify-center">
                {/* 3 Blue Sunshine Rays on the Left */}
                <div className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 select-none pointer-events-none">
                  <svg className="w-8 sm:w-10 h-16 text-[#1d4ed8]" viewBox="0 0 40 80" fill="none">
                    <line x1="36" y1="40" x2="8" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="36" y1="26" x2="12" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="36" y1="54" x2="12" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-3 border-white shadow-md bg-white">
                  <img
                    src="/images/success/family.jpg"
                    alt="Priyanka Sharma with her daughter"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Center: Quote Content */}
              <div className="lg:col-span-6 text-left">
                {/* Quotation Mark & Title */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl font-serif font-black text-amber-500 leading-none">
                    “
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0c2340]">
                    What Parents Say
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  “<span className="font-semibold text-[#0c2340]">Kumari Institute</span> has given my child the right guidance, encouragement and environment to grow. The teachers are caring, patient and truly dedicated. We are happy to be a part of this journey.”
                </p>

                <p className="mt-3 text-xs font-bold text-slate-500">
                  — Mrs. Priyanka Sharma (Parent of 5th Standard Student)
                </p>
              </div>

              {/* Right: Whimsical Doodle flanked by sunshine rays */}
              <div className="lg:col-span-3 flex items-center justify-center">
                <div className="relative flex items-center gap-2 select-none pointer-events-none text-center">
                  {/* Left Sunshine Rays */}
                  <svg className="w-6 h-12 text-amber-400 shrink-0" viewBox="0 0 30 60" fill="none">
                    <line x1="26" y1="30" x2="6" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="24" y1="18" x2="8" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="24" y1="42" x2="8" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>

                  <span className="font-handwriting text-xl sm:text-2xl text-[#1e3a8a] font-bold leading-tight">
                    Happy Parents<br />
                    Build<br />
                    Confident Children
                  </span>

                  {/* Right Sunshine Rays */}
                  <svg className="w-6 h-12 text-amber-400 shrink-0" viewBox="0 0 30 60" fill="none">
                    <line x1="4" y1="30" x2="24" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="6" y1="18" x2="22" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="6" y1="42" x2="22" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. BOTTOM NAVY CTA BANNER: "Give Your Child the Right Guidance" + Kids Visual
         ========================================================================= */}
      <section className="mt-8 sm:mt-12 bg-[#0c2340] text-white pt-10 pb-8 sm:pt-14 sm:pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Graduation Cap Doodle + Handwritten Text */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start select-none pointer-events-none text-center lg:text-left">
              {/* Graduation Cap Doodle */}
              <div className="mb-2">
                <svg className="w-12 h-10 text-amber-400" viewBox="0 0 60 50" fill="none">
                  <polygon points="30,8 55,20 30,32 5,20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
                  <path d="M15,26 L15,38 C15,44 45,44 45,38 L45,26" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M50,22 L50,38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="50" cy="40" r="2.5" fill="currentColor" />
                </svg>
              </div>

              <span className="font-handwriting text-2xl sm:text-3xl text-white font-bold tracking-wide transform -rotate-3 leading-snug">
                Let's Build<br />
                a Brighter Future Together
              </span>

              {/* Curved golden underline */}
              <svg className="w-24 sm:w-28 h-4 text-amber-400 mt-1 transform -rotate-3" viewBox="0 0 100 20" fill="none">
                <path d="M5 14 Q 50 3 95 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>

            {/* Center: Headline, Subheading, and Golden Button */}
            <div className="lg:col-span-4 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Give Your Child the Right Guidance
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-6 font-normal">
                Join Kumari Institute today and be a part of countless success stories.
              </p>

              <button
                type="button"
                id="success-cta-enroll-btn"
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2 px-8 sm:px-10 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
              >
                <span>Enroll Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Right: Cheerful Students Illustration with Doodles */}
            <div className="lg:col-span-4 relative flex items-center justify-center">
              <div className="relative w-full max-w-[280px]">
                {/* Sunshine Doodle Rays overhead */}
                <div className="absolute -top-4 right-8 select-none pointer-events-none">
                  <svg className="w-10 h-6 text-amber-400" viewBox="0 0 50 30" fill="none">
                    <line x1="25" y1="26" x2="25" y2="6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="12" y1="26" x2="4" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="38" y1="26" x2="46" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Illustrated Students Image */}
                <img
                  src="/images/success/cta_kids.jpg"
                  alt="Happy students of Kumari Institute"
                  className="w-full h-auto object-contain rounded-2xl drop-shadow-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
