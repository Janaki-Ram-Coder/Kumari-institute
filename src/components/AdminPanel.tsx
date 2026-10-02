import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  GraduationCap,
  FileText,
  Search,
  Users,
  Eye,
  Check,
  X,
  Bell,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Award,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  MessageSquare,
  Ban,
  Upload,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  History,
  IndianRupee,
  CreditCard,
  ArrowDownRight,
  Filter,
  Download,
  Printer,
  CheckSquare,
  Layers,
  FileCheck,
  Landmark,
  Home,
  Copy,
  Receipt,
  Star,
  UserPlus,
  SlidersHorizontal
} from 'lucide-react';
import { Tutor, TutorReview } from '../data/tutorsData';
import {
  HomeTutorBooking,
  OfflineDemoQuery,
  AdminGalleryItem,
  AdminSuccessStory,
  AdminActivityLog,
  ActivityCategory,
  ActivityActionType
} from '../types';
import {
  subscribeToAllTeachersForAdmin,
  adminVerifyTutorInDatabase,
  adminToggleTutorVisibility,
  subscribeToRealtimeBookings,
  adminAcceptAndAssignTutorBooking,
  adminDeclineTutorBooking,
  saveSuccessStoryToFirestore,
  deleteSuccessStoryFromFirestore,
  subscribeToRealtimeSuccessStories,
  subscribeToRealtimeActivityLogs,
  logAdminActivity,
  adminAddTutorReview,
  adminDeleteTutorReview,
  subscribeToAllParentsForAdmin,
  adminDirectAssignTutorToParent,
  AppUserProfile
} from '../services/firebaseAuth';
import { IncomingBookings } from './IncomingBookings';
import { uploadImageToImgBB } from '../services/imgbbService';
import { AdminActivityLogsTab } from './AdminActivityLogsTab';
import { AdminRecordPaymentModal } from './AdminRecordPaymentModal';
import { AdminReceiptVoucherModal } from './AdminReceiptVoucherModal';

interface AdminPanelProps {
  currentUser?: AppUserProfile | null;
  onNavigateHome: () => void;
  onNavigateTutors?: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateTutors,
  onLogout
}) => {
  // Navigation tabs - Includes dedicated 'incoming_bookings', 'assigned_tutors', 'activity_logs', 'tutor_reviews', and 'registered_directory'
  const [activeTab, setActiveTab] = useState<
    'tutors' | 'incoming_bookings' | 'assigned_tutors' | 'bookings' | 'offline_queries' | 'gallery' | 'success_stories' | 'activity_logs' | 'tutor_reviews' | 'registered_directory'
  >('incoming_bookings');

  // Registered Directory State (Parents & Tutors)
  const [registeredParents, setRegisteredParents] = useState<AppUserProfile[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState<boolean>(true);
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<'all' | 'parents' | 'tutors'>('all');
  const [parentAssignmentFilter, setParentAssignmentFilter] = useState<'all' | 'unassigned' | 'assigned' | 'pending'>('all');
  const [directorySearch, setDirectorySearch] = useState<string>('');

  // Direct Assign Modal for unassigned parent
  const [directAssignParent, setDirectAssignParent] = useState<AppUserProfile | null>(null);
  const [directAssignTutorId, setDirectAssignTutorId] = useState<string>('');
  const [directAssignSlot, setDirectAssignSlot] = useState<string>('5:00 PM - 6:00 PM');
  const [directAssignNotes, setDirectAssignNotes] = useState<string>('');
  const [isDirectAssigning, setIsDirectAssigning] = useState<boolean>(false);

  // 1. Tutors state
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [tutorFilter, setTutorFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [tutorSearch, setTutorSearch] = useState('');
  const [selectedTutorForReview, setSelectedTutorForReview] = useState<Tutor | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  // Certificate Lightbox Preview Modal state
  const [previewCertDoc, setPreviewCertDoc] = useState<{ title: string; url: string; details?: string } | null>(null);

  // 2. Bookings & Assignment state
  const [bookings, setBookings] = useState<HomeTutorBooking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'pending' | 'accepted' | 'declined' | 'all'>('pending');
  const [isAssigning, setIsAssigning] = useState(false);
  const [reassignModalBooking, setReassignModalBooking] = useState<HomeTutorBooking | null>(null);
  const [selectedReassignTutorId, setSelectedReassignTutorId] = useState<string>('');
  const [reassignNotes, setReassignNotes] = useState('');

  // Decline Booking Modal state
  const [declineModalBooking, setDeclineModalBooking] = useState<HomeTutorBooking | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Selected time slot is already fully occupied.');
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');
  const [isDeclining, setIsDeclining] = useState<boolean>(false);

  // Assigned Tutors search query
  const [assignedSearch, setAssignedSearch] = useState<string>('');

  // 3. Offline Demo Queries state
  const [demoQueries, setDemoQueries] = useState<OfflineDemoQuery[]>([]);

  // 4. Gallery state
  const [galleryItems, setGalleryItems] = useState<AdminGalleryItem[]>([]);
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<'students' | 'classrooms' | 'building' | 'events'>('students');
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [newGallerySubtitle, setNewGallerySubtitle] = useState('');

  // 5. Success Stories state
  const [successStories, setSuccessStories] = useState<AdminSuccessStory[]>([]);
  const [isAddingStory, setIsAddingStory] = useState(false);
  const [newStoryName, setNewStoryName] = useState('');
  const [newStoryScore, setNewStoryScore] = useState('');
  const [newStoryExam, setNewStoryExam] = useState('');
  const [newStorySchool, setNewStorySchool] = useState('');
  const [newStoryParent, setNewStoryParent] = useState('');
  const [newStoryTestimonial, setNewStoryTestimonial] = useState('');
  const [newStoryImage, setNewStoryImage] = useState('');
  const [newStoryBadge, setNewStoryBadge] = useState('Top Performer');
  const [newStoryYear, setNewStoryYear] = useState('2024');
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [storyImagePreview, setStoryImagePreview] = useState<string>('');
  const [isUploadingStoryImage, setIsUploadingStoryImage] = useState(false);

  // 6. Activity Logs & Audit Trail state
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState<boolean>(true);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<ActivityCategory>('all');
  const [activityAdminFilter, setActivityAdminFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [activityTimeFilter, setActivityTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AdminActivityLog | null>(null);

  // Record Payment / Action Modal state
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState<boolean>(false);
  const [recordActionType, setRecordActionType] = useState<
    'payment_home_tutor' | 'payment_course' | 'tutor_approved' | 'demo_booking_handled'
  >('payment_home_tutor');
  const [recordAdminName, setRecordAdminName] = useState<string>('Admin Chandini Kurumoju');
  const [recordStudentName, setRecordStudentName] = useState<string>('');
  const [recordParentName, setRecordParentName] = useState<string>('');
  const [recordParentPhone, setRecordParentPhone] = useState<string>('');
  const [recordTutorId, setRecordTutorId] = useState<string>('');
  const [recordTutorName, setRecordTutorName] = useState<string>('');
  const [recordCourseTitle, setRecordCourseTitle] = useState<string>('JNVST Navodaya Class 6 Exam Prep Course');
  const [recordAmount, setRecordAmount] = useState<string>('3000');
  const [recordPaymentMethod, setRecordPaymentMethod] = useState<
    'UPI / QR' | 'Cash (At Center)' | 'Bank Transfer / NEFT' | 'Online Card / Gateway'
  >('UPI / QR');
  const [recordTransactionId, setRecordTransactionId] = useState<string>('');
  const [recordReceiptNo, setRecordReceiptNo] = useState<string>('');
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Real-time Notification Alert Popover State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Review Creation Form State
  const [selectedReviewTutorId, setSelectedReviewTutorId] = useState<string>('');
  const [reviewParentName, setReviewParentName] = useState<string>('');
  const [reviewRelation, setReviewRelation] = useState<string>('');
  const [reviewStudentGrade, setReviewStudentGrade] = useState<string>('Class 4 (CBSE)');
  const [reviewSchoolName, setReviewSchoolName] = useState<string>('Rayagada');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewVerifiedBooking, setReviewVerifiedBooking] = useState<boolean>(true);
  const [isPublishingReview, setIsPublishingReview] = useState<boolean>(false);
  const [reviewFilterTutorId, setReviewFilterTutorId] = useState<string>('all');

  // Close notification popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real-time Subscriptions
  useEffect(() => {
    setIsLoadingTutors(true);
    const unsubTutors = subscribeToAllTeachersForAdmin((allTutors) => {
      setTutors(allTutors);
      setIsLoadingTutors(false);
    });

    const unsubBookings = subscribeToRealtimeBookings((allBookings) => {
      setBookings(allBookings);
    });

    // Real-time subscription to Firestore collection 'success_stories'
    const unsubSuccessStories = subscribeToRealtimeSuccessStories((stories) => {
      setSuccessStories(stories);
    });

    // Real-time subscription to Activity & Audit Logs
    setIsLoadingActivityLogs(true);
    const unsubActivityLogs = subscribeToRealtimeActivityLogs((logs) => {
      setActivityLogs(logs);
      setIsLoadingActivityLogs(false);
    });

    // Real-time subscription to Registered Parents directory in Firestore
    setIsLoadingParents(true);
    const unsubParents = subscribeToAllParentsForAdmin((allParents) => {
      setRegisteredParents(allParents);
      setIsLoadingParents(false);
    });

    // Fetch offline demo queries
    fetch('/api/admin/demo-queries')
      .then((r) => r.json())
      .then((res) => {
        if (res?.queries) setDemoQueries(res.queries);
      })
      .catch((err) => console.warn('Offline queries fetch notice:', err));

    // Fetch Gallery
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((res) => {
        if (res?.items) setGalleryItems(res.items);
      })
      .catch((err) => console.warn('Gallery fetch notice:', err));

    return () => {
      unsubTutors();
      unsubBookings();
      unsubSuccessStories();
      unsubActivityLogs();
      unsubParents();
    };
  }, []);

  // Filtered tutors
  const filteredTutors = tutors.filter((t) => {
    const matchesFilter =
      tutorFilter === 'all'
        ? true
        : tutorFilter === 'pending'
        ? t.status === 'pending' || !t.isApproved
        : tutorFilter === 'approved'
        ? t.status === 'approved' || t.isApproved === true
        : t.status === 'rejected';

    const matchesSearch =
      !tutorSearch.trim() ||
      t.name.toLowerCase().includes(tutorSearch.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(tutorSearch.toLowerCase())) ||
      (t.locationArea && t.locationArea.toLowerCase().includes(tutorSearch.toLowerCase())) ||
      (t.phone && t.phone.includes(tutorSearch));

    return matchesFilter && matchesSearch;
  });

  // Approved tutors available for assignment
  const approvedTutors = tutors.filter((t) => t.isApproved === true || t.status === 'approved');

  // Filtered bookings
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const acceptedBookings = bookings.filter((b) => b.status === 'accepted' || b.status === 'reassigned');
  const declinedBookings = bookings.filter((b) => b.status === 'declined');

  const pendingBookingsCount = pendingBookings.length;
  const acceptedBookingsCount = acceptedBookings.length;
  const declinedBookingsCount = declinedBookings.length;

  const uniqueAssignedTutorsCount = new Set(
    acceptedBookings.map((b) => b.assignedTutorId || b.requestedTutorId).filter(Boolean)
  ).size;

  const totalMonthlyTuitionValue = acceptedBookings.reduce(
    (sum, b) => sum + (b.assignedTutorFee || b.requestedTutorMonthlyFee || 0),
    0
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'declined') return b.status === 'declined';
    return b.status === 'accepted' || b.status === 'reassigned';
  });

  // Filtered assigned bookings for dedicated Assigned Tutors section
  const filteredAssignedBookings = acceptedBookings.filter((b) => {
    if (!assignedSearch.trim()) return true;
    const q = assignedSearch.toLowerCase();
    return (
      (b.assignedTutorName && b.assignedTutorName.toLowerCase().includes(q)) ||
      (b.requestedTutorName && b.requestedTutorName.toLowerCase().includes(q)) ||
      (b.studentName && b.studentName.toLowerCase().includes(q)) ||
      (b.parentName && b.parentName.toLowerCase().includes(q)) ||
      (b.parentPhone && b.parentPhone.includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q)) ||
      (b.locality && b.locality.toLowerCase().includes(q)) ||
      (b.studentGrade && b.studentGrade.toLowerCase().includes(q))
    );
  });

  // Count summaries
  const pendingTutorsCount = tutors.filter((t) => t.status === 'pending' || !t.isApproved).length;
  const approvedTutorsCount = tutors.filter((t) => t.status === 'approved' || t.isApproved).length;

  // Registered Parents Directory Analysis & Booking Status Detection
  const getParentBookingStatus = (parent: AppUserProfile): 'assigned' | 'pending' | 'unassigned' => {
    // Check bookings matching parentUid, email, or phone
    const matchedBookings = bookings.filter((b) => {
      const matchUid = Boolean(b.parentUid && parent.uid && b.parentUid === parent.uid);
      const matchEmail = Boolean(b.parentEmail && parent.email && b.parentEmail.toLowerCase() === parent.email.toLowerCase());
      const cleanBPhone = (b.parentPhone || '').replace(/\D/g, '');
      const cleanPPhone = (parent.phone || '').replace(/\D/g, '');
      const matchPhone = Boolean(cleanBPhone && cleanPPhone && cleanBPhone.slice(-10) === cleanPPhone.slice(-10));
      return matchUid || matchEmail || matchPhone;
    });

    const hasAcceptedBooking = matchedBookings.some((b) => b.status === 'accepted' || b.status === 'assigned');
    const hasPendingBooking = matchedBookings.some((b) => b.status === 'pending');
    const hasHired = (parent.hiredTutors && parent.hiredTutors.length > 0) || Boolean(parent.assignedEducator);

    if (hasAcceptedBooking || hasHired) return 'assigned';
    if (hasPendingBooking) return 'pending';
    return 'unassigned';
  };

  const getParentMatchedBooking = (parent: AppUserProfile): HomeTutorBooking | undefined => {
    return bookings.find((b) => {
      const matchUid = Boolean(b.parentUid && parent.uid && b.parentUid === parent.uid);
      const matchEmail = Boolean(b.parentEmail && parent.email && b.parentEmail.toLowerCase() === parent.email.toLowerCase());
      const cleanBPhone = (b.parentPhone || '').replace(/\D/g, '');
      const cleanPPhone = (parent.phone || '').replace(/\D/g, '');
      const matchPhone = Boolean(cleanBPhone && cleanPPhone && cleanBPhone.slice(-10) === cleanPPhone.slice(-10));
      return matchUid || matchEmail || matchPhone;
    });
  };

  const unassignedParentsCount = registeredParents.filter(
    (p) => getParentBookingStatus(p) === 'unassigned'
  ).length;

  const assignedParentsCount = registeredParents.filter(
    (p) => getParentBookingStatus(p) === 'assigned'
  ).length;

  const pendingParentsCount = registeredParents.filter(
    (p) => getParentBookingStatus(p) === 'pending'
  ).length;

  // Filtered Registered Parents list
  const filteredRegisteredParents = registeredParents.filter((p) => {
    const status = getParentBookingStatus(p);
    if (parentAssignmentFilter === 'unassigned' && status !== 'unassigned') return false;
    if (parentAssignmentFilter === 'assigned' && status !== 'assigned') return false;
    if (parentAssignmentFilter === 'pending' && status !== 'pending') return false;

    if (directorySearch.trim()) {
      const q = directorySearch.toLowerCase().trim();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const emailMatch = (p.email || '').toLowerCase().includes(q);
      const phoneMatch = (p.phone || '').toLowerCase().includes(q);
      const childMatch = (p.childName || '').toLowerCase().includes(q);
      const gradeMatch = (p.childGrade || '').toLowerCase().includes(q);
      const localityMatch = (p.locality || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || childMatch || gradeMatch || localityMatch;
    }
    return true;
  });

  // Filtered Tutors in Directory
  const filteredDirectoryTutors = tutors.filter((t) => {
    if (directorySearch.trim()) {
      const q = directorySearch.toLowerCase().trim();
      const nameMatch = (t.name || '').toLowerCase().includes(q);
      const emailMatch = (t.email || '').toLowerCase().includes(q);
      const phoneMatch = (t.phone || '').toLowerCase().includes(q);
      const qualMatch = (t.qualification || '').toLowerCase().includes(q);
      const subjMatch = t.subjects.some((s) => s.toLowerCase().includes(q));
      const areaMatch = (t.locationArea || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || qualMatch || subjMatch || areaMatch;
    }
    return true;
  });

  // Direct tutor assignment to unassigned registered parent
  const handleConfirmDirectAssign = async () => {
    if (!directAssignParent || !directAssignTutorId) {
      showToast('error', 'Please select a tutor to assign.');
      return;
    }

    const tutorObj = approvedTutors.find((t) => t.id === directAssignTutorId);
    if (!tutorObj) {
      showToast('error', 'Selected tutor not found.');
      return;
    }

    setIsDirectAssigning(true);
    try {
      const res = await adminDirectAssignTutorToParent(
        directAssignParent,
        tutorObj,
        directAssignSlot,
        directAssignNotes
      );

      if (res.success) {
        showToast('success', `✓ Successfully assigned ${tutorObj.name} to ${directAssignParent.name}!`);
        // Update local registered parents
        setRegisteredParents((prev) =>
          prev.map((p) =>
            p.uid === directAssignParent.uid
              ? {
                  ...p,
                  assignedEducator: {
                    id: tutorObj.id,
                    name: tutorObj.name,
                    phone: tutorObj.phone,
                    monthlyFee: tutorObj.monthlyFee,
                    subjects: tutorObj.subjects,
                    status: 'Active'
                  }
                }
              : p
          )
        );
        setDirectAssignParent(null);
        setDirectAssignTutorId('');
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to assign tutor.');
    } finally {
      setIsDirectAssigning(false);
    }
  };

  // Activity Logs Audit Metrics
  const tutorApprovalsCount = activityLogs.filter(
    (l) => l.actionType === 'tutor_approved' || l.actionType === 'tutor_rejected'
  ).length;

  const demoBookingsHandledCount = activityLogs.filter(
    (l) => l.category === 'demo_bookings' || l.actionType === 'demo_booking_handled' || l.actionType === 'demo_booking_scheduled'
  ).length;

  // Way 1: Home Tutor Payments
  const homeTutorPaymentLogs = activityLogs.filter(
    (l) => l.category === 'payment_home_tutors' || l.actionType === 'payment_home_tutor'
  );
  const homeTutorPaymentsTotal = homeTutorPaymentLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const homeTutorPaymentsCount = homeTutorPaymentLogs.length;

  // Way 2: Course Payments
  const coursePaymentLogs = activityLogs.filter(
    (l) => l.category === 'payment_courses' || l.actionType === 'payment_course'
  );
  const coursePaymentsTotal = coursePaymentLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const coursePaymentsCount = coursePaymentLogs.length;

  const totalAuditedRevenue = homeTutorPaymentsTotal + coursePaymentsTotal;
  const totalAuditActionsCount = activityLogs.length;

  // Unique admins list for filter
  const uniqueAdmins = Array.from(
    new Set([
      'Admin Chandini Kurumoju',
      'Admin Rajesh Panda',
      'Admin Sunita Sahoo',
      'Admin Anil Mohanty',
      ...activityLogs.map((l) => l.adminName).filter(Boolean)
    ])
  );

  // Filtered Activity Logs
  const filteredActivityLogs = activityLogs.filter((log) => {
    // Category filter
    if (activityCategoryFilter !== 'all') {
      if (
        activityCategoryFilter === 'payment_home_tutors' &&
        log.category !== 'payment_home_tutors' &&
        log.actionType !== 'payment_home_tutor'
      ) {
        return false;
      }
      if (
        activityCategoryFilter === 'payment_courses' &&
        log.category !== 'payment_courses' &&
        log.actionType !== 'payment_course'
      ) {
        return false;
      }
      if (
        activityCategoryFilter === 'tutors' &&
        log.category !== 'tutors' &&
        log.actionType !== 'tutor_approved' &&
        log.actionType !== 'tutor_rejected' &&
        log.actionType !== 'tutor_visibility_toggled'
      ) {
        return false;
      }
      if (
        activityCategoryFilter === 'demo_bookings' &&
        log.category !== 'demo_bookings' &&
        log.actionType !== 'demo_booking_handled' &&
        log.actionType !== 'demo_booking_scheduled'
      ) {
        return false;
      }
      if (activityCategoryFilter === 'bookings' && log.category !== 'bookings' && !log.actionType.startsWith('booking_')) {
        return false;
      }
    }

    // Admin filter
    if (activityAdminFilter !== 'all') {
      if (!log.adminName.toLowerCase().includes(activityAdminFilter.toLowerCase())) {
        return false;
      }
    }

    // Time filter
    if (activityTimeFilter !== 'all') {
      const logTime = new Date(log.timestamp || 0).getTime();
      const now = Date.now();
      if (activityTimeFilter === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        if (logTime < startOfDay.getTime()) return false;
      } else if (activityTimeFilter === 'week') {
        const past7Days = now - 7 * 24 * 3600 * 1000;
        if (logTime < past7Days) return false;
      } else if (activityTimeFilter === 'month') {
        const past30Days = now - 30 * 24 * 3600 * 1000;
        if (logTime < past30Days) return false;
      }
    }

    // Search query
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      const matches =
        log.title.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.adminName.toLowerCase().includes(q) ||
        (log.studentName && log.studentName.toLowerCase().includes(q)) ||
        (log.parentName && log.parentName.toLowerCase().includes(q)) ||
        (log.tutorName && log.tutorName.toLowerCase().includes(q)) ||
        (log.courseTitle && log.courseTitle.toLowerCase().includes(q)) ||
        (log.transactionId && log.transactionId.toLowerCase().includes(q)) ||
        (log.receiptNo && log.receiptNo.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Handler for Recording New Activity / Received Payment
  const handleSaveActivityLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordStudentName.trim() && recordActionType.includes('payment')) {
      showToast('error', 'Student or payer name is required.');
      return;
    }

    setIsSavingLog(true);
    try {
      let title = '';
      let desc = '';
      let category: ActivityCategory = 'tutors';
      const parsedAmt = parseInt(recordAmount.replace(/[^0-9]/g, '')) || 0;

      if (recordActionType === 'payment_home_tutor') {
        category = 'payment_home_tutors';
        const tutor = tutors.find((t) => t.id === recordTutorId);
        const tName = tutor?.name || recordTutorName || 'Home Tutor';
        title = 'Monthly Tuition Fee Received (Way 1: Home Tutor)';
        desc = `Verified monthly tuition payment of ₹${parsedAmt.toLocaleString('en-IN')} for Home Tutor ${tName} for student ${recordStudentName.trim()}.`;
      } else if (recordActionType === 'payment_course') {
        category = 'payment_courses';
        title = 'Course Enrollment Payment Received (Way 2: Course)';
        desc = `Confirmed course fee payment of ₹${parsedAmt.toLocaleString('en-IN')} for '${recordCourseTitle}' for student ${recordStudentName.trim()}.`;
      } else if (recordActionType === 'tutor_approved') {
        category = 'tutors';
        const tutor = tutors.find((t) => t.id === recordTutorId);
        const tName = tutor?.name || recordTutorName || 'Educator';
        title = 'Tutor Profile & Certificates Approved';
        desc = `Audited academic credentials & marksheets for tutor ${tName}, verified genuine.`;
      } else {
        category = 'demo_bookings';
        title = 'Demo Booking Scheduled & Handled';
        desc = `Handled demo class inquiry for student ${recordStudentName.trim()} for ${recordCourseTitle || 'Classroom Coaching'}.`;
      }

      const newLog = await logAdminActivity({
        adminName: recordAdminName,
        actionType: recordActionType,
        category,
        title,
        description: desc,
        studentName: recordStudentName.trim(),
        parentName: recordParentName.trim(),
        parentPhone: recordParentPhone.trim(),
        tutorName: recordTutorName || (recordTutorId ? tutors.find((t) => t.id === recordTutorId)?.name : ''),
        courseTitle: recordActionType.includes('course') ? recordCourseTitle : undefined,
        amount: parsedAmt > 0 ? parsedAmt : undefined,
        paymentMethod: recordPaymentMethod,
        transactionId: recordTransactionId.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        receiptNo: recordReceiptNo.trim() || `KIR-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'verified',
        notes: recordNotes.trim() || 'Recorded via Admin Audit Desk'
      });

      setActivityLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
      showToast('success', '✓ Activity & payment logged in audit trail!');
      setIsRecordPaymentModalOpen(false);

      // Reset form
      setRecordStudentName('');
      setRecordParentName('');
      setRecordParentPhone('');
      setRecordNotes('');
      setRecordTransactionId('');
      setRecordReceiptNo('');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to record activity log.');
    } finally {
      setIsSavingLog(false);
    }
  };

  // Export audit trail to CSV
  const handleExportAuditLogs = () => {
    try {
      const headers = [
        'Timestamp',
        'Admin Name',
        'Category',
        'Action Type',
        'Title',
        'Student Name',
        'Tutor / Course',
        'Amount (INR)',
        'Payment Method',
        'Transaction ID',
        'Receipt No',
        'Status',
        'Notes'
      ];
      const rows = filteredActivityLogs.map((l) => [
        `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
        `"${l.adminName.replace(/"/g, '""')}"`,
        l.category,
        l.actionType,
        `"${l.title.replace(/"/g, '""')}"`,
        `"${(l.studentName || '').replace(/"/g, '""')}"`,
        `"${(l.tutorName || l.courseTitle || '').replace(/"/g, '""')}"`,
        l.amount || '',
        l.paymentMethod || '',
        l.transactionId || '',
        l.receiptNo || '',
        l.status,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Kumari_Institute_Admin_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Audit trail exported as CSV!');
    } catch {
      showToast('error', 'Could not export audit log.');
    }
  };

  // Handle Tutor Acceptance (Verify Genuine) or Decline (Purge from Firestore)
  const handleVerifyTutor = async (tutor: Tutor, status: 'approved' | 'rejected', notes?: string) => {
    setIsVerifying(true);
    setVerifyNotice(null);
    try {
      const res = await adminVerifyTutorInDatabase(tutor.id, status, notes);

      if (status === 'rejected') {
        // STRICT REQUIREMENT: If declined, removed directly from Firestore and state
        setTutors((prev) => prev.filter((item) => item.id !== tutor.id));
        if (selectedTutorForReview && selectedTutorForReview.id === tutor.id) {
          setSelectedTutorForReview(null);
        }
        showToast('info', '✓ Tutor declined and permanently removed from Firestore database.');
        return;
      }

      showToast('success', res.message);
      setVerifyNotice(res.message);

      // Update local state for approved
      setTutors((prev) =>
        prev.map((item) =>
          item.id === tutor.id
            ? {
                ...item,
                status: 'approved',
                isApproved: true,
                verified: true,
                verificationStatus: 'Verified Genuine Tutor'
              }
            : item
        )
      );

      // If review modal is open, update selected
      if (selectedTutorForReview && selectedTutorForReview.id === tutor.id) {
        setSelectedTutorForReview({
          ...selectedTutorForReview,
          status: 'approved',
          isApproved: true,
          verified: true,
          verificationStatus: 'Verified Genuine Tutor'
        });
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update tutor status.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Tutor Visibility Toggle (Update 'verified' status in Firestore & toggle public Find Home Tutor visibility)
  const handleToggleVisibility = async (tutor: Tutor) => {
    const newVerified = !tutor.verified;
    setIsVerifying(true);
    try {
      const res = await adminToggleTutorVisibility(tutor.id, newVerified);
      showToast('success', res.message);

      // Update local tutor state
      setTutors((prev) =>
        prev.map((item) =>
          item.id === tutor.id
            ? {
                ...item,
                verified: newVerified,
                isApproved: newVerified,
                status: newVerified ? 'approved' : 'pending',
                verificationStatus: newVerified ? 'Verified Genuine Tutor' : 'Pending Verification'
              }
            : item
        )
      );

      // If review modal is open, sync modal state
      if (selectedTutorForReview && selectedTutorForReview.id === tutor.id) {
        setSelectedTutorForReview({
          ...selectedTutorForReview,
          verified: newVerified,
          isApproved: newVerified,
          status: newVerified ? 'approved' : 'pending',
          verificationStatus: newVerified ? 'Verified Genuine Tutor' : 'Pending Verification'
        });
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to toggle tutor visibility.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Booking Acceptance (Assign requested tutor)
  const handleAcceptRequestedTutor = async (booking: HomeTutorBooking) => {
    setIsAssigning(true);
    try {
      const res = await adminAcceptAndAssignTutorBooking(booking.id, booking.requestedTutorId, 'Confirmed requested tutor by Admin.');
      showToast('success', `Home Tutor ${booking.requestedTutorName} successfully assigned to ${booking.studentName}!`);
      
      // Update local bookings
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: 'accepted',
                assignedTutorId: booking.requestedTutorId,
                assignedTutorName: booking.requestedTutorName,
                assignedTutorFee: booking.requestedTutorMonthlyFee
              }
            : b
        )
      );

      // Update tutor as booked
      setTutors((prev) =>
        prev.map((t) =>
          t.id === booking.requestedTutorId ? { ...t, isBooked: true, bookingStatus: 'booked' } : t
        )
      );

      showToast('success', `✓ Home Tutor ${booking.requestedTutorName} automatically assigned to ${booking.studentName} and moved to 'Assigned Tutors' list!`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to accept booking.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Open Decline Modal
  const handleOpenDeclineModal = (booking: HomeTutorBooking) => {
    setDeclineModalBooking(booking);
    setDeclineReason('Selected time slot is already fully occupied.');
    setCustomDeclineReason('');
  };

  // Confirm Decline parent booking request
  const handleConfirmDecline = async () => {
    if (!declineModalBooking) return;

    setIsDeclining(true);
    const finalReason = customDeclineReason.trim() ? customDeclineReason.trim() : declineReason;

    try {
      const res = await adminDeclineTutorBooking(declineModalBooking.id, finalReason);
      showToast('info', `Booking request for ${declineModalBooking.studentName} has been declined.`);

      setBookings((prev) =>
        prev.map((b) =>
          b.id === declineModalBooking.id
            ? {
                ...b,
                status: 'declined',
                declineReason: finalReason,
                declinedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : b
        )
      );

      setDeclineModalBooking(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to decline booking.');
    } finally {
      setIsDeclining(false);
    }
  };

  // Open Re-assign Modal
  const handleOpenReassignModal = (booking: HomeTutorBooking) => {
    setReassignModalBooking(booking);
    // Default to first approved tutor that is not the same or available
    const available = approvedTutors.find((t) => t.id !== booking.requestedTutorId);
    setSelectedReassignTutorId(available ? available.id : approvedTutors[0]?.id || '');
    setReassignNotes(`Assigned specialized educator to match ${booking.studentName}'s schedule.`);
  };

  // Confirm Re-assignment with a new/different tutor
  const handleConfirmReassignment = async () => {
    if (!reassignModalBooking || !selectedReassignTutorId) return;

    setIsAssigning(true);
    const chosenTutor = approvedTutors.find((t) => t.id === selectedReassignTutorId);
    try {
      const res = await adminAcceptAndAssignTutorBooking(
        reassignModalBooking.id,
        selectedReassignTutorId,
        reassignNotes,
        reassignModalBooking
      );

      showToast('success', `Assigned new Home Tutor ${chosenTutor?.name} to student ${reassignModalBooking.studentName}!`);

      setBookings((prev) =>
        prev.map((b) =>
          b.id === reassignModalBooking.id
            ? {
                ...b,
                status: 'reassigned',
                assignedTutorId: selectedReassignTutorId,
                assignedTutorName: chosenTutor?.name || 'Assigned Tutor',
                assignedTutorFee: chosenTutor?.monthlyFee,
                assignedTutorAvatar: chosenTutor?.avatar,
                reassignedNotes: reassignNotes
              }
            : b
        )
      );

      // Mark chosen tutor as booked
      setTutors((prev) =>
        prev.map((t) =>
          t.id === selectedReassignTutorId ? { ...t, isBooked: true, bookingStatus: 'booked' } : t
        )
      );

      setReassignModalBooking(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to assign new tutor.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Offline demo query status update
  const handleUpdateQueryStatus = async (queryId: string, status: OfflineDemoQuery['status']) => {
    try {
      await fetch(`/api/admin/demo-queries/${encodeURIComponent(queryId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setDemoQueries((prev) =>
        prev.map((q) => (q.id === queryId ? { ...q, status } : q))
      );
      showToast('success', `Query status updated to ${status}.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update status.');
    }
  };

  // Add new gallery image
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle.trim() || !newGalleryImage.trim()) {
      showToast('error', 'Please provide a title and image URL.');
      return;
    }

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGalleryTitle.trim(),
          subtitle: newGallerySubtitle.trim() || 'Kumari Institute Rayagada',
          category: newGalleryCategory,
          image: newGalleryImage.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGalleryItems((prev) => [data.item, ...prev]);
        showToast('success', 'Image added to Gallery successfully!');
        setNewGalleryTitle('');
        setNewGallerySubtitle('');
        setNewGalleryImage('');
        setIsAddingGallery(false);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to add gallery image.');
    }
  };

  // Delete gallery image
  const handleDeleteGalleryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setGalleryItems((prev) => prev.filter((item) => item.id !== id));
        showToast('info', 'Gallery image deleted.');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete gallery image.');
    }
  };

  // Add new success story with image upload & Firestore persistence
  const handleAddSuccessStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryName.trim() || !newStoryTestimonial.trim()) {
      showToast('error', 'Student name and testimonial quote are required.');
      return;
    }

    setIsUploadingStoryImage(true);
    try {
      let finalImageUrl = newStoryImage.trim();

      // If user uploaded an image file from device
      if (storyImageFile) {
        showToast('info', 'Uploading image asset...');
        const uploadResult = await uploadImageToImgBB(storyImageFile, `${newStoryName}_success_story`);
        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        } else if (storyImagePreview) {
          finalImageUrl = storyImagePreview;
        }
      }

      if (!finalImageUrl) {
        finalImageUrl = '/src/assets/images/student_rohit_1788779382685.jpg';
      }

      // Persist to Cloud Firestore collection 'success_stories'
      const res = await saveSuccessStoryToFirestore({
        studentName: newStoryName.trim(),
        score: newStoryScore.trim() || 'Distinction',
        exam: newStoryExam.trim() || 'Board Examination',
        school: newStorySchool.trim() || 'Rayagada',
        parentName: newStoryParent.trim(),
        testimonial: newStoryTestimonial.trim(),
        image: finalImageUrl,
        badge: newStoryBadge.trim() || 'Top Performer',
        year: newStoryYear.trim() || `${new Date().getFullYear()}`
      });

      if (res.success) {
        setSuccessStories((prev) => [res.story, ...prev.filter((s) => s.id !== res.story.id)]);
        showToast('success', '✓ Success story persisted in Firestore and rendered in gallery!');
        setNewStoryName('');
        setNewStoryScore('');
        setNewStoryExam('');
        setNewStorySchool('');
        setNewStoryParent('');
        setNewStoryTestimonial('');
        setNewStoryImage('');
        setStoryImageFile(null);
        setStoryImagePreview('');
        setIsAddingStory(false);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to persist success story in Firestore.');
    } finally {
      setIsUploadingStoryImage(false);
    }
  };

  // Delete success story from Firestore
  const handleDeleteSuccessStory = async (id: string) => {
    try {
      await deleteSuccessStoryFromFirestore(id);
      setSuccessStories((prev) => prev.filter((s) => s.id !== id));
      showToast('info', 'Success story removed from Firestore and public gallery.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete story from Firestore.');
    }
  };

  // Total reviews count calculation
  const totalReviewsCount = tutors.reduce((acc, t) => acc + (t.reviews?.length || 0), 0);

  // Review publication handler - Stored in Firestore database
  const handlePublishReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewTutorId) {
      showToast('error', 'Please select a tutor from the dropdown.');
      return;
    }
    if (!reviewParentName.trim()) {
      showToast('error', 'Please enter parent / guardian name.');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('error', 'Please write a review comment.');
      return;
    }

    setIsPublishingReview(true);
    try {
      const res = await adminAddTutorReview(selectedReviewTutorId, {
        parentName: reviewParentName.trim(),
        relation: reviewRelation.trim() || 'Parent',
        studentGrade: reviewStudentGrade.trim() || 'Primary Class',
        schoolName: reviewSchoolName.trim() || 'Rayagada',
        rating: Number(reviewRating) || 5,
        comment: reviewComment.trim(),
        verifiedBooking: reviewVerifiedBooking
      });

      if (res.success) {
        showToast('success', res.message || '✓ Parent review created and stored in Firestore database!');
        // Update local tutor reviews
        setTutors((prev) =>
          prev.map((t) => {
            if (t.id === selectedReviewTutorId) {
              const updatedRev = res.review ? [res.review, ...(t.reviews || [])] : (t.reviews || []);
              const newAvg = Math.round((updatedRev.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / (updatedRev.length || 1)) * 10) / 10;
              return {
                ...t,
                reviews: updatedRev,
                rating: newAvg,
                reviewCount: updatedRev.length
              };
            }
            return t;
          })
        );
        // Reset review form
        setReviewComment('');
        setReviewParentName('');
        setReviewRelation('');
      } else {
        showToast('error', res.message || 'Failed to create review.');
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Error publishing review.');
    } finally {
      setIsPublishingReview(false);
    }
  };

  // Review deletion handler - Removed directly from Firestore
  const handleDeleteReview = async (tutorId: string, reviewId: string) => {
    if (!confirm('Are you sure you want to delete this parent review from Firestore?')) return;
    try {
      const res = await adminDeleteTutorReview(tutorId, reviewId);
      if (res.success) {
        showToast('info', '✓ Review removed from Firestore database.');
        setTutors((prev) =>
          prev.map((t) => {
            if (t.id === tutorId) {
              const remaining = (t.reviews || []).filter((r) => r.id !== reviewId);
              const newAvg = remaining.length > 0
                ? Math.round((remaining.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / remaining.length) * 10) / 10
                : 5.0;
              return {
                ...t,
                reviews: remaining,
                rating: newAvg,
                reviewCount: remaining.length
              };
            }
            return t;
          })
        );
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete review.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-blue-950/90 text-blue-200 border-blue-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* TOP ADMIN HEADER */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Portal title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              KI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base sm:text-lg tracking-tight">Kumari Institute</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in as <span className="text-white font-medium">Chandini Kurumoju</span> (chandinikurumoju424@gmail.com)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Real-time Notification Alert Bell & Badge Counter */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  pendingTutorsCount + pendingBookingsCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                }`}
                title="Action alerts for pending tutor verifications & parent bookings"
              >
                <Bell className={`w-4 h-4 ${pendingTutorsCount + pendingBookingsCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">Alerts</span>
                {pendingTutorsCount + pendingBookingsCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                    {pendingTutorsCount + pendingBookingsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-white">Action Required</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {pendingTutorsCount + pendingBookingsCount} Pending Tasks
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 p-2 space-y-1">
                    {pendingTutorsCount + pendingBookingsCount === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                        <p className="font-bold text-slate-300">All caught up!</p>
                        <p className="text-[11px] text-slate-500">No pending tutor verifications or unassigned bookings.</p>
                      </div>
                    ) : (
                      <>
                        {/* Pending Tutors List */}
                        {tutors.filter((t) => t.status === 'pending' || !t.isApproved).length > 0 && (
                          <div className="p-1 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 block">
                              Pending Tutor Registrations ({tutors.filter((t) => t.status === 'pending' || !t.isApproved).length})
                            </span>
                            {tutors
                              .filter((t) => t.status === 'pending' || !t.isApproved)
                              .map((t) => (
                                <div
                                  key={t.id}
                                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-white text-xs truncate">{t.name}</h5>
                                    <p className="text-[11px] text-slate-400 truncate">{t.qualification || 'Qualification Pending'}</p>
                                    <p className="text-[10px] text-amber-400/90">{t.locationArea || 'Rayagada'}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('tutors');
                                      setTutorFilter('pending');
                                      setSelectedTutorForReview(t);
                                      setIsNotificationOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shrink-0 cursor-pointer shadow-xs"
                                  >
                                    Review
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Pending Bookings List */}
                        {bookings.filter((b) => b.status === 'pending').length > 0 && (
                          <div className="p-1 space-y-1 pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 block">
                              Pending Parent Bookings ({bookings.filter((b) => b.status === 'pending').length})
                            </span>
                            {bookings
                              .filter((b) => b.status === 'pending')
                              .map((b) => (
                                <div
                                  key={b.id}
                                  className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-white text-xs truncate">
                                      Student: {b.studentName} ({b.studentGrade})
                                    </h5>
                                    <p className="text-[11px] text-slate-400 truncate">Parent: {b.parentName} ({b.parentPhone})</p>
                                    <p className="text-[10px] text-emerald-400">Target Tutor: {b.requestedTutorName}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('incoming_bookings');
                                      setBookingFilter('pending');
                                      setIsNotificationOpen(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 cursor-pointer shadow-xs"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onNavigateHome}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700/60"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Preview Live Website</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/30"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ADMIN STATS RIBBON */}
        <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 text-xs">
            <div className="flex items-center gap-6 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tutors');
                  setTutorFilter('pending');
                }}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tutorFilter === 'pending' && activeTab === 'tutors' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Pending Tutors Review:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {pendingTutorsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tutors');
                  setTutorFilter('approved');
                }}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  tutorFilter === 'approved' && activeTab === 'tutors' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Genuine Tutors:</span>
                <span className="font-bold text-white">{approvedTutorsCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('incoming_bookings');
                  setBookingFilter('pending');
                }}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'incoming_bookings' || activeTab === 'bookings'
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Incoming Bookings:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {pendingBookingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assigned_tutors')}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'assigned_tutors' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assigned Tutors:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {acceptedBookingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('registered_directory');
                  setParentAssignmentFilter('all');
                }}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'registered_directory' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Registered Directory:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {registeredParents.length + tutors.length}
                </span>
                {unassignedParentsCount > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('registered_directory');
                      setDirectoryRoleFilter('parents');
                      setParentAssignmentFilter('unassigned');
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 text-[10px] hover:bg-rose-500 hover:text-white transition-colors"
                    title="Click to view unassigned parents who haven't booked any tutors"
                  >
                    {unassignedParentsCount} Unassigned
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('offline_queries')}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'offline_queries' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Offline Demo Queries:</span>
                <span className="font-bold text-white">{demoQueries.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity_logs')}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'activity_logs' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
                <span>Activity Logs:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {activityLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tutor_reviews')}
                className={`flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'tutor_reviews' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Parent Reviews:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {totalReviewsCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-slate-500 text-[11px]">
              <span>Center: Indira Nagar, Rayagada</span>
            </div>
          </div>
        </div>

        {/* PRIMARY ADMIN TABS */}
        <div className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('incoming_bookings');
                setBookingFilter('pending');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'incoming_bookings' || activeTab === 'bookings'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Incoming Bookings</span>
              {pendingBookingsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {pendingBookingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assigned_tutors')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assigned_tutors'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Assigned Tutors</span>
              {acceptedBookingsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {acceptedBookingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('registered_directory')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'registered_directory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300" />
              <span>Registered Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-indigo-300 border border-indigo-500/30">
                {registeredParents.length + tutors.length}
              </span>
              {unassignedParentsCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse"
                  title={`${unassignedParentsCount} parents registered with no tutor booked`}
                >
                  {unassignedParentsCount} Unassigned
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tutors')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tutors'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Tutor Verification &amp; Certificates</span>
              {pendingTutorsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950 text-amber-300">
                  {pendingTutorsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tutor_reviews')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tutor_reviews'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Tutor Reviews &amp; Ratings</span>
              {totalReviewsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-amber-300">
                  {totalReviewsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('offline_queries')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'offline_queries'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Offline Demo Queries</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {demoQueries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery Management</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {galleryItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('success_stories')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'success_stories'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Success Stories</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                {successStories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity_logs')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'activity_logs'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Activity Logs</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activityLogs.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* =========================================================================
            TAB 1: TUTORS VERIFICATION & CERTIFICATE REVIEW
           ========================================================================= */}
        {activeTab === 'tutors' && (
          <div className="space-y-6">
            {/* Header description banner */}
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Tutor Registrations &amp; Certificate Previews</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin Approval Required
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  All newly registered tutors arrive here first. Inspect their uploaded 10th, 12th, and Degree marksheets alongside their Government ID proof. Once you accept a tutor as genuine, they will immediately appear on the Find Home Tutor search page.
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setTutorFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tutorFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Pending</span>
                  {pendingTutorsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px]">
                      {pendingTutorsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTutorFilter('approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    tutorFilter === 'approved'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Verified Genuine</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-emerald-300 text-[10px]">
                    {approvedTutorsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTutorFilter('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tutorFilter === 'rejected' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Rejected</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTutorFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tutorFilter === 'all' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>All ({tutors.length})</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tutorSearch}
                onChange={(e) => setTutorSearch(e.target.value)}
                placeholder="Search tutors by name, subject, phone, or locality in Rayagada..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Tutors Grid */}
            {isLoadingTutors ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                <p className="text-sm">Loading tutors list...</p>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 space-y-3">
                <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Tutors in this Category</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {tutorFilter === 'pending'
                    ? 'All registered tutors have been reviewed! New submissions will automatically appear here.'
                    : 'No tutors found matching your current filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTutors.map((tutor) => {
                  const isApproved = tutor.isApproved === true || tutor.status === 'approved';
                  const isPending = tutor.status === 'pending' || (!tutor.isApproved && tutor.status !== 'rejected');
                  const isRejected = tutor.status === 'rejected';

                  return (
                    <div
                      key={tutor.id}
                      className={`bg-slate-800 rounded-3xl p-5 border flex flex-col justify-between transition-all hover:border-slate-600 ${
                        isPending
                          ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : isApproved
                          ? 'border-emerald-500/40'
                          : 'border-rose-500/30'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Top Tutor Info */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={tutor.avatar || '/src/assets/images/tutor_priya_sharma_1789370534007.jpg'}
                              alt={tutor.name}
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-base">{tutor.name}</h3>
                                {isApproved && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" title="Verified Genuine" />
                                )}
                              </div>
                              <p className="text-xs text-amber-400 font-semibold">{tutor.qualification}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{tutor.locationArea || 'Rayagada'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>Pending Preview</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Genuine Tutor</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Experience</span>
                            <span className="font-semibold text-slate-200">{tutor.experienceYears}+ Years</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Monthly Fee</span>
                            <span className="font-bold text-emerald-400">₹{tutor.monthlyFee}/month</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Subjects Handled</span>
                            <span className="font-medium text-slate-300 truncate block">
                              {tutor.subjects.join(', ')}
                            </span>
                          </div>
                        </div>

                        {/* Certificates uploaded preview badges */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>Uploaded Certificates &amp; ID Proofs:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-700/80 text-slate-200 border border-slate-600">
                              ✓ 10th Marksheet ({tutor.certificates?.tenth?.score || 'Submitted'})
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-700/80 text-slate-200 border border-slate-600">
                              ✓ 12th Marksheet ({tutor.certificates?.twelfth?.score || 'Submitted'})
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-700/80 text-slate-200 border border-slate-600">
                              ✓ Degree Certificate
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-900/40 text-blue-200 border border-blue-700/40">
                              ✓ Govt ID (Aadhaar)
                            </span>
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-700/50">
                          {tutor.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-200 font-medium">{tutor.phone}</span>
                            </p>
                          )}
                          {tutor.email && (
                            <p className="flex items-center gap-2 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-300 truncate">{tutor.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Approval Workflow: Visibility Toggle on 'Find Home Tutor' Page & Actions */}
                      <div className="pt-4 border-t border-slate-700/80 space-y-2.5 mt-4">
                        {/* Interactive Visibility Toggle */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/70">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                tutor.verified ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-white block truncate">
                                {tutor.verified ? 'Visible on Find Tutors' : 'Hidden from Parents'}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {tutor.verified ? 'Verified in Firestore' : 'Unverified (Approval Needed)'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isVerifying}
                            onClick={() => handleToggleVisibility(tutor)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              tutor.verified ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                            title={
                              tutor.verified
                                ? "Click to toggle visibility OFF (hide from Find Home Tutor page)"
                                : "Click to toggle visibility ON (verify in Firestore and display on Find Home Tutor page)"
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                tutor.verified ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTutorForReview(tutor)}
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Preview Certificates</span>
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              disabled={isVerifying}
                              onClick={() => handleVerifyTutor(tutor, 'approved')}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                              title="Accept as Genuine Home Tutor"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}

                          {isApproved && (
                            <span className="px-2 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: INCOMING BOOKINGS (Notifications from parents with Accept & Decline)
           ========================================================================= */}
        {(activeTab === 'incoming_bookings' || activeTab === 'bookings') && (
          <IncomingBookings
            availableTutors={approvedTutors}
            onNavigateAssignedTutors={() => setActiveTab('assigned_tutors')}
            onTutorAssigned={(tutorId) => {
              setTutors((prev) =>
                prev.map((t) => (t.id === tutorId ? { ...t, isBooked: true, bookingStatus: 'booked' } : t))
              );
            }}
            showToast={showToast}
          />
        )}

        {/* =========================================================================
            TAB 3: ASSIGNED TUTORS (Tutors successfully assigned upon admin acceptance)
           ========================================================================= */}
        {activeTab === 'assigned_tutors' && (
          <div className="space-y-6">
            {/* Header Description & Metrics */}
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Assigned Tutors</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active Home Mentors
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                    Home tutors that have been officially accepted and assigned to students across Rayagada. These educators are marked as "Booked" and actively appear in parents' profiles and learning schedules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('incoming_bookings');
                    setBookingFilter('pending');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  <span>Incoming Bookings ({pendingBookingsCount})</span>
                </button>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700/60">
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Active Home Assignments
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">{acceptedBookingsCount}</span>
                    <span className="text-xs text-emerald-400 font-semibold">Active Bookings</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Unique Assigned Mentors
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-amber-400">{uniqueAssignedTutorsCount}</span>
                    <span className="text-xs text-slate-400">Tutors Engaged</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Monthly Tuition Volume
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{totalMonthlyTuitionValue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400">/month</span>
                  </div>
                </div>
              </div>

              {/* Search Bar for Assigned Tutors */}
              <div className="pt-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search assigned tutors by tutor name, student name, parent phone, address, or grade..."
                    value={assignedSearch}
                    onChange={(e) => setAssignedSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {assignedSearch && (
                    <button
                      type="button"
                      onClick={() => setAssignedSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned Tutors Grid */}
            {filteredAssignedBookings.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-emerald-400 mx-auto flex items-center justify-center">
                  <UserCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200">
                    {assignedSearch ? 'No Assigned Tutors Match Search' : 'No Assigned Tutors Yet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {assignedSearch
                      ? `No assigned tutors match "${assignedSearch}". Try clearing your search.`
                      : 'When you accept pending booking requests from parents in the Incoming Bookings tab, they will automatically move into this Assigned Tutors list.'}
                  </p>
                </div>
                {!assignedSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('incoming_bookings');
                      setBookingFilter('pending');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Go to Incoming Bookings</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAssignedBookings.map((booking) => {
                  return (
                    <div
                      key={booking.id}
                      className="bg-slate-800 rounded-3xl p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 space-y-4"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Active Assignment</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            REF: {booking.id}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Tutor Profile Block */}
                      <div className="flex items-center gap-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                        <img
                          src={
                            booking.assignedTutorAvatar ||
                            booking.requestedTutorAvatar ||
                            '/src/assets/images/tutor_priya_sharma_1789370534007.jpg'
                          }
                          alt={booking.assignedTutorName || booking.requestedTutorName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              Assigned Home Mentor
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base truncate mt-1">
                            {booking.assignedTutorName || booking.requestedTutorName}
                          </h4>
                          <p className="text-xs font-bold text-amber-300">
                            Fee: ₹{booking.assignedTutorFee || booking.requestedTutorMonthlyFee}/month
                          </p>
                        </div>
                      </div>

                      {/* Student & Parent Assignment Details */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Student</span>
                          <span className="font-bold text-white text-sm block">{booking.studentName}</span>
                          <span className="text-slate-300 block">{booking.studentGrade}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Parent &amp; Contact</span>
                          <span className="font-semibold text-slate-200 block">{booking.parentName}</span>
                          <a
                            href={`tel:${booking.parentPhone}`}
                            className="text-amber-400 font-mono inline-flex items-center gap-1 hover:underline mt-0.5"
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            <span>{booking.parentPhone}</span>
                          </a>
                        </div>

                        <div className="col-span-2 pt-2 border-t border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Address in Rayagada</span>
                          <span className="text-slate-300 flex items-center gap-1 mt-0.5 truncate" title={booking.address}>
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span className="truncate">{booking.address}</span>
                          </span>
                          <span className="text-slate-400 text-[11px] block mt-1">
                            Slot: <strong className="text-white">{booking.preferredTimeSlot || 'Evening Schedule'}</strong>
                          </span>
                        </div>

                        {booking.reassignedNotes && (
                          <div className="col-span-2 pt-1 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Admin Notes:</span>
                            <p className="text-amber-300/90 text-xs italic">{booking.reassignedNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <a
                          href={`tel:${booking.parentPhone}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3 h-3 text-amber-400" />
                          <span>Call Parent</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(booking)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Change Tutor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: OFFLINE DEMO CLASS QUERIES (Coaching center classes)
           ========================================================================= */}
        {activeTab === 'offline_queries' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Offline Classroom Demo Queries</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Indira Nagar Coaching Center
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Inquiries from parents and students for physical classroom batches, Navodaya exam prep, and foundation classes held directly at the Kumari Institute campus.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Total Offline Inquiries:</span>
                <p className="text-2xl font-black text-amber-400">{demoQueries.length}</p>
              </div>
            </div>

            {demoQueries.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">No Offline Demo Inquiries</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When visitors submit inquiries for classroom foundation batches, they will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="px-5 py-4">Student &amp; Parent</th>
                        <th className="px-5 py-4">Phone / Contact</th>
                        <th className="px-5 py-4">Grade &amp; Subject</th>
                        <th className="px-5 py-4">Preferred Slot</th>
                        <th className="px-5 py-4">Inquiry Notes</th>
                        <th className="px-5 py-4">Status &amp; Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 text-slate-200">
                      {demoQueries.map((query) => (
                        <tr key={query.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-white text-sm block">{query.studentName}</span>
                            <span className="text-slate-400 text-[11px]">Parent: {query.parentName}</span>
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold">
                            <a href={`tel:${query.phone}`} className="text-amber-400 hover:underline">
                              {query.phone}
                            </a>
                            {query.email && <span className="text-slate-400 block text-[11px] truncate">{query.email}</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-200 block">{query.grade}</span>
                            <span className="text-slate-400 text-[11px]">{query.subject}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            <span>{query.preferredDate || 'Upcoming'}</span>
                            <span className="text-slate-400 block text-[11px]">{query.preferredTime}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 max-w-xs truncate" title={query.notes}>
                            {query.notes || 'Inquiry for offline center batches'}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={query.status}
                              onChange={(e) => handleUpdateQueryStatus(query.id, e.target.value as any)}
                              className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                            >
                              <option value="new">New Query</option>
                              <option value="contacted">Contacted</option>
                              <option value="scheduled">Demo Scheduled</option>
                              <option value="enrolled">Enrolled</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: GALLERY MANAGEMENT
           ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Gallery Management</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Live Website Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Add photos of classrooms, study sessions, student activities, and institute facilities. Newly published images appear immediately on the public Gallery page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingGallery(!isAddingGallery)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingGallery ? 'Cancel' : 'Add New Gallery Photo'}</span>
              </button>
            </div>

            {/* Add Gallery Form */}
            {isAddingGallery && (
              <form onSubmit={handleAddGalleryItem} className="bg-slate-800 rounded-3xl p-6 border border-amber-500/40 space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Add Photo to Gallery</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Photo Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Science Laboratory Session"
                      value={newGalleryTitle}
                      onChange={(e) => setNewGalleryTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                    <select
                      value={newGalleryCategory}
                      onChange={(e) => setNewGalleryCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="students">Students in Action</option>
                      <option value="classrooms">Classrooms &amp; Labs</option>
                      <option value="building">Campus &amp; Facilities</option>
                      <option value="events">Events &amp; Celebrations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Interactive experiments in physics"
                      value={newGallerySubtitle}
                      onChange={(e) => setNewGallerySubtitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Image URL / Path *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://... or /src/assets/images/... (or ImgBB URL)"
                    value={newGalleryImage}
                    onChange={(e) => setNewGalleryImage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {newGalleryImage && (
                  <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 flex items-center gap-3">
                    <img src={newGalleryImage} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-emerald-400">Image Preview Ready</span>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm">{newGalleryTitle || 'Untitled Photo'}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingGallery(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                  >
                    Publish to Gallery
                  </button>
                </div>
              </form>
            )}

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {galleryItems.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 group">
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-950">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-xs uppercase tracking-wider">
                      {item.category}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryItem(item.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: SUCCESS STORIES MANAGEMENT
           ========================================================================= */}
        {activeTab === 'success_stories' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Success Stories &amp; Testimonials</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Website Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Add inspirational stories of students achieving top scores, cracking Navodaya selections, or excelling in CBSE/State Boards. Newly added stories will display immediately on the public Success Stories page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingStory(!isAddingStory)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingStory ? 'Cancel' : 'Add New Success Story'}</span>
              </button>
            </div>

            {/* Add Story Form */}
            {isAddingStory && (
              <form onSubmit={handleAddSuccessStory} className="bg-slate-800 rounded-3xl p-6 border border-amber-500/40 space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Create Student Success Story</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={newStoryName}
                      onChange={(e) => setNewStoryName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Score / Rank *</label>
                    <input
                      type="text"
                      placeholder="e.g. 98.4% or AIR 12"
                      value={newStoryScore}
                      onChange={(e) => setNewStoryScore(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Exam / Board</label>
                    <input
                      type="text"
                      placeholder="e.g. CBSE Class 10 (District 1st)"
                      value={newStoryExam}
                      onChange={(e) => setNewStoryExam(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Highlight Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. District Topper"
                      value={newStoryBadge}
                      onChange={(e) => setNewStoryBadge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">School / Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. De Paul School, Rayagada"
                      value={newStorySchool}
                      onChange={(e) => setNewStorySchool(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Parent's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={newStoryParent}
                      onChange={(e) => setNewStoryParent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Academic Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024"
                      value={newStoryYear}
                      onChange={(e) => setNewStoryYear(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Image Upload or URL */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200">
                      Student / Certificate Image (Upload File or Enter URL) *
                    </label>
                    {isUploadingStoryImage && (
                      <span className="text-[11px] text-amber-400 animate-pulse font-semibold flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 animate-bounce" />
                        <span>Uploading image...</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File upload input */}
                    <div>
                      <span className="block text-[11px] text-slate-400 mb-1.5">Option A: Upload Image from Device</span>
                      <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-xl cursor-pointer bg-slate-950/60 transition-colors">
                        <Upload className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-300">
                          {storyImageFile ? storyImageFile.name : 'Choose image (PNG, JPG, WebP)'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Click to browse local files</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setStoryImageFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setStoryImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Image URL fallback */}
                    <div>
                      <span className="block text-[11px] text-slate-400 mb-1.5">Option B: Or Enter Image URL</span>
                      <input
                        type="text"
                        placeholder="https://... or /src/assets/images/..."
                        value={newStoryImage}
                        onChange={(e) => {
                          setNewStoryImage(e.target.value);
                          if (e.target.value) setStoryImagePreview(e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Leave blank to use default high-resolution student portrait
                      </p>
                    </div>
                  </div>

                  {/* Image Preview Banner */}
                  {(storyImagePreview || newStoryImage) && (
                    <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      <img
                        src={storyImagePreview || newStoryImage}
                        alt="Success Story Preview"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-emerald-400 block">✓ Image Selected</span>
                        <p className="text-[11px] text-slate-400 truncate">
                          {storyImageFile ? `${storyImageFile.name} (${(storyImageFile.size / 1024).toFixed(1)} KB)` : newStoryImage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Testimonial Quote / Story *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share how the student achieved this score, role of Kumari Institute mentors..."
                    value={newStoryTestimonial}
                    onChange={(e) => setNewStoryTestimonial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStory(false);
                      setStoryImageFile(null);
                      setStoryImagePreview('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingStoryImage}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingStoryImage ? 'Uploading & Persisting...' : 'Persist Story in Firestore'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {successStories.map((story) => (
                <div key={story.id} className="bg-slate-800 rounded-3xl p-5 border border-slate-700 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={story.image || '/src/assets/images/student_rohit_1788779382685.jpg'}
                          alt={story.studentName}
                          className="w-13 h-13 rounded-2xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-white text-base">{story.studentName}</h4>
                          <span className="text-xs font-bold text-amber-400">{story.score}</span>
                          <p className="text-[11px] text-slate-400">{story.exam}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSuccessStory(story.id)}
                        className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors"
                        title="Delete Story"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                      "{story.testimonial}"
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/60 pt-2">
                    <span>{story.school || 'Rayagada'}</span>
                    {story.parentName && <span>Parent: {story.parentName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: ADMINISTRATIVE ACTIVITY LOGS & AUDIT TRAIL
           ========================================================================= */}
        {activeTab === 'activity_logs' && (
          <AdminActivityLogsTab
            activityLogs={activityLogs}
            isLoading={isLoadingActivityLogs}
            onRefresh={() => {
              setIsLoadingActivityLogs(true);
              fetch('/api/admin/activity-logs')
                .then((r) => r.json())
                .then((res) => {
                  if (res?.logs) setActivityLogs(res.logs);
                  setIsLoadingActivityLogs(false);
                })
                .catch(() => setIsLoadingActivityLogs(false));
            }}
            onRecordPaymentClick={() => setIsRecordPaymentModalOpen(true)}
            onExport={handleExportAuditLogs}
            onSelectLogForDetail={(log) => setSelectedLogForDetail(log)}
            tutorApprovalsCount={tutorApprovalsCount}
            demoBookingsHandledCount={demoBookingsHandledCount}
            homeTutorPaymentsTotal={homeTutorPaymentsTotal}
            homeTutorPaymentsCount={homeTutorPaymentsCount}
            coursePaymentsTotal={coursePaymentsTotal}
            coursePaymentsCount={coursePaymentsCount}
            totalAuditedRevenue={totalAuditedRevenue}
            totalAuditActionsCount={totalAuditActionsCount}
            activityCategoryFilter={activityCategoryFilter}
            setActivityCategoryFilter={setActivityCategoryFilter}
            activityAdminFilter={activityAdminFilter}
            setActivityAdminFilter={setActivityAdminFilter}
            activityTimeFilter={activityTimeFilter}
            setActivityTimeFilter={setActivityTimeFilter}
            activitySearch={activitySearch}
            setActivitySearch={setActivitySearch}
            filteredActivityLogs={filteredActivityLogs}
            uniqueAdmins={uniqueAdmins}
          />
        )}

        {/* =========================================================================
            TAB 8: TUTOR REVIEWS & PARENT TRUST TESTIMONIALS
           ========================================================================= */}
        {activeTab === 'tutor_reviews' && (
          <div className="space-y-6">
            {/* Header description banner */}
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Tutor Reviews &amp; Parent Trust Ratings</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Direct Firestore Storage
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Create and manage authentic parent reviews for verified home tutors. Reviews are persisted directly in the Firestore database and rendered on each tutor's detail page to establish trust with parents in Rayagada.
                </p>
              </div>

              {/* Quick stats pills */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-center">
                  <span className="text-xs text-slate-400 block font-medium">Published Reviews</span>
                  <span className="text-lg font-black text-amber-400">{totalReviewsCount}</span>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-center">
                  <span className="text-xs text-slate-400 block font-medium">Reviewed Tutors</span>
                  <span className="text-lg font-black text-emerald-400">
                    {tutors.filter((t) => t.reviews && t.reviews.length > 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Layout: Create Review Form (Left) & Existing Reviews List (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Create & Publish Form */}
              <div className="lg:col-span-5 bg-slate-800/90 rounded-3xl p-6 border border-slate-700 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Create Parent Review</h3>
                      <p className="text-[11px] text-slate-400">Published to tutor's profile page &amp; Firestore</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePublishReview} className="space-y-4">
                  {/* Select Verified Tutor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Select Verified Home Tutor <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={selectedReviewTutorId}
                      onChange={(e) => setSelectedReviewTutorId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="">-- Choose a verified tutor --</option>
                      {approvedTutors.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} • {t.qualification} ({t.locationArea || 'Rayagada'})
                        </option>
                      ))}
                    </select>
                    {approvedTutors.length === 0 && (
                      <p className="text-[11px] text-amber-400 mt-1">
                        No verified tutors yet. Please verify a tutor first from the Tutor Verification tab.
                      </p>
                    )}
                  </div>

                  {/* Parent Name & Relation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Parent / Guardian Name <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Mohanty"
                        value={reviewParentName}
                        onChange={(e) => setReviewParentName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Relation to Student
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Father, Mother, Guardian"
                        value={reviewRelation}
                        onChange={(e) => setReviewRelation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Student Grade & School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Student Class / Grade
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Class 10 CBSE"
                        value={reviewStudentGrade}
                        onChange={(e) => setReviewStudentGrade(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        School Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DAV Public School Rayagada"
                        value={reviewSchoolName}
                        onChange={(e) => setReviewSchoolName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Interactive Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Rating: <span className="text-amber-400 font-extrabold">{reviewRating} Stars</span>
                    </label>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setReviewRating(starVal)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              starVal <= reviewRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-2 font-medium">
                        {reviewRating === 5
                          ? 'Outstanding (5/5)'
                          : reviewRating === 4
                          ? 'Very Good (4/5)'
                          : reviewRating === 3
                          ? 'Good (3/5)'
                          : 'Satisfactory'}
                      </span>
                    </div>
                  </div>

                  {/* Review Testimonial Comment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Parent Review &amp; Testimonial <span className="text-amber-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Very patient teacher! Helped my son understand fundamental Math concepts clearly and score 94% in term exams..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Verified Booking Checkbox */}
                  <label className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-700/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewVerifiedBooking}
                      onChange={(e) => setReviewVerifiedBooking(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Verified Parent Booking Badge</span>
                      <span className="text-[11px] text-slate-400">Shows the green 'Verified Booking' trust badge on review card</span>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isPublishingReview}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-60"
                  >
                    {isPublishingReview ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-slate-950" />
                        <span>Publish Review to Firestore &amp; Tutor Page</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Reviews List */}
              <div className="lg:col-span-7 space-y-4">
                {/* Search & Filter Header */}
                <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white shrink-0">Filter by Tutor:</span>
                    <select
                      value={reviewFilterTutorId}
                      onChange={(e) => setReviewFilterTutorId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer w-full sm:w-auto"
                    >
                      <option value="all">All Tutors ({totalReviewsCount} reviews)</option>
                      {approvedTutors.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.reviews?.length || 0} reviews)
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    Showing{' '}
                    <strong className="text-amber-400">
                      {reviewFilterTutorId === 'all'
                        ? totalReviewsCount
                        : tutors.find((t) => t.id === reviewFilterTutorId)?.reviews?.length || 0}
                    </strong>{' '}
                    reviews
                  </span>
                </div>

                {/* Reviews Cards List */}
                {(() => {
                  const tutorsToShow = reviewFilterTutorId === 'all'
                    ? tutors.filter((t) => t.reviews && t.reviews.length > 0)
                    : tutors.filter((t) => t.id === reviewFilterTutorId && t.reviews && t.reviews.length > 0);

                  const allReviewsList: { tutor: Tutor; review: TutorReview }[] = [];
                  tutorsToShow.forEach((t) => {
                    (t.reviews || []).forEach((r) => {
                      allReviewsList.push({ tutor: t, review: r });
                    });
                  });

                  if (allReviewsList.length === 0) {
                    return (
                      <div className="bg-slate-800/60 rounded-3xl p-12 border border-slate-700 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                          <Star className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-white">No Parent Reviews Yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Use the form on the left to write and publish authentic parent reviews for verified tutors in Rayagada.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {allReviewsList.map(({ tutor, review }) => (
                        <div
                          key={review.id}
                          className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 hover:border-slate-600 transition-all space-y-3 shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                                {review.parentName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-white">{review.parentName}</h4>
                                  {review.relation && (
                                    <span className="text-[11px] text-slate-400">({review.relation})</span>
                                  )}
                                  {review.verifiedBooking && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Verified Booking</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {review.studentGrade} • {review.schoolName} • {review.date}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteReview(tutor.id, review.id)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer shrink-0"
                              title="Delete review from Firestore"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Target Tutor Badge & Stars */}
                          <div className="flex items-center justify-between bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">For Tutor:</span>
                              <span className="text-xs font-bold text-amber-300">{tutor.name}</span>
                              <span className="text-[10px] text-slate-400">({tutor.qualification})</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-bold text-white ml-1">{review.rating}.0</span>
                            </div>
                          </div>

                          {/* Review Comment */}
                          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            "{review.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            REGISTERED DIRECTORY TAB (ALL REGISTERED PARENTS & TUTORS + UNASSIGNED FILTER)
           ========================================================================= */}
        {activeTab === 'registered_directory' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Overview & Metrics Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
                      <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          Registered Directory
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Parents &amp; Tutors
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Comprehensive registry of all registered families and home educators in Rayagada. Use filters to identify unassigned parents who registered but have not booked any tutors yet, and allocate verified home teachers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Action Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  {/* Total Parents */}
                  <div
                    onClick={() => {
                      setDirectoryRoleFilter('parents');
                      setParentAssignmentFilter('all');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      directoryRoleFilter === 'parents' && parentAssignmentFilter === 'all'
                        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Total Parents</span>
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">{registeredParents.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Rayagada Families</div>
                  </div>

                  {/* Unassigned Parents Highlight Card */}
                  <div
                    onClick={() => {
                      setDirectoryRoleFilter('parents');
                      setParentAssignmentFilter('unassigned');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      parentAssignmentFilter === 'unassigned'
                        ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-500/20 ring-1 ring-rose-400'
                        : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-rose-300 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        Unassigned
                      </span>
                      {unassignedParentsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>
                    <div className="text-xl font-black text-rose-400 mt-1 flex items-baseline gap-1.5">
                      <span>{unassignedParentsCount}</span>
                      <span className="text-[10px] font-semibold text-rose-300/80">no tutor booked</span>
                    </div>
                    <div className="text-[10px] text-rose-400/80 font-bold mt-0.5">Needs Allocation →</div>
                  </div>

                  {/* Assigned Parents */}
                  <div
                    onClick={() => {
                      setDirectoryRoleFilter('parents');
                      setParentAssignmentFilter('assigned');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      parentAssignmentFilter === 'assigned'
                        ? 'bg-emerald-950/60 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Assigned Families</span>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl font-black text-emerald-400 mt-1">{assignedParentsCount}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Active Tuition</div>
                  </div>

                  {/* Registered Tutors */}
                  <div
                    onClick={() => {
                      setDirectoryRoleFilter('tutors');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      directoryRoleFilter === 'tutors'
                        ? 'bg-amber-950/60 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Total Tutors</span>
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-black text-amber-400 mt-1">{tutors.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{approvedTutorsCount} verified genuine</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
              {/* Primary Role Filter & Search */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Role Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    Filter User Role:
                  </span>

                  <button
                    type="button"
                    onClick={() => setDirectoryRoleFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      directoryRoleFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Users ({registeredParents.length + tutors.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectoryRoleFilter('parents')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      directoryRoleFilter === 'parents'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Registered Parents ({registeredParents.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectoryRoleFilter('tutors')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      directoryRoleFilter === 'tutors'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Registered Tutors ({tutors.length})</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, child, grade, phone, colony, tutor..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {directorySearch && (
                    <button
                      type="button"
                      onClick={() => setDirectorySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Parent Booking & Assignment Status Filter (CRITICAL REQUIREMENT) */}
              {(directoryRoleFilter === 'all' || directoryRoleFilter === 'parents') && (
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      Parent Status Filter:
                    </span>

                    <button
                      type="button"
                      onClick={() => setParentAssignmentFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        parentAssignmentFilter === 'all'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      All Parents ({registeredParents.length})
                    </button>

                    {/* UNASSIGNED PARENTS FILTER - Core user requirement */}
                    <button
                      type="button"
                      onClick={() => {
                        setParentAssignmentFilter('unassigned');
                        if (directoryRoleFilter === 'tutors') setDirectoryRoleFilter('parents');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        parentAssignmentFilter === 'unassigned'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400 scale-105'
                          : 'bg-rose-950/30 border border-rose-500/50 text-rose-300 hover:bg-rose-900/40 hover:text-white'
                      }`}
                      title="Show parents who registered on Kumari Home Tutors but have NOT booked or been assigned any tutor"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                      <span>Unassigned Parents (No Tutor Booked)</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {unassignedParentsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setParentAssignmentFilter('assigned')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        parentAssignmentFilter === 'assigned'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assigned Tutors ({assignedParentsCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setParentAssignmentFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        parentAssignmentFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pending Requests ({pendingParentsCount})</span>
                    </button>
                  </div>

                  {parentAssignmentFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setParentAssignmentFilter('all')}
                      className="text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Reset Status Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Active Unassigned Alert Banner */}
            {parentAssignmentFilter === 'unassigned' && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3.5 animate-in fade-in">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Filtering: Unassigned Parents (No Tutors Booked)</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                      {filteredRegisteredParents.length} parent{filteredRegisteredParents.length === 1 ? '' : 's'} found
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    These parents registered on the Kumari Home Tutors portal with their student requirements, but haven't booked any teacher or been assigned an educator yet. You can click <strong>"Assign Tutor Now"</strong> on any family card to pair them directly with an approved home educator in their Rayagada locality.
                  </p>
                </div>
              </div>
            )}

            {/* DIRECTORY CONTENT: PARENTS & TUTORS */}
            <div className="space-y-6">
              {/* 1. REGISTERED PARENTS SECTION */}
              {(directoryRoleFilter === 'all' || directoryRoleFilter === 'parents') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-black text-white text-base">
                        Registered Parents ({filteredRegisteredParents.length})
                      </h3>
                      {parentAssignmentFilter === 'unassigned' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Unassigned Filter Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Showing {filteredRegisteredParents.length} of {registeredParents.length} parents
                    </span>
                  </div>

                  {isLoadingParents ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      <span>Loading registered parents directory from database...</span>
                    </div>
                  ) : filteredRegisteredParents.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No parents match current filter criteria</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {parentAssignmentFilter === 'unassigned'
                          ? 'Great news! There are currently no unassigned parents without tutors. All registered families have either been matched or have pending booking requests.'
                          : 'Try changing your search terms or resetting the assignment status filter.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setParentAssignmentFilter('all');
                          setDirectorySearch('');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredRegisteredParents.map((parent) => {
                        const status = getParentBookingStatus(parent);
                        const matchedBooking = getParentMatchedBooking(parent);
                        const assignedEducator = parent.assignedEducator || (parent.hiredTutors && parent.hiredTutors[0]);

                        return (
                          <div
                            key={parent.uid}
                            className={`rounded-3xl border p-5 transition-all relative overflow-hidden shadow-lg ${
                              status === 'unassigned'
                                ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/70 shadow-rose-950/20'
                                : status === 'assigned'
                                ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-950/20'
                                : 'bg-slate-900/90 border-blue-500/40 hover:border-blue-500/60 shadow-blue-950/20'
                            }`}
                          >
                            {/* Card Top Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black border shadow-inner ${
                                    status === 'unassigned'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      : status === 'assigned'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  }`}
                                >
                                  {parent.name?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">{parent.name}</h4>
                                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                      Parent
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-slate-500" />
                                    <span>{parent.locality || 'Rayagada City'}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div>
                                {status === 'unassigned' ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Unassigned • No Tutor Booked</span>
                                  </span>
                                ) : status === 'assigned' ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Assigned &amp; Active</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5 shadow-sm">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Booking Pending</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Student Requirements Box */}
                            <div className="mt-4 bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Student / Ward:</span>
                                <span className="font-bold text-white">
                                  {parent.childName || 'Child details registered'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                                <div>
                                  <span className="text-slate-500 text-[11px] block">Class / Grade:</span>
                                  <span className="font-semibold text-slate-200">
                                    {parent.childGrade || 'Grade not specified'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[11px] block">School &amp; Board:</span>
                                  <span className="font-semibold text-slate-200 truncate block">
                                    {parent.childSchool
                                      ? `${parent.childSchool} (${parent.childBoard || 'CBSE'})`
                                      : parent.childBoard || 'CBSE Board'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Contact Details */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="font-mono">{parent.phone || 'Phone pending'}</span>
                                {parent.phone && (
                                  <a
                                    href={`tel:${parent.phone}`}
                                    className="text-amber-400 hover:underline text-[11px] ml-1"
                                    title="Call parent directly"
                                  >
                                    Call
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{parent.email || 'Email registered'}</span>
                              </div>
                            </div>

                            {/* Assignment Status Summary or Action Box */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80">
                              {status === 'unassigned' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-950/20 p-3 rounded-2xl border border-rose-500/20">
                                  <div className="text-xs text-rose-300">
                                    <span className="font-bold block">⚠️ No Tutor Booked Yet</span>
                                    <span className="text-[11px] text-rose-300/80">
                                      Parent is registered and waiting for an educator allocation.
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDirectAssignParent(parent);
                                      setDirectAssignTutorId(approvedTutors[0]?.id || '');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shrink-0"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Assign Tutor Now</span>
                                  </button>
                                </div>
                              ) : status === 'assigned' ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/20 text-xs">
                                  <div>
                                    <span className="text-emerald-400 font-bold block flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Assigned Tutor: {assignedEducator?.name || matchedBooking?.assignedTutorName || 'Home Tutor'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      {assignedEducator?.phone && `Phone: ${assignedEducator.phone} • `}
                                      {assignedEducator?.monthlyFee ? `₹${assignedEducator.monthlyFee}/month • ` : ''}
                                      Active home tuition in progress
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('assigned_tutors');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors shrink-0"
                                  >
                                    View in Assigned Tab →
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-950/20 p-3 rounded-2xl border border-blue-500/20 text-xs">
                                  <div>
                                    <span className="text-blue-300 font-bold block">
                                      Booking Request Pending for {matchedBooking?.requestedTutorName || 'Tutor'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Time Slot: {matchedBooking?.preferredTimeSlot || '5:00 PM - 6:00 PM'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('incoming_bookings');
                                      setBookingFilter('pending');
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shrink-0"
                                  >
                                    Review Request →
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. REGISTERED TUTORS SECTION */}
              {(directoryRoleFilter === 'all' || directoryRoleFilter === 'tutors') && (
                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-5 h-5 text-amber-400" />
                      <h3 className="font-black text-white text-base">
                        Registered Home Tutors ({filteredDirectoryTutors.length})
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {approvedTutorsCount} Approved Genuine
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Showing {filteredDirectoryTutors.length} of {tutors.length} tutors
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDirectoryTutors.map((tutor) => {
                      return (
                        <div
                          key={tutor.id}
                          className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                        >
                          <div className="space-y-3.5">
                            {/* Tutor Header */}
                            <div className="flex items-start gap-3">
                              <img
                                src={tutor.avatar}
                                alt={tutor.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-sm font-bold text-white truncate">{tutor.name}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                      tutor.isApproved || tutor.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : tutor.status === 'rejected'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {tutor.isApproved || tutor.status === 'approved'
                                      ? 'Genuine Approved'
                                      : tutor.status === 'rejected'
                                      ? 'Rejected'
                                      : 'Pending Verification'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 truncate mt-0.5">{tutor.qualification}</p>
                                <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{tutor.locationArea || 'Rayagada'}</span>
                                </p>
                              </div>
                            </div>

                            {/* Subjects & Rates */}
                            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                              <div>
                                <span className="text-slate-400 text-[11px] block">Subjects:</span>
                                <span className="text-slate-200 font-semibold line-clamp-1">
                                  {tutor.subjects.join(', ')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                <span className="text-slate-400 text-[11px]">Monthly Fee:</span>
                                <span className="text-emerald-400 font-bold">₹{tutor.monthlyFee}/month</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-[11px]">Contact:</span>
                                <span className="font-mono text-slate-300">{tutor.phone || 'Available in account'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTutorForReview(tutor);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Inspect Credentials &amp; Dossier</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          DETAILED TUTOR CERTIFICATE & PROFILE PREVIEW MODAL
         ========================================================================= */}
      {selectedTutorForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-700 overflow-hidden relative my-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedTutorForReview.avatar || '/src/assets/images/tutor_priya_sharma_1789370534007.jpg'}
                  alt={selectedTutorForReview.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">{selectedTutorForReview.name}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedTutorForReview.qualification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedTutorForReview.experienceYears}+ Yrs Exp • {selectedTutorForReview.locationArea || 'Rayagada'} •{' '}
                    <span className="text-emerald-400 font-bold">₹{selectedTutorForReview.monthlyFee}/month</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTutorForReview(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {verifyNotice && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{verifyNotice}</span>
                </div>
              )}

              {/* 1. Official Document Previews (10th, 12th, Degree, Aadhaar) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Uploaded Certificates &amp; ID Proofs</span>
                  </h4>
                  <span className="text-xs text-slate-400">Click any document to inspect full-size</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 10th Class Marksheet */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400">10th Marksheet</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {selectedTutorForReview.certificates?.tenth?.score || '91.4%'}
                      </span>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewCertDoc({
                          title: '10th Class High School Certificate & Marksheet',
                          url: selectedTutorForReview.certificates?.tenth?.url || '',
                          details: `Board: ${selectedTutorForReview.certificates?.tenth?.board || 'BSE Odisha'} • Year: ${selectedTutorForReview.certificates?.tenth?.year || '2016'}`
                        })
                      }
                      className="aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 cursor-pointer relative group flex items-center justify-center p-1"
                    >
                      <img
                        src={selectedTutorForReview.certificates?.tenth?.url}
                        alt="10th Marksheet"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedTutorForReview.certificates?.tenth?.board || 'BSE Odisha'}
                    </p>
                  </div>

                  {/* 12th Class Marksheet */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400">+2 / 12th Science</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {selectedTutorForReview.certificates?.twelfth?.score || '88.6%'}
                      </span>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewCertDoc({
                          title: '+2 Higher Secondary Examination Marksheet',
                          url: selectedTutorForReview.certificates?.twelfth?.url || '',
                          details: `Council: ${selectedTutorForReview.certificates?.twelfth?.board || 'CHSE Odisha'} • Year: ${selectedTutorForReview.certificates?.twelfth?.year || '2018'}`
                        })
                      }
                      className="aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 cursor-pointer relative group flex items-center justify-center p-1"
                    >
                      <img
                        src={selectedTutorForReview.certificates?.twelfth?.url}
                        alt="12th Marksheet"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedTutorForReview.certificates?.twelfth?.board || 'CHSE Odisha'}
                    </p>
                  </div>

                  {/* Degree Certificate */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400">Degree Certificate</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {selectedTutorForReview.certificates?.degree?.score || '85.0%'}
                      </span>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewCertDoc({
                          title: 'Degree & Graduation Certificate',
                          url: selectedTutorForReview.certificates?.degree?.url || '',
                          details: `University: ${selectedTutorForReview.certificates?.degree?.university || 'Berhampur University'} • Degree: ${selectedTutorForReview.qualification}`
                        })
                      }
                      className="aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 cursor-pointer relative group flex items-center justify-center p-1"
                    >
                      <img
                        src={selectedTutorForReview.certificates?.degree?.url}
                        alt="Degree Certificate"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {selectedTutorForReview.certificates?.degree?.university || 'University Degree'}
                    </p>
                  </div>

                  {/* Aadhaar Card ID */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-400">Aadhaar ID Proof</span>
                      <span className="text-[10px] text-slate-400">Govt ID</span>
                    </div>

                    <div
                      onClick={() =>
                        setPreviewCertDoc({
                          title: 'Government Identity Verification (Aadhaar Card)',
                          url: selectedTutorForReview.certificates?.idProof?.url || '',
                          details: `Aadhaar Number: ${selectedTutorForReview.aadhaarNumber || '8492 1048 3921'} • Address: ${selectedTutorForReview.locationArea || 'Rayagada'}`
                        })
                      }
                      className="aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 cursor-pointer relative group flex items-center justify-center p-1"
                    >
                      <img
                        src={selectedTutorForReview.certificates?.idProof?.url}
                        alt="Aadhaar Card"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 shadow-md">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      UID: {selectedTutorForReview.aadhaarNumber || '8492 1048 3921'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Teaching Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Academic & Teaching Summary */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Teaching Credentials</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Subjects Offered:</span>
                      <span className="font-semibold text-slate-200">{selectedTutorForReview.subjects.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Classes Handled:</span>
                      <span className="font-semibold text-slate-200">
                        {selectedTutorForReview.classesHandled.join(', ') || '1st to 5th Class'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tuition Mode:</span>
                      <span className="font-semibold text-emerald-400">Home Tutor (Dedicated 1-on-1 at Student Home)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Available Slots:</span>
                      <span className="text-slate-300">
                        {selectedTutorForReview.availableTimeSlots?.join(', ') || '5:00 PM - 6:00 PM, 6:00 PM - 7:00 PM'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & Coordinates */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">GPS &amp; Residence Location</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Address:</span>
                      <span className="font-medium text-slate-200">
                        {selectedTutorForReview.addressSnippet || selectedTutorForReview.locationArea || 'Rayagada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">GPS Coordinates:</span>
                      <span className="font-mono text-amber-300">
                        {selectedTutorForReview.latitude?.toFixed(4)}° N, {selectedTutorForReview.longitude?.toFixed(4)}° E
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone / WhatsApp:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {selectedTutorForReview.phone || 'Available in account'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email:</span>
                      <span className="text-slate-300 truncate block">
                        {selectedTutorForReview.email || 'Registered account'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Teaching Highlights */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Teacher Biography</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedTutorForReview.bio || 'Dedicated educator registered with Kumari Institute for home tutoring in Rayagada.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-950 p-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Current Status:</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      selectedTutorForReview.isApproved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : selectedTutorForReview.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedTutorForReview.isApproved ? 'Genuine Tutor (Approved)' : selectedTutorForReview.status === 'rejected' ? 'Rejected' : 'Pending Verification'}
                  </span>
                </div>

                {/* Direct Visibility Toggle on 'Find Home Tutor' page */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                  <span className="text-xs text-slate-400">Find Tutor Page:</span>
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleToggleVisibility(selectedTutorForReview)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      selectedTutorForReview.verified
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Toggle public visibility on Find Home Tutor page"
                  >
                    {selectedTutorForReview.verified ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Visible to Parents</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hidden (Unverified)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedTutorForReview.isApproved && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReviewTutorId(selectedTutorForReview.id);
                      setActiveTab('tutor_reviews');
                      setSelectedTutorForReview(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Create Parent Review</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerifyTutor(selectedTutorForReview, 'rejected')}
                  className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer transition-colors"
                >
                  Reject / Request Documents
                </button>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleVerifyTutor(selectedTutorForReview, 'approved')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Tutor as Genuine</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX FOR CERTIFICATE FULL PREVIEW
         ========================================================================= */}
      {previewCertDoc && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setPreviewCertDoc(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">{previewCertDoc.title}</h4>
                {previewCertDoc.details && <p className="text-xs text-slate-400">{previewCertDoc.details}</p>}
              </div>
              <button
                type="button"
                onClick={() => setPreviewCertDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={previewCertDoc.url}
                alt={previewCertDoc.title}
                className="max-h-[70vh] w-auto object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Official Academic &amp; Verification Document</span>
              <a
                href={previewCertDoc.url}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RE-ASSIGN TUTOR MODAL (Admin assigns new tutor to parent)
         ========================================================================= */}
      {reassignModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Assign Home Tutor to Parent</h3>
                <p className="text-xs text-slate-400">
                  Student: <span className="text-white font-semibold">{reassignModalBooking.studentName}</span> ({reassignModalBooking.studentGrade})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Select Approved Genuine Home Tutor:
              </label>
              <select
                value={selectedReassignTutorId}
                onChange={(e) => setSelectedReassignTutorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {approvedTutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} • {t.qualification} • ₹{t.monthlyFee}/mo ({t.locationArea || 'Rayagada'})
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assignment Note / Confirmation Message for Parent:
                </label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReassignModalBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigning}
                onClick={handleConfirmReassignment}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Tutor Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DECLINE BOOKING MODAL (Admin declines parent booking request with reason)
         ========================================================================= */}
      {declineModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-rose-500/40 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Decline Booking Request</h3>
                  <p className="text-xs text-slate-400">
                    Parent request for student{' '}
                    <span className="text-white font-semibold">{declineModalBooking.studentName}</span> ({declineModalBooking.studentGrade})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeclineModalBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Requested Tutor:</span>
                <span className="font-bold text-white">{declineModalBooking.requestedTutorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Parent &amp; Contact:</span>
                <span className="font-medium text-slate-200">
                  {declineModalBooking.parentName} ({declineModalBooking.parentPhone})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Class &amp; Location:</span>
                <span className="text-slate-300 truncate max-w-xs">
                  {declineModalBooking.studentGrade} • {declineModalBooking.address}
                </span>
              </div>
            </div>

            {/* Select Decline Reason */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Select Reason for Declining:
              </label>
              <div className="space-y-2">
                {[
                  'Selected time slot is already fully occupied.',
                  'Tutor is currently not accepting new home tuition students in this area.',
                  'Location is outside tutor daily travel perimeter in Rayagada.',
                  'Subject or syllabus requirement mismatch with current availability.',
                  'Custom / Other Reason'
                ].map((reasonOption) => (
                  <label
                    key={reasonOption}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      declineReason === reasonOption
                        ? 'bg-rose-950/40 border-rose-500/50 text-white font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="declineReason"
                      value={reasonOption}
                      checked={declineReason === reasonOption}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="mt-0.5 text-rose-500 focus:ring-rose-400 cursor-pointer"
                    />
                    <span>{reasonOption}</span>
                  </label>
                ))}
              </div>

              {declineReason === 'Custom / Other Reason' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Specify Custom Decline Reason / Notes:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter reason to be recorded for this booking..."
                    value={customDeclineReason}
                    onChange={(e) => setCustomDeclineReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeclineModalBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeclining}
                onClick={handleConfirmDecline}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isDeclining ? 'Declining...' : 'Confirm Decline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIRECT TUTOR ASSIGNMENT MODAL (Assign approved tutor to unassigned parent)
         ========================================================================= */}
      {directAssignParent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full border border-indigo-500/40 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Assign Home Tutor</h3>
                  <p className="text-xs text-slate-400">
                    Pairing educator for <span className="text-white font-semibold">{directAssignParent.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDirectAssignParent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parent & Student Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Parent Name &amp; Phone:</span>
                <span className="font-bold text-white">
                  {directAssignParent.name} ({directAssignParent.phone || 'No phone'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Student &amp; Class:</span>
                <span className="font-medium text-slate-200">
                  {directAssignParent.childName || 'Child'} • {directAssignParent.childGrade || 'Primary/Middle School'} ({directAssignParent.childBoard || 'CBSE'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Residence Locality:</span>
                <span className="text-amber-300 font-medium">
                  {directAssignParent.locality || 'Rayagada City'}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Select Approved Tutor */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Approved Home Tutor:
                </label>
                <select
                  value={directAssignTutorId}
                  onChange={(e) => setDirectAssignTutorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">-- Choose an approved tutor --</option>
                  {approvedTutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.name} • {tutor.qualification} • {tutor.subjects.slice(0, 2).join(', ')} • ₹{tutor.monthlyFee}/mo • ({tutor.locationArea || 'Rayagada'})
                    </option>
                  ))}
                </select>
                {approvedTutors.length === 0 && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    No approved tutors available. Please verify and approve tutors in the "Tutor Verification" tab first.
                  </p>
                )}
              </div>

              {/* Selected Tutor Preview Box */}
              {(() => {
                const selectedTutor = approvedTutors.find((t) => t.id === directAssignTutorId);
                if (!selectedTutor) return null;
                return (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3 flex items-center gap-3">
                    <img
                      src={selectedTutor.avatar}
                      alt={selectedTutor.name}
                      className="w-10 h-10 rounded-xl object-cover border border-indigo-400/40"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-white">{selectedTutor.name}</div>
                      <div className="text-[11px] text-indigo-300">
                        {selectedTutor.qualification} • {selectedTutor.locationArea || 'Rayagada'} • ₹{selectedTutor.monthlyFee}/month
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Time Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Daily Teaching Time Slot:
                </label>
                <select
                  value={directAssignSlot}
                  onChange={(e) => setDirectAssignSlot(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM (Evening Slot 1)</option>
                  <option value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM (Evening Slot 2)</option>
                  <option value="7:00 PM - 8:00 PM">7:00 PM - 8:00 PM (Evening Slot 3)</option>
                  <option value="8:00 PM - 9:00 PM">8:00 PM - 9:00 PM (Night Slot)</option>
                  <option value="7:00 AM - 8:00 AM">7:00 AM - 8:00 AM (Morning Slot)</option>
                </select>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Admin Assignment Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on CBSE Mathematics & Science, 5 days a week home visit."
                  value={directAssignNotes}
                  onChange={(e) => setDirectAssignNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDirectAssignParent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDirectAssigning || !directAssignTutorId}
                onClick={handleConfirmDirectAssign}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isDirectAssigning ? 'Assigning Tutor...' : 'Confirm Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT & AUDIT ACTION MODAL */}
      <AdminRecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => setIsRecordPaymentModalOpen(false)}
        tutors={tutors}
        currentAdminName={currentUser?.name || 'Admin Chandini Kurumoju'}
        onSave={async (entry) => {
          const newLog = await logAdminActivity(entry);
          setActivityLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id)]);
          showToast('success', '✓ Activity & payment logged in audit trail!');
        }}
      />

      {/* RECEIPT & AUDIT VOUCHER MODAL */}
      <AdminReceiptVoucherModal
        log={selectedLogForDetail}
        onClose={() => setSelectedLogForDetail(null)}
      />
    </div>
  );
};
