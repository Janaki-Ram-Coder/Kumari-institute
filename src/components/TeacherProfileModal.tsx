import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Trophy,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  BookOpen,
  LogOut,
  ShieldCheck,
  Zap,
  GraduationCap,
  Calendar,
  Layers,
  Award,
  ListTodo,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Activity,
  TrendingUp
} from 'lucide-react';
import {
  AppUserProfile,
  UserTask,
  addUserTaskToFirestore,
  toggleUserTaskInFirestore,
  deleteUserTaskFromFirestore
} from '../services/firebaseAuth';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUserProfile | null;
  onCompleteProfile: () => void;
  onLogout: () => void;
  onExploreCourses?: () => void;
  onExploreTutors?: () => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onCompleteProfile,
  onLogout,
  onExploreCourses,
  onExploreTutors
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'tutors' | 'tasks' | 'details'>('courses');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<UserTask['category']>('Homework');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  if (!isOpen || !user) return null;

  const isTeacher = user.role === 'teacher';
  const isParent = user.role === 'parent';
  const isCompleted = !!user.profileCompleted;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const enrolledCourses = user.enrolledCourses || [];
  const hiredTutors = user.hiredTutors || [];
  const demoBookings = user.demoBookings || [];
  const tasks: UserTask[] = user.tasks || [];

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'pending') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user.uid) return;
    setIsAddingTask(true);
    try {
      await addUserTaskToFirestore(user.uid, {
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        dueDate: newTaskDueDate || undefined
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
    } catch (err) {
      console.warn('Error adding task to Firestore:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user.uid) return;
    try {
      await toggleUserTaskInFirestore(user.uid, taskId, !currentStatus);
    } catch (err) {
      console.warn('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user.uid) return;
    try {
      await deleteUserTaskFromFirestore(user.uid, taskId);
    } catch (err) {
      console.warn('Error deleting task:', err);
    }
  };

  const modalContent = (
    <div
      id="user-profile-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="user-profile-modal-card"
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto text-left flex flex-col max-h-[90vh]"
      >
        {/* Modal Header Bar */}
        <div className="bg-gradient-to-r from-[#0c2340] via-[#163359] to-[#1d4ed8] p-6 text-white relative shrink-0">
          <button
            type="button"
            id="close-profile-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* User Avatar Circle */}
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-white/20 shrink-0">
              {initial}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white">
                  {isTeacher ? 'Verified Tutor' : 'Parent Account'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Rayagada Member</span>
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">
                {user.name}
              </h3>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span>{user.locality || 'Rayagada, Odisha'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Parent & Teacher */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/70 shrink-0 overflow-x-auto">
          {isParent && (
            <button
              type="button"
              id="profile-tab-courses"
              onClick={() => setActiveTab('courses')}
              className={`pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'border-[#1d4ed8] text-[#1d4ed8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Courses ({enrolledCourses.length})</span>
            </button>
          )}

          {isParent && (
            <button
              type="button"
              id="profile-tab-tutors"
              onClick={() => setActiveTab('tutors')}
              className={`pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'tutors'
                  ? 'border-[#1d4ed8] text-[#1d4ed8]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tutors ({hiredTutors.length})</span>
            </button>
          )}

          {/* Real-time Tasks & Works Tab */}
          <button
            type="button"
            id="profile-tab-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'border-[#1d4ed8] text-[#1d4ed8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Tasks & Works ({tasks.length})</span>
            {tasks.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            type="button"
            id="profile-tab-details"
            onClick={() => setActiveTab('details')}
            className={`pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-[#1d4ed8] text-[#1d4ed8]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isTeacher ? 'Profile & Ranking' : 'Account Info'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TASKS & WORKS TAB (REAL-TIME SYNCED WITH FIRESTORE) */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Header & Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isTeacher ? 'Teacher Worklist & Student Tasks' : 'My Learning Works, Tasks & Progress'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    All tasks and progress automatically synchronize to Firestore in real-time.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Firestore Real-Time</span>
                </span>
              </div>

              {/* Progress Overview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Works Completion Rate</span>
                  </span>
                  <span className="text-blue-700">
                    {tasks.length > 0
                      ? `${Math.round((completedTasksCount / tasks.length) * 100)}% (${completedTasksCount}/${tasks.length} Completed)`
                      : 'No tasks scheduled'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-blue-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full"
                    style={{
                      width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                  <span>Pending: {tasks.length - completedTasksCount} items</span>
                  <span>Active Session UID: {user.uid.slice(0, 8)}...</span>
                </div>
              </div>

              {/* Add New Task Form */}
              <form onSubmit={handleAddTask} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add New Task / Work Item</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={
                      isTeacher
                        ? 'e.g., Prepare Class 10 Math Mock Paper 2'
                        : 'e.g., Complete Navodaya Math Section Ch. 4'
                    }
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Homework">Homework</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Test">Test / Exam</option>
                    <option value="Revision">Revision</option>
                    <option value="Demo">Demo Class</option>
                    <option value="General">General</option>
                  </select>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingTask || !newTaskTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shrink-0"
                  >
                    {isAddingTask ? 'Saving...' : 'Add Task'}
                  </button>
                </div>
              </form>

              {/* Task Filters */}
              {tasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-semibold mr-1">Filter:</span>
                  {(['all', 'pending', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTaskFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                        taskFilter === filter
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks List */}
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        t.completed
                          ? 'bg-slate-50/80 border-slate-200 opacity-80'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t.id, t.completed)}
                        className="flex items-start gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {t.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm font-semibold text-slate-900 ${
                              t.completed ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                              {t.category}
                            </span>
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {t.dueDate}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <ListTodo className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    {tasks.length === 0 ? 'No tasks or works logged yet' : 'No tasks matching this filter'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add homework assignments, exam schedules, or teaching notes above. They will sync straight to your Firestore account.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PARENT VIEW - ENROLLED COURSES */}
          {isParent && activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Enrolled Courses & Batches
                </h4>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Permanently Saved in Session
                </span>
              </div>

              {enrolledCourses.length > 0 ? (
                <div className="space-y-3">
                  {enrolledCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                            {c.tag || 'Course'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Enrolled on {c.enrolledAt}</span>
                          </span>
                        </div>
                        <h5 className="text-sm sm:text-base font-black text-slate-900">{c.title}</h5>
                        {c.subtitle && <p className="text-xs text-slate-600">{c.subtitle}</p>}
                        <div className="text-xs font-bold text-emerald-700 pt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tuition Fee: {c.fee} • Status: Active Batch</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">No Courses Enrolled Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore our Navodaya Coaching, Class 1-10 Foundation, and Science batches. Once enrolled, they stay permanently linked to your profile.
                    </p>
                  </div>
                  {onExploreCourses && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExploreCourses();
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0c2340] text-white font-bold text-xs hover:bg-slate-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PARENT VIEW - HIRED TUTORS */}
          {isParent && activeTab === 'tutors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Hired Home Tutors in Rayagada
                </h4>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Stored in Firestore & Session
                </span>
              </div>

              {hiredTutors.length > 0 ? (
                <div className="space-y-3">
                  {hiredTutors.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">
                            Confirmed Tutor
                          </span>
                          <span className="text-xs text-slate-500">Hired on {t.hiredAt}</span>
                        </div>
                        <h5 className="text-sm sm:text-base font-black text-slate-900">{t.tutorName}</h5>
                        <p className="text-xs text-slate-600">
                          Subjects: {t.subjects.join(', ')} • {t.locationArea || 'Rayagada'}
                        </p>
                        <div className="text-xs font-bold text-purple-900 pt-1 flex items-center gap-2">
                          <span>Monthly Fee: ₹{t.monthlyFee}/month</span>
                          {t.phone && <span>• Phone: {t.phone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">No Home Tutors Hired Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Need a dedicated home educator in Rayagada? Browse verified tutors in your locality.
                    </p>
                  </div>
                  {onExploreTutors && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onExploreTutors();
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Find Tutors in Rayagada</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Demo bookings subsection */}
              {demoBookings.length > 0 && (
                <div className="pt-3 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Trial Classes & Demo Bookings
                  </h5>
                  <div className="space-y-2">
                    {demoBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{b.studentName ? `${b.studentName} (${b.grade || 'Student'})` : 'Demo Session'}</span>
                          <span className="text-amber-700">{b.status}</span>
                        </div>
                        <div className="text-slate-600">
                          {b.subject && <span>Subject: {b.subject} • </span>}
                          {b.mode && <span>Mode: {b.mode} • </span>}
                          <span>Booked on {b.bookedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARENT VIEW - ACCOUNT INFO or TEACHER VIEW */}
          {(isTeacher || activeTab === 'details') && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                User Details & Session Credentials
              </h4>

              {/* Contact Details Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2.5 text-xs sm:text-sm font-medium text-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate text-slate-800 font-semibold">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-slate-800 font-semibold">{user.phone}</span>
                  </div>
                )}
                {user.gender && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-slate-800 font-semibold capitalize">Gender: {user.gender}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800 font-semibold capitalize">Account Type: {user.role}</span>
                </div>
              </div>

              {/* Teacher Specific Ranking Incentive Callout */}
              {isTeacher && (
                <>
                  <div className="bg-gradient-to-br from-purple-50 via-purple-50/70 to-indigo-50 rounded-2xl p-4 sm:p-5 border border-purple-200/80 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Trophy className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm sm:text-base font-black text-purple-950 flex items-center gap-1.5">
                          <span>Complete Profile to Rank at the Top!</span>
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        </h4>
                        <p className="text-xs text-purple-900/80 leading-relaxed">
                          Teachers who complete their teaching details (timings, subjects, monthly fees) get placed at the top of Rayagada search results and receive 5x more parent tuition bookings!
                        </p>
                      </div>
                    </div>

                    {/* Profile Completion Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                        <span>Profile Status</span>
                        <span
                          className={
                            isCompleted && (user.verified || user.kycStatus === 'verified')
                              ? 'text-emerald-700'
                              : isCompleted
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }
                        >
                          {isCompleted && (user.verified || user.kycStatus === 'verified')
                            ? '100% Completed (Verified)'
                            : isCompleted
                            ? '75% Submitted (Verification in Progress)'
                            : 'Pending Submission (Action Needed)'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-purple-200/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isCompleted && (user.verified || user.kycStatus === 'verified')
                              ? 'bg-emerald-600 w-full'
                              : isCompleted
                              ? 'bg-amber-500 w-[75%]'
                              : 'bg-red-500 w-[15%]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile Verification Checklist: 4 Distinct Items */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Teacher Profile Verification Items
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
                      {/* 1. Personal Info */}
                      <div
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/80'
                            : 'bg-red-50/70 text-red-900 border-red-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">Personal Info</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      {/* 2. Qualifications */}
                      <div
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/80'
                            : 'bg-red-50/70 text-red-900 border-red-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">Qualifications</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      {/* 3. Subjects & Pricing */}
                      <div
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/80'
                            : 'bg-red-50/70 text-red-900 border-red-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900">Subjects &amp; Pricing</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>

                      {/* 4. KYC Verification: Red for pending, Yellow for verification-in-progress, Green for completed */}
                      {(() => {
                        const isKycVerified = Boolean(user.verified || user.kycStatus === 'verified' || user.kycStatus === 'approved');
                        const isKycInProgress = isCompleted && !isKycVerified;
                        return (
                          <div
                            className={`flex items-start justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                              isKycVerified
                                ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/80'
                                : isKycInProgress
                                ? 'bg-amber-50/80 text-amber-900 border-amber-200/80'
                                : 'bg-red-50/70 text-red-900 border-red-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isKycVerified ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isKycInProgress ? (
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900">KYC Verification</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                isKycVerified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isKycInProgress
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {isKycVerified
                                ? 'Completed'
                                : isKycInProgress
                                ? 'In Progress'
                                : 'Pending'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Area: Complete Profile Button & Logout */}
        <div className="p-4 sm:p-6 border-t border-slate-100 space-y-2 bg-slate-50 shrink-0">
          {isTeacher && (
            <button
              type="button"
              id="complete-profile-from-modal-btn"
              onClick={() => {
                onClose();
                onCompleteProfile();
              }}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{isCompleted ? 'Edit / Update Profile' : 'Complete Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id="logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Log Out (Securely End Session)</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};
