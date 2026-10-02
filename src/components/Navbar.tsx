import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  X,
  UserCheck,
  Home,
  User,
  Star,
  Image as ImageIcon,
  Phone,
  GraduationCap,
  ChevronRight,
  MapPin,
  Heart,
  Facebook,
  Instagram,
  Youtube,
  Search,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { instituteInfo } from '../data/instituteData';

interface NavbarProps {
  activeTab?: 'home' | 'about' | 'success' | 'gallery' | 'contact' | 'tutors' | 'exam-prep' | 'auth' | 'profile' | 'teacher-complete-profile' | 'admin' | string;
  currentUser?: {
    name: string;
    role: 'parent' | 'teacher' | 'admin';
    email: string;
    phone?: string;
    profileCompleted?: boolean;
  } | null;
  onOpenProfile?: () => void;
  onNavigateHome: () => void;
  onNavigateTutors: () => void;
  onNavigateExamPrep?: () => void;
  onNavigateAbout: () => void;
  onNavigateSuccess: () => void;
  onNavigateGallery: () => void;
  onNavigateContact: () => void;
  onNavigateAdmin?: () => void;
  onOpenEnquiry: () => void;
  onOpenDemoBooking?: () => void;
  onNavigateAuth?: (mode?: 'login' | 'create-parent' | 'create-teacher', role?: 'parent' | 'teacher') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'home',
  currentUser,
  onOpenProfile,
  onNavigateHome,
  onNavigateTutors,
  onNavigateExamPrep,
  onNavigateAbout,
  onNavigateSuccess,
  onNavigateGallery,
  onNavigateContact,
  onNavigateAdmin,
  onOpenEnquiry,
  onNavigateAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email?.toLowerCase() === 'chandinikurumoju424@gmail.com';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Desktop navigation links - Matches screenshot with Courses
  const desktopNavItems = [
    { label: 'Home', id: 'home', action: onNavigateHome },
    { label: 'Find Tutors', id: 'tutors', action: onNavigateTutors },
    { label: 'Courses', id: 'exam-prep', action: onNavigateExamPrep || onNavigateHome },
    { label: 'About Us', id: 'about', action: onNavigateAbout },
    { label: 'Success Stories', id: 'success', action: onNavigateSuccess },
    { label: 'Gallery', id: 'gallery', action: onNavigateGallery },
    { label: 'Contact', id: 'contact', action: onNavigateContact },
    ...(isAdmin ? [{ label: 'Admin Panel', id: 'admin', action: onNavigateAdmin || onNavigateHome }] : []),
  ];

  // Mobile menu items
  const mobileNavItems = [
    { label: 'Home', id: 'home', icon: Home, action: onNavigateHome },
    { label: 'Find Tutors', id: 'tutors', icon: Search, action: onNavigateTutors },
    { label: 'Courses (Exam Prep)', id: 'exam-prep', icon: GraduationCap, action: onNavigateExamPrep || onNavigateHome },
    { label: 'About Us', id: 'about', icon: User, action: onNavigateAbout },
    { label: 'Success Stories', id: 'success', icon: Star, action: onNavigateSuccess },
    { label: 'Gallery', id: 'gallery', icon: ImageIcon, action: onNavigateGallery },
    { label: 'Contact', id: 'contact', icon: Phone, action: onNavigateContact },
    ...(isAdmin ? [{ label: 'Admin Panel', id: 'admin', icon: ShieldCheck, action: onNavigateAdmin || onNavigateHome }] : []),
  ];

  return (
    <header
      id="main-navbar"
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? 'shadow-md border-b border-slate-100' : 'border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo with "Kumari Institute in Indira Nagar" */}
          <button
            type="button"
            id="brand-logo-link"
            onClick={onNavigateHome}
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg py-1 cursor-pointer text-left"
          >
            <img
              src="Logo/kumarilogo.png"
              alt="Kumari Institute Logo"
              className="h-10 sm:h-12 lg:h-14 w-auto max-w-[180px] sm:max-w-[220px] lg:max-w-[260px] object-contain group-hover:scale-102 transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav-links" className="hidden lg:flex items-center gap-6 xl:gap-8">
            {desktopNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`text-sm font-semibold transition-all py-1.5 relative cursor-pointer ${
                    isActive
                      ? 'text-[#0c2340] font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-400'
                      : 'text-slate-700 hover:text-[#0c2340] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-400 hover:after:w-full after:transition-all after:duration-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Call to Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                id="desktop-admin-panel-btn"
                onClick={onNavigateAdmin}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                }`}
                title="Go to Admin Panel"
              >
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              type="button"
              id="desktop-find-tutors-btn"
              onClick={onNavigateTutors}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                activeTab === 'tutors'
                  ? 'bg-[#1d4ed8] text-white shadow-xs'
                  : 'bg-blue-50 text-[#1d4ed8] hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Find Tutors</span>
            </button>

            {/* Desktop Log In or User Profile Button */}
            {currentUser ? (
              <button
                type="button"
                id="desktop-profile-btn"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 text-[#0c2340] shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group"
                title="Click to view My Profile"
              >
                <div
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-black text-xs shadow-2xs ${
                    currentUser.role === 'admin'
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950'
                      : currentUser.role === 'teacher'
                      ? 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                      : 'bg-gradient-to-tr from-[#0c2340] to-[#1d4ed8]'
                  }`}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : currentUser.role === 'teacher'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'teacher' ? 'Teacher' : 'Parent'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                id="desktop-login-btn"
                onClick={() => onNavigateAuth?.('login', 'parent')}
                className={`inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer ${
                  activeTab === 'auth'
                    ? 'bg-[#0c2340] text-white ring-2 ring-amber-400'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile & Tablet (< 1024px) Menu Toggle & Log In / Profile Action */}
          <div className="flex lg:hidden items-center gap-2 sm:gap-3">
            {currentUser ? (
              <button
                type="button"
                id="mobile-profile-header-btn"
                onClick={onOpenProfile}
                className={`px-3 py-1.5 rounded-full border font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : currentUser.role === 'teacher'
                    ? 'bg-purple-50 border-purple-200 text-purple-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-black ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-600 text-slate-950'
                      : currentUser.role === 'teacher'
                      ? 'bg-purple-700'
                      : 'bg-[#0c2340]'
                  }`}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[75px] truncate">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ({currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'teacher' ? 'Tutor' : 'Parent'})
                </span>
              </button>
            ) : (
              <button
                type="button"
                id="mobile-login-header-btn"
                onClick={() => onNavigateAuth?.('login', 'parent')}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer transition-all"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log In</span>
              </button>
            )}
            <button
              type="button"
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 stroke-[2.3]" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FULL-SCREEN PROFESSIONAL MOBILE MENU DRAWER (PORTALED TO BODY FOR RELIABILITY)
         ========================================================================= */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="mobile-fullscreen-drawer"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-white overflow-y-auto flex flex-col justify-between"
            style={{ minHeight: '100dvh' }}
          >
            {/* Top Header Bar */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100/80 sticky top-0 bg-white/98 backdrop-blur-md z-10 shadow-xs">
              <div className="flex items-center">
                <img
                  src="Logo/kumarilogo.png"
                  alt="Kumari Institute Logo"
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <button
                type="button"
                id="mobile-menu-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-1 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-5 flex-1 flex flex-col space-y-4 max-w-md mx-auto w-full pb-8">
              {/* Top Motto Banner: "Better Learning Brighter Future" with Graduation Cap */}
              <div className="bg-[#edf5fd] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden border border-blue-100/60 shadow-xs">
                {/* Circular Navy Badge with Graduation Cap */}
                <div className="w-12 h-12 rounded-full bg-[#0c2340] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                </div>

                {/* Text & Yellow Curved Underline */}
                <div className="flex flex-col text-left relative z-10">
                  <span className="text-sm font-semibold italic text-[#0c2340]">
                    Better Learning
                  </span>
                  <span className="text-lg font-black text-[#0c2340] leading-tight">
                    Brighter Future
                  </span>
                  <svg
                    className="w-24 h-2 text-amber-400 mt-1"
                    viewBox="0 0 100 8"
                    fill="none"
                  >
                    <path
                      d="M2 6C30 2 70 2 98 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Soft decorative geometric background shape */}
                <div className="absolute right-0 top-0 bottom-0 w-28 bg-blue-100/30 rounded-l-full pointer-events-none" />
              </div>

              {/* Navigation Links List (Professional & Parent Friendly) */}
              <div className="space-y-1.5 pt-1">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.action();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#eaf3fd] text-[#1d4ed8] font-bold shadow-xs'
                          : 'text-[#0c2340] hover:bg-slate-50 active:bg-slate-100 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? 'text-[#1d4ed8]' : 'text-[#0c2340]'
                          }`}
                        />
                        <span className="text-base font-bold">{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 stroke-[2.5] ${
                          isActive ? 'text-[#1d4ed8]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Login / Profile Quick Section in Mobile Drawer */}
              <div className="pt-1">
                {currentUser ? (
                  <button
                    type="button"
                    id="mobile-drawer-profile-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs transition-transform active:scale-98 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white text-purple-800 flex items-center justify-center font-black text-sm shrink-0">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="text-left truncate">
                        <div className="truncate text-white font-bold">{currentUser.name}</div>
                        <div className="text-[11px] text-purple-200 font-medium">
                          {currentUser.profileCompleted ? 'Profile Complete (Verified)' : 'Profile Incomplete (Action Needed)'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-200 shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="mobile-drawer-login-btn"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateAuth?.('login', 'parent');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#0c2340] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>Log In / Create Account</span>
                  </button>
                )}
              </div>

              {/* Subtle Divider Line */}
              <div className="pt-2 border-b border-blue-100/80" />

              {/* "Need Help?" Card with Golden Direct Call Button */}
              <div className="bg-[#edf5fd] rounded-2xl p-5 border border-blue-100/70 shadow-xs">
                <div className="flex items-center gap-3.5 text-left mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#0c2340] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#0c2340] leading-tight">
                      Need Help?
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Talk to our team for any queries.
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${instituteInfo.phoneClean}`}
                  className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
                >
                  <Phone className="w-4 h-4 fill-slate-900 stroke-none" />
                  <span>{instituteInfo.phone}</span>
                </a>
              </div>

              {/* Bottom Card with Social Links, Location & Hand-styled Slogan */}
              <div className="bg-[#f4f9fe] rounded-2xl p-5 border border-blue-100/50 text-center space-y-3.5">
                {/* Follow Us with Circular Social Icons */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs font-bold text-slate-700">
                    Follow Us
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-[#0c2340] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Location Badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
                  <span>Indira Nagar, Rayagada, Odisha</span>
                </div>

                {/* Hand-styled Slogan with Heart and Yellow Brush Smile Curve */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[#1d4ed8] font-serif italic text-base font-bold">
                    <span>Better Learning</span>
                    <span className="font-sans text-xs not-italic mx-0.5">·</span>
                    <span>Brighter Future</span>
                    <Heart className="w-3.5 h-3.5 fill-[#1d4ed8] text-[#1d4ed8] inline ml-0.5" />
                  </div>
                  <svg
                    className="w-36 h-2.5 text-amber-400 mt-0.5"
                    viewBox="0 0 140 10"
                    fill="none"
                  >
                    <path
                      d="M4 8C45 2 95 2 136 8"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
