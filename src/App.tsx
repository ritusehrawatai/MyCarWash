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
import { CustomerPOSSection } from './components/Customers/CustomerPOSSection';
import { CustomersPage } from './components/Customers/CustomersPage';
import { AddCustomerModal } from './components/Customers/AddCustomerModal';
import { FindCustomerModal } from './components/Customers/FindCustomerModal';
import { AddVehicleModal } from './components/Customers/AddVehicleModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { HomePage } from './components/Public/HomePage';
import { CustomerSignUpPage } from './components/Public/CustomerSignUpPage';
import { CustomerLoginPage } from './components/Public/CustomerLoginPage';
import { AdminLoginPage } from './components/Public/AdminLoginPage';
import { CustomerDashboardPage } from './components/CustomerPortal/CustomerDashboardPage';
import { MembershipsPage } from './components/Public/MembershipsPage';
import { MembershipCheckoutModal } from './components/Memberships/MembershipCheckoutModal';
import { MembershipManagementSection } from './components/Admin/MembershipManagementSection';
import {
  POSServiceItem,
  POSVehicleType,
  BusinessInfo,
  POSSettings,
  PaymentMethod,
  Transaction,
  UserRole,
  Customer,
  CustomerVehicle,
  AuthUser,
  MembershipPlan,
  CustomerMembership,
  MembershipUsage,
} from './types/pos';
import {
  DEFAULT_SETTINGS,
  generateReceiptNumber,
} from './data/constants';
import {
  STORAGE_CUSTOMERS_KEY,
  STORAGE_VEHICLES_KEY,
  INITIAL_CUSTOMERS,
  INITIAL_VEHICLES,
  formatVehicleDescription,
} from './data/customerData';
import {
  DEFAULT_MEMBERSHIP_PLANS,
  INITIAL_MEMBERSHIPS,
  INITIAL_MEMBERSHIP_USAGES,
  STORAGE_MEMBERSHIPS_KEY,
  STORAGE_MEMBERSHIP_PLANS_KEY,
  STORAGE_MEMBERSHIP_USAGES_KEY,
  generateUsageId,
} from './data/membershipData';
import {
  UserAccount,
  STORAGE_AUTH_ACCOUNTS_KEY,
  STORAGE_CURRENT_USER_KEY,
  INITIAL_ACCOUNTS,
  hashPassword,
} from './services/authService';

const STORAGE_TRANSACTIONS_KEY = 'my_car_wash_transactions';
const STORAGE_SETTINGS_KEY = 'my_car_wash_settings';

export type AppView = 'public_home' | 'customer_signup' | 'customer_login' | 'admin_login' | 'customer_dashboard' | 'memberships' | 'app';

export default function App() {
  // Accounts Collection State
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_ACCOUNTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading accounts from localStorage:', e);
    }
    return INITIAL_ACCOUNTS;
  });

  // Active Authenticated User (Null when visiting public home)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (saved) {
        const parsed: AuthUser = JSON.parse(saved);
        return parsed;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Current Active Top-Level View
  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (savedUser) {
        const parsed: AuthUser = JSON.parse(savedUser);
        if (parsed.role === 'customer') return 'customer_dashboard';
        if (parsed.role === 'cashier' || parsed.role === 'admin') return 'app';
      }
    } catch {
      // Fallback
    }
    return 'public_home';
  });

  // Staff Navigation Tab inside POS ('pos' | 'customers' | 'transactions' | 'settings')
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  // Customer Edit Vehicle state for Customer Dashboard
  const [editingVehicleForCustomer, setEditingVehicleForCustomer] = useState<CustomerVehicle | null>(null);
  const [isCustomerAddVehicleModalOpen, setIsCustomerAddVehicleModalOpen] = useState(false);

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

  // Customers Collection State
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading customers from localStorage:', e);
    }
    return INITIAL_CUSTOMERS;
  });

  // Vehicles Collection State
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VEHICLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading vehicles from localStorage:', e);
    }
    return INITIAL_VEHICLES;
  });

  // Transactions State
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

  // Membership Plans Collection State
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEMBERSHIP_PLANS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading membership plans from localStorage:', e);
    }
    return DEFAULT_MEMBERSHIP_PLANS;
  });

  // Active Customer Memberships State
  const [memberships, setMemberships] = useState<CustomerMembership[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEMBERSHIPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading memberships from localStorage:', e);
    }
    return INITIAL_MEMBERSHIPS;
  });

  // Membership Usages State
  const [membershipUsages, setMembershipUsages] = useState<MembershipUsage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEMBERSHIP_USAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading membership usages from localStorage:', e);
    }
    return INITIAL_MEMBERSHIP_USAGES;
  });

  // Membership Checkout Modal State
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<MembershipPlan | null>(null);
  const [isMembershipCheckoutOpen, setIsMembershipCheckoutOpen] = useState(false);

  // POS State for redeeming membership wash
  const [isRedeemingMembershipWash, setIsRedeemingMembershipWash] = useState(false);

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

  // POS Customer & Vehicle State (Optional)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerVehicle, setSelectedCustomerVehicle] = useState<CustomerVehicle | null>(null);

  // Modal dialog states for POS flow
  const [isFindCustomerModalOpen, setIsFindCustomerModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isNewSaleCompletion, setIsNewSaleCompletion] = useState(false);

  // Transaction detail modal when opened from Customer Profile
  const [inspectingTransaction, setInspectingTransaction] = useState<Transaction | null>(null);

  // Persist accounts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts to localStorage:', e);
    }
  }, [accounts]);

  // Persist current session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save current user to localStorage:', e);
    }
  }, [currentUser]);

  // Persist other collections
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to localStorage:', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VEHICLES_KEY, JSON.stringify(vehicles));
    } catch (e) {
      console.error('Failed to save vehicles to localStorage:', e);
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEMBERSHIP_PLANS_KEY, JSON.stringify(membershipPlans));
    } catch (e) {
      console.error('Failed to save membership plans to localStorage:', e);
    }
  }, [membershipPlans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEMBERSHIPS_KEY, JSON.stringify(memberships));
    } catch (e) {
      console.error('Failed to save memberships to localStorage:', e);
    }
  }, [memberships]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEMBERSHIP_USAGES_KEY, JSON.stringify(membershipUsages));
    } catch (e) {
      console.error('Failed to save membership usages to localStorage:', e);
    }
  }, [membershipUsages]);

  // Synchronize POS selections if active lists change
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

  // Current vehicles belonging to the selected customer on POS
  const currentCustomerVehicles = useMemo(() => {
    if (!selectedCustomer) return [];
    return vehicles.filter((v) => v.customerId === selectedCustomer.id && v.active !== false);
  }, [selectedCustomer, vehicles]);

  // Active membership for the selected customer on POS
  const activeCustomerMembership = useMemo(() => {
    if (!selectedCustomer) return null;
    return (
      memberships.find(
        (m) => m.customerId === selectedCustomer.id && m.status === 'active'
      ) || null
    );
  }, [selectedCustomer, memberships]);

  // Default redeem wash to true if active customer has remaining washes
  useEffect(() => {
    if (activeCustomerMembership && activeCustomerMembership.remainingWashes > 0) {
      setIsRedeemingMembershipWash(true);
    } else {
      setIsRedeemingMembershipWash(false);
    }
  }, [activeCustomerMembership]);

  useEffect(() => {
    if (selectedCustomer) {
      const custVehicles = vehicles.filter(
        (v) => v.customerId === selectedCustomer.id && v.active !== false
      );
      if (custVehicles.length > 0) {
        if (!selectedCustomerVehicle || selectedCustomerVehicle.customerId !== selectedCustomer.id) {
          const first = custVehicles[0];
          setSelectedCustomerVehicle(first);
          if (first.vehicleTypeId) {
            setSelectedVehicleId(first.vehicleTypeId);
          }
        }
      } else {
        setSelectedCustomerVehicle(null);
      }
    } else {
      setSelectedCustomerVehicle(null);
    }
  }, [selectedCustomer]);

  const handleSelectCustomerVehicle = (v: CustomerVehicle) => {
    setSelectedCustomerVehicle(v);
    if (v.vehicleTypeId) {
      setSelectedVehicleId(v.vehicleTypeId);
    }
  };

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

  // ================= AUTHENTICATION & ROLE ROUTING =================
  const handleCustomerSignUpSuccess = (newUser: AuthUser, customerProfile: Customer) => {
    // 1. Save new customer account (with role='customer')
    const newAccount: UserAccount = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'customer',
      passwordHash: hashPassword('customer123'), // Demo default hash
      customerId: customerProfile.id,
    };

    setAccounts((prev) => [...prev, newAccount]);

    // 2. Ensure customer profile is in directory
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === customerProfile.id);
      if (!exists) return [customerProfile, ...prev];
      return prev;
    });

    // 3. Automatically log customer in and navigate to Customer Dashboard
    setCurrentUser(newUser);
    setCurrentView('customer_dashboard');
  };

  const handleCustomerLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentView('customer_dashboard');
  };

  const handleAdminLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentView('app');
    // If cashier logs in, land directly on POS
    if (user.role === 'cashier') {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('public_home');
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } catch {}
  };

  // Safe navigation handler enforcing role permissions for Staff POS
  const handleSelectTab = (tab: NavTab) => {
    // Cashier cannot access settings or membership management
    if ((tab === 'settings' || tab === 'memberships') && currentUser?.role !== 'admin') {
      return;
    }
    setActiveTab(tab);
  };

  // Customer Management Handlers
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  };

  const handleSaveVehicle = (savedVehicle: CustomerVehicle) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === savedVehicle.id);
      if (exists) {
        return prev.map((v) => (v.id === savedVehicle.id ? savedVehicle : v));
      }
      return [...prev, savedVehicle];
    });

    if (
      (!savedVehicle.customerId && !selectedCustomer) ||
      (selectedCustomer && savedVehicle.customerId === selectedCustomer.id)
    ) {
      setSelectedCustomerVehicle(savedVehicle);
      if (savedVehicle.vehicleTypeId) {
        setSelectedVehicleId(savedVehicle.vehicleTypeId);
      }
    }
  };

  const handleToggleVehicleActive = (targetVehicle: CustomerVehicle) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === targetVehicle.id ? { ...v, active: !v.active } : v))
    );
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
    setSelectedCustomer(null);
    setSelectedCustomerVehicle(null);
    setIsRedeemingMembershipWash(false);
  };

  const handleStartNewWashWithCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('pos');
  };

  // Complete Sale from POS
  const handleCompleteSale = (
    cashTendered?: number,
    changeDue?: number,
    cardRef?: string,
    isMembershipRedeemed?: boolean,
    membershipDiscount?: number
  ) => {
    if (!paymentMethod) return;

    const addOnsTotal = selectedAddOnObjects.reduce((sum, item) => sum + item.price, 0);
    const rawSubtotal = selectedService.price + selectedVehicle.surcharge + addOnsTotal;
    const discountAmount = membershipDiscount || 0;
    const subtotal = Math.max(0, rawSubtotal - discountAmount);
    const taxAmount = Math.round(subtotal * settings.taxRate * 100) / 100;
    const total = subtotal + taxAmount;

    const customerNameAtSale = selectedCustomer
      ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
      : undefined;

    const vehicleDesc = selectedCustomerVehicle
      ? formatVehicleDescription(selectedCustomerVehicle)
      : selectedVehicle.name;

    const newTx: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      receiptNumber: generateReceiptNumber(),
      timestamp: new Date().toISOString(),
      status: 'completed',

      customerId: selectedCustomer?.id,
      customerNameAtSale,
      vehicleId: selectedCustomerVehicle?.id,
      vehicleDescriptionAtSale: vehicleDesc,
      vehicleTypeAtSale: selectedVehicle.name,

      membershipId: activeCustomerMembership?.id,
      membershipPlanName: activeCustomerMembership?.planNameSnapshot,
      isMembershipWash: isMembershipRedeemed,
      membershipDiscount: discountAmount > 0 ? discountAmount : undefined,

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

    // If membership was redeemed and active customer membership exists, decrement wash & record usage
    if (isMembershipRedeemed && activeCustomerMembership && selectedCustomer) {
      const updatedRemaining = Math.max(0, activeCustomerMembership.remainingWashes - 1);
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === activeCustomerMembership.id
            ? { ...m, remainingWashes: updatedRemaining, updatedAt: new Date().toISOString() }
            : m
        )
      );

      const newUsage: MembershipUsage = {
        id: generateUsageId(membershipUsages),
        membershipId: activeCustomerMembership.id,
        customerId: selectedCustomer.id,
        customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        vehicleId: selectedCustomerVehicle?.id,
        vehicleDescription: vehicleDesc,
        transactionId: newTx.id,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: new Date().toISOString(),
        remainingWashes: updatedRemaining,
        discountAmount: discountAmount || selectedService.price,
      };

      setMembershipUsages((prev) => [newUsage, ...prev]);
    }

    setTransactions((prev) => [newTx, ...prev]);

    setActiveReceipt(newTx);
    setIsNewSaleCompletion(true);
    setIsReceiptOpen(true);
  };

  const handleNewSale = () => {
    setIsReceiptOpen(false);
    setActiveReceipt(null);
    setIsNewSaleCompletion(false);
    setIsRedeemingMembershipWash(false);
    handleResetOrder();
  };

  // Membership Handlers
  const handleSelectPlanToJoin = (plan: MembershipPlan) => {
    setSelectedPlanForCheckout(plan);
    setIsMembershipCheckoutOpen(true);
  };

  const handleConfirmMembershipSuccess = (
    newMembership: CustomerMembership,
    newTx: Transaction
  ) => {
    setMemberships((prev) => [newMembership, ...prev]);
    setTransactions((prev) => [newTx, ...prev]);
    setIsMembershipCheckoutOpen(false);
    setSelectedPlanForCheckout(null);

    // If customer is logged in, navigate to dashboard
    if (currentUser?.role === 'customer') {
      setCurrentView('customer_dashboard');
    }
  };

  const handleCancelMembership = (membershipId: string) => {
    setMemberships((prev) =>
      prev.map((m) =>
        m.id === membershipId
          ? {
              ...m,
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const handleSaveMembershipPlan = (plan: MembershipPlan) => {
    setMembershipPlans((prev) => {
      const exists = prev.some((p) => p.id === plan.id);
      if (exists) {
        return prev.map((p) => (p.id === plan.id ? plan : p));
      }
      return [...prev, plan];
    });
  };

  const handleTogglePlanActive = (planId: string) => {
    setMembershipPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, active: !p.active } : p))
    );
  };

  const handleVoidTransaction = (transactionId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Only an Administrator can void transactions.');
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

  const handlePrintReceipt = (tx: Transaction) => {
    setActiveReceipt(tx);
    setIsNewSaleCompletion(false);
    setIsReceiptOpen(true);
  };

  // Find customer object for logged-in customer
  const loggedInCustomerProfile = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') return null;
    return (
      customers.find((c) => c.id === currentUser.customerId) ||
      customers.find((c) => c.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      null
    );
  }, [currentUser, customers]);

  // Find active or latest membership for logged-in customer
  const loggedInCustomerMembership = useMemo(() => {
    if (!currentUser) return null;
    const custId = currentUser.customerId;
    if (!custId) return null;
    return (
      memberships.find((m) => m.customerId === custId && m.status === 'active') ||
      memberships.find((m) => m.customerId === custId) ||
      null
    );
  }, [currentUser, memberships]);

  // ================= VIEW ROUTING =================

  // 1. PUBLIC HOME PAGE
  if (currentView === 'public_home') {
    return (
      <HomePage
        services={settings.services}
        businessInfo={settings.business}
        onNavigateSignUp={() => setCurrentView('customer_signup')}
        onNavigateCustomerLogin={() => setCurrentView('customer_login')}
        onNavigateAdminLogin={() => setCurrentView('admin_login')}
        onNavigateMemberships={() => setCurrentView('memberships')}
      />
    );
  }

  // 2. PUBLIC MEMBERSHIP PLANS PAGE
  if (currentView === 'memberships') {
    return (
      <>
        <MembershipsPage
          membershipPlans={membershipPlans}
          businessInfo={settings.business}
          currentUser={currentUser}
          onNavigateHome={() => setCurrentView('public_home')}
          onNavigateSignUp={() => setCurrentView('customer_signup')}
          onNavigateCustomerLogin={() => setCurrentView('customer_login')}
          onNavigateAdminLogin={() => setCurrentView('admin_login')}
          onSelectPlanToJoin={handleSelectPlanToJoin}
        />

        {/* Membership Checkout Modal */}
        <MembershipCheckoutModal
          plan={selectedPlanForCheckout}
          customer={loggedInCustomerProfile}
          user={currentUser}
          isOpen={isMembershipCheckoutOpen}
          onClose={() => {
            setIsMembershipCheckoutOpen(false);
            setSelectedPlanForCheckout(null);
          }}
          onConfirmSuccess={handleConfirmMembershipSuccess}
          existingMemberships={memberships}
        />
      </>
    );
  }

  // 3. CUSTOMER SIGN UP PAGE
  if (currentView === 'customer_signup') {
    return (
      <CustomerSignUpPage
        onSignUpSuccess={handleCustomerSignUpSuccess}
        onNavigateLogin={() => setCurrentView('customer_login')}
        onNavigateHome={() => setCurrentView('public_home')}
        existingAccounts={accounts}
        existingCustomers={customers}
      />
    );
  }

  // 4. CUSTOMER LOGIN PAGE
  if (currentView === 'customer_login') {
    return (
      <CustomerLoginPage
        onLoginSuccess={handleCustomerLoginSuccess}
        onNavigateSignUp={() => setCurrentView('customer_signup')}
        onNavigateHome={() => setCurrentView('public_home')}
        existingAccounts={accounts}
      />
    );
  }

  // 5. ADMINISTRATION LOGIN (CASHIER & ADMIN)
  if (currentView === 'admin_login') {
    return (
      <AdminLoginPage
        onLoginSuccess={handleAdminLoginSuccess}
        onNavigateHome={() => setCurrentView('public_home')}
        existingAccounts={accounts}
      />
    );
  }

  // 6. CUSTOMER DASHBOARD (AUTHENTICATED CUSTOMER)
  if (currentView === 'customer_dashboard' && currentUser?.role === 'customer') {
    return (
      <>
        <CustomerDashboardPage
          user={currentUser}
          customer={loggedInCustomerProfile}
          vehicles={vehicles}
          transactions={transactions}
          membership={loggedInCustomerMembership}
          membershipUsages={membershipUsages}
          onOpenAddVehicle={() => {
            setEditingVehicleForCustomer(null);
            setIsCustomerAddVehicleModalOpen(true);
          }}
          onOpenEditVehicle={(veh) => {
            setEditingVehicleForCustomer(veh);
            setIsCustomerAddVehicleModalOpen(true);
          }}
          onOpenTransactionReceipt={handlePrintReceipt}
          onNavigateHome={() => setCurrentView('public_home')}
          onNavigateMemberships={() => setCurrentView('memberships')}
          onCancelMembership={handleCancelMembership}
          onLogout={handleLogout}
        />

        {/* Customer's Add/Edit Vehicle Modal */}
        <AddVehicleModal
          isOpen={isCustomerAddVehicleModalOpen}
          onClose={() => {
            setIsCustomerAddVehicleModalOpen(false);
            setEditingVehicleForCustomer(null);
          }}
          onVehicleSaved={handleSaveVehicle}
          customerId={currentUser.customerId}
          customerName={currentUser.name}
          vehicleTypes={settings.vehicleTypes}
          existingVehicles={vehicles}
          vehicleToEdit={editingVehicleForCustomer}
        />

        {/* Membership Checkout Modal */}
        <MembershipCheckoutModal
          plan={selectedPlanForCheckout}
          customer={loggedInCustomerProfile}
          user={currentUser}
          isOpen={isMembershipCheckoutOpen}
          onClose={() => {
            setIsMembershipCheckoutOpen(false);
            setSelectedPlanForCheckout(null);
          }}
          onConfirmSuccess={handleConfirmMembershipSuccess}
          existingMemberships={memberships}
        />

        {/* Receipt Modal for viewing individual receipts */}
        <ReceiptModal
          transaction={activeReceipt}
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setActiveReceipt(null);
          }}
          businessInfo={settings.business}
        />
      </>
    );
  }

  // 6. STAFF APPLICATION (CASHIER & ADMIN POS / LEDGER / SETTINGS)
  const currentRole: UserRole = currentUser?.role === 'admin' ? 'admin' : 'cashier';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
      {/* Top Header with Role Gating and Logout */}
      <Header
        businessName={settings.business.businessName}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        transactionCount={transactions.length}
        customerCount={customers.length}
        membershipCount={memberships.filter((m) => m.status === 'active').length}
        taxRate={settings.taxRate}
        userRole={currentRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentView('public_home')}
      />

      {/* Main Content Area */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          /* Main POS Screen: New Wash (Full functional existing POS) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: POS Selections (8 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Customer & Vehicle Selection Section */}
              <CustomerPOSSection
                selectedCustomer={selectedCustomer}
                selectedCustomerVehicle={selectedCustomerVehicle}
                customerVehicles={currentCustomerVehicles}
                activeMembership={activeCustomerMembership}
                onOpenFindCustomer={() => setIsFindCustomerModalOpen(true)}
                onOpenNewCustomer={() => setIsAddCustomerModalOpen(true)}
                onOpenAddVehicle={() => setIsAddVehicleModalOpen(true)}
                onSelectCustomerVehicle={handleSelectCustomerVehicle}
                onClearCustomer={() => {
                  setSelectedCustomer(null);
                  setSelectedCustomerVehicle(null);
                }}
                onClearCustomerVehicle={() => setSelectedCustomerVehicle(null)}
                vehicleTypes={settings.vehicleTypes}
              />

              {/* Step 1: Services */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
                <ServiceSelector
                  services={activeWashServices}
                  selectedServiceId={selectedService.id}
                  onSelectService={(service) => setSelectedServiceId(service.id)}
                />
              </div>

              {/* Step 2: Vehicle Type */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
                <VehicleSelector
                  vehicleTypes={activeVehicleTypes}
                  selectedVehicleId={selectedVehicle.id}
                  onSelectVehicle={(vehicle) => {
                    setSelectedVehicleId(vehicle.id);
                  }}
                />
              </div>

              {/* Step 3: Add-ons */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
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
                selectedCustomer={selectedCustomer}
                selectedCustomerVehicle={selectedCustomerVehicle}
                activeMembership={activeCustomerMembership}
                isRedeemingMembershipWash={isRedeemingMembershipWash}
                onToggleRedeemMembershipWash={(redeem) => setIsRedeemingMembershipWash(redeem)}
                taxRate={settings.taxRate}
                paymentMethod={paymentMethod}
                onSelectPaymentMethod={(method) => setPaymentMethod(method)}
                onCompleteSale={handleCompleteSale}
                onResetOrder={handleResetOrder}
              />
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          /* Customers Directory Screen */
          <CustomersPage
            customers={customers}
            vehicles={vehicles}
            transactions={transactions}
            memberships={memberships}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onSaveVehicle={handleSaveVehicle}
            onToggleVehicleActive={handleToggleVehicleActive}
            onOpenTransactionDetails={(tx) => setInspectingTransaction(tx)}
            onStartNewWashWithCustomer={handleStartNewWashWithCustomer}
            userRole={currentRole}
            vehicleTypes={settings.vehicleTypes}
          />
        )}

        {activeTab === 'memberships' && currentRole === 'admin' && (
          /* Admin Memberships Management Screen */
          <MembershipManagementSection
            plans={membershipPlans}
            memberships={memberships}
            usages={membershipUsages}
            services={settings.services}
            onSavePlan={handleSaveMembershipPlan}
            onTogglePlanActive={handleTogglePlanActive}
            onCancelMembership={handleCancelMembership}
          />
        )}

        {activeTab === 'transactions' && (
          /* Transactions Screen */
          <TransactionsPage
            transactions={transactions}
            onVoidTransaction={handleVoidTransaction}
            onPrintReceipt={handlePrintReceipt}
            onStartNewWash={() => setActiveTab('pos')}
            userRole={currentRole}
          />
        )}

        {activeTab === 'settings' && currentRole === 'admin' && (
          /* Settings Screen (Admin only) */
          <SettingsPage
            settings={settings}
            transactions={transactions}
            onSaveBusinessInfo={handleSaveBusinessInfo}
            onSaveServices={handleSaveServices}
            onSaveVehicleTypes={handleSaveVehicleTypes}
            onSaveTaxRate={handleSaveTaxRate}
            membershipPlans={membershipPlans}
            memberships={memberships}
            membershipUsages={membershipUsages}
            onSaveMembershipPlan={handleSaveMembershipPlan}
            onTogglePlanActive={handleTogglePlanActive}
            onCancelMembership={handleCancelMembership}
          />
        )}
      </main>

      {/* Find Customer Modal */}
      <FindCustomerModal
        isOpen={isFindCustomerModalOpen}
        onClose={() => setIsFindCustomerModalOpen(false)}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
        }}
        onOpenNewCustomer={() => {
          setIsAddCustomerModalOpen(true);
        }}
        customers={customers}
        vehicles={vehicles}
        memberships={memberships}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onCustomerCreated={(newCust) => {
          handleAddCustomer(newCust);
          setSelectedCustomer(newCust);
        }}
        onSelectExistingCustomer={(existingCust) => {
          setSelectedCustomer(existingCust);
        }}
        existingCustomers={customers}
      />

      {/* Add Vehicle Modal from POS */}
      <AddVehicleModal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        onVehicleSaved={handleSaveVehicle}
        customerId={selectedCustomer?.id}
        customerName={
          selectedCustomer
            ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
            : undefined
        }
        vehicleTypes={settings.vehicleTypes}
        existingVehicles={vehicles}
      />

      {/* Transaction Details Inspector Modal */}
      <TransactionDetailsModal
        transaction={inspectingTransaction}
        isOpen={!!inspectingTransaction}
        onClose={() => setInspectingTransaction(null)}
        onPrintReceipt={(tx) => {
          setInspectingTransaction(null);
          handlePrintReceipt(tx);
        }}
        onVoidTransaction={handleVoidTransaction}
        userRole={currentRole}
      />

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
