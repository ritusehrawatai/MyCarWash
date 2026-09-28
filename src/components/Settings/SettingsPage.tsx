import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  Car,
  Percent,
  Check,
  Plus,
  Edit2,
  Trash2,
  Ban,
  Receipt,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  POSSettings,
  BusinessInfo,
  POSServiceItem,
  POSVehicleType,
  Transaction,
  MembershipPlan,
  CustomerMembership,
  MembershipUsage,
} from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { ServiceModal } from './ServiceModal';
import { VehicleModal } from './VehicleModal';
import { MembershipManagementSection } from '../Admin/MembershipManagementSection';
import { useLanguage } from '../../context/LanguageContext';

interface SettingsPageProps {
  settings: POSSettings;
  transactions: Transaction[];
  onSaveBusinessInfo: (info: BusinessInfo) => void;
  onSaveServices: (services: POSServiceItem[]) => void;
  onSaveVehicleTypes: (vehicleTypes: POSVehicleType[]) => void;
  onSaveTaxRate: (rate: number) => void;
  membershipPlans?: MembershipPlan[];
  memberships?: CustomerMembership[];
  membershipUsages?: MembershipUsage[];
  onSaveMembershipPlan?: (plan: MembershipPlan) => void;
  onTogglePlanActive?: (planId: string) => void;
  onCancelMembership?: (membershipId: string) => void;
  initialSubTab?: SettingsSubTab;
}

type SettingsSubTab = 'all' | 'business' | 'services' | 'vehicles' | 'tax' | 'memberships';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  transactions,
  onSaveBusinessInfo,
  onSaveServices,
  onSaveVehicleTypes,
  onSaveTaxRate,
  membershipPlans = [],
  memberships = [],
  membershipUsages = [],
  onSaveMembershipPlan,
  onTogglePlanActive,
  onCancelMembership,
  initialSubTab = 'all',
}) => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  // Business info form state
  const [businessName, setBusinessName] = useState(settings.business.businessName);
  const [address, setAddress] = useState(settings.business.address);
  const [phone, setPhone] = useState(settings.business.phone);
  const [email, setEmail] = useState(settings.business.email);
  const [receiptFooter, setReceiptFooter] = useState(settings.business.receiptFooter);
  const [businessSuccessMsg, setBusinessSuccessMsg] = useState<string | null>(null);
  const [businessErrorMsg, setBusinessErrorMsg] = useState<string | null>(null);

  // Tax rate form state
  const [taxRateInput, setTaxRateInput] = useState((settings.taxRate * 100).toString());
  const [taxSuccessMsg, setTaxSuccessMsg] = useState<string | null>(null);
  const [taxErrorMsg, setTaxErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<POSServiceItem | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<POSVehicleType | null>(null);

  // Notification state for services/vehicles
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showActionNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Helper to check if a service is used in historical transactions
  const isServiceUsedInTransactions = (service: POSServiceItem) => {
    return transactions.some((tx) => {
      if (service.type === 'wash') {
        return tx.service.id === service.id || tx.service.name === service.name;
      } else {
        return tx.addOns.some((a) => a.id === service.id || a.name === service.name);
      }
    });
  };

  // Helper to check if a vehicle type is used in historical transactions
  const isVehicleUsedInTransactions = (vehicle: POSVehicleType) => {
    return transactions.some(
      (tx) => tx.vehicleType.id === vehicle.id || tx.vehicleType.name === vehicle.name
    );
  };

  // Save Business Info
  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessErrorMsg(null);
    setBusinessSuccessMsg(null);

    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setBusinessErrorMsg(t('settings.businessNameRequiredError'));
      return;
    }

    const updatedInfo: BusinessInfo = {
      businessName: trimmedName,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      receiptFooter: receiptFooter.trim(),
    };

    onSaveBusinessInfo(updatedInfo);
    setBusinessSuccessMsg(t('settings.futureReceiptsNote'));
    setTimeout(() => setBusinessSuccessMsg(null), 4000);
  };

  // Save Tax Rate
  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTaxErrorMsg(null);
    setTaxSuccessMsg(null);

    const parsed = parseFloat(taxRateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setTaxErrorMsg(t('settings.taxRateBetweenZeroAndHundred'));
      return;
    }

    const newRate = parsed / 100;
    onSaveTaxRate(newRate);
    setTaxSuccessMsg(t('settings.taxUpdatedSuccess', { rate: parsed.toFixed(2) }));
    setTimeout(() => setTaxSuccessMsg(null), 4000);
  };

  // Service Management Handlers
  const handleToggleServiceActive = (service: POSServiceItem) => {
    const updated = settings.services.map((s) =>
      s.id === service.id ? { ...s, active: !s.active } : s
    );
    onSaveServices(updated);
    showActionNotice(
      !service.active
        ? t('settings.serviceActivated', { name: service.name })
        : t('settings.serviceDeactivated', { name: service.name })
    );
  };

  const handleSaveService = (serviceData: POSServiceItem) => {
    const exists = settings.services.some((s) => s.id === serviceData.id);
    let updated: POSServiceItem[];
    if (exists) {
      updated = settings.services.map((s) => (s.id === serviceData.id ? serviceData : s));
      showActionNotice(t('settings.serviceUpdatedSuccess', { name: serviceData.name }));
    } else {
      updated = [...settings.services, serviceData];
      showActionNotice(t('settings.serviceCreatedSuccess', { name: serviceData.name }));
    }
    onSaveServices(updated);
  };

  const handleDeleteService = (service: POSServiceItem) => {
    if (isServiceUsedInTransactions(service)) {
      alert(t('settings.cannotDeleteServiceHistory', { name: service.name }));
      return;
    }

    if (window.confirm(t('settings.confirmDeleteServicePrompt', { name: service.name }))) {
      const updated = settings.services.filter((s) => s.id !== service.id);
      onSaveServices(updated);
      showActionNotice(t('settings.serviceDeletedSuccess', { name: service.name }));
    }
  };

  // Vehicle Management Handlers
  const handleToggleVehicleActive = (vehicle: POSVehicleType) => {
    const updated = settings.vehicleTypes.map((v) =>
      v.id === vehicle.id ? { ...v, active: !v.active } : v
    );
    onSaveVehicleTypes(updated);
    showActionNotice(
      !vehicle.active
        ? t('settings.vehicleActivated', { name: vehicle.name })
        : t('settings.vehicleDeactivated', { name: vehicle.name })
    );
  };

  const handleSaveVehicle = (vehicleData: POSVehicleType) => {
    const exists = settings.vehicleTypes.some((v) => v.id === vehicleData.id);
    let updated: POSVehicleType[];
    if (exists) {
      updated = settings.vehicleTypes.map((v) => (v.id === vehicleData.id ? vehicleData : v));
      showActionNotice(t('settings.vehicleUpdatedSuccess', { name: vehicleData.name }));
    } else {
      updated = [...settings.vehicleTypes, vehicleData];
      showActionNotice(t('settings.vehicleCreatedSuccess', { name: vehicleData.name }));
    }
    onSaveVehicleTypes(updated);
  };

  const handleDeleteVehicle = (vehicle: POSVehicleType) => {
    if (isVehicleUsedInTransactions(vehicle)) {
      alert(t('settings.cannotDeleteVehicleHistory', { name: vehicle.name }));
      return;
    }

    if (window.confirm(t('settings.confirmDeleteVehiclePrompt', { name: vehicle.name }))) {
      const updated = settings.vehicleTypes.filter((v) => v.id !== vehicle.id);
      onSaveVehicleTypes(updated);
      showActionNotice(t('settings.vehicleDeletedSuccess', { name: vehicle.name }));
    }
  };

  // Tax math calculation example
  const parsedTax = parseFloat(taxRateInput);
  const sampleTaxRate = isNaN(parsedTax) || parsedTax < 0 ? 0 : parsedTax / 100;
  const sampleSubtotal = 25.0;
  const sampleTax = Math.round(sampleSubtotal * sampleTaxRate * 100) / 100;
  const sampleTotal = sampleSubtotal + sampleTax;

  const washServices = settings.services.filter((s) => s.type === 'wash');
  const addOnServices = settings.services.filter((s) => s.type === 'addon');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>{t('settings.pageTitle')}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {t('settings.pageSubtitle')}
          </p>
        </div>

        {/* Section Jump Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.tabAll')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('business')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'business'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.businessAndReceiptTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('services')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'services'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.servicesAndPricesTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vehicles')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'vehicles'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.vehiclesTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tax')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'tax'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.taxRateTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('memberships')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'memberships'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('settings.tabMemberships')}
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Business Information & Receipt Settings */}
      {(activeSubTab === 'all' || activeSubTab === 'business') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.tabBusiness')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('settings.pageSubtitle')}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hidden sm:inline">
              {t('settings.printedOnReceipts')}
            </span>
          </div>

          {businessSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{businessSuccessMsg}</span>
            </div>
          )}

          {businessErrorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{businessErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleBusinessSubmit} className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t('settings.businessNameLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. My Car Wash or ABC Express Car Wash"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-1">
                    {t('settings.businessNameHelp')}
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t('settings.storeAddressLabel')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main Street"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t('settings.phoneLabel')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t('settings.customerServiceEmailLabel')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@mycarwash.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Receipt Footer */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t('settings.receiptFooterNoteLabel')}
                  </label>
                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="e.g. Thank you for visiting! Drive safe & shine bright."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-1">
                    {t('settings.receiptFooterHelp')}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('common.saveChanges')}</span>
                </button>
              </div>
            </form>

            {/* Live Receipt Preview Card */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-sans">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <Receipt className="w-3.5 h-3.5" /> {t('settings.liveReceiptPreview')}
                </span>
                <span className="text-[10px] uppercase">{t('settings.thermal80mm')}</span>
              </div>

              <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-0.5">
                <p className="font-bold text-xs uppercase font-sans text-slate-900 dark:text-white">
                  {businessName || 'Business Name'}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">{address || '123 Main Street'}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Tel: {phone || '(555) 123-4567'}</p>
              </div>

              <div className="py-1 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>{t('settings.sampleWash')}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">$20.00</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settings.sampleSubtotalTax')}:</span>
                  <span>$20.00 / $1.65</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-0.5">
                  <span>{t('common.total')}:</span>
                  <span>$21.65</span>
                </div>
              </div>

              <div className="text-center pt-1 text-[10px] text-slate-600 dark:text-slate-400 font-sans">
                <p className="font-medium italic">
                  "{receiptFooter || t('receipt.thankYou')}"
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Services & Prices */}
      {(activeSubTab === 'all' || activeSubTab === 'services') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.servicesAndPricesTab')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('settings.servicesSubtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setServiceToEdit(null);
                setIsServiceModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('settings.addService')}</span>
            </button>
          </div>

          {/* Wash Services Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{t('settings.washPackagesCount', { count: washServices.length })}</span>
              </h4>
              <span className="text-[11px] text-slate-700 dark:text-slate-400">
                {t('settings.activePackagesNotice')}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">{t('settings.serviceNameLabel')}</th>
                    <th className="py-2.5 px-4">{t('common.price')}</th>
                    <th className="py-2.5 px-3">{t('settings.serviceTypeLabel')}</th>
                    <th className="py-2.5 px-3 text-center">{t('common.status')}</th>
                    <th className="py-2.5 px-4 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {washServices.map((service) => {
                    const isUsed = isServiceUsedInTransactions(service);
                    return (
                      <tr
                        key={service.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors ${
                          !service.active ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{service.name}</span>
                            {service.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-semibold uppercase">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-[11px] text-slate-700 dark:text-slate-400 font-normal mt-0.5">
                              {service.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(service.price)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {t('settings.washPackage')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(service)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              service.active
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                            title={service.active ? t('settings.clickToDeactivate') : t('settings.clickToActivate')}
                          >
                            {service.active ? t('common.active') : t('common.inactive')}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setServiceToEdit(service);
                              setIsServiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title={t('settings.editServiceDetails')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isUsed ? (
                            <span
                              className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                              title={t('settings.usedInPastTransactionsDeactivate')}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(service)}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title={t('settings.deleteService')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add-on Services Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{t('settings.optionalAddonsTitle', { count: addOnServices.length })}</span>
              </h4>
              <span className="text-[11px] text-slate-700 dark:text-slate-400">
                {t('settings.multiSelectExtrasNotice')}
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">{t('settings.serviceNameLabel')}</th>
                    <th className="py-2.5 px-4">{t('common.price')}</th>
                    <th className="py-2.5 px-3">{t('settings.serviceTypeLabel')}</th>
                    <th className="py-2.5 px-3 text-center">{t('common.status')}</th>
                    <th className="py-2.5 px-4 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {addOnServices.map((addon) => {
                    const isUsed = isServiceUsedInTransactions(addon);
                    return (
                      <tr
                        key={addon.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors ${
                          !addon.active ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <span>{addon.name}</span>
                          {addon.description && (
                            <p className="text-[11px] text-slate-700 dark:text-slate-400 font-normal mt-0.5">
                              {addon.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(addon.price)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded">
                            {t('settings.addonExtra')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(addon)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              addon.active
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                            title={addon.active ? t('settings.clickToDeactivate') : t('settings.clickToActivate')}
                          >
                            {addon.active ? t('common.active') : t('common.inactive')}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setServiceToEdit(addon);
                              setIsServiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title={t('settings.editAddonDetails')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isUsed ? (
                            <span
                              className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                              title={t('settings.usedInPastTransactionsDeactivate')}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(addon)}
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title={t('settings.deleteAddon')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 3. Vehicle Surcharges */}
      {(activeSubTab === 'all' || activeSubTab === 'vehicles') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.vehiclesTitle')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('settings.vehiclesSubtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setVehicleToEdit(null);
                setIsVehicleModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('settings.addVehicleType')}</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-4">{t('settings.vehicleTypeNameLabel')}</th>
                  <th className="py-2.5 px-4">{t('settings.surchargeCol')}</th>
                  <th className="py-2.5 px-3">{t('common.description')}</th>
                  <th className="py-2.5 px-3 text-center">{t('common.status')}</th>
                  <th className="py-2.5 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {settings.vehicleTypes.map((vehicle) => {
                  const isUsed = isVehicleUsedInTransactions(vehicle);
                  return (
                    <tr
                      key={vehicle.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors ${
                        !vehicle.active ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {vehicle.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        {vehicle.surcharge > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                            +{formatCurrency(vehicle.surcharge)}
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">{t('settings.standardSurcharge')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {vehicle.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleActive(vehicle)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            vehicle.active
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                          title={vehicle.active ? t('settings.clickToDeactivate') : t('settings.clickToActivate')}
                        >
                          {vehicle.active ? t('common.active') : t('common.inactive')}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setVehicleToEdit(vehicle);
                            setIsVehicleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                          title={t('settings.editVehicleDetails')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isUsed ? (
                          <span
                            className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                            title={t('settings.usedInPastTransactionsDeactivate')}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(vehicle)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title={t('settings.deleteVehicleType')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Tax Settings */}
      {(activeSubTab === 'all' || activeSubTab === 'tax') && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('settings.tabTax')}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('settings.taxSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {taxSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{taxSuccessMsg}</span>
            </div>
          )}

          {taxErrorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{taxErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <form onSubmit={handleTaxSubmit} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('settings.taxRateLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={taxRateInput}
                      onChange={(e) => setTaxRateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-600 dark:text-slate-400 text-sm">
                      %
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('settings.saveTaxRate')}</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  {t('settings.quickPresets')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 7.5, 8.25, 9.5, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRateInput(rate.toString())}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        parseFloat(taxRateInput) === rate
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-700 dark:text-slate-400 flex items-start gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {t('settings.pastTransactionsTaxNotice')}
                </span>
              </p>
            </form>

            {/* Calculation Example Box */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-sans">
                <span className="font-bold text-xs">{t('settings.liveCalculationExample')}</span>
                <span className="text-[10px]">{t('common.tax')}: {(sampleTaxRate * 100).toFixed(2)}%</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>{t('settings.sampleWash')}:</span>
                  <span>{formatCurrency(sampleSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>{t('common.tax')}:</span>
                  <span>{formatCurrency(sampleTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span>{t('common.total')}:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold">{formatCurrency(sampleTotal)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans italic pt-1">
                {t('settings.roundedDecimalsNotice')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. Membership Management Section */}
      {(activeSubTab === 'all' || activeSubTab === 'memberships') && (
        <section className="pt-2">
          <MembershipManagementSection
            plans={membershipPlans}
            memberships={memberships}
            usages={membershipUsages}
            services={settings.services}
            onSavePlan={onSaveMembershipPlan || (() => {})}
            onTogglePlanActive={onTogglePlanActive || (() => {})}
            onCancelMembership={onCancelMembership || (() => {})}
          />
        </section>
      )}

      {/* Service Modal for Add/Edit */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceToEdit(null);
        }}
        onSave={handleSaveService}
        serviceToEdit={serviceToEdit}
        existingServices={settings.services}
      />

      {/* Vehicle Modal for Add/Edit */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={handleSaveVehicle}
        vehicleToEdit={vehicleToEdit}
        existingVehicles={settings.vehicleTypes}
      />
    </div>
  );
};
