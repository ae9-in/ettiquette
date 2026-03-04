import React, { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { COURSES } from '../data/courses';
import { UserProfile, UserProgress } from '../types';
import { createUser, deleteUser, updateUser, fetchEmployees } from '../systems/appData';

interface AdminDashboardProps {
  state: UserProfile;
  allUsers: UserProfile[];
  onUpdateEmployees: (newUsers: UserProfile[]) => void;
  onReloadUsers: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ state, allUsers = [], onUpdateEmployees, onReloadUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [managedUserId, setManagedUserId] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial load check - also reload if we detect mock data (id 'user-123' etc)
  useEffect(() => {
    const hasMockData = allUsers.some(u => u.id === 'user-123' || u.id === 'admin-999');
    if (allUsers.length === 0 || hasMockData) {
      loadEmployees();
    }
  }, [allUsers.length]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const users = await fetchEmployees();
      onUpdateEmployees(users);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees: ' + (error.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    department: '',
    assignedCourses: [] as string[]
  });

  // Stats Logic
  const metrics = useMemo(() => {
    if (allUsers.length === 0) return { compliance: 0, totalEmployees: 0, activeCerts: 0 };
    let totalAssigned = 0;
    let totalCompleted = 0;
    allUsers.forEach(u => {
      const assigned = u.assignedCourses || [];
      const prog = u.progress || {};
      totalAssigned += assigned.length;
      totalCompleted += Object.values(prog as Record<string, UserProgress>).filter(p => p.isCompleted && assigned.includes(p.courseId)).length;
    });
    return {
      compliance: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
      totalEmployees: allUsers.filter(u => u.role === 'employee').length,
      activeCerts: totalCompleted
    };
  }, [allUsers]);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return allUsers.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || e.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [allUsers, searchTerm, selectedDept]);



  const managedUser = allUsers.find(u => u.id === managedUserId);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const mappedRole = newUserForm.role === 'admin' ? 'platform_admin' : 'employee';
      const { profile: newUser, invited } = await createUser({
        name: newUserForm.name,
        email: newUserForm.email,
        role: mappedRole,
        department: newUserForm.department,
        assignedCourses: newUserForm.role === 'admin' ? [] : newUserForm.assignedCourses
      });

      // Refresh the user list
      onReloadUsers();

      setMessage({
        type: 'success',
        text: invited
          ? `Invite sent to ${newUser.email}`
          : `User pre-seeded: ${newUser.name} (${newUser.email}). They can now log in via Google.`
      });
      setShowAddUser(false);
      // FIX: Reset full form state to avoid stale assigned courses in subsequent creates.
      setNewUserForm({ name: '', email: '', role: 'user', department: '', assignedCourses: [] });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setLoading(true);
    setMessage(null);

    try {
      await deleteUser(userId);
      onReloadUsers();
      setManagedUserId(null);
      setMessage({ type: 'success', text: 'User deleted successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignment = async (courseId: string) => {
    if (!managedUserId) return;

    const managedUser = allUsers.find(u => u.id === managedUserId);
    if (!managedUser) return;

    const isAssigned = managedUser.assignedCourses.includes(courseId);
    const optimisticUser = {
      ...managedUser,
      assignedCourses: isAssigned
        ? managedUser.assignedCourses.filter(id => id !== courseId)
        : [...managedUser.assignedCourses, courseId]
    };
    const previousUsers = allUsers;

    // FIX: Apply optimistic UI update immediately so assignment actions feel instant.
    onUpdateEmployees(allUsers.map(u => u.id === managedUserId ? optimisticUser : u));

    try {
      const updatedUser = await updateUser(managedUserId, {
        assignedCourses: optimisticUser.assignedCourses
      });

      if (updatedUser) {
        const updatedUsers = allUsers.map(u => u.id === managedUserId ? updatedUser : u);
        onUpdateEmployees(updatedUsers);
      }
      setMessage({ type: 'success', text: 'Assignment updated' });
    } catch (error: any) {
      onUpdateEmployees(previousUsers);
      setMessage({ type: 'error', text: error.message || 'Failed to update course assignment' });
    }
  };

  const sendReminder = (emp: UserProfile, courseTitle: string) => {
    const subject = encodeURIComponent(`Action Required: ${courseTitle} Training`);
    const body = encodeURIComponent(`Hi ${emp.name},\n\nOur records show you have not yet completed the mandatory training: ${courseTitle}.\n\nPlease complete this module at your earliest convenience to ensure organizational compliance.\n\nRegards,\nHR Compliance Team`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${emp.email}&su=${subject}&body=${body}`, '_blank');
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(allUsers.map(u => u.department));
    return ['All', ...Array.from(depts)];
  }, [allUsers]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
          <p className="font-bold text-sm">{message.text}</p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddUser(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-3xl font-black text-slate-900 italic font-['Bangers']">Add New User</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-10 pt-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="jane.doe@gmail.com"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewUserForm({ ...newUserForm, role: 'user' })}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border-2 transition-all ${newUserForm.role === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserForm({ ...newUserForm, role: 'admin' })}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border-2 transition-all ${newUserForm.role === 'admin'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                <input
                  type="text"
                  required
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  placeholder="Product Development"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {newUserForm.role === 'user' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Assign Initial Curriculum</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                    {COURSES.map(course => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          const isSelected = newUserForm.assignedCourses.includes(course.id);
                          setNewUserForm({
                            ...newUserForm,
                            assignedCourses: isSelected
                              ? newUserForm.assignedCourses.filter(id => id !== course.id)
                              : [...newUserForm.assignedCourses, course.id]
                          });
                        }}
                        className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-3 text-left ${newUserForm.assignedCourses.includes(course.id)
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                      >
                        <span className="text-xl shrink-0">{course.icon}</span>
                        <span className="truncate">{course.title.split(':')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="bg-white border-b border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black text-slate-900 italic font-['Bangers'] tracking-tighter">Workforce Intelligence</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Administrative Command Center • ISO 27001 Audited</p>
              </div>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add User
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Org Compliance</p>
              <h2 className="text-6xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{metrics.compliance}%</h2>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${metrics.compliance}%` }}></div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Employees</p>
              <h2 className="text-6xl font-black text-slate-900 group-hover:text-emerald-500 transition-colors">{metrics.totalEmployees}</h2>
              <p className="mt-4 text-[10px] font-bold text-slate-300 uppercase">Active Accounts</p>
            </div>
            <div className="p-8 bg-slate-900 rounded-[40px] shadow-2xl shadow-indigo-100 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Certifications Issued</p>
              <h2 className="text-6xl font-black">{metrics.activeCerts}</h2>
              <p className="mt-4 text-[10px] font-bold opacity-40 uppercase">Statutory Records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Table Controls */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search name, email or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[32px] text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
            <svg className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {departments.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedDept === d ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Main Directory Table */}
        <div className="bg-white rounded-[56px] border border-slate-100 shadow-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Contact</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Status</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.map(emp => {
                const assigned = emp.assignedCourses || [];
                const prog = emp.progress || {};
                const totalAssigned = assigned.length;
                const completed = Object.values(prog as Record<string, UserProgress>).filter(p => p.isCompleted && assigned.includes(p.courseId)).length;
                const percent = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <img src={emp.avatar || undefined} className="h-14 w-14 rounded-2xl border-2 border-white shadow-xl grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                        <div>
                          <p className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">{emp.email}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${emp.role === 'platform_admin'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                        {emp.role === 'platform_admin' ? 'Administrator' : 'Employee'}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-2 text-[9px] font-black uppercase tracking-widest">
                            <span className={percent === 100 ? 'text-emerald-500' : 'text-slate-400'}>{percent === 100 ? 'Certified' : 'Progress'}</span>
                            <span className="text-slate-900">{percent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm ${percent === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                          {percent === 100 ? 'Audit Clear' : 'Attention'}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setManagedUserId(emp.id)}
                          className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                        >
                          Manage
                        </button>
                        {emp.id !== state.id && (
                          <button
                            onClick={() => handleDeleteUser(emp.id)}
                            className="px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-bold">No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Detail Panel */}
      {managedUser && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setManagedUserId(null)}></div>

          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full animate-in slide-in-from-right duration-500 overflow-y-auto">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-6">
                <img src={managedUser.avatar || undefined} className="h-16 w-16 rounded-2xl shadow-lg" alt="" />
                <div>
                  <h3 className="text-3xl font-black text-slate-900 italic font-['Bangers']">{managedUser.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Learning Pathway Control</p>
                </div>
              </div>
              <button onClick={() => setManagedUserId(null)} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-10">
              <div className="mb-12">
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 border-b-2 border-indigo-50 pb-2">Assign Mandatory Curriculum</h4>
                <div className="grid grid-cols-1 gap-4">
                  {COURSES.map(course => {
                    const isAssigned = managedUser.assignedCourses.includes(course.id);
                    const progress = managedUser.progress[course.id] as UserProgress | undefined;
                    const isDone = progress?.isCompleted;

                    return (
                      <div key={course.id} className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between gap-4 ${isAssigned ? 'bg-slate-50 border-slate-900' : 'bg-white border-slate-100'
                        }`}>
                        <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${isAssigned ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>
                            {isDone ? '✓' : course.icon}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm">{course.title.split(':')[0]}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{course.category} • {course.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAssigned && !isDone && (
                            <button
                              onClick={() => sendReminder(managedUser, course.title)}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                            >
                              Send Reminder
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleAssignment(course.id)}
                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${isAssigned ? 'bg-rose-500 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900'
                              }`}
                          >
                            {isAssigned ? 'Remove' : 'Assign'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
