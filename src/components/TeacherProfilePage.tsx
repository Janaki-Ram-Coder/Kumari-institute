import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  Calendar,
  MessageCircle,
  Check,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Briefcase,
  Home,
  Lightbulb,
  Gamepad2,
  FileText,
  Heart,
  Share2,
  Shield,
  Layers,
  Leaf,
  MessageSquareQuote,
  Send,
  Phone,
  X,
  AlertCircle
} from 'lucide-react';
import { Tutor, TutorReview } from '../data/tutorsData';

interface TeacherProfilePageProps {
  tutor: Tutor;
  onBack: () => void;
  onBookTuition: (tutor: Tutor, plan?: 'month' | 'starter' | 'term') => void;
  onOpenDemoBooking: () => void;
  onOpenEnquiry: () => void;
  isLocationEnabled?: boolean;
}

export const TeacherProfilePage: React.FC<TeacherProfilePageProps> = ({
  tutor,
  onBack,
  onBookTuition,
  onOpenDemoBooking,
  onOpenEnquiry,
  isLocationEnabled = false
}) => {
  // Active Tab state
  const [activeTab, setActiveTab] = useState<'about' | 'subjects' | 'reviews' | 'teaching_style'>('about');

  // Chat with Tutor modal state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [chatSent, setChatSent] = useState(false);

  // All reviews modal state
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  // Horizontal reviews slider ref
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (direction: 'left' | 'right') => {
    if (reviewsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      reviewsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Scroll to top on mount or tutor change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tutor.id]);

  // Tab scrolling helper
  const handleTabClick = (tabKey: 'about' | 'subjects' | 'reviews' | 'teaching_style', sectionId: string) => {
    setActiveTab(tabKey);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Determine display values with graceful fallbacks matching real tutor data
  const tutorName = tutor.name || 'Educator';
  const tutorTagline = tutor.bio ? 'Verified Home Tutor in Rayagada' : 'Profile in Setup';
  const tutorMonthlyFee = tutor.monthlyFee || (tutor.hourlyRate ? tutor.hourlyRate * 10 : 0);
  const tutorRating = tutor.rating || 0;
  const tutorReviewCount = tutor.reviewCount || (tutor.reviews?.length || 0);
  const tutorDegree = tutor.qualification || 'Qualification Pending';
  const tutorUniversity = (tutor as any).university || '';
  const tutorExp = tutor.experienceYears ? `${tutor.experienceYears}+ Years` : 'Experience Pending';

  const hasBio = Boolean(tutor.bio && tutor.bio.trim().length > 0);
  const tutorBio = tutor.bio || '';

  const aboutParagraph = hasBio
    ? tutor.bio
    : `${tutorName} has not populated their biography yet. Tutors can set up their profile to share their teaching experience, subjects, and methodology with parents.`;

  const displayReviews = tutor.reviews && tutor.reviews.length > 0 ? tutor.reviews : [];

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    setChatSent(true);
    setTimeout(() => {
      setChatSent(false);
      setIsChatModalOpen(false);
      setChatMessage('');
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Back Breadcrumb Bar (No duplicate navbar) */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#1d4ed8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#1d4ed8]" />
            <span>Back to All Tutors</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Home</span>
            <span>/</span>
            <span>Tutors</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">{tutorName}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN CONTAINER
         ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* =======================================================================
            HERO SECTION: TEACHER CARD & PRICING PANEL (Exact layout from image)
           ======================================================================= */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Tutor Photo with "Verified Tutor" badge */}
            <div className="w-full sm:w-auto lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100 group">
                {tutor.avatar ? (
                  <img
                    src={tutor.avatar}
                    alt={tutorName}
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0c2340] to-blue-800 text-white flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-5xl font-black">{tutorName.charAt(0).toUpperCase()}</span>
                    <span className="text-xs font-semibold text-blue-200 mt-2">Photo Pending</span>
                  </div>
                )}

                {/* Overlaid Verified Tutor Badge at Bottom Center (Exact as image) */}
                <div className="absolute bottom-3.5 inset-x-0 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md text-xs font-black text-slate-800 border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    <span>{tutor.availabilityBadge || 'Verified Tutor'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle (Desktop) / Main Details (Mobile) */}
            <div className="w-full lg:col-span-5 space-y-4 text-left">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#0c2340] tracking-tight">
                  {tutorName}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
                  {tutorTagline}
                </p>
              </div>

              {/* Star Rating & Review Count */}
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                {tutorReviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-base font-black">{tutorRating}</span>
                    </div>
                    <span className="text-slate-500 font-normal">
                      ({tutorReviewCount} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">
                    New Educator • No reviews yet
                  </span>
                )}
              </div>

              {/* Mobile-Only Pricing & Action Buttons (Directly below Rating as in mobile mockup) */}
              <div className="block lg:hidden pt-2 pb-1 space-y-3">
                <div className="flex items-center justify-between">
                  {tutorMonthlyFee > 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0c2340]">
                        ₹{tutorMonthlyFee.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">/ month</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Fee not set • Set up profile
                    </span>
                  )}

                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Best Value</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tutor.isBooked ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 min-h-[44px] shadow-2xs select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Booked</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBookTuition(tutor)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0c2340] hover:bg-[#14376c] text-white font-black text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Home Tutor</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsChatModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-[#0c2340] font-bold text-sm border border-slate-300 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <MessageCircle className="w-4 h-4 text-[#1d4ed8]" />
                    <span>Chat with Tutor</span>
                  </button>
                </div>
              </div>

              {/* Bio Paragraph or Set Up Profile notice */}
              {hasBio ? (
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {tutorBio}
                </p>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bio not populated yet • Set up your profile to introduce yourself to parents.</span>
                </div>
              )}
            </div>

            {/* Right: Pricing Card & Action Buttons (Desktop only, as mobile is rendered cleanly above) */}
            <div className="hidden lg:block w-full lg:col-span-3 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              {/* Monthly Price & Best Value Badge */}
              <div className="flex items-center justify-between">
                {tutorMonthlyFee > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-[#0c2340]">
                      ₹{tutorMonthlyFee.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ month</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Fee not set • Set up profile
                  </span>
                )}

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Best Value</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {tutor.isBooked ? (
                  <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-sm text-center flex items-center justify-center gap-2 shadow-2xs select-none">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Booked</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="book-now-btn"
                    onClick={() => onBookTuition(tutor)}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0c2340] hover:bg-[#14376c] active:bg-[#071629] text-white font-black text-sm shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Home Tutor</span>
                  </button>
                )}

                {/* Chat with Tutor (Outlined Secondary Button) */}
                <button
                  type="button"
                  id="chat-with-tutor-btn"
                  onClick={() => setIsChatModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0c2340] font-bold text-sm border border-slate-300 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#1d4ed8]" />
                  <span>Chat with Tutor</span>
                </button>
              </div>

              {/* Trust Checklist Underneath */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-medium text-left">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#1d4ed8] stroke-[2.5]" />
                  <span>Free Demo Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#1d4ed8] stroke-[2.5]" />
                  <span>Flexible Timings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#1d4ed8] stroke-[2.5]" />
                  <span>Safe &amp; Trusted</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================================
            NAVIGATION TABS (Hidden on mobile as requested, visible on desktop)
           ======================================================================= */}
        <div className="hidden md:block border-b border-slate-200">
          <nav className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar text-sm sm:text-base font-semibold">
            <button
              type="button"
              onClick={() => handleTabClick('about', 'about-section')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'about'
                  ? 'border-[#0c2340] text-[#0c2340] font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('subjects', 'subjects-section')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'border-[#0c2340] text-[#0c2340] font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Subjects &amp; Classes
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('reviews', 'reviews-section')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-[#0c2340] text-[#0c2340] font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Reviews
            </button>
            <button
              type="button"
              onClick={() => handleTabClick('teaching_style', 'teaching-style-section')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'teaching_style'
                  ? 'border-[#0c2340] text-[#0c2340] font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Teaching Style
            </button>
          </nav>
        </div>

        {/* =======================================================================
            SECTION 1: ABOUT [TEACHER NAME] + INSPIRATIONAL QUOTE CARD
           ======================================================================= */}
        <section id="about-section" className="space-y-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Left: Bio & 3 Feature Cards */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
                  About {tutorName}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
                  {aboutParagraph}
                </p>
              </div>

              {/* 3 Feature Cards in a Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Experience */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#0c2340]">
                      {tutorExp}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Teaching Experience
                    </div>
                  </div>
                </div>

                {/* 2. Degree */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#0c2340]">
                      {tutorDegree}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Degree
                    </div>
                  </div>
                </div>

                {/* 3. Available at Your Home */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#0c2340]">
                      Available at
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Your Home
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Inspirational Quote Card (Light Blue Card from Image) */}
            <div className="lg:col-span-5 bg-[#f0f6fd] rounded-3xl p-6 sm:p-8 border border-blue-100 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-blue-100/60 text-[#1d4ed8] flex items-center justify-center">
                <GraduationCap className="w-9 h-9 stroke-[1.5]" />
              </div>
              <blockquote className="text-xl sm:text-2xl font-bold text-[#0c2340] max-w-xs leading-snug">
                “Small steps every day lead to big results.”
              </blockquote>
              <div className="w-10 h-0.5 bg-blue-300 rounded-full" />
            </div>
          </div>
        </section>

        {/* =======================================================================
            SECTION 2: SUBJECTS & CLASSES (4 Cards Grid from Image)
           ======================================================================= */}
        <section id="subjects-section" className="space-y-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
              Subjects &amp; Classes
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Classes handled: {Array.isArray(tutor.classesHandled) && tutor.classesHandled.length > 0 ? tutor.classesHandled.join(', ') : 'Not specified yet • Profile in progress'}
            </p>
          </div>

          {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {tutor.subjects.map((subject, sIdx) => {
                const icons = [GraduationCap, BookOpen, Leaf, MessageSquareQuote];
                const IconComp = icons[sIdx % icons.length];
                return (
                  <div key={subject + sIdx} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col items-start space-y-3 hover:border-blue-300 transition-colors">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#0c2340]">{subject}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {Array.isArray(tutor.classesHandled) && tutor.classesHandled.length > 0 ? tutor.classesHandled[0] : 'All Classes'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200/80 text-center space-y-2">
              <BookOpen className="w-7 h-7 text-blue-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Subjects Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This educator has not configured the subjects they teach in their profile.
              </p>
            </div>
          )}
        </section>

        {/* =======================================================================
            SECTION 3: HOW I TEACH (Concept Clarity, Interactive, Practice, Attention)
           ======================================================================= */}
        <section id="teaching-style-section" className="space-y-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
              How I Teach
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-1">
              I use simple, interactive and activity-based methods to make{' '}
              <span className="text-[#0284c7] font-semibold">
                learning fun and effective for young learners.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Concept Clarity */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-[#0284c7] flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 text-left">
                <h3 className="text-base font-black text-[#0c2340]">Concept Clarity</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Focus on basic concepts with easy examples.
                </p>
              </div>
            </div>

            {/* 2. Interactive Sessions */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 text-left">
                <h3 className="text-base font-black text-[#0c2340]">Interactive Sessions</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Use puzzles, games and real-life examples.
                </p>
              </div>
            </div>

            {/* 3. Regular Practice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 text-left">
                <h3 className="text-base font-black text-[#0c2340]">Regular Practice</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Worksheets and homework to build confidence.
                </p>
              </div>
            </div>

            {/* 4. Personal Attention */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-start gap-3.5 sm:gap-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 text-left">
                <h3 className="text-base font-black text-[#0c2340]">Personal Attention</h3>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Each child gets individual care and support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================================
            SECTION 4: STUDENT REVIEWS (Horizontal Slider with Left/Right arrows)
           ======================================================================= */}
        <section id="reviews-section" className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0c2340] tracking-tight">
                Student Reviews
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Feedback from parents of our students
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollReviews('left')}
                aria-label="Previous review"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#1d4ed8] shadow-2xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollReviews('right')}
                aria-label="Next review"
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#1d4ed8] shadow-2xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAllReviewsModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 ml-2 text-sm font-bold text-[#1d4ed8] hover:text-blue-800 transition-colors cursor-pointer"
              >
                <span>All Reviews</span>
              </button>
            </div>
          </div>

          {displayReviews.length > 0 ? (
            <div
              ref={reviewsScrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {displayReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="w-[285px] sm:w-[340px] shrink-0 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Reviewer Header */}
                    <div className="flex items-center gap-3">
                      {(rev as any).parentAvatar ? (
                        <img
                          src={(rev as any).parentAvatar}
                          alt={rev.parentName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0c2340] flex items-center justify-center font-black text-sm shrink-0">
                          {rev.parentName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#0c2340] truncate">
                          {rev.parentName}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {rev.studentGrade} • {rev.date}
                        </p>
                      </div>
                    </div>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs font-bold text-slate-800 ml-1">5.0</span>
                    </div>

                    {/* Comment */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {rev.comment}
                    </p>
                  </div>

                  {rev.schoolName && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium truncate">
                      {rev.schoolName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-1.5 max-w-md mx-auto">
              <p className="text-sm font-bold text-slate-800">No student reviews yet</p>
              <p className="text-xs text-slate-500">Book a free trial class with this tutor to experience teaching quality firsthand!</p>
            </div>
          )}
        </section>

        {/* =======================================================================
            SECTION 5: BOTTOM CTA BANNER (Exact card from image)
           ======================================================================= */}
        <section className="bg-[#f0f6fd] rounded-3xl p-5 sm:p-7 border border-blue-100 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            {/* Left: Graphic Icon & Heading */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-blue-100/70 text-[#1d4ed8] flex items-center justify-center shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0c2340]">
                  Give your child the right guidance for a brighter future.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Book a free demo class or directly purchase the plan.
                </p>
              </div>
            </div>

            {/* Right: Two Buttons (Book Now & Chat with Tutor) */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onOpenDemoBooking}
                className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-[#0c2340] hover:bg-[#14376c] active:bg-[#071629] text-white font-black text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Now</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChatModalOpen(true)}
                className="flex-1 sm:flex-none py-3 px-5 rounded-xl bg-white hover:bg-slate-50 text-[#0c2340] font-black text-xs sm:text-sm border border-slate-300 shadow-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#1d4ed8]" />
                <span>Chat with Tutor</span>
              </button>
            </div>
          </div>
        </section>

        {/* =======================================================================
            SECTION 6: BOTTOM TRUST FOOTER BAR (Safe & Trusted, Verified, Flexible)
           ======================================================================= */}
        <section className="pt-2 pb-6">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm font-semibold text-slate-600">
            <div className="inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1d4ed8]" />
              <span>Safe &amp; Trusted</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Tutor</span>
            </div>

            <div className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1d4ed8]" />
              <span>Flexible Timings</span>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          CHAT WITH TUTOR MODAL (Parent-Friendly Interactive Feature)
         ========================================================================= */}
      {isChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsChatModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={tutor.avatar}
                alt={tutorName}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <h4 className="text-base font-black text-[#0c2340]">
                  Chat with {tutorName}
                </h4>
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online for Doorstep Tuitions
                </p>
              </div>
            </div>

            {chatSent ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h5 className="text-base font-black text-slate-900">Message Sent!</h5>
                <p className="text-xs text-slate-500">
                  {tutorName} will respond to your WhatsApp/Phone shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendChat} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name (Parent)
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Mrs. Sunita Mohanty"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    What would you like to ask?
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Hello ${tutorName}, I am looking for a home tutor for my child in Class 3...`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0c2340] hover:bg-[#14376c] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message to {tutorName}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ALL REVIEWS MODAL
         ========================================================================= */}
      {isAllReviewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] p-6 shadow-2xl border border-slate-200 relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="text-left">
                <h4 className="text-xl font-black text-[#0c2340]">
                  Parent Reviews for {tutorName}
                </h4>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{tutorRating}</span>
                  </div>
                  <span>•</span>
                  <span>{tutorReviewCount} Verified Ratings</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllReviewsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 text-left pr-1">
              {displayReviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-slate-900">{rev.parentName}</div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {rev.studentGrade} • {rev.schoolName} • {rev.date}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
