/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Header, NavTab } from './components/Header';
import { ServiceSelector } from './components/ServiceSelector';
import { VehicleSelector } from './components/VehicleSelector';
import { AddOnSelector } from './components/AddOnSelector';
import { OrderSummary } from './components/OrderSummary';
import { ReceiptModal } from './components/ReceiptModal';
import { TransactionsPage } from './components/TransactionsPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import {
  POSServiceItem,
  POSVehicleType,
  BusinessInfo,
  POSSettings,
  PaymentMethod,
  Transaction,
  UserRole,
} from './types/pos';
import {
  DEFAULT_SETTINGS,
  generateReceiptNumber,
} from './data/constants';

const STORAGE_TRANSACTIONS_KEY = 'my_car_wash_transactions';
const STORAGE_SETTINGS_KEY = 'my_car_wash_settings';
const STORAGE_USER_ROLE_KEY = 'my_car_wash_user_role';

export default function App() {
  // User Role State: 'admin' | 'cashier' (default 'admin' for easy access/testing)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const savedRole = localStorage.getItem(STORAGE_USER_ROLE_KEY);
      if (savedRole === 'admin' || savedRole === 'cashier') {
        return savedRole;
      }
    } catch {
      // Fallback
    }
    return 'admin';
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  // App Settings State (Business info, Services, Vehicle types, Tax rate)
  const [settings, setSettings] = useState<POSSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed: POSSettings = JSON.parse(saved);
        return {
          business: { ...DEFAULT_SETTINGS.business, ...parsed.business },
          services: parsed.services && parsed.services.length > 0 ? parsed.services : DEFAULT_SETTINGS.services,
          vehicleTypes: parsed.vehicleTypes && parsed.vehicleTypes.length > 0 ? parsed.vehicleTypes : DEFAULT_SETTINGS.vehicleTypes,
          taxRate: typeof parsed.taxRate === 'number' ? parsed.taxRate : DEFAULT_SETTINGS.taxRate,
        };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Active filters for New Wash screen
  const activeWashServices = useMemo(
    () => settings.services.filter((s) => s.type === 'wash' && s.active),
    [settings.services]
  );

  const activeVehicleTypes = useMemo(
    () => settings.vehicleTypes.filter((v) => v.active),
    [settings.vehicleTypes]
  );

  const activeAddOns = useMemo(
    () => settings.services.filter((s) => s.type === 'addon' && s.active),
    [settings.services]
  );

  // POS Order State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    return activeWashServices[0]?.id || 'basic';
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(() => {
    return activeVehicleTypes[0]?.id || 'car';
  });

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  // Synchronize selectedService and selectedVehicle if active lists change or prices update
  useEffect(() => {
    if (activeWashServices.length > 0) {
      const exists = activeWashServices.some((s) => s.id === selectedServiceId);
      if (!exists) {
        setSelectedServiceId(activeWashServices[0].id);
      }
    }
  }, [activeWashServices, selectedServiceId]);

  useEffect(() => {
    if (activeVehicleTypes.length > 0) {
      const exists = activeVehicleTypes.some((v) => v.id === selectedVehicleId);
      if (!exists) {
        setSelectedVehicleId(activeVehicleTypes[0].id);
      }
    }
  }, [activeVehicleTypes, selectedVehicleId]);

  // Clean up selected add-ons if any was deactivated
  useEffect(() => {
    setSelectedAddOnIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (activeAddOns.some((a) => a.id === id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [activeAddOns]);

  // Current selected objects
  const selectedService: POSServiceItem = useMemo(() => {
    return (
      activeWashServices.find((s) => s.id === selectedServiceId) ||
      settings.services.find((s) => s.type === 'wash') ||
      DEFAULT_SETTINGS.services[0]
    );
  }, [activeWashServices, settings.services, selectedServiceId]);

  const selectedVehicle: POSVehicleType = useMemo(() => {
    return (
      activeVehicleTypes.find((v) => v.id === selectedVehicleId) ||
      settings.vehicleTypes[0] ||
      DEFAULT_SETTINGS.vehicleTypes[0]
    );
  }, [activeVehicleTypes, settings.vehicleTypes, selectedVehicleId]);

  const selectedAddOnObjects: POSServiceItem[] = useMemo(() => {
    return activeAddOns.filter((a) => selectedAddOnIds.has(a.id));
  }, [activeAddOns, selectedAddOnIds]);

  // Stored Transactions in Local Browser Storage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        return parsed.map((t) => ({
          ...t,
          status: t.status || 'completed',
        }));
      }
    } catch (e) {
      console.error('Error reading transactions from localStorage:', e);
    }
    return [];
  });

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNewSaleCompletion, setIsNewSaleCompletion] = useState(false);

  // Save transactions to local storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  }, [transactions]);

  // Save settings to local storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Save user role to local storage whenever updated
  const handleToggleRole = (role: UserRole) => {
    setUserRole(role);
    try {
      localStorage.setItem(STORAGE_USER_ROLE_KEY, role);
    } catch {
      // Ignore
    }
    // If cashier cannot access settings, redirect to POS if currently on settings tab
    if (role === 'cashier' && activeTab === 'settings') {
      setActiveTab('pos');
    }
  };

  // Safe navigation handler enforcing Cashier permissions
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'settings' && userRole !== 'admin') {
      return; // Cashier cannot access settings
    }
    setActiveTab(tab);
  };

  // Settings modification handlers
  const handleSaveBusinessInfo = (business: BusinessInfo) => {
    setSettings((prev) => ({ ...prev, business }));
  };

  const handleSaveServices = (services: POSServiceItem[]) => {
    setSettings((prev) => ({ ...prev, services }));
  };

  const handleSaveVehicleTypes = (vehicleTypes: POSVehicleType[]) => {
    setSettings((prev) => ({ ...prev, vehicleTypes }));
  };

  const handleSaveTaxRate = (taxRate: number) => {
    setSettings((prev) => ({ ...prev, taxRate }));
  };

  // Toggle Add-on on POS screen
  const handleToggleAddOn = (addon: POSServiceItem) => {
    setSelectedAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(addon.id)) {
        next.delete(addon.id);
      } else {
        next.add(addon.id);
      }
      return next;
    });
  };

  // Reset order on POS screen
  const handleResetOrder = () => {
    if (activeWashServices.length > 0) {
      setSelectedServiceId(activeWashServices[0].id);
    }
    if (activeVehicleTypes.length > 0) {
      setSelectedVehicleId(activeVehicleTypes[0].id);
    }
    setSelectedAddOnIds(new Set());
    setPaymentMethod(null);
  };

  // Complete Sale from POS
  const handleCompleteSale = (cashTendered?: number, changeDue?: number, cardRef?: string) => {
    if (!paymentMethod) return;

    const addOnsTotal = selectedAddOnObjects.reduce((sum, item) => sum + item.price, 0);
    const subtotal = selectedService.price + selectedVehicle.surcharge + addOnsTotal;
    const taxAmount = Math.round(subtotal * settings.taxRate * 100) / 100;
    const total = subtotal + taxAmount;

    // Snapshot current names, prices, surcharges, and tax rate into transaction
    // Note: Sensitive card details are NEVER accepted, stored, or processed.
    const newTx: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      receiptNumber: generateReceiptNumber(),
      timestamp: new Date().toISOString(),
      status: 'completed',
      service: {
        id: selectedService.id,
        name: selectedService.name,
        price: selectedService.price,
      },
      vehicleType: {
        id: selectedVehicle.id,
        name: selectedVehicle.name,
        surcharge: selectedVehicle.surcharge,
      },
      addOns: selectedAddOnObjects.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      subtotal,
      taxRate: settings.taxRate,
      taxAmount,
      total,
      paymentMethod,
      cardRef,
      cashTendered,
      changeDue,
    };

    // 1. Save to transactions list & local storage
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Open receipt modal as new sale completion
    setActiveReceipt(newTx);
    setIsNewSaleCompletion(true);
    setIsReceiptOpen(true);
  };

  // Start New Sale (after closing receipt)
  const handleNewSale = () => {
    setIsReceiptOpen(false);
    setActiveReceipt(null);
    setIsNewSaleCompletion(false);
    handleResetOrder();
  };

  // Void a transaction (Admin only)
  const handleVoidTransaction = (transactionId: string) => {
    if (userRole !== 'admin') {
      alert('Only an Admin can void transactions.');
      return;
    }

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId && t.status !== 'voided') {
          return {
            ...t,
            status: 'voided' as const,
            voidedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  // Print / View receipt from Transactions page
  const handlePrintReceipt = (tx: Transaction) => {
    setActiveReceipt(tx);
    setIsNewSaleCompletion(false);
    setIsReceiptOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header with New Wash, Transactions, and Settings (Admin only) */}
      <Header
        businessName={settings.business.businessName}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        transactionCount={transactions.length}
        taxRate={settings.taxRate}
        userRole={userRole}
        onToggleRole={handleToggleRole}
      />

      {/* Main Content Area */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          /* Main POS Screen: New Wash */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: POS Selections (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Step 1: Services */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <ServiceSelector
                  services={activeWashServices}
                  selectedServiceId={selectedService.id}
                  onSelectService={(service) => setSelectedServiceId(service.id)}
                />
              </div>

              {/* Step 2: Vehicle Type */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <VehicleSelector
                  vehicleTypes={activeVehicleTypes}
                  selectedVehicleId={selectedVehicle.id}
                  onSelectVehicle={(vehicle) => setSelectedVehicleId(vehicle.id)}
                />
              </div>

              {/* Step 3: Add-ons */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <AddOnSelector
                  addOns={activeAddOns}
                  selectedAddOnIds={selectedAddOnIds}
                  onToggleAddOn={handleToggleAddOn}
                />
              </div>
            </div>

            {/* Right Column: Order Summary, Totals & Payment (5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
              <OrderSummary
                selectedService={selectedService}
                selectedVehicle={selectedVehicle}
                selectedAddOns={selectedAddOnObjects}
                taxRate={settings.taxRate}
                paymentMethod={paymentMethod}
                onSelectPaymentMethod={(method) => setPaymentMethod(method)}
                onCompleteSale={handleCompleteSale}
                onResetOrder={handleResetOrder}
              />
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          /* Transactions Screen */
          <TransactionsPage
            transactions={transactions}
            onVoidTransaction={handleVoidTransaction}
            onPrintReceipt={handlePrintReceipt}
            onStartNewWash={() => setActiveTab('pos')}
            userRole={userRole}
          />
        )}

        {activeTab === 'settings' && userRole === 'admin' && (
          /* Settings Screen (Admin only) */
          <SettingsPage
            settings={settings}
            transactions={transactions}
            onSaveBusinessInfo={handleSaveBusinessInfo}
            onSaveServices={handleSaveServices}
            onSaveVehicleTypes={handleSaveVehicleTypes}
            onSaveTaxRate={handleSaveTaxRate}
          />
        )}
      </main>

      {/* Receipt Modal (Displays on payment completion & print friendly) */}
      <ReceiptModal
        transaction={activeReceipt}
        isOpen={isReceiptOpen}
        onNewSale={handleNewSale}
        onClose={() => {
          setIsReceiptOpen(false);
          setActiveReceipt(null);
        }}
        isNewSaleCompletion={isNewSaleCompletion}
        businessInfo={settings.business}
      />
    </div>
  );
}
