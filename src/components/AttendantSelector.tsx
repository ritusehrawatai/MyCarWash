import React from 'react';
import { UserCheck, ChevronDown } from 'lucide-react';
import { UserAccount } from '../services/authService';
import { AuthUser } from '../types/pos';
import { useLanguage } from '../context/LanguageContext';

interface AttendantSelectorProps {
  accounts: UserAccount[];
  selectedAttendantId: string;
  onSelectAttendantId: (attendantId: string) => void;
  currentUser?: AuthUser | null;
}

export const AttendantSelector: React.FC<AttendantSelectorProps> = ({
  accounts,
  selectedAttendantId,
  onSelectAttendantId,
}) => {
  const { t } = useLanguage();

  // Eligible active staff employees (Cashier/Attendant and Admin) who can perform washes
  const eligibleAttendants = accounts.filter(
    (a) => (a.role === 'cashier' || a.role === 'admin') && a.active !== false
  );

  const selectedAttendant =
    eligibleAttendants.find((a) => a.id === selectedAttendantId) ||
    eligibleAttendants[0] ||
    null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 space-y-2.5 transition-colors duration-200">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {t('employees.serviceAttendantTitle') || 'Service Attendant (Washed By)'}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            {t('employees.serviceAttendantHelp') ||
              'Select the employee who physically performs this car wash.'}
          </p>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="attendant-select" className="sr-only">
          {t('employees.serviceAttendantTitle') || 'Service Attendant (Washed By)'}
        </label>
        <div className="relative">
          <select
            id="attendant-select"
            value={selectedAttendant?.id || ''}
            onChange={(e) => onSelectAttendantId(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold rounded-xl py-2.5 pl-3.5 pr-10 cursor-pointer transition-colors shadow-xs"
          >
            {eligibleAttendants.map((attendant) => (
              <option key={attendant.id} value={attendant.id}>
                {attendant.name} {attendant.employeeId ? `(${attendant.employeeId})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
