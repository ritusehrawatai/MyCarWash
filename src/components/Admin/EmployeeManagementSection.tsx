import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Ban,
  Clock,
  Filter,
} from 'lucide-react';
import { UserAccount, generateEmployeeId, hashPassword, validateEmployeeAccount } from '../../services/authService';
import { Transaction, EmployeeRole } from '../../types/pos';
import { useLanguage } from '../../context/LanguageContext';

interface EmployeeManagementSectionProps {
  accounts: UserAccount[];
  transactions: Transaction[];
  onSaveEmployee: (account: UserAccount, isNew: boolean) => { success: boolean; error?: string };
  onToggleEmployeeActive: (accountId: string) => void;
  currentUserId?: string;
}

export const EmployeeManagementSection: React.FC<EmployeeManagementSectionProps> = ({
  accounts,
  transactions,
  onSaveEmployee,
  onToggleEmployeeActive,
  currentUserId,
}) => {
  const { t } = useLanguage();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'cashier'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    role: 'cashier' as EmployeeRole,
    password: '',
    phone: '',
    active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Only consider staff accounts (admin and cashier)
  const staffAccounts = useMemo(() => {
    return accounts.filter((a) => a.role === 'admin' || a.role === 'cashier');
  }, [accounts]);

  // Performance stats per employee
  const employeePerformanceMap = useMemo(() => {
    const map = new Map<
      string,
      { washesPerformed: number; salesTotal: number; cashierProcessed: number }
    >();

    staffAccounts.forEach((staff) => {
      map.set(staff.id, { washesPerformed: 0, salesTotal: 0, cashierProcessed: 0 });
    });

    transactions.forEach((tx) => {
      // Completed washes performed by attendant
      if (tx.serviceAttendantId && map.has(tx.serviceAttendantId)) {
        const current = map.get(tx.serviceAttendantId)!;
        if (tx.status !== 'voided') {
          current.washesPerformed += 1;
          current.salesTotal += tx.total;
        }
      } else if (tx.serviceAttendantEmployeeId) {
        // Fallback by employeeId
        const match = staffAccounts.find((a) => a.employeeId === tx.serviceAttendantEmployeeId);
        if (match && map.has(match.id)) {
          const current = map.get(match.id)!;
          if (tx.status !== 'voided') {
            current.washesPerformed += 1;
            current.salesTotal += tx.total;
          }
        }
      }

      // Cashier processed
      if (tx.processedById && map.has(tx.processedById)) {
        map.get(tx.processedById)!.cashierProcessed += 1;
      }
    });

    return map;
  }, [staffAccounts, transactions]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return staffAccounts.filter((emp) => {
      // Role filter
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) return false;

      // Status filter
      const isActive = emp.active !== false;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'inactive' && isActive) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = emp.name.toLowerCase().includes(q);
        const emailMatch = emp.email.toLowerCase().includes(q);
        const idMatch = (emp.employeeId || '').toLowerCase().includes(q);
        const phoneMatch = (emp.phone || '').includes(q);
        if (!nameMatch && !emailMatch && !idMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [staffAccounts, roleFilter, statusFilter, searchQuery]);

  // Open modal for new employee
  const handleOpenNew = () => {
    const nextEmpId = generateEmployeeId(accounts);
    setEditingAccount(null);
    setFormData({
      employeeId: nextEmpId,
      name: '',
      email: '',
      role: 'cashier', // Default to Cashier/Attendant
      password: '',
      phone: '',
      active: true,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Open modal for editing employee
  const handleOpenEdit = (emp: UserAccount) => {
    setEditingAccount(emp);
    setFormData({
      employeeId: emp.employeeId || '',
      name: emp.name,
      email: emp.email,
      role: emp.role === 'admin' ? 'admin' : 'cashier',
      password: '', // Blank unless changing
      phone: emp.phone || '',
      active: emp.active !== false,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateEmployeeAccount(
      {
        id: editingAccount?.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        employeeId: formData.employeeId,
        password: editingAccount ? formData.password || undefined : formData.password,
      },
      accounts
    );

    if (!validation.valid) {
      setFormError(validation.error || 'Please check your inputs.');
      return;
    }

    const isNew = !editingAccount;
    const accountId = editingAccount ? editingAccount.id : `USR-${formData.role.toUpperCase()}-${Date.now()}`;

    let passwordHash = editingAccount ? editingAccount.passwordHash : '';
    if (formData.password.trim()) {
      passwordHash = hashPassword(formData.password.trim());
    }

    const updatedAccount: UserAccount = {
      id: accountId,
      employeeId: formData.employeeId.trim().toUpperCase(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      passwordHash,
      phone: formData.phone.trim() || undefined,
      active: formData.active,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = onSaveEmployee(updatedAccount, isNew);
    if (!result.success) {
      setFormError(result.error || 'Failed to save employee.');
      return;
    }

    setIsModalOpen(false);
    setSuccessToast(
      isNew
        ? `Employee "${updatedAccount.name}" created successfully!`
        : `Employee "${updatedAccount.name}" updated successfully!`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header and Quick Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Employee Management
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage car wash staff accounts with Admin and Cashier/Attendant roles.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Total Staff
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {staffAccounts.length}
            </span>
          </div>

          <div className="bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl p-3 border border-cyan-200/80 dark:border-cyan-800/80">
            <span className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 block">
              Cashiers / Attendants
            </span>
            <span className="text-xl font-black text-cyan-900 dark:text-cyan-200 font-mono mt-0.5 block">
              {staffAccounts.filter((a) => a.role === 'cashier' && a.active !== false).length}
            </span>
          </div>

          <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-xl p-3 border border-blue-200/80 dark:border-blue-800/80">
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 block">
              Administrators
            </span>
            <span className="text-xl font-black text-blue-900 dark:text-blue-200 font-mono mt-0.5 block">
              {staffAccounts.filter((a) => a.role === 'admin' && a.active !== false).length}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Deactivated
            </span>
            <span className="text-xl font-black text-slate-600 dark:text-slate-400 font-mono mt-0.5 block">
              {staffAccounts.filter((a) => a.active === false).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3 transition-colors duration-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="px-2 text-[10px] uppercase font-bold text-slate-400">Role:</span>
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('cashier')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                roleFilter === 'cashier'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cashier/Attendant
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="px-2 text-[10px] uppercase font-bold text-slate-400">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email / Login</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Services Attributed</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.map((emp) => {
                const isActive = emp.active !== false;
                const perf = employeePerformanceMap.get(emp.id) || {
                  washesPerformed: 0,
                  salesTotal: 0,
                  cashierProcessed: 0,
                };
                const isSelf = emp.id === currentUserId;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/50 ${
                      !isActive ? 'opacity-65 bg-slate-50/30 dark:bg-slate-950/20' : ''
                    }`}
                  >
                    {/* Employee ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {emp.employeeId || 'ID'}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {emp.name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                            You
                          </span>
                        )}
                      </div>
                      {emp.phone && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                          {emp.phone}
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {emp.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          <UserCheck className="w-3 h-3 text-cyan-600" />
                          <span>Cashier / Attendant</span>
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {emp.email}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>

                    {/* Services Attributed */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {perf.washesPerformed} {perf.washesPerformed === 1 ? 'wash' : 'washes'}
                        </span>
                        {perf.salesTotal > 0 && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${perf.salesTotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Edit employee details"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => onToggleEmployeeActive(emp.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            isSelf
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                              : isActive
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={
                            isSelf
                              ? 'You cannot deactivate your own account'
                              : isActive
                              ? 'Deactivate account (preserves historical data)'
                              : 'Reactivate account'
                          }
                        >
                          {isActive ? (
                            <>
                              <Ban className="w-3 h-3 text-rose-500" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No employees found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in transition-colors duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {editingAccount ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingAccount ? 'Edit Employee' : 'Add New Employee'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingAccount
                      ? `Updating employee profile ${editingAccount.employeeId || ''}`
                      : 'Create a new staff account with login credentials'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Employee ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Employee ID (System Generated)
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  readOnly={!!editingAccount}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Employee Type (Strictly Admin or Cashier/Attendant) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Employee Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.role === 'cashier'
                        ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="employeeRole"
                      value="cashier"
                      checked={formData.role === 'cashier'}
                      onChange={() => setFormData({ ...formData, role: 'cashier' })}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Cashier / Attendant</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        POS & car wash service
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.role === 'admin'
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="employeeRole"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={() => setFormData({ ...formData, role: 'admin' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold block">Administrator</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Full admin & reports
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email / Username */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email / Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. employee@carwash.com"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {editingAccount ? 'Change Password (optional)' : 'Password (min 6 characters)'}{' '}
                  {!editingAccount && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingAccount}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingAccount ? 'Leave blank to keep unchanged' : '••••••••'}
                    className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Status Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Account is Active (can log in and perform car washes)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {editingAccount ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
