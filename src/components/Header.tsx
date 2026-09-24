import React from 'react';
import { Sparkles, ReceiptText, Clock, Settings2, PlusCircle, ShieldCheck, User } from 'lucide-react';
import { UserRole } from '../types/pos';

export type NavTab = 'pos' | 'transactions' | 'settings';

interface HeaderProps {
  businessName: string;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  transactionCount: number;
  taxRate: number;
  userRole: UserRole;
  onToggleRole: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  activeTab,
  onSelectTab,
  transactionCount,
  taxRate,
  userRole,
  onToggleRole,
}) => {
  const [time, setTime] = React.useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {businessName || 'My Car Wash'}
            </h1>
            <p className="text-xs text-slate-700 font-medium hidden sm:block">
              Express POS · Lane 1
            </p>
          </div>
        </div>

        {/* Zone 2: Primary Navigation Tabs (New Wash, Transactions, and Settings for Admin) */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectTab('pos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Wash</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Transactions</span>
            {transactionCount > 0 && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
                  activeTab === 'transactions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {transactionCount}
              </span>
            )}
          </button>

          {/* Settings Tab - Admin only */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Role Switcher & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onToggleRole('cashier')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                userRole === 'cashier'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Switch to Cashier view"
            >
              <User className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Cashier</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleRole('admin')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                userRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Switch to Admin view"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>

          {/* Tax info badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            <span>Tax:</span>
            <span className="font-mono font-bold">{(taxRate * 100).toFixed(2)}%</span>
          </div>

          {/* Time display */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
