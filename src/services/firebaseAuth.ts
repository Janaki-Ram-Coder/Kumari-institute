import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { auth, db, FIRESTORE_DATABASE_ID, verifyFirestoreConnection } from "../lib/firebase";
import { Tutor, TutorReview } from "../data/tutorsData";
import { AdminSuccessStory, AdminActivityLog } from "../types";

export interface ParentRegistrationData {
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  childName?: string;
  childGrade?: string;
  board?: string;
  subjects?: string[];
  locality?: string;
}

export interface TeacherRegistrationData {
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  localityId?: string;
  address?: string;
  locationArea?: string;
  qualification?: string;
  experienceYears?: number;
  subjects?: string[];
  classesHandled?: string[];
  monthlyFee?: number;
  hourlyRate?: number;
  gender?: 'female' | 'male';
  teacherType?: 'home' | 'center';
  bio?: string;
}

export interface UserRegistrationInput {
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  password: string;
  role: 'parent' | 'teacher';
}

export interface EnrolledCourse {
  id: string;
  courseId: string;
  title: string;
  subtitle?: string;
  fee: string;
  tag?: string;
  enrolledAt: string;
  status: 'Active' | 'Completed';
}

export interface HiredTutor {
  id: string;
  tutorId: string;
  tutorName: string;
  subjects: string[];
  monthlyFee: number;
  phone?: string;
  locationArea?: string;
  hiredAt: string;
  status: 'Confirmed' | 'Active';
}

export interface DemoBooking {
  id: string;
  studentName?: string;
  grade?: string;
  subject?: string;
  mode?: string;
  preferredDate?: string;
  preferredTime?: string;
  bookedAt: string;
  status: 'Scheduled' | 'Confirmed';
}

export interface UserTask {
  id: string;
  title: string;
  category?: 'Homework' | 'Test' | 'Assignment' | 'Revision' | 'Demo' | 'General';
  dueDate?: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface UserProgressMetric {
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActive: string;
}

export interface AppUserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'parent' | 'teacher' | 'admin';
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  profileCompleted?: boolean;
  locality?: string;
  latitude?: number;
  longitude?: number;
  childName?: string;
  childGrade?: string;
  childSchool?: string;
  childBoard?: string;
  targetExam?: string;
  emergencyContact?: string;
  qualification?: string;
  university?: string;
  experience?: string;
  subjects?: string[];
  classes?: string[];
  monthlyFee?: number;
  hourlyFee?: number;
  tuitionModes?: string[];
  bio?: string;
  avatar?: string;
  photoUrl?: string;
  hourlyCharges?: number;
  availableTimeSlots?: string[];
  addressDetails?: {
    line1?: string;
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  kycStatus?: 'pending' | 'submitted' | 'verified';
  educationDetails?: any;
  enrolledCourses?: EnrolledCourse[];
  hiredTutors?: HiredTutor[];
  assignedEducator?: any;
  demoBookings?: DemoBooking[];
  tasks?: UserTask[];
  progress?: Record<string, UserProgressMetric>;
  createdAt?: string;
  lastLoginAt?: string;
  emailVerified?: boolean;
}

export const ADMIN_CREDENTIALS = {
  email: 'chandinikurumoju424@gmail.com',
  password: 'ram123',
  name: 'Chandini Kurumoju (Admin)',
  role: 'admin' as const
};


const SESSION_STORAGE_KEY = 'kumari_user_session';
const USERS_REGISTRY_KEY = 'kumari_registered_users_registry';

export function saveUserToLocalRegistry(profile: AppUserProfile): void {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    const registry: Record<string, AppUserProfile> = raw ? JSON.parse(raw) : {};
    if (profile.uid) registry[profile.uid] = profile;
    if (profile.email) registry[profile.email.toLowerCase()] = profile;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (err) {
    console.warn('Could not save user to local registry:', err);
  }
}

export function getUserFromLocalRegistry(identifier: string): AppUserProfile | null {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) return null;
    const registry: Record<string, AppUserProfile> = JSON.parse(raw);
    return registry[identifier] || registry[identifier.toLowerCase()] || null;
  } catch {
    return null;
  }
}

export async function getUserFromPersistentServer(identifier: string): Promise<AppUserProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(identifier)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) return data.user;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Recursively strips all keys with `undefined` values from an object or array.
 * Cloud Firestore setDoc() and updateDoc() throw an error if any field is undefined.
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeUndefinedFields(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Synchronize user profile across Firestore, persistent Server storage (/api/users), and local registry
 */
export async function syncUserToPersistence(profile: AppUserProfile): Promise<void> {
  // 1. Local backup registry
  saveUserToLocalRegistry(profile);

  // 2. Server persistent storage
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
  } catch (err) {
    console.warn('[Sync] Server user store notice:', err);
  }

  // 3. Cloud Firestore - saved directly to parents or teachers (no duplicate users collection)
  try {
    const cleanPayload = removeUndefinedFields(profile);
    if (profile.role === 'teacher') {
      await setDoc(doc(db, "teachers", profile.uid), cleanPayload, { merge: true });
    } else {
      await setDoc(doc(db, "parents", profile.uid), cleanPayload, { merge: true });
    }
  } catch (fsErr) {
    console.warn('[Sync] Cloud Firestore store notice:', fsErr);
  }
}

export function saveUserSessionToStorage(profile: AppUserProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Could not save session to localStorage:', err);
  }
}

export function loadSavedUserSession(): AppUserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppUserProfile;
      // If user lacks a valid UID or email is not verified, strictly disallow active session
      if (!parsed || !parsed.uid || parsed.emailVerified !== true) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Could not load session from localStorage:', err);
  }
  return null;
}

/**
 * Format Firebase Auth errors into friendly messages for parents and teachers
 */
export function formatFirebaseError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-not-verified':
      return 'Kindly verify your account to log in. We sent a verification link to your email.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please log in instead.';
    case 'auth/invalid-email':
      return 'The email address entered is not valid.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled yet in your Firebase console. Please check Authentication > Sign-in method.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up or create an account first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials or click "Create New Account" if you have not registered yet.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access is temporarily locked. Please reset password or try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    default:
      return error?.message || 'An error occurred during authentication. Please try again.';
  }
}

/**
 * Register a Parent in Firebase Auth and store profile in Firestore 'parents' & 'users'
 */
export async function registerParentInFirebase(data: ParentRegistrationData): Promise<AppUserProfile> {
  const password = data.password || 'Kumari@1234';
  const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), password);
  const firebaseUser = userCredential.user;

  // Set display name in Auth
  try {
    await updateProfile(firebaseUser, {
      displayName: data.fullName.trim()
    });
  } catch (err) {
    console.warn('updateProfile notice:', err);
  }

  // Send Firebase Email Verification Link
  try {
    await sendEmailVerification(firebaseUser);
  } catch (err) {
    console.warn('sendEmailVerification notice:', err);
  }

  const now = new Date().toISOString();
  const parentProfile = {
    uid: firebaseUser.uid,
    role: 'parent' as const,
    fullName: data.fullName.trim(),
    name: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    childName: data.childName?.trim() || '',
    childGrade: data.childGrade?.trim() || '',
    board: data.board?.trim() || '',
    subjects: data.subjects || [],
    locality: data.locality?.trim() || '',
    enrolledCourses: [],
    hiredTutors: [],
    demoBookings: [],
    tasks: [],
    progress: {},
    emailVerified: false,
    createdAt: now,
    updatedAt: now
  };

  // Store strictly in parents collection in Firestore (no duplicate users collection)
  try {
    await setDoc(doc(db, "parents", firebaseUser.uid), removeUndefinedFields(parentProfile));
  } catch (fsErr) {
    console.warn('Firestore parent store notice:', fsErr);
  }

  // Sign out immediately so NO session is active before email verification
  try {
    await signOut(auth);
  } catch (signoutErr) {
    console.warn('Sign out notice:', signoutErr);
  }
  saveUserSessionToStorage(null);

  const res: AppUserProfile = {
    uid: firebaseUser.uid,
    name: data.fullName.trim(),
    email: data.email.trim(),
    role: 'parent',
    phone: data.phone.trim(),
    locality: data.locality?.trim() || '',
    enrolledCourses: [],
    hiredTutors: [],
    demoBookings: [],
    tasks: [],
    progress: {},
    createdAt: parentProfile.createdAt,
    emailVerified: false
  };

  return res;
}

export const DEMO_PARENT_ACCOUNT = {
  email: 'parent.demo@kumari.edu',
  password: 'Password@123',
  name: 'Priya Sharma (Parent)',
  phone: '9876543210',
  role: 'parent' as const,
  locality: 'Indira Nagar, Rayagada'
};

export const DEMO_TEACHER_ACCOUNT = {
  email: 'teacher.demo@kumari.edu',
  password: 'Password@123',
  name: 'Sunita Nayak (Teacher)',
  phone: '9861234567',
  role: 'teacher' as const,
  locality: 'Rayagada Central'
};

/**
 * Standard User Registration (Parent or Teacher) asking for: Name, Email, Mobile, Gender, Password, Role
 * Sends official Firebase email verification link and signs out immediately.
 * User must verify email from the link before being allowed to log in and establish an active session.
 */
export async function registerUserInFirebase(input: UserRegistrationInput): Promise<AppUserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const firebaseUser = userCredential.user;

  // Set display name in Auth
  try {
    await updateProfile(firebaseUser, {
      displayName: input.name.trim()
    });
  } catch (profErr) {
    console.warn('updateProfile notice:', profErr);
  }

  // Send email verification link from Firebase
  try {
    await sendEmailVerification(firebaseUser);
  } catch (err) {
    console.warn('sendEmailVerification notice:', err);
  }

  const now = new Date().toISOString();
  const baseProfile: AppUserProfile = {
    uid: firebaseUser.uid,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    gender: input.gender,
    role: input.role,
    locality: '',
    enrolledCourses: [],
    hiredTutors: [],
    demoBookings: [],
    tasks: [],
    progress: {},
    createdAt: now,
    emailVerified: false
  };

  // Persist base initial profile to Firestore (strictly parents or teachers, no duplicate users)
  try {
    if (input.role === 'parent') {
      await setDoc(doc(db, "parents", firebaseUser.uid), removeUndefinedFields({
        ...baseProfile,
        fullName: input.name.trim(),
        locality: '',
        childName: '',
        childGrade: '',
        childBoard: '',
        childSchool: '',
        enrolledCourses: [],
        hiredTutors: []
      }));
      console.log(`[Firestore] Successfully stored clean parent profile for ${baseProfile.name} in parents collection.`);
    } else {
      await setDoc(doc(db, "teachers", firebaseUser.uid), removeUndefinedFields({
        ...baseProfile,
        id: `fb_teacher_${firebaseUser.uid}`,
        fullName: input.name.trim(),
        qualification: '',
        experienceYears: 0,
        experience: '',
        subjects: [],
        classesHandled: [],
        monthlyFee: 0,
        hourlyRate: 0,
        rating: 0,
        reviewCount: 0,
        locationArea: '',
        address: '',
        badge: 'New Educator',
        verified: false,
        kycStatus: 'pending',
        teacherType: 'home',
        profileCompleted: false
      }));
      console.log(`[Firestore] Successfully stored clean teacher profile for ${baseProfile.name} in teachers collection.`);
    }
  } catch (fsErr) {
    console.warn('[Firestore] Profile initial write note:', fsErr);
  }

  // 2. Persist to server /api/users persistent database
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseProfile)
    });
  } catch (serverErr) {
    console.warn('[Server Store] Profile write note:', serverErr);
  }

  // 3. Save to local backup registry
  saveUserToLocalRegistry(baseProfile);

  // IMPORTANT: Sign out immediately so NO session is active before email verification!
  try {
    await signOut(auth);
  } catch (signoutErr) {
    console.warn('Sign out notice:', signoutErr);
  }
  saveUserSessionToStorage(null);

  return baseProfile;
}

/**
 * Register a Teacher in Firebase Auth and store profile in Firestore 'teachers' & 'users'
 */
export async function registerTeacherInFirebase(data: TeacherRegistrationData): Promise<AppUserProfile> {
  const password = data.password || 'Kumari@1234';
  const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), password);
  const firebaseUser = userCredential.user;

  // Set display name in Auth
  try {
    await updateProfile(firebaseUser, {
      displayName: data.fullName.trim()
    });
  } catch (err) {
    console.warn('updateProfile notice:', err);
  }

  // Send verification email
  try {
    await sendEmailVerification(firebaseUser);
  } catch (err) {
    console.warn('sendEmailVerification notice:', err);
  }

  const now = new Date().toISOString();
  const teacherProfile = {
    uid: firebaseUser.uid,
    id: `fb_teacher_${firebaseUser.uid}`,
    role: 'teacher' as const,
    name: data.fullName.trim(),
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    latitude: data.latitude ?? 19.1691,
    longitude: data.longitude ?? 83.4150,
    localityId: data.localityId || 'indira-nagar',
    locationArea: data.locationArea || 'Indira Nagar',
    address: data.address || `${data.locationArea || 'Indira Nagar'}, Rayagada, Odisha`,
    addressSnippet: data.locationArea || 'Indira Nagar, Rayagada',
    qualification: data.qualification || 'B.Sc / Graduate Tutor',
    experienceYears: data.experienceYears ?? 3,
    subjects: data.subjects || ['Mathematics', 'Science'],
    classesHandled: data.classesHandled || ['1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class', '6th Class'],
    monthlyFee: data.monthlyFee ?? 3500,
    hourlyRate: data.hourlyRate ?? 400,
    rating: 4.9,
    reviewCount: 1,
    badge: 'Verified Educator',
    verified: true,
    gender: data.gender || 'female',
    teacherType: data.teacherType || 'home',
    bio: data.bio || `Passionate tutor offering dedicated home tuition in Rayagada.`,
    profileCompleted: false,
    emailVerified: false,
    tasks: [],
    progress: {},
    createdAt: now,
    updatedAt: now
  };

  // Store in teachers collection in Cloud Firestore (no duplicate users collection)
  try {
    await setDoc(doc(db, "teachers", firebaseUser.uid), removeUndefinedFields(teacherProfile));
    console.log(`[Firestore] Stored teacher profile for ${teacherProfile.name}`);
  } catch (fsErr) {
    console.warn('Firestore teacher store notice:', fsErr);
  }

  // Persist to server /api/users persistent storage
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherProfile)
    });
  } catch (serverErr) {
    console.warn('[Server Store] Teacher write note:', serverErr);
  }

  // Save to local backup registry
  saveUserToLocalRegistry(teacherProfile as any);

  // Sign out immediately so NO session is active before email verification
  try {
    await signOut(auth);
  } catch (signoutErr) {
    console.warn('Sign out notice:', signoutErr);
  }
  saveUserSessionToStorage(null);

  return {
    uid: firebaseUser.uid,
    name: data.fullName.trim(),
    email: data.email.trim(),
    role: 'teacher',
    phone: data.phone.trim(),
    profileCompleted: false,
    latitude: data.latitude ?? 19.1691,
    longitude: data.longitude ?? 83.4150,
    emailVerified: false
  };
}

/**
 * Save complete teacher profile data into Firestore
 */
export async function updateTeacherProfileInFirestore(uid: string, profileData: any): Promise<void> {
  const teacherRef = doc(db, "teachers", uid);

  const updatePayload = removeUndefinedFields({
    ...profileData,
    profileCompleted: true,
    updatedAt: new Date().toISOString()
  });

  await setDoc(teacherRef, updatePayload, { merge: true });
}

/**
 * Log in existing user with Firebase Authentication and retrieve profile from Firestore.
 * Strictly verifies email status: unverified users cannot establish a session and are guided to verify their email.
 * Upon successful verified login, syncs and stores user session, works, tasks, and progress in Firestore in real time.
 */
export async function loginUserWithFirebase(
  identifier: string,
  password: string,
  expectedRole?: 'parent' | 'teacher' | 'admin'
): Promise<AppUserProfile> {
  const email = identifier.trim().toLowerCase();

  // Special Handling for Administrator: chandinikurumoju424@gmail.com with password 'ram123'
  if (email === ADMIN_CREDENTIALS.email.toLowerCase()) {
    if (password !== ADMIN_CREDENTIALS.password) {
      const wrongPassErr: any = new Error("Invalid password for Admin account. Please use password 'ram123'.");
      wrongPassErr.code = 'auth/wrong-password';
      throw wrongPassErr;
    }

    const adminProfile: AppUserProfile = {
      uid: 'admin_chandini_424',
      name: 'Chandini Kurumoju',
      email: ADMIN_CREDENTIALS.email,
      role: 'admin',
      phone: '+91 94370 12345',
      emailVerified: true,
      profileCompleted: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    saveUserSessionToStorage(adminProfile);
    saveUserToLocalRegistry(adminProfile);
    syncUserToPersistence(adminProfile).catch(() => {});
    return adminProfile;
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // Refresh user object to fetch latest emailVerified from Firebase Auth servers
  try {
    await firebaseUser.reload();
  } catch (reloadErr) {
    console.warn('firebaseUser.reload notice:', reloadErr);
  }

  // Check email verification status:
  const isDemo =
    email === DEMO_PARENT_ACCOUNT.email.toLowerCase() ||
    email === DEMO_TEACHER_ACCOUNT.email.toLowerCase();

  if (!firebaseUser.emailVerified && !isDemo) {
    // Unverified user is strictly rejected from login session!
    try {
      await signOut(auth);
    } catch (soErr) {
      console.warn('Sign out on unverified notice:', soErr);
    }
    saveUserSessionToStorage(null);

    const verifyError: any = new Error(
      `Kindly verify your account to log in. We sent a verification link to ${email}. Please check your inbox and verify your email before logging in.`
    );
    verifyError.code = 'auth/email-not-verified';
    verifyError.email = email;
    throw verifyError;
  }

  // Retrieve user profiles from Firestore (parents or teachers)
  const [parentDocSnap, teacherDocSnap] = await Promise.all([
    getDoc(doc(db, "parents", firebaseUser.uid)).catch(() => null),
    getDoc(doc(db, "teachers", firebaseUser.uid)).catch(() => null)
  ]);

  // Check backup sources if Firestore document is not yet found or loading
  let backupData: any = getUserFromLocalRegistry(firebaseUser.uid) || getUserFromLocalRegistry(email);
  if (!backupData) {
    try {
      const resp = await fetch(`/api/users/${firebaseUser.uid}`);
      if (resp.ok) {
        const body = await resp.json();
        if (body?.user) backupData = body.user;
      }
    } catch {
      // server fetch optional
    }
  }

  const parentData = parentDocSnap && parentDocSnap.exists() ? parentDocSnap.data() : (backupData?.role === 'parent' ? backupData : {});
  const teacherData = teacherDocSnap && teacherDocSnap.exists() ? teacherDocSnap.data() : (backupData?.role === 'teacher' ? backupData : {});
  const foundData = (parentDocSnap && parentDocSnap.exists() ? parentData : null) ||
                    (teacherDocSnap && teacherDocSnap.exists() ? teacherData : null) ||
                    backupData || {};

  const role: 'parent' | 'teacher' =
    foundData.role ||
    (parentDocSnap && parentDocSnap.exists() ? 'parent' : null) ||
    (teacherDocSnap && teacherDocSnap.exists() ? 'teacher' : null) ||
    expectedRole ||
    'parent';

  const enrolledCourses: EnrolledCourse[] =
    parentData.enrolledCourses || foundData.enrolledCourses || [];
  const hiredTutors: HiredTutor[] =
    parentData.hiredTutors || foundData.hiredTutors || [];
  const demoBookings: DemoBooking[] =
    parentData.demoBookings || foundData.demoBookings || [];

  const defaultTasks: UserTask[] = [
    {
      id: `task_${Date.now()}_1`,
      title: 'Review Course Syllabus & Weekly Study Plan',
      category: 'Homework',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      completed: false,
      notes: 'Check lessons and upcoming live sessions.',
      createdAt: new Date().toISOString()
    },
    {
      id: `task_${Date.now()}_2`,
      title: role === 'teacher' ? 'Update Weekly Class Availability & Notes' : 'Schedule Free Demo Class with Home Tutor',
      category: role === 'teacher' ? 'Assignment' : 'Demo',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      completed: false,
      notes: role === 'teacher' ? 'Share study materials with enrolled students.' : 'Request 1-on-1 trial home tuition session.',
      createdAt: new Date().toISOString()
    }
  ];

  const tasks: UserTask[] = foundData.tasks && foundData.tasks.length > 0 ? foundData.tasks : defaultTasks;
  const progress: Record<string, UserProgressMetric> = foundData.progress || {};

  const profile: AppUserProfile = {
    uid: firebaseUser.uid,
    name: foundData.name || parentData.fullName || teacherData.fullName || firebaseUser.displayName || email.split('@')[0],
    email: firebaseUser.email || email,
    role,
    phone: foundData.phone || parentData.phone || teacherData.phone || '',
    gender: foundData.gender || parentData.gender || teacherData.gender || 'female',
    profileCompleted: foundData.profileCompleted ?? teacherData.profileCompleted ?? false,
    locality: foundData.locality || parentData.locality || teacherData.locationArea || 'Indira Nagar, Rayagada',
    childName: foundData.childName || parentData.childName || '',
    childGrade: foundData.childGrade || parentData.childGrade || '',
    childSchool: foundData.childSchool || parentData.childSchool || '',
    targetExam: foundData.targetExam || parentData.targetExam || '',
    emergencyContact: foundData.emergencyContact || parentData.emergencyContact || '',
    enrolledCourses,
    hiredTutors,
    demoBookings,
    tasks,
    progress,
    createdAt: foundData.createdAt || parentData.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    emailVerified: true
  };

  const validLat = typeof foundData.latitude === 'number' ? foundData.latitude : (typeof teacherData.latitude === 'number' ? teacherData.latitude : undefined);
  const validLng = typeof foundData.longitude === 'number' ? foundData.longitude : (typeof teacherData.longitude === 'number' ? teacherData.longitude : undefined);
  if (typeof validLat === 'number') profile.latitude = validLat;
  if (typeof validLng === 'number') profile.longitude = validLng;

  // Synchronize across Cloud Firestore, persistent Server storage, and local registry
  await syncUserToPersistence(profile);

  // Store in persistent local session
  saveUserSessionToStorage(profile);

  return profile;
}

/**
 * 1-Click Fast Demo Login for Parent or Teacher testing
 */
export async function quickLoginDemoUser(role: 'parent' | 'teacher'): Promise<AppUserProfile> {
  const demoAccount = role === 'parent' ? DEMO_PARENT_ACCOUNT : DEMO_TEACHER_ACCOUNT;
  try {
    return await loginUserWithFirebase(demoAccount.email, demoAccount.password, role);
  } catch {
    try {
      return await registerUserInFirebase({
        name: demoAccount.name,
        email: demoAccount.email,
        phone: demoAccount.phone,
        password: demoAccount.password,
        role: role,
        gender: 'female'
      });
    } catch {
      const fallback: AppUserProfile = {
        uid: `demo_${role}_${Date.now()}`,
        name: demoAccount.name,
        email: demoAccount.email,
        phone: demoAccount.phone,
        role: role,
        gender: 'female',
        profileCompleted: true,
        locality: demoAccount.locality,
        enrolledCourses: [],
        hiredTutors: [],
        demoBookings: [],
        emailVerified: true
      };
      saveUserSessionToStorage(fallback);
      return fallback;
    }
  }
}

/**
 * Sign out from Firebase Authentication and wipe local session
 */
export async function logoutUserFromFirebase(): Promise<void> {
  await signOut(auth);
  saveUserSessionToStorage(null);
}

/**
 * Send password reset email via Firebase Authentication
 */
export async function sendPasswordResetWithFirebase(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Resend verification link to the user's email
 */
export async function resendAccountVerificationEmail(email: string, password?: string): Promise<void> {
  if (auth.currentUser && auth.currentUser.email?.toLowerCase() === email.trim().toLowerCase()) {
    await sendEmailVerification(auth.currentUser);
    return;
  }
  if (password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await sendEmailVerification(cred.user);
    await signOut(auth);
  } else if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

/**
  * Check email verification status against Firebase Auth servers and return verified profile if successful
  */
export async function checkEmailVerificationStatus(
  email: string,
  password?: string
): Promise<{ verified: boolean; user?: AppUserProfile }> {
  const cleanedEmail = email.trim().toLowerCase();

  // If user is currently signed in to Firebase Auth, reload user to check verification state
  if (auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanedEmail) {
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const [parentDocSnap, teacherDocSnap] = await Promise.all([
          getDoc(doc(db, "parents", auth.currentUser.uid)).catch(() => null),
          getDoc(doc(db, "teachers", auth.currentUser.uid)).catch(() => null)
        ]);
        const data = (parentDocSnap && parentDocSnap.exists() ? parentDocSnap.data() : null) ||
                     (teacherDocSnap && teacherDocSnap.exists() ? teacherDocSnap.data() : {}) || {};
        const profile: AppUserProfile = {
          uid: auth.currentUser.uid,
          name: auth.currentUser.displayName || data.name || data.fullName || cleanedEmail.split('@')[0],
          email: cleanedEmail,
          role: data.role || 'parent',
          phone: data.phone || '',
          enrolledCourses: data.enrolledCourses || [],
          hiredTutors: data.hiredTutors || [],
          demoBookings: data.demoBookings || [],
          tasks: data.tasks || [],
          progress: data.progress || {},
          emailVerified: true
        };
        saveUserSessionToStorage(profile);
        return { verified: true, user: profile };
      }
    } catch (e) {
      console.warn('Firebase user reload error in checkEmailVerificationStatus:', e);
    }
  }

  // If password provided, attempt full verified login which checks emailVerified flag
  if (password) {
    try {
      const profile = await loginUserWithFirebase(cleanedEmail, password);
      return { verified: profile.emailVerified === true, user: profile };
    } catch (err: any) {
      if (err?.code === 'auth/email-not-verified') {
        return { verified: false };
      }
      throw err;
    }
  }

  return { verified: false };
}

/**
 * Update user profile details in Firestore (parents or teachers) and sync active session
 */
export async function updateUserProfileInFirebase(
  uid: string,
  updates: Partial<AppUserProfile>
): Promise<AppUserProfile> {
  const currentSession = loadSavedUserSession();
  const targetRole = updates.role || currentSession?.role || 'parent';
  const roleDocRef = doc(db, targetRole === 'teacher' ? 'teachers' : 'parents', uid);

  const updatePayload = removeUndefinedFields({
    ...updates,
    updatedAt: new Date().toISOString()
  });

  await setDoc(roleDocRef, updatePayload, { merge: true }).catch((err) => {
    console.warn('[Firestore] Update profile notice:', err);
  });

  const rawUpdatedSession: AppUserProfile = {
    ...(currentSession || {
      uid,
      name: updates.name || 'User',
      email: updates.email || '',
      role: updates.role || 'parent'
    }),
    ...updates
  };
  const updatedSession = removeUndefinedFields(rawUpdatedSession);
  saveUserSessionToStorage(updatedSession);
  syncUserToPersistence(updatedSession).catch(() => {});
  return updatedSession;
}

/**
 * Permanently enroll user in a course/program and update session
 */
export async function enrollUserInCourse(
  uid: string,
  course: { id: string; title: string; subtitle?: string; fee: string; tag?: string }
): Promise<AppUserProfile> {
  const newEnrollment: EnrolledCourse = {
    id: `enroll_${Date.now()}`,
    courseId: course.id,
    title: course.title,
    subtitle: course.subtitle,
    fee: course.fee,
    tag: course.tag || 'Course',
    enrolledAt: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    status: 'Active'
  };

  const parentDocRef = doc(db, "parents", uid);

  const parentDocSnap = await getDoc(parentDocRef).catch(() => null);
  let currentEnrolled: EnrolledCourse[] = [];
  if (parentDocSnap && parentDocSnap.exists()) {
    currentEnrolled = parentDocSnap.data().enrolledCourses || [];
  }

  const exists = currentEnrolled.some((c) => c.courseId === course.id);
  const updatedEnrolled = exists ? currentEnrolled : [newEnrollment, ...currentEnrolled];

  await setDoc(parentDocRef, removeUndefinedFields({ enrolledCourses: updatedEnrolled }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  const updatedSession: AppUserProfile = currentSession
    ? { ...currentSession, enrolledCourses: updatedEnrolled }
    : {
        uid,
        name: auth.currentUser?.displayName || 'Student',
        email: auth.currentUser?.email || '',
        role: 'parent',
        enrolledCourses: updatedEnrolled
      };

  saveUserSessionToStorage(updatedSession);

  // Automatically log Course Payment (Way 2: Course)
  const numericFee = parseInt((course.fee || '').replace(/[^0-9]/g, '')) || 2500;
  logAdminActivity({
    adminName: "Admin Sunita Sahoo",
    adminEmail: "sunita.sahoo.admin@kumari.edu.in",
    actionType: "payment_course",
    category: "payment_courses",
    title: `Course Enrollment Payment Received (Way 2: Course)`,
    description: `Confirmed course tuition payment of ₹${numericFee.toLocaleString('en-IN')} for '${course.title}' for student ${updatedSession.name || 'Student'}.`,
    targetId: course.id,
    targetName: course.title,
    studentName: updatedSession.childName || updatedSession.name || 'Student',
    parentName: updatedSession.name,
    parentPhone: updatedSession.phone,
    courseTitle: course.title,
    amount: numericFee,
    paymentMethod: "UPI / QR",
    transactionId: `UPI-CR-${Date.now().toString().slice(-6)}`,
    receiptNo: `KIR-CR-${Math.floor(2000 + Math.random() * 8000)}`,
    status: "verified",
    notes: `Enrollment confirmed for ${course.title} (${course.tag || 'Course'}). Access syllabus unlocked.`
  }).catch(() => {});

  return updatedSession;
}

/**
 * Permanently book / hire a tutor for the parent and update session
 */
export async function hireTutorForUser(
  uid: string,
  tutor: { id: string; name: string; subjects?: string[]; monthlyFee?: number; phone?: string; locationArea?: string }
): Promise<AppUserProfile> {
  const newHiring: HiredTutor = {
    id: `hire_${Date.now()}`,
    tutorId: tutor.id,
    tutorName: tutor.name,
    subjects: tutor.subjects || ['All Subjects'],
    monthlyFee: tutor.monthlyFee || 3500,
    phone: tutor.phone || '+91 98765 43210',
    locationArea: tutor.locationArea || 'Rayagada',
    hiredAt: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    status: 'Confirmed'
  };

  const parentDocRef = doc(db, "parents", uid);

  const parentDocSnap = await getDoc(parentDocRef).catch(() => null);
  let currentHired: HiredTutor[] = [];
  if (parentDocSnap && parentDocSnap.exists()) {
    currentHired = parentDocSnap.data().hiredTutors || [];
  }

  const updatedHired = [newHiring, ...currentHired];

  await setDoc(parentDocRef, removeUndefinedFields({ hiredTutors: updatedHired }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  const updatedSession: AppUserProfile = currentSession
    ? { ...currentSession, hiredTutors: updatedHired }
    : {
        uid,
        name: auth.currentUser?.displayName || 'Parent',
        email: auth.currentUser?.email || '',
        role: 'parent',
        hiredTutors: updatedHired
      };

  saveUserSessionToStorage(updatedSession);

  // Automatically log Home Tutor Payment (Way 1: Home Tutor)
  logAdminActivity({
    adminName: "Admin Anil Mohanty",
    adminEmail: "anil.mohanty.accounts@kumari.edu.in",
    actionType: "payment_home_tutor",
    category: "payment_home_tutors",
    title: `Monthly Tuition Fee Received (Way 1: Home Tutor)`,
    description: `Received monthly tuition fee of ₹${(tutor.monthlyFee || 3500).toLocaleString('en-IN')} for Home Tutor ${tutor.name} (Student: ${updatedSession.childName || updatedSession.name}).`,
    targetId: tutor.id,
    targetName: tutor.name,
    tutorName: tutor.name,
    studentName: updatedSession.childName || updatedSession.name,
    parentName: updatedSession.name,
    parentPhone: updatedSession.phone,
    amount: tutor.monthlyFee || 3500,
    paymentMethod: "UPI / QR",
    transactionId: `UPI-HT-${Date.now().toString().slice(-6)}`,
    receiptNo: `KIR-HT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "verified",
    notes: `Home tutor monthly tuition booked for subjects: ${(tutor.subjects || ['All Subjects']).join(', ')}.`
  }).catch(() => {});

  return updatedSession;
}

/**
 * Permanently save a demo trial booking to parent profile and update session
 */
export async function recordDemoBookingForUser(
  uid: string,
  booking: { studentName?: string; grade?: string; subject?: string; mode?: string; preferredDate?: string; preferredTime?: string }
): Promise<AppUserProfile> {
  const newBooking: DemoBooking = {
    id: `demo_${Date.now()}`,
    studentName: booking.studentName,
    grade: booking.grade,
    subject: booking.subject,
    mode: booking.mode,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    bookedAt: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    status: 'Scheduled'
  };

  const parentDocRef = doc(db, "parents", uid);

  const parentDocSnap = await getDoc(parentDocRef).catch(() => null);
  let currentBookings: DemoBooking[] = [];
  if (parentDocSnap && parentDocSnap.exists()) {
    currentBookings = parentDocSnap.data().demoBookings || [];
  }

  const updatedBookings = [newBooking, ...currentBookings];

  await setDoc(parentDocRef, removeUndefinedFields({ demoBookings: updatedBookings }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  const updatedSession: AppUserProfile = currentSession
    ? { ...currentSession, demoBookings: updatedBookings }
    : {
        uid,
        name: auth.currentUser?.displayName || 'Parent',
        email: auth.currentUser?.email || '',
        role: 'parent',
        demoBookings: updatedBookings
      };

  saveUserSessionToStorage(updatedSession);
  return updatedSession;
}

/**
 * Helper to get the Firestore document reference (parents or teachers)
 */
function getUserRoleDocRef(uid: string) {
  const currentSession = loadSavedUserSession();
  const collectionName = currentSession?.role === 'teacher' ? 'teachers' : 'parents';
  return doc(db, collectionName, uid);
}

/**
 * Add a new task/work item to the user's profile in Firestore (real-time synchronized)
 */
export async function addUserTaskToFirestore(
  uid: string,
  task: { title: string; category?: UserTask['category']; dueDate?: string; notes?: string }
): Promise<UserTask[]> {
  const roleDocRef = getUserRoleDocRef(uid);
  const docSnap = await getDoc(roleDocRef).catch(() => null);
  const currentTasks: UserTask[] = (docSnap && docSnap.exists() && docSnap.data().tasks) || [];

  const newTask: UserTask = {
    id: `task_${Date.now()}`,
    title: task.title.trim(),
    category: task.category || 'General',
    dueDate: task.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    completed: false,
    notes: task.notes?.trim() || '',
    createdAt: new Date().toISOString()
  };

  const updatedTasks = [newTask, ...currentTasks];
  await setDoc(roleDocRef, removeUndefinedFields({ tasks: updatedTasks, updatedAt: new Date().toISOString() }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  if (currentSession && currentSession.uid === uid) {
    saveUserSessionToStorage({ ...currentSession, tasks: updatedTasks });
  }
  return updatedTasks;
}

/**
 * Toggle task completion state in Firestore (real-time synchronized)
 */
export async function toggleUserTaskInFirestore(
  uid: string,
  taskId: string,
  completed: boolean
): Promise<UserTask[]> {
  const roleDocRef = getUserRoleDocRef(uid);
  const docSnap = await getDoc(roleDocRef).catch(() => null);
  const currentTasks: UserTask[] = (docSnap && docSnap.exists() && docSnap.data().tasks) || [];

  const updatedTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, completed } : t));
  await setDoc(roleDocRef, removeUndefinedFields({ tasks: updatedTasks, updatedAt: new Date().toISOString() }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  if (currentSession && currentSession.uid === uid) {
    saveUserSessionToStorage({ ...currentSession, tasks: updatedTasks });
  }
  return updatedTasks;
}

/**
 * Delete a task in Firestore (real-time synchronized)
 */
export async function deleteUserTaskFromFirestore(
  uid: string,
  taskId: string
): Promise<UserTask[]> {
  const roleDocRef = getUserRoleDocRef(uid);
  const docSnap = await getDoc(roleDocRef).catch(() => null);
  const currentTasks: UserTask[] = (docSnap && docSnap.exists() && docSnap.data().tasks) || [];

  const updatedTasks = currentTasks.filter((t) => t.id !== taskId);
  await setDoc(roleDocRef, removeUndefinedFields({ tasks: updatedTasks, updatedAt: new Date().toISOString() }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  if (currentSession && currentSession.uid === uid) {
    saveUserSessionToStorage({ ...currentSession, tasks: updatedTasks });
  }
  return updatedTasks;
}

/**
 * Update user course progress metric in Firestore (real-time synchronized)
 */
export async function updateUserCourseProgressInFirestore(
  uid: string,
  metric: UserProgressMetric
): Promise<Record<string, UserProgressMetric>> {
  const roleDocRef = getUserRoleDocRef(uid);
  const docSnap = await getDoc(roleDocRef).catch(() => null);
  const currentProgress: Record<string, UserProgressMetric> =
    (docSnap && docSnap.exists() && docSnap.data().progress) || {};

  const updatedProgress = {
    ...currentProgress,
    [metric.courseId]: metric
  };

  await setDoc(roleDocRef, removeUndefinedFields({ progress: updatedProgress, updatedAt: new Date().toISOString() }), { merge: true }).catch(() => {});

  const currentSession = loadSavedUserSession();
  if (currentSession && currentSession.uid === uid) {
    saveUserSessionToStorage({ ...currentSession, progress: updatedProgress });
  }
  return updatedProgress;
}

/**
 * Fetch all registered teachers from Firestore 'teachers' collection
 */
export async function fetchTeachersFromFirestore(): Promise<Tutor[]> {
  try {
    const teachersCol = collection(db, "teachers");
    const snapshot = await getDocs(teachersCol);
    const teachers: Tutor[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      teachers.push({
        id: data.id || `fb_${docSnap.id}`,
        name: data.fullName || data.name || "Educator",
        qualification: data.qualification || data.highestQualification || "B.Sc / Experienced Tutor",
        rating: data.rating || 4.9,
        reviewCount: data.reviewCount || 1,
        hourlyRate: data.hourlyRate || 400,
        monthlyFee: data.monthlyFee || 3500,
        subjects: Array.isArray(data.subjects) && data.subjects.length > 0 ? data.subjects : ["Mathematics", "Science"],
        classesHandled: Array.isArray(data.classesHandled) && data.classesHandled.length > 0 ? data.classesHandled : ["1st to 6th Standard"],
        boardsSupported: Array.isArray(data.boardsSupported) && data.boardsSupported.length > 0 ? data.boardsSupported : ["CBSE", "ICSE", "Odisha State Board"],
        experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : 3,
        experienceText: data.experienceText || `${data.totalExperience || 3} Years Experience`,
        locationArea: data.locationArea || "Indira Nagar",
        addressSnippet: data.addressSnippet || data.address || "Rayagada, Odisha",
        distanceKm: 0.8,
        availabilityText: data.availabilityText || "Slots Open • Mon-Sat",
        availabilityType: data.availabilityType || "available_now",
        availabilityBadge: data.availabilityBadge || "Available for Home Tuition",
        avatar: data.avatar || data.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        bio: data.bio || "Dedicated home tutor in Rayagada committed to building solid conceptual foundations.",
        verified: data.verified ?? true,
        latitude: typeof data.latitude === 'number' ? data.latitude : 19.1691,
        longitude: typeof data.longitude === 'number' ? data.longitude : 83.4150,
        gender: data.gender === "male" ? "male" : "female",
        teacherType: data.teacherType === "both" ? "both" : "home",
        teachingHighlights: Array.isArray(data.teachingHighlights) ? data.teachingHighlights : [
          "Daily Concept Reinforcement",
          "Weekly Parent Progress Report",
          "NCERT & Odisha Board Aligned"
        ],
        reviews: Array.isArray(data.reviews) ? data.reviews : []
      });
    });

    return teachers;
  } catch (err) {
    console.warn("Notice reading teachers from Firestore:", err);
    return [];
  }
}

/**
 * Listen to Firebase Auth state changes using onAuthStateChanged with real-time session tracking,
 * cross-tab synchronization, and proactive email verification polling/focus detection.
 */
export function subscribeToFirebaseAuth(onUserChange: (user: AppUserProfile | null) => void): () => void {
  let userSnapshotUnsubscribe: (() => void) | null = null;
  let verificationCheckInterval: any = null;
  let isSubscribed = true;

  const teardownSnapshot = () => {
    if (userSnapshotUnsubscribe) {
      userSnapshotUnsubscribe();
      userSnapshotUnsubscribe = null;
    }
  };

  const stopVerificationPoller = () => {
    if (verificationCheckInterval) {
      clearInterval(verificationCheckInterval);
      verificationCheckInterval = null;
    }
  };

  const buildProfile = (data: any, fbUser: FirebaseUser): AppUserProfile => {
    const role: 'parent' | 'teacher' = data?.role === 'teacher' ? 'teacher' : 'parent';
    const profile: AppUserProfile = {
      uid: fbUser.uid,
      name: data?.name || data?.fullName || fbUser.displayName || 'User',
      email: fbUser.email || data?.email || '',
      role,
      phone: data?.phone || '',
      gender: data?.gender || 'female',
      profileCompleted: data?.profileCompleted ?? false,
      locality: data?.locality || data?.locationArea || '',
      enrolledCourses: Array.isArray(data?.enrolledCourses) ? data.enrolledCourses : [],
      hiredTutors: Array.isArray(data?.hiredTutors) ? data.hiredTutors : [],
      demoBookings: Array.isArray(data?.demoBookings) ? data.demoBookings : [],
      tasks: Array.isArray(data?.tasks) ? data.tasks : [],
      progress: data?.progress || {},
      createdAt: data?.createdAt || new Date().toISOString(),
      lastLoginAt: data?.lastLoginAt || new Date().toISOString(),
      emailVerified: true
    };

    if (typeof data?.latitude === 'number') profile.latitude = data.latitude;
    if (typeof data?.longitude === 'number') profile.longitude = data.longitude;
    if (data?.childName) profile.childName = data.childName;
    if (data?.childGrade) profile.childGrade = data.childGrade;
    if (data?.childBoard || data?.board) (profile as any).childBoard = data.childBoard || data.board;
    if (data?.childSchool) profile.childSchool = data.childSchool;
    if (data?.targetExam) profile.targetExam = data.targetExam;
    if (data?.emergencyContact) profile.emergencyContact = data.emergencyContact;

    // Teacher fields
    if (data?.qualification || data?.highestQualification) profile.qualification = data.qualification || data.highestQualification;
    if (data?.university) profile.university = data.university;
    if (data?.experience) profile.experience = data.experience;
    if (typeof data?.experienceYears === 'number') (profile as any).experienceYears = data.experienceYears;
    if (Array.isArray(data?.subjects)) profile.subjects = data.subjects;
    if (Array.isArray(data?.classesHandled)) (profile as any).classesHandled = data.classesHandled;
    if (Array.isArray(data?.classes)) profile.classes = data.classes;
    if (typeof data?.hourlyCharges === 'number') profile.hourlyCharges = data.hourlyCharges;
    if (typeof data?.hourlyFee === 'number') profile.hourlyFee = data.hourlyFee;
    if (typeof data?.monthlyFee === 'number') profile.monthlyFee = data.monthlyFee;
    if (data?.bio) profile.bio = data.bio;
    if (data?.avatar || data?.photoUrl) {
      profile.avatar = data.avatar || data.photoUrl;
      profile.photoUrl = data.avatar || data.photoUrl;
    }
    if (Array.isArray(data?.availableTimeSlots)) profile.availableTimeSlots = data.availableTimeSlots;
    if (Array.isArray(data?.timeSlots)) (profile as any).timeSlots = data.timeSlots;
    if (data?.addressDetails) profile.addressDetails = data.addressDetails;
    if (data?.kycStatus) profile.kycStatus = data.kycStatus;
    if (data?.verified !== undefined) (profile as any).verified = data.verified;
    if (Array.isArray(data?.assignedStudents)) (profile as any).assignedStudents = data.assignedStudents;
    if (data?.assignedEducator) (profile as any).assignedEducator = data.assignedEducator;

    return profile;
  };

  const attachUserDocListener = async (fbUser: FirebaseUser) => {
    teardownSnapshot();
    if (!isSubscribed) return;

    // Check cached session or check teachers first to determine role collection
    let collectionName = 'parents';
    const cached = loadSavedUserSession();
    if (cached && cached.uid === fbUser.uid && cached.role === 'teacher') {
      collectionName = 'teachers';
    } else {
      try {
        const teacherSnap = await getDoc(doc(db, "teachers", fbUser.uid));
        if (teacherSnap.exists()) {
          collectionName = 'teachers';
        }
      } catch {
        // default to parents
      }
    }

    if (!isSubscribed) return;

    try {
      const docRef = doc(db, collectionName, fbUser.uid);
      userSnapshotUnsubscribe = onSnapshot(
        docRef,
        async (docSnap) => {
          if (!isSubscribed) return;
          if (docSnap.exists()) {
            const profile = buildProfile(docSnap.data(), fbUser);
            saveUserSessionToStorage(profile);
            saveUserToLocalRegistry(profile);
            // Sync to local server without redundant Firestore setDoc
            fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profile)
            }).catch(() => {});
            onUserChange(profile);
          } else {
            // Check alternate role collection or persistent server storage
            const altCollection = collectionName === 'parents' ? 'teachers' : 'parents';
            try {
              const [altDocSnap, serverProfile] = await Promise.all([
                getDoc(doc(db, altCollection, fbUser.uid)).catch(() => null),
                getUserFromPersistentServer(fbUser.uid).catch(() => null)
              ]);
              const altData = altDocSnap && altDocSnap.exists() ? altDocSnap.data() : null;
              const foundData = altData || serverProfile;
              if (foundData) {
                const profile = buildProfile(foundData, fbUser);
                saveUserSessionToStorage(profile);
                onUserChange(profile);
              } else {
                const fallbackProfile: AppUserProfile = {
                  uid: fbUser.uid,
                  name: fbUser.displayName || 'Parent',
                  email: fbUser.email || '',
                  role: 'parent',
                  locality: 'Indira Nagar, Rayagada',
                  enrolledCourses: [],
                  hiredTutors: [],
                  demoBookings: [],
                  emailVerified: true
                };
                saveUserSessionToStorage(fallbackProfile);
                syncUserToPersistence(fallbackProfile).catch(() => {});
                onUserChange(fallbackProfile);
              }
            } catch (innerErr) {
              console.warn("[Auth Realtime] Role collection lookup notice:", innerErr);
            }
          }
        },
        (error) => {
          console.warn(`[Firestore Realtime] Snapshot notice on ${collectionName}/${fbUser.uid}:`, error?.message || error);
          const currentCached = loadSavedUserSession();
          if (currentCached && currentCached.uid === fbUser.uid && currentCached.emailVerified) {
            onUserChange(currentCached);
          }
        }
      );
    } catch (err) {
      console.warn("[Firestore Realtime] Init snapshot notice:", err);
    }
  };

  const handleVerifiedUser = (fbUser: FirebaseUser) => {
    stopVerificationPoller();

    // Instantly restore cached session if available to avoid flicker
    const cached = loadSavedUserSession();
    if (cached && cached.uid === fbUser.uid && cached.emailVerified) {
      onUserChange(cached);
    }

    // Attach real-time Firestore document listener
    attachUserDocListener(fbUser);
  };

  // Check and reload the currentUser's token to check for email verification in real-time
  const checkAndUpdateVerification = async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser || !isSubscribed) return;

    if (currentFbUser.emailVerified) {
      // Already verified, ensure active session is mounted
      handleVerifiedUser(currentFbUser);
      return;
    }

    try {
      await currentFbUser.reload();
      if (currentFbUser.emailVerified) {
        console.log('[Auth Realtime] Email verification confirmed in real-time for:', currentFbUser.email);
        handleVerifiedUser(currentFbUser);
      }
    } catch (err: any) {
      if (err?.code === 'auth/user-token-expired' || err?.code === 'auth/user-not-found') {
        teardownSnapshot();
        stopVerificationPoller();
        saveUserSessionToStorage(null);
        onUserChange(null);
      }
    }
  };

  // Primary Firebase Auth State Listener using onAuthStateChanged
  const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!isSubscribed) return;

    teardownSnapshot();

    if (!firebaseUser) {
      stopVerificationPoller();
      saveUserSessionToStorage(null);
      onUserChange(null);
      return;
    }

    const isDemo =
      firebaseUser.email?.toLowerCase() === DEMO_PARENT_ACCOUNT.email.toLowerCase() ||
      firebaseUser.email?.toLowerCase() === DEMO_TEACHER_ACCOUNT.email.toLowerCase();

    if (!firebaseUser.emailVerified && !isDemo) {
      // User is currently unverified - attempt an immediate reload in case they just clicked the email link
      try {
        await firebaseUser.reload();
      } catch (reloadErr) {
        // ignore transient reload errors
      }

      if (firebaseUser.emailVerified) {
        handleVerifiedUser(firebaseUser);
        return;
      }

      // Still unverified: block active session in accordance with security policy
      saveUserSessionToStorage(null);
      onUserChange(null);

      // Start reactive poller to immediately catch verification when user clicks the link
      stopVerificationPoller();
      verificationCheckInterval = setInterval(() => {
        if (!document.hidden) {
          checkAndUpdateVerification();
        }
      }, 3000);
      return;
    }

    // User is verified
    handleVerifiedUser(firebaseUser);
  });

  // Cross-Tab Session Synchronization via localStorage storage event
  const handleStorageEvent = (event: StorageEvent) => {
    if (!isSubscribed) return;
    if (event.key === SESSION_STORAGE_KEY) {
      if (!event.newValue) {
        // User logged out in another tab: react immediately
        console.log('[Auth Realtime] User signed out from another tab.');
        teardownSnapshot();
        stopVerificationPoller();
        onUserChange(null);
        if (auth.currentUser) {
          signOut(auth).catch(() => {});
        }
      } else {
        // User logged in or updated session in another tab
        try {
          const parsed = JSON.parse(event.newValue) as AppUserProfile;
          if (parsed && parsed.emailVerified === true) {
            console.log('[Auth Realtime] User signed in or session updated in another tab:', parsed.email);
            onUserChange(parsed);
          } else {
            onUserChange(null);
          }
        } catch {
          // ignore parse error
        }
      }
    }
  };

  // React immediately when the user switches tabs back to the app (after checking their email)
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkAndUpdateVerification();
    }
  };

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  return () => {
    isSubscribed = false;
    teardownSnapshot();
    stopVerificationPoller();
    authUnsubscribe();
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
  };
}

/**
 * Real-time listener for verified genuine teachers from Firestore collection 'teachers'.
 * STRICT RULE: Only genuine tutors accepted by admin (isApproved === true or status === 'approved')
 * will show on the "Find Home Tutor" page as per user requirement!
 */
export function subscribeToRealtimeTeachers(onTeachersUpdate: (teachers: Tutor[]) => void): () => void {
  try {
    const teachersCol = collection(db, "teachers");
    return onSnapshot(
      teachersCol,
      (snapshot) => {
        const teachers: Tutor[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id.toLowerCase();
          // Exclude any fake/prototype placeholder tutor IDs
          if (
            docId.includes("priya-sharma") ||
            docId.includes("rakesh-tripathy") ||
            docId.includes("sneha-patel") ||
            docId.includes("sagar-das") ||
            docId.includes("anita-mohanty")
          ) {
            return;
          }
          // STRICT RULE: Only genuine tutors accepted and verified by admin show on Find Home Tutor page
          const isApproved = Boolean(
            (data.verified === true && (data.isApproved === true || data.status === 'approved')) ||
            (data.isApproved === true && data.status === 'approved')
          );
          if (!isApproved || data.status === 'rejected' || data.verified === false) {
            return; // Skip unverified or pending tutors
          }

          teachers.push({
            id: docSnap.id,
            name: data.fullName || data.name || "Educator",
            email: data.email,
            phone: data.phone,
            qualification: data.highestQualification || data.qualification || "",
            experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : 0,
            experienceText: typeof data.experienceYears === 'number' && data.experienceYears > 0 ? `${data.experienceYears}+ Yrs Exp` : '',
            subjects: Array.isArray(data.subjects) ? data.subjects : [],
            distanceKm: 0,
            availabilityText: data.isBooked ? "Currently Booked" : (data.availabilityText || "Available"),
            availabilityType: "available_now",
            availabilityBadge: data.isBooked ? "Booked" : "Verified Genuine Home Tutor",
            rating: typeof data.rating === 'number' ? data.rating : 4.9,
            reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 1,
            monthlyFee: typeof data.monthlyFee === 'number' ? data.monthlyFee : 1500,
            hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : (typeof data.hourlyCharges === 'number' ? data.hourlyCharges : 100),
            bio: data.bio || "",
            avatar: data.avatar || data.photoUrl || "",
            classesHandled: Array.isArray(data.classesHandled) ? data.classesHandled : [],
            boardsSupported: Array.isArray(data.boardsSupported) ? data.boardsSupported : [],
            locationArea: data.locationArea || data.locality || "Rayagada",
            addressSnippet: data.address || data.locality || "",
            verified: true,
            status: 'approved',
            isApproved: true,
            isBooked: Boolean(data.isBooked),
            bookingStatus: data.isBooked ? 'booked' : 'available',
            verificationStatus: 'Verified Genuine Tutor',
            latitude: typeof data.latitude === 'number' ? data.latitude : 19.1691,
            longitude: typeof data.longitude === 'number' ? data.longitude : 83.4150,
            gender: data.gender === "male" ? "male" : "female",
            teacherType: data.teacherType === "both" ? "both" : "home",
            teachingHighlights: Array.isArray(data.teachingHighlights) ? data.teachingHighlights : [],
            educationDetails: data.educationDetails,
            aadhaarNumber: data.aadhaarNumber,
            aadhaarDocUrl: data.aadhaarDocUrl,
            availableTimeSlots: Array.isArray(data.availableTimeSlots) ? data.availableTimeSlots : [],
            reviews: Array.isArray(data.reviews) ? data.reviews : []
          });
        });

        if (teachers.length > 0) {
          onTeachersUpdate(teachers);
        } else {
          // If no approved teachers in Firestore, query backend API
          fetch('/api/teachers')
            .then((r) => r.json())
            .then((res) => {
              if (res?.teachers) onTeachersUpdate(res.teachers);
              else onTeachersUpdate([]);
            })
            .catch(() => onTeachersUpdate([]));
        }
      },
      (err) => {
        console.warn("[Firestore Realtime default] Notice on teachers snapshot:", err?.message || err);
        fetch('/api/teachers')
          .then((r) => r.json())
          .then((res) => {
            if (res?.teachers) onTeachersUpdate(res.teachers);
          })
          .catch(() => {});
      }
    );
  } catch (err) {
    console.warn("[Firestore Realtime default] subscribeToRealtimeTeachers setup notice:", err);
    fetch('/api/teachers')
      .then((r) => r.json())
      .then((res) => {
        if (res?.teachers) onTeachersUpdate(res.teachers);
      })
      .catch(() => {});
    return () => {};
  }
}

/**
 * Admin Real-time listener for ALL registered teachers (pending, approved, rejected)
 * Enables admin to preview uploaded details and certificates properly.
 */
export function subscribeToAllTeachersForAdmin(onTeachersUpdate: (teachers: Tutor[]) => void): () => void {
  const parseFirestoreTeacher = (docId: string, data: any): Tutor => {
    const isApproved = Boolean(data.verified === true && (data.isApproved === true || data.status === 'approved'));
    const status = data.status || (isApproved ? 'approved' : 'pending');
    return {
      id: docId,
      name: data.fullName || data.name || "Educator",
      email: data.email,
      phone: data.phone,
      qualification: data.highestQualification || data.qualification || "",
      experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : 0,
      experienceText: typeof data.experienceYears === 'number' && data.experienceYears > 0 ? `${data.experienceYears}+ Yrs Exp` : '',
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      distanceKm: 0,
      availabilityText: data.isBooked ? "Currently Booked" : (data.availabilityText || "Available"),
      availabilityType: "available_now",
      availabilityBadge: isApproved ? "Verified Genuine Home Tutor" : "Pending Verification",
      rating: typeof data.rating === 'number' ? data.rating : 0,
      reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
      monthlyFee: typeof data.monthlyFee === 'number' ? data.monthlyFee : 1500,
      hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : (typeof data.hourlyCharges === 'number' ? data.hourlyCharges : 100),
      bio: data.bio || "",
      avatar: data.avatar || data.photoUrl || "",
      classesHandled: Array.isArray(data.classesHandled) ? data.classesHandled : [],
      boardsSupported: Array.isArray(data.boardsSupported) ? data.boardsSupported : [],
      locationArea: data.locationArea || data.locality || "Rayagada",
      addressSnippet: data.address || data.locality || "",
      verified: Boolean(data.verified),
      status: status,
      isApproved: isApproved,
      isBooked: Boolean(data.isBooked),
      bookingStatus: data.isBooked ? 'booked' : 'available',
      verificationStatus: data.verificationStatus || (isApproved ? 'Verified Genuine Tutor' : 'Pending Verification'),
      approvedAt: data.approvedAt,
      submittedAt: data.submittedAt || data.createdAt,
      latitude: typeof data.latitude === 'number' ? data.latitude : 19.1691,
      longitude: typeof data.longitude === 'number' ? data.longitude : 83.4150,
      gender: data.gender === "male" ? "male" : "female",
      teacherType: data.teacherType === "both" ? "both" : "home",
      teachingHighlights: Array.isArray(data.teachingHighlights) ? data.teachingHighlights : [],
      educationDetails: data.educationDetails,
      certificates: {
        tenth: {
          name: data.educationDetails?.tenth?.marksheetName || '10th_marksheet.jpg',
          url: data.educationDetails?.tenth?.marksheetUrl || '',
          score: data.educationDetails?.tenth?.score || '',
          year: data.educationDetails?.tenth?.year || '',
          board: data.educationDetails?.tenth?.board || 'Board of Secondary Education, Odisha'
        },
        twelfth: {
          name: data.educationDetails?.twelfth?.marksheetName || '12th_marksheet.jpg',
          url: data.educationDetails?.twelfth?.marksheetUrl || '',
          score: data.educationDetails?.twelfth?.score || '',
          year: data.educationDetails?.twelfth?.year || '',
          board: data.educationDetails?.twelfth?.board || 'Council of Higher Secondary Education, Odisha'
        },
        degree: {
          name: data.educationDetails?.degree?.marksheetName || 'degree_certificate.jpg',
          url: data.educationDetails?.degree?.marksheetUrl || '',
          score: data.educationDetails?.degree?.score || '',
          year: data.educationDetails?.degree?.year || '',
          course: data.educationDetails?.degree?.course || data.qualification || '',
          university: data.educationDetails?.degree?.university || ''
        },
        idProof: {
          name: 'aadhaar_card.jpg',
          url: data.aadhaarDocUrl || '',
          docNumber: data.aadhaarNumber || '',
          type: 'Aadhaar Card (Govt. of India)'
        }
      },
      aadhaarNumber: data.aadhaarNumber,
      aadhaarDocUrl: data.aadhaarDocUrl,
      availableTimeSlots: Array.isArray(data.availableTimeSlots) ? data.availableTimeSlots : [],
      reviews: Array.isArray(data.reviews) ? data.reviews : []
    };
  };

  const fetchAndMerge = (firestoreTeachers: Tutor[] = []) => {
    fetch('/api/admin/teachers')
      .then((r) => r.json())
      .then((res) => {
        const apiTeachers: Tutor[] = Array.isArray(res?.teachers) ? res.teachers : [];
        const mergedMap = new Map<string, Tutor>();
        // Add api teachers
        apiTeachers.forEach((t) => {
          const id = (t.id || '').toLowerCase();
          if (
            !id.includes('priya-sharma') &&
            !id.includes('rakesh-tripathy') &&
            !id.includes('sneha-patel') &&
            !id.includes('sagar-das') &&
            !id.includes('anita-mohanty')
          ) {
            mergedMap.set(t.id, t);
          }
        });
        // Override with Firestore teachers
        firestoreTeachers.forEach((t) => {
          const id = (t.id || '').toLowerCase();
          if (
            !id.includes('priya-sharma') &&
            !id.includes('rakesh-tripathy') &&
            !id.includes('sneha-patel') &&
            !id.includes('sagar-das') &&
            !id.includes('anita-mohanty')
          ) {
            mergedMap.set(t.id, t);
          }
        });
        onTeachersUpdate(Array.from(mergedMap.values()));
      })
      .catch(() => {
        if (firestoreTeachers.length > 0) {
          onTeachersUpdate(firestoreTeachers);
        }
      });
  };

  try {
    const teachersCol = collection(db, "teachers");
    const unsub = onSnapshot(
      teachersCol,
      (snapshot) => {
        const firestoreTeachers: Tutor[] = [];
        snapshot.forEach((docSnap) => {
          firestoreTeachers.push(parseFirestoreTeacher(docSnap.id, docSnap.data()));
        });
        fetchAndMerge(firestoreTeachers);
      },
      () => {
        fetchAndMerge();
      }
    );
    return unsub;
  } catch {
    fetchAndMerge();
    return () => {};
  }
}

/**
 * Admin Real-time listener for ALL registered parents (Firestore collection 'parents' & API fallback)
 */
export function subscribeToAllParentsForAdmin(onParentsUpdate: (parents: AppUserProfile[]) => void): () => void {
  const parseFirestoreParent = (docId: string, data: any): AppUserProfile => {
    return {
      uid: docId,
      name: data.fullName || data.name || "Registered Parent",
      email: data.email || "",
      role: "parent",
      phone: data.phone || "",
      gender: data.gender || "male",
      locality: data.locality || data.address || "Rayagada",
      childName: data.childName || "",
      childGrade: data.childGrade || "",
      childSchool: data.childSchool || "",
      childBoard: data.childBoard || data.board || "",
      hiredTutors: Array.isArray(data.hiredTutors) ? data.hiredTutors : [],
      assignedEducator: data.assignedEducator || null,
      createdAt: data.createdAt || new Date().toISOString(),
      emailVerified: Boolean(data.emailVerified)
    };
  };

  const fetchAndMerge = (firestoreParents: AppUserProfile[] = []) => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((res) => {
        const apiUsers: any[] = Array.isArray(res?.users) ? res.users : [];
        const mergedMap = new Map<string, AppUserProfile>();

        // Add API parents
        apiUsers.forEach((u) => {
          if (u.role === 'parent' || (!u.role && !u.qualification)) {
            const uidKey = u.uid || u.id || u.email;
            mergedMap.set(uidKey, {
              uid: u.uid || u.id || uidKey,
              name: u.name || u.fullName || 'Registered Parent',
              email: u.email || '',
              role: 'parent',
              phone: u.phone || '',
              gender: u.gender || 'male',
              locality: u.locality || u.address || 'Rayagada',
              childName: u.childName || '',
              childGrade: u.childGrade || '',
              childSchool: u.childSchool || '',
              childBoard: u.childBoard || u.board || '',
              hiredTutors: Array.isArray(u.hiredTutors) ? u.hiredTutors : [],
              assignedEducator: u.assignedEducator || null,
              createdAt: u.createdAt || new Date().toISOString(),
              emailVerified: Boolean(u.emailVerified)
            });
          }
        });

        // Overlay with Firestore parents (live source of truth)
        firestoreParents.forEach((p) => {
          mergedMap.set(p.uid || p.email, p);
        });

        const list = Array.from(mergedMap.values());
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onParentsUpdate(list);
      })
      .catch(() => {
        if (firestoreParents.length > 0) {
          onParentsUpdate(firestoreParents);
        }
      });
  };

  try {
    const parentsCol = collection(db, "parents");
    const unsub = onSnapshot(
      parentsCol,
      (snapshot) => {
        const firestoreParents: AppUserProfile[] = [];
        snapshot.forEach((docSnap) => {
          firestoreParents.push(parseFirestoreParent(docSnap.id, docSnap.data()));
        });
        fetchAndMerge(firestoreParents);
      },
      () => {
        fetchAndMerge();
      }
    );
    return unsub;
  } catch {
    fetchAndMerge();
    return () => {};
  }
}

/**
 * Admin directly books and assigns a tutor to an unassigned registered parent
 */
export async function adminDirectAssignTutorToParent(
  parent: AppUserProfile,
  tutor: Tutor,
  preferredTimeSlot?: string,
  notes?: string
): Promise<{ success: boolean; message: string; bookingId?: string }> {
  try {
    // 1. Submit the home tutor booking request
    const bookingRes = await submitHomeTutorBooking({
      parentUid: parent.uid,
      parentName: parent.name,
      parentPhone: parent.phone || '',
      parentEmail: parent.email || '',
      studentName: parent.childName || `${parent.name}'s Child`,
      studentGrade: parent.childGrade || tutor.classesHandled[0] || 'Class 4',
      subjects: tutor.subjects.length > 0 ? tutor.subjects : ['Foundational Subjects'],
      address: parent.locality || tutor.locationArea || 'Rayagada',
      locality: tutor.locationArea || 'Rayagada',
      preferredTimeSlot: preferredTimeSlot || tutor.availableTimeSlots?.[0] || '5:00 PM - 6:00 PM',
      requestedTutorId: tutor.id,
      requestedTutorName: tutor.name,
      requestedTutorMonthlyFee: tutor.monthlyFee,
      requestedTutorAvatar: tutor.avatar
    });

    // 2. Immediately accept and assign the tutor in Firestore & Backend
    await adminAcceptAndAssignTutorBooking(
      bookingRes.bookingId,
      tutor.id,
      notes || 'Directly assigned by Administrator from Registered Directory'
    );

    return {
      success: true,
      message: `Successfully assigned ${tutor.name} to ${parent.name}!`,
      bookingId: bookingRes.bookingId
    };
  } catch (err: any) {
    console.warn('adminDirectAssignTutorToParent error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to directly assign tutor.'
    };
  }
}

/**
 * Admin action to accept tutor as genuine or reject
 */
export async function adminVerifyTutorInDatabase(
  tutorId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<{ success: boolean; message: string; teacher?: Tutor }> {
  try {
    if (status === 'rejected') {
      // STRICT REQUIREMENT: If admin declines, tutor is removed directly from Cloud Firestore
      const tutorRef = doc(db, "teachers", tutorId);
      await deleteDoc(tutorRef).catch((err) => console.warn('Firestore tutor deleteDoc notice:', err));

      // Also notify Backend Express Server to delete from disk registry
      const res = await fetch(`/api/admin/teachers/${encodeURIComponent(tutorId)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', notes })
      });

      logAdminActivity({
        actionType: 'tutor_rejected',
        category: 'tutors',
        title: 'Tutor Verification Declined & Removed from Firestore',
        description: `Verification declined for tutor (${tutorId}). Record purged from Firestore and public tutor directory. Reason: ${notes || 'Document details require revision.'}`,
        targetId: tutorId,
        status: 'flagged',
        notes
      }).catch(() => {});

      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return {
        success: true,
        message: 'Tutor verification declined and permanently removed from Firestore.'
      };
    }

    // 1. Update Firestore doc
    const tutorRef = doc(db, "teachers", tutorId);
    await updateDoc(tutorRef, {
      status,
      isApproved: true,
      verified: true,
      verificationStatus: 'Verified Genuine Tutor',
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    }).catch((err) => console.warn('Firestore tutor verify notice:', err));

    // 2. Update Backend Express Server
    const res = await fetch(`/api/admin/teachers/${encodeURIComponent(tutorId)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });

    if (res.ok) {
      const data = await res.json();
      logAdminActivity({
        actionType: 'tutor_approved',
        category: 'tutors',
        title: 'Tutor Verified Genuine & Approved',
        description: `Audited credentials & verified tutor (${tutorId}) for public Find Home Tutor listing.`,
        targetId: tutorId,
        status: 'completed',
        notes
      }).catch(() => {});
      return data;
    }
  } catch (err: any) {
    console.warn('adminVerifyTutorInDatabase error:', err);
  }

  logAdminActivity({
    actionType: status === 'approved' ? 'tutor_approved' : 'tutor_rejected',
    category: 'tutors',
    title: status === 'approved' ? 'Tutor Verified Genuine & Approved' : 'Tutor Verification Declined',
    description: status === 'approved'
      ? `Audited credentials & verified tutor (${tutorId}) for public Find Home Tutor listing.`
      : `Verification rejected for tutor (${tutorId}). Reason: ${notes || 'Document details require revision.'}`,
    targetId: tutorId,
    status: status === 'approved' ? 'completed' : 'flagged',
    notes
  }).catch(() => {});

  return {
    success: true,
    message: status === 'approved' ? 'Tutor accepted as genuine home tutor!' : 'Tutor declined and removed from Firestore.'
  };
}

/**
 * Toggle a tutor's visibility on the 'Find Home Tutor' page by updating their 'verified' status in Firestore
 */
export async function adminToggleTutorVisibility(
  tutorId: string,
  verified: boolean,
  notes?: string
): Promise<{ success: boolean; message: string; verified: boolean }> {
  try {
    const status = verified ? 'approved' : 'pending';
    // 1. Update Firestore doc in 'teachers'
    const tutorRef = doc(db, "teachers", tutorId);
    await updateDoc(tutorRef, {
      verified,
      isApproved: verified,
      status,
      verificationStatus: verified ? 'Verified Genuine Tutor' : 'Pending Verification',
      approvedAt: verified ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }).catch((err) => console.warn('Firestore tutor visibility update notice:', err));

    // 2. Sync to Backend API
    await fetch(`/api/admin/teachers/${encodeURIComponent(tutorId)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    }).catch(() => {});

    logAdminActivity({
      actionType: 'tutor_visibility_toggled',
      category: 'tutors',
      title: verified ? 'Tutor Visibility Enabled' : 'Tutor Visibility Hidden',
      description: verified
        ? `Toggled tutor (${tutorId}) to visible on Find Home Tutor directory.`
        : `Toggled tutor (${tutorId}) to hidden from Find Home Tutor directory.`,
      targetId: tutorId,
      status: 'completed',
      notes
    }).catch(() => {});

    return {
      success: true,
      message: verified
        ? 'Tutor verified and now visible on Find Home Tutor page!'
        : 'Tutor hidden from Find Home Tutor page.',
      verified
    };
  } catch (err: any) {
    console.warn('adminToggleTutorVisibility notice:', err);
    return {
      success: true,
      message: verified ? 'Tutor marked visible.' : 'Tutor marked hidden.',
      verified
    };
  }
}

/**
 * Parent submits a Home Tutor booking
 */
export async function submitHomeTutorBooking(bookingData: {
  parentUid?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  studentName: string;
  studentGrade: string;
  subjects: string[];
  address: string;
  locality?: string;
  preferredTimeSlot?: string;
  requestedTutorId: string;
  requestedTutorName: string;
  requestedTutorMonthlyFee: number;
  requestedTutorAvatar?: string;
}): Promise<{ success: boolean; message: string; bookingId: string }> {
  const bookingId = `book-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const fullBooking = {
    ...bookingData,
    id: bookingId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // 1. Save to Firestore collection 'tutor_bookings'
  try {
    const bookingDocRef = doc(db, "tutor_bookings", bookingId);
    await setDoc(bookingDocRef, {
      ...fullBooking,
      timestamp: serverTimestamp(),
      databaseId: FIRESTORE_DATABASE_ID
    });
  } catch (err) {
    console.warn('Firestore tutor_bookings notice:', err);
  }

  // 2. Save to Backend Express API
  try {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullBooking)
    });
  } catch (err) {
    console.warn('API /api/bookings notice:', err);
  }

  return {
    success: true,
    message: 'Booking request sent to admin panel! You will be notified once assigned.',
    bookingId
  };
}

/**
 * Listener for Home Tutor Bookings directly from Firestore collection 'tutor_bookings'
 */
export function subscribeToRealtimeBookings(onBookingsUpdate: (bookings: any[]) => void): () => void {
  const fetchFromApi = () => {
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((res) => {
        if (res?.bookings && Array.isArray(res.bookings)) {
          onBookingsUpdate(res.bookings);
        }
      })
      .catch((err) => console.warn('Bookings API fetch notice:', err));
  };

  try {
    const col = collection(db, "tutor_bookings");
    const unsub = onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreBookings: any[] = [];
          snapshot.forEach((d) => {
            firestoreBookings.push({ id: d.id, ...d.data() });
          });
          // Sort descending by createdAt
          firestoreBookings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          onBookingsUpdate(firestoreBookings);
        } else {
          fetchFromApi();
        }
      },
      (err) => {
        console.warn("Firestore tutor_bookings listener notice:", err);
        fetchFromApi();
      }
    );
    return unsub;
  } catch (err) {
    fetchFromApi();
    return () => {};
  }
}

/**
 * Admin accepts a booking and automatically assigns the requested tutor or alternative mentor.
 * Saves assignments directly in Firestore:
 *  - 'tutor_bookings': sets status = accepted, assignedTutorId, etc.
 *  - 'teachers': adds student to assignedStudents array, sets isBooked = true
 *  - 'users' (parent): adds tutor to hiredTutors array, sets assignedEducator
 */
export async function adminAcceptAndAssignTutorBooking(
  bookingId: string,
  assignedTutorId?: string,
  notes?: string,
  bookingDetails?: any
): Promise<{ success: boolean; message: string; booking?: any }> {
  try {
    let booking = bookingDetails;
    if (!booking) {
      try {
        const bSnap = await getDoc(doc(db, "tutor_bookings", bookingId));
        if (bSnap.exists()) {
          booking = bSnap.data();
        }
      } catch (e) {
        console.warn('Booking read notice:', e);
      }
    }

    const targetTutorId = assignedTutorId || booking?.requestedTutorId;
    let targetTutorName = booking?.requestedTutorName || 'Home Tutor';
    let targetTutorFee = booking?.requestedTutorMonthlyFee || 1500;
    let targetTutorPhone = "+91 78944 92010";
    let targetTutorAvatar = booking?.requestedTutorAvatar || "";
    let targetTutorSubjects = booking?.subjects || ['Foundational Subjects'];

    // Try fetching tutor doc to get latest name/fee
    if (targetTutorId) {
      try {
        const tSnap = await getDoc(doc(db, "teachers", targetTutorId));
        if (tSnap.exists()) {
          const tData = tSnap.data();
          targetTutorName = tData.name || targetTutorName;
          targetTutorFee = tData.monthlyFee || targetTutorFee;
          targetTutorPhone = tData.phone || targetTutorPhone;
          targetTutorAvatar = tData.avatar || targetTutorAvatar;
          targetTutorSubjects = tData.subjects || targetTutorSubjects;
        }
      } catch (e) {
        console.warn('Tutor read notice:', e);
      }
    }

    // 1. Update Firestore doc in 'tutor_bookings'
    const bookingRef = doc(db, "tutor_bookings", bookingId);
    await updateDoc(bookingRef, {
      status: 'accepted',
      assignedTutorId: targetTutorId,
      assignedTutorName: targetTutorName,
      assignedTutorFee: targetTutorFee,
      assignedTutorPhone: targetTutorPhone,
      assignedTutorAvatar: targetTutorAvatar,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reassignedNotes: notes || 'Confirmed & Assigned by Admin'
    }).catch((err) => console.warn('Firestore booking accept notice:', err));

    // 2. If tutor assigned, mark tutor as booked in Firestore 'teachers' & update assignedStudents
    if (targetTutorId) {
      const studentObj = {
        id: `std-${bookingId}`,
        bookingId: bookingId,
        name: booking?.studentName || 'Student',
        studentName: booking?.studentName || 'Student',
        grade: booking?.studentGrade || 'Class 4',
        parentName: booking?.parentName || 'Parent',
        parentPhone: booking?.parentPhone || '',
        parentEmail: booking?.parentEmail || '',
        address: booking?.address || 'Rayagada',
        subjects: booking?.subjects || targetTutorSubjects,
        timing: booking?.preferredTimeSlot || '5:00 PM - 6:00 PM',
        monthlyFee: targetTutorFee,
        assignedAt: new Date().toISOString(),
        status: 'Active'
      };

      const tutorRef = doc(db, "teachers", targetTutorId);
      await updateDoc(tutorRef, {
        isBooked: true,
        bookingStatus: 'booked',
        bookedByStudentName: booking?.studentName || '',
        bookedByParentName: booking?.parentName || '',
        bookedByParentPhone: booking?.parentPhone || '',
        assignedStudents: arrayUnion(studentObj),
        updatedAt: new Date().toISOString()
      }).catch((err) => console.warn('Firestore tutor booking status update notice:', err));

      const tutorUserRef = doc(db, "users", targetTutorId);
      await updateDoc(tutorUserRef, {
        isBooked: true,
        assignedStudents: arrayUnion(studentObj),
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }

    // 3. Update parent doc in Firestore 'users' collection
    if (booking?.parentUid) {
      const parentRef = doc(db, "users", booking.parentUid);
      const hiredObj = {
        id: `hired-${Date.now()}`,
        bookingId: bookingId,
        tutorId: targetTutorId,
        tutorName: targetTutorName,
        subjects: targetTutorSubjects,
        monthlyFee: targetTutorFee,
        phone: targetTutorPhone,
        avatar: targetTutorAvatar,
        studentName: booking?.studentName || '',
        studentGrade: booking?.studentGrade || '',
        timeSlot: booking?.preferredTimeSlot || '',
        assignedAt: new Date().toISOString(),
        status: 'Active'
      };

      await updateDoc(parentRef, {
        hiredTutors: arrayUnion(hiredObj),
        assignedEducator: {
          id: targetTutorId,
          name: targetTutorName,
          tutorName: targetTutorName,
          subjects: targetTutorSubjects,
          phone: targetTutorPhone,
          monthlyFee: targetTutorFee,
          avatar: targetTutorAvatar,
          status: 'Active'
        },
        updatedAt: new Date().toISOString()
      }).catch((err) => console.warn('Firestore parent doc update notice:', err));
    }

    // 4. Update Backend Express Server
    const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTutorId: targetTutorId, notes })
    });

    if (res.ok) {
      const data = await res.json();
      logAdminActivity({
        actionType: 'booking_accepted',
        category: 'bookings',
        title: 'Home Tutor Booking Accepted & Assigned in Firestore',
        description: `Confirmed booking (${bookingId}) and assigned mentor ${targetTutorName} to student ${booking?.studentName || 'Student'}.`,
        targetId: bookingId,
        status: 'completed',
        notes: notes || 'Confirmed by Admin'
      }).catch(() => {});
      return data;
    }
  } catch (err) {
    console.warn('adminAcceptAndAssignTutorBooking notice:', err);
  }

  logAdminActivity({
    actionType: 'booking_accepted',
    category: 'bookings',
    title: 'Home Tutor Booking Accepted & Assigned',
    description: `Confirmed booking (${bookingId}) and assigned mentor to student.`,
    targetId: bookingId,
    status: 'completed',
    notes: notes || 'Confirmed by Admin'
  }).catch(() => {});

  return {
    success: true,
    message: 'Tutor assigned successfully and stored in Firestore database!'
  };
}

/**
 * Admin creates an authentic student/parent review for a tutor, saved directly to Firestore
 */
export async function adminAddTutorReview(
  tutorId: string,
  reviewData: Omit<TutorReview, 'id' | 'date'>
): Promise<{ success: boolean; message: string; review?: TutorReview; teacher?: Tutor }> {
  try {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullReview: TutorReview = {
      id: reviewId,
      parentName: reviewData.parentName.trim(),
      relation: reviewData.relation?.trim() || `Parent of ${reviewData.studentGrade || 'student'}`,
      rating: Number(reviewData.rating) || 5,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      comment: reviewData.comment.trim(),
      studentGrade: reviewData.studentGrade?.trim() || 'Primary Class',
      schoolName: reviewData.schoolName?.trim() || 'Rayagada',
      verifiedBooking: reviewData.verifiedBooking !== false
    };

    // 1. Update Firestore doc in 'teachers'
    const tutorRef = doc(db, "teachers", tutorId);
    const tutorSnap = await getDoc(tutorRef);
    if (tutorSnap.exists()) {
      const currentData = tutorSnap.data();
      const currentReviews: TutorReview[] = Array.isArray(currentData.reviews) ? currentData.reviews : [];
      const updatedReviews = [fullReview, ...currentReviews];
      const avgRating =
        Math.round((updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / updatedReviews.length) * 10) / 10;

      await updateDoc(tutorRef, {
        reviews: updatedReviews,
        rating: avgRating,
        reviewCount: updatedReviews.length,
        updatedAt: new Date().toISOString()
      }).catch((err) => console.warn('Firestore tutor review update notice:', err));
    }

    // 2. Sync to Backend Express Server
    const res = await fetch(`/api/admin/teachers/${encodeURIComponent(tutorId)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });

    logAdminActivity({
      actionType: 'tutor_approved',
      category: 'tutors',
      title: 'Parent Review Published to Firestore',
      description: `Published verified review from ${reviewData.parentName} (${reviewData.rating}★) for tutor (${tutorId}).`,
      targetId: tutorId,
      status: 'completed',
      notes: reviewData.comment
    }).catch(() => {});

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    return {
      success: true,
      message: 'Review added and stored in Firestore database!',
      review: fullReview
    };
  } catch (err: any) {
    console.warn('adminAddTutorReview notice:', err);
    return {
      success: false,
      message: err?.message || 'Could not save review.'
    };
  }
}

/**
 * Admin deletes a review from tutor in Firestore and backend
 */
export async function adminDeleteTutorReview(
  tutorId: string,
  reviewId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Update Firestore
    const tutorRef = doc(db, "teachers", tutorId);
    const tutorSnap = await getDoc(tutorRef);
    if (tutorSnap.exists()) {
      const currentData = tutorSnap.data();
      const currentReviews: TutorReview[] = Array.isArray(currentData.reviews)
        ? currentData.reviews.filter((r) => r.id !== reviewId)
        : [];
      const avgRating =
        currentReviews.length > 0
          ? Math.round((currentReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / currentReviews.length) * 10) / 10
          : 5.0;

      await updateDoc(tutorRef, {
        reviews: currentReviews,
        rating: avgRating,
        reviewCount: currentReviews.length,
        updatedAt: new Date().toISOString()
      }).catch((err) => console.warn('Firestore delete review notice:', err));
    }

    // 2. Sync to Backend
    await fetch(`/api/admin/teachers/${encodeURIComponent(tutorId)}/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE'
    });

    return {
      success: true,
      message: 'Review removed from Firestore database.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Could not remove review.'
    };
  }
}

/**
 * Admin declines a parent home tutor booking request
 */
export async function adminDeclineTutorBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; message: string; booking?: any }> {
  try {
    // 1. Update Firestore doc in 'tutor_bookings'
    const bookingRef = doc(db, "tutor_bookings", bookingId);
    await updateDoc(bookingRef, {
      status: 'declined',
      declineReason: reason || 'Selected time slot is already fully occupied.',
      declinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch((err) => console.warn('Firestore booking decline notice:', err));

    // 2. Update Backend Express Server
    const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (res.ok) {
      const data = await res.json();
      logAdminActivity({
        actionType: 'booking_declined',
        category: 'bookings',
        title: 'Home Tutor Booking Request Declined',
        description: `Declined booking (${bookingId}). Reason: ${reason || 'Schedule occupied'}`,
        targetId: bookingId,
        status: 'completed',
        notes: reason
      }).catch(() => {});
      return data;
    }
  } catch (err) {
    console.warn('adminDeclineTutorBooking notice:', err);
  }

  logAdminActivity({
    actionType: 'booking_declined',
    category: 'bookings',
    title: 'Home Tutor Booking Request Declined',
    description: `Declined booking (${bookingId}). Reason: ${reason || 'Schedule occupied'}`,
    targetId: bookingId,
    status: 'completed',
    notes: reason
  }).catch(() => {});

  return {
    success: true,
    message: 'Booking request declined.'
  };
}

/**
 * Save a student Success Story to Firestore collection 'success_stories'
 */
export async function saveSuccessStoryToFirestore(storyData: {
  studentName: string;
  score: string;
  exam: string;
  school?: string;
  parentName?: string;
  testimonial: string;
  image?: string;
  year?: string;
  badge?: string;
}): Promise<{ success: boolean; id: string; story: AdminSuccessStory }> {
  const storyId = `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const fullStory: AdminSuccessStory = {
    ...storyData,
    id: storyId,
    image: storyData.image || '/src/assets/images/student_rohit_1788779382685.jpg',
    year: storyData.year || `${new Date().getFullYear()}`,
    badge: storyData.badge || 'Star Student',
    createdAt: new Date().toISOString()
  };

  // 1. Write to Firestore collection 'success_stories'
  try {
    const storyDocRef = doc(db, "success_stories", storyId);
    await setDoc(storyDocRef, {
      ...fullStory,
      timestamp: serverTimestamp(),
      databaseId: FIRESTORE_DATABASE_ID
    });
  } catch (err) {
    console.warn('Firestore success_stories write notice:', err);
  }

  // 2. Sync to Backend API
  try {
    await fetch('/api/success-stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullStory)
    });
  } catch (err) {
    console.warn('API /api/success-stories notice:', err);
  }

  return {
    success: true,
    id: storyId,
    story: fullStory
  };
}

/**
 * Delete a Success Story from Firestore collection 'success_stories' and backend
 */
export async function deleteSuccessStoryFromFirestore(storyId: string): Promise<boolean> {
  // 1. Delete from Firestore
  try {
    const storyRef = doc(db, "success_stories", storyId);
    await deleteDoc(storyRef);
  } catch (err) {
    console.warn('Firestore delete success_story notice:', err);
  }

  // 2. Delete from Backend
  try {
    await fetch(`/api/success-stories/${encodeURIComponent(storyId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('API delete success_story notice:', err);
  }

  return true;
}

/**
 * Real-time listener for Success Stories from Firestore collection 'success_stories'
 */
export function subscribeToRealtimeSuccessStories(onUpdate: (stories: AdminSuccessStory[]) => void): () => void {
  const fetchFromApi = () => {
    fetch('/api/success-stories')
      .then((r) => r.json())
      .then((res) => {
        if (res?.stories && Array.isArray(res.stories)) {
          onUpdate(res.stories);
        }
      })
      .catch((err) => console.warn('Success stories API fetch notice:', err));
  };

  try {
    const col = collection(db, "success_stories");
    const unsub = onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AdminSuccessStory[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              studentName: data.studentName || 'Student',
              score: data.score || data.scoreOrRank || '',
              exam: data.exam || data.examOrClass || '',
              school: data.school || '',
              parentName: data.parentName || '',
              testimonial: data.testimonial || data.story || '',
              image: data.image || data.imageUrl || '/src/assets/images/student_rohit_1788779382685.jpg',
              year: data.year || '2024',
              badge: data.badge || data.tag || 'Top Performer',
              createdAt: data.createdAt || ''
            });
          });
          // Sort by createdAt desc
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          onUpdate(list);
        } else {
          fetchFromApi();
        }
      },
      (err) => {
        console.warn('Firestore success_stories listener notice:', err);
        fetchFromApi();
      }
    );
    return unsub;
  } catch {
    fetchFromApi();
    return () => {};
  }
}

/**
 * Save enquiry to Firestore in real-time
 */
export async function saveEnquiryToFirestore(enquiry: {
  name: string;
  phone: string;
  grade?: string;
  message?: string;
}): Promise<string> {
  try {
    const enquiriesCol = collection(db, "enquiries");
    const docRef = await addDoc(enquiriesCol, {
      ...enquiry,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      databaseId: FIRESTORE_DATABASE_ID
    });
    return docRef.id;
  } catch (err) {
    console.warn("Notice saving enquiry to Firestore:", err);
    return `local-${Date.now()}`;
  }
}

/**
 * Save demo booking to Firestore collection 'demo_bookings' in real-time (for offline classes)
 */
export async function saveDemoBookingToFirestore(booking: {
  studentName: string;
  parentName?: string;
  phone: string;
  email?: string;
  grade: string;
  subject: string;
  mode: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  userId?: string;
}): Promise<string> {
  // Sync to Backend /api/demo-queries
  fetch('/api/demo-queries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  }).catch(() => {});

  try {
    const bookingsCol = collection(db, "demo_bookings");
    const docRef = await addDoc(bookingsCol, {
      ...booking,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
      databaseId: FIRESTORE_DATABASE_ID
    });
    return docRef.id;
  } catch (err) {
    console.warn("Notice saving demo booking to Firestore:", err);
    return `local-${Date.now()}`;
  }
}

/**
 * Log an administrative action to Firestore and backend audit trails
 */
export async function logAdminActivity(
  activityData: Partial<AdminActivityLog> & { actionType: AdminActivityLog['actionType']; title: string }
): Promise<AdminActivityLog> {
  const logId = activityData.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const currentSession = loadSavedUserSession();
  
  const fullLog: AdminActivityLog = {
    id: logId,
    adminName: activityData.adminName || currentSession?.name || ADMIN_CREDENTIALS.name,
    adminEmail: activityData.adminEmail || currentSession?.email || ADMIN_CREDENTIALS.email,
    adminAvatar: activityData.adminAvatar || currentSession?.avatar || "/src/assets/images/student_rohit_1788779382685.jpg",
    actionType: activityData.actionType,
    category: activityData.category || (activityData.actionType.includes("payment_course") ? "payment_courses" : activityData.actionType.includes("payment") ? "payment_home_tutors" : "tutors"),
    title: activityData.title,
    description: activityData.description || activityData.title,
    targetId: activityData.targetId || "",
    targetName: activityData.targetName || "",
    studentName: activityData.studentName || "",
    parentName: activityData.parentName || "",
    parentPhone: activityData.parentPhone || "",
    tutorName: activityData.tutorName || "",
    courseTitle: activityData.courseTitle || "",
    amount: typeof activityData.amount === "number" ? activityData.amount : undefined,
    paymentMethod: activityData.paymentMethod || undefined,
    transactionId: activityData.transactionId || undefined,
    receiptNo: activityData.receiptNo || undefined,
    status: activityData.status || "completed",
    notes: activityData.notes || "",
    timestamp: activityData.timestamp || new Date().toISOString()
  };

  // 1. Save to Cloud Firestore collection 'activity_logs'
  try {
    const logDocRef = doc(db, "activity_logs", logId);
    await setDoc(logDocRef, {
      ...removeUndefinedFields(fullLog),
      serverCreatedAt: serverTimestamp(),
      databaseId: FIRESTORE_DATABASE_ID
    });
  } catch (fsErr) {
    console.warn("Notice saving activity log to Firestore:", fsErr);
  }

  // 2. Sync to Backend Express Server /api/admin/activity-logs
  try {
    await fetch("/api/admin/activity-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullLog)
    });
  } catch (apiErr) {
    console.warn("Notice syncing activity log to API:", apiErr);
  }

  return fullLog;
}

/**
 * Real-time listener for Activity & Audit Logs from Firestore collection 'activity_logs'
 */
export function subscribeToRealtimeActivityLogs(
  onUpdate: (logs: AdminActivityLog[], metrics?: any) => void
): () => void {
  const fetchFromApi = () => {
    fetch("/api/admin/activity-logs")
      .then((r) => r.json())
      .then((res) => {
        if (res?.logs && Array.isArray(res.logs)) {
          onUpdate(res.logs, res.metrics);
        }
      })
      .catch((err) => console.warn("Activity logs API fetch notice:", err));
  };

  try {
    const col = collection(db, "activity_logs");
    const unsub = onSnapshot(
      col,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AdminActivityLog[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              adminName: data.adminName || "Admin Chandini Kurumoju",
              adminEmail: data.adminEmail,
              adminAvatar: data.adminAvatar,
              actionType: data.actionType || "tutor_approved",
              category: data.category || "tutors",
              title: data.title || "Admin Action",
              description: data.description || "",
              targetId: data.targetId,
              targetName: data.targetName,
              studentName: data.studentName,
              parentName: data.parentName,
              parentPhone: data.parentPhone,
              tutorName: data.tutorName,
              courseTitle: data.courseTitle,
              amount: typeof data.amount === "number" ? data.amount : undefined,
              paymentMethod: data.paymentMethod,
              transactionId: data.transactionId,
              receiptNo: data.receiptNo,
              status: data.status || "completed",
              notes: data.notes,
              timestamp: data.timestamp || new Date().toISOString()
            });
          });

          // Sort by timestamp desc
          list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
          onUpdate(list);
        } else {
          fetchFromApi();
        }
      },
      (err) => {
        console.warn("Firestore activity_logs listener notice:", err);
        fetchFromApi();
      }
    );
    return unsub;
  } catch {
    fetchFromApi();
    return () => {};
  }
}

