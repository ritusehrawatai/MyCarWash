import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Car,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { Customer, CustomerVehicle, Transaction, UserRole, CustomerMembership } from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { CustomerProfileModal } from './CustomerProfileModal';
import { AddCustomerModal } from './AddCustomerModal';
import { AddVehicleModal } from './AddVehicleModal';
import { Sparkles } from 'lucide-react';

interface CustomersPageProps {
  customers: Customer[];
  vehicles: CustomerVehicle[];
  transactions: Transaction[];
  memberships?: CustomerMembership[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSaveVehicle: (vehicle: CustomerVehicle) => void;
  onToggleVehicleActive: (vehicle: CustomerVehicle) => void;
  onOpenTransactionDetails: (transaction: Transaction) => void;
  onStartNewWashWithCustomer: (customer: Customer) => void;
  userRole?: UserRole;
  vehicleTypes: any[];
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  customers,
  vehicles,
  transactions,
  memberships = [],
  onAddCustomer,
  onUpdateCustomer,
  onSaveVehicle,
  onToggleVehicleActive,
  onOpenTransactionDetails,
  onStartNewWashWithCustomer,
  userRole = 'admin',
  vehicleTypes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal controls
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [targetCustomerIdForVehicle, setTargetCustomerIdForVehicle] = useState<string | undefined>();
  const [vehicleToEdit, setVehicleToEdit] = useState<CustomerVehicle | null>(null);

  // Compute metrics per customer (vehicles count, visits count, last visit date, total spent)
  const customerStats = useMemo(() => {
    const map = new Map<
      string,
      {
        vehiclesCount: number;
        visitsCount: number;
        lastVisit?: string;
        totalSpent: number;
      }
    >();

    customers.forEach((c) => {
      const custVehicles = vehicles.filter((v) => v.customerId === c.id && v.active !== false);
      const custTxs = transactions.filter((t) => t.customerId === c.id);
      const validTxs = custTxs.filter((t) => t.status !== 'voided');

      const totalSpent = validTxs.reduce((sum, t) => sum + t.total, 0);

      // Latest visit
      const sortedTxs = [...custTxs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastVisit = sortedTxs.length > 0 ? sortedTxs[0].timestamp : undefined;

      map.set(c.id, {
        vehiclesCount: custVehicles.length,
        visitsCount: validTxs.length,
        lastVisit,
        totalSpent,
      });
    });

    return map;
  }, [customers, vehicles, transactions]);

  // Overall account revenue
  const overallTotalRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.customerId && t.status !== 'voided')
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      const matchName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);

      // Match vehicles
      const custVehicles = vehicles.filter((v) => v.customerId === c.id);
      const matchVehicles = custVehicles.some(
        (v) =>
          (v.licensePlate && v.licensePlate.toLowerCase().includes(q)) ||
          (v.make && v.make.toLowerCase().includes(q)) ||
          (v.model && v.model.toLowerCase().includes(q))
      );

      return matchName || matchPhone || matchEmail || matchId || matchVehicles;
    });
  }, [customers, searchQuery, vehicles]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Customer Management</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Directory of registered drivers, linked vehicles, and transaction history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Total Customers
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {customers.length}
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">Saved profiles</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Registered Vehicles
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {vehicles.filter((v) => v.active !== false).length}
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">Linked to accounts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Customer Revenue
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono-numbers mt-1 block">
            {formatCurrency(overallTotalRevenue)}
          </span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400">From account sales</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Walk-in Anonymous
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono-numbers mt-1 block">
            {transactions.filter((t) => !t.customerId).length}
          </span>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">Guest sales</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3 transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, email, or license plate..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Customer Directory ({filteredCustomers.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Click row to open profile & vehicle manager</span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No customers found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Try clearing your search query' : 'Create your first customer to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3 text-center">Vehicles</th>
                  <th className="py-3 px-3 text-center">Visits</th>
                  <th className="py-3 px-3">Last Visit</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map((c) => {
                  const stat = customerStats.get(c.id) || {
                    vehiclesCount: 0,
                    visitsCount: 0,
                    totalSpent: 0,
                  };

                  const formattedLastVisit = stat.lastVisit
                    ? new Date(stat.lastVisit).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group select-none"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{c.firstName} {c.lastName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {c.id}
                          </span>
                          {(() => {
                            const mem = memberships.find((m) => m.customerId === c.id && m.status === 'active');
                            if (!mem) return null;
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-500" />
                                <span>{mem.planNameSnapshot}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {c.phone || <span className="text-slate-400 dark:text-slate-500 italic">None</span>}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                        {c.email || <span className="text-slate-400 dark:text-slate-500 italic">None</span>}
                      </td>

                      {/* Vehicles */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {stat.vehiclesCount}
                        </span>
                      </td>

                      {/* Visits */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {stat.visitsCount}
                      </td>

                      {/* Last Visit */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formattedLastVisit}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-blue-700 dark:text-blue-400">
                        {formatCurrency(stat.totalSpent)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onStartNewWashWithCustomer(c)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                            title="Start new wash for this customer"
                          >
                            New Wash
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 inline" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        vehicles={vehicles}
        transactions={transactions}
        membership={
          selectedCustomer
            ? memberships.find((m) => m.customerId === selectedCustomer.id && m.status === 'active') ||
              memberships.find((m) => m.customerId === selectedCustomer.id) ||
              null
            : null
        }
        onOpenAddVehicle={(cId) => {
          setTargetCustomerIdForVehicle(cId);
          setVehicleToEdit(null);
          setIsAddVehicleOpen(true);
        }}
        onOpenEditVehicle={(veh) => {
          setTargetCustomerIdForVehicle(veh.customerId);
          setVehicleToEdit(veh);
          setIsAddVehicleOpen(true);
        }}
        onToggleVehicleActive={onToggleVehicleActive}
        onOpenTransactionDetails={onOpenTransactionDetails}
        onUpdateCustomer={onUpdateCustomer}
        userRole={userRole}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerCreated={(newCust) => {
          onAddCustomer(newCust);
          setSelectedCustomer(newCust);
        }}
        existingCustomers={customers}
      />

      {/* Add / Edit Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => {
          setIsAddVehicleOpen(false);
          setVehicleToEdit(null);
        }}
        onVehicleSaved={onSaveVehicle}
        customerId={targetCustomerIdForVehicle}
        customerName={
          targetCustomerIdForVehicle
            ? customers.find((c) => c.id === targetCustomerIdForVehicle)?.firstName +
              ' ' +
              customers.find((c) => c.id === targetCustomerIdForVehicle)?.lastName
            : undefined
        }
        vehicleTypes={vehicleTypes}
        existingVehicles={vehicles}
        vehicleToEdit={vehicleToEdit}
      />
    </div>
  );
};
