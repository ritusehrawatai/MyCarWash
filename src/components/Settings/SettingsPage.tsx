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
} from '../../types/pos';
import { formatCurrency } from '../../data/constants';
import { ServiceModal } from './ServiceModal';
import { VehicleModal } from './VehicleModal';

interface SettingsPageProps {
  settings: POSSettings;
  transactions: Transaction[];
  onSaveBusinessInfo: (info: BusinessInfo) => void;
  onSaveServices: (services: POSServiceItem[]) => void;
  onSaveVehicleTypes: (vehicleTypes: POSVehicleType[]) => void;
  onSaveTaxRate: (rate: number) => void;
}

type SettingsSubTab = 'all' | 'business' | 'services' | 'vehicles' | 'tax';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  transactions,
  onSaveBusinessInfo,
  onSaveServices,
  onSaveVehicleTypes,
  onSaveTaxRate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('all');

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
      setBusinessErrorMsg('Business name cannot be empty.');
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
    setBusinessSuccessMsg('Business information saved successfully! Future receipts will use these details.');
    setTimeout(() => setBusinessSuccessMsg(null), 4000);
  };

  // Save Tax Rate
  const handleTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTaxErrorMsg(null);
    setTaxSuccessMsg(null);

    const parsed = parseFloat(taxRateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setTaxErrorMsg('Tax rate must be a valid number between 0% and 100%.');
      return;
    }

    const newRate = parsed / 100;
    onSaveTaxRate(newRate);
    setTaxSuccessMsg(`Tax rate updated to ${parsed.toFixed(2)}%! New sales will calculate with this rate.`);
    setTimeout(() => setTaxSuccessMsg(null), 4000);
  };

  // Service Management Handlers
  const handleToggleServiceActive = (service: POSServiceItem) => {
    const updated = settings.services.map((s) =>
      s.id === service.id ? { ...s, active: !s.active } : s
    );
    onSaveServices(updated);
    showActionNotice(
      `"${service.name}" ${!service.active ? 'activated' : 'deactivated'}. ${
        !service.active ? 'Now available on New Wash' : 'Hidden from New Wash options'
      }.`
    );
  };

  const handleSaveService = (serviceData: POSServiceItem) => {
    const exists = settings.services.some((s) => s.id === serviceData.id);
    let updated: POSServiceItem[];
    if (exists) {
      updated = settings.services.map((s) => (s.id === serviceData.id ? serviceData : s));
      showActionNotice(`Service "${serviceData.name}" updated successfully!`);
    } else {
      updated = [...settings.services, serviceData];
      showActionNotice(`New service "${serviceData.name}" created!`);
    }
    onSaveServices(updated);
  };

  const handleDeleteService = (service: POSServiceItem) => {
    if (isServiceUsedInTransactions(service)) {
      alert(
        `Cannot delete "${service.name}" because it was used in past transactions. Please deactivate it instead so historical records are preserved.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete "${service.name}"?`)) {
      const updated = settings.services.filter((s) => s.id !== service.id);
      onSaveServices(updated);
      showActionNotice(`Service "${service.name}" was deleted.`);
    }
  };

  // Vehicle Management Handlers
  const handleToggleVehicleActive = (vehicle: POSVehicleType) => {
    const updated = settings.vehicleTypes.map((v) =>
      v.id === vehicle.id ? { ...v, active: !v.active } : v
    );
    onSaveVehicleTypes(updated);
    showActionNotice(
      `Vehicle "${vehicle.name}" ${!vehicle.active ? 'activated' : 'deactivated'}.`
    );
  };

  const handleSaveVehicle = (vehicleData: POSVehicleType) => {
    const exists = settings.vehicleTypes.some((v) => v.id === vehicleData.id);
    let updated: POSVehicleType[];
    if (exists) {
      updated = settings.vehicleTypes.map((v) => (v.id === vehicleData.id ? vehicleData : v));
      showActionNotice(`Vehicle type "${vehicleData.name}" updated successfully!`);
    } else {
      updated = [...settings.vehicleTypes, vehicleData];
      showActionNotice(`New vehicle type "${vehicleData.name}" added!`);
    }
    onSaveVehicleTypes(updated);
  };

  const handleDeleteVehicle = (vehicle: POSVehicleType) => {
    if (isVehicleUsedInTransactions(vehicle)) {
      alert(
        `Cannot delete "${vehicle.name}" because it has been used in past transactions. Please deactivate it instead.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete vehicle type "${vehicle.name}"?`)) {
      const updated = settings.vehicleTypes.filter((v) => v.id !== vehicle.id);
      onSaveVehicleTypes(updated);
      showActionNotice(`Vehicle type "${vehicle.name}" deleted.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>POS Administration & Settings</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Configure business information, services, vehicle surcharges, receipt text, and sales tax.
          </p>
        </div>

        {/* Section Jump Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            All Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('business')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'business'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Business & Receipt
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('services')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'services'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Services & Prices
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vehicles')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'vehicles'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Vehicle Types
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tax')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeSubTab === 'tax'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Tax Rate
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 1. Business Information & Receipt Settings */}
      {(activeSubTab === 'all' || activeSubTab === 'business') && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Business Information</h3>
                <p className="text-xs text-slate-600">
                  Update business name, address, contact details, and receipt message.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg hidden sm:inline">
              Printed on Receipts
            </span>
          </div>

          {businessSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{businessSuccessMsg}</span>
            </div>
          )}

          {businessErrorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{businessErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form onSubmit={handleBusinessSubmit} className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Business Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. My Car Wash or ABC Express Car Wash"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-700 mt-1">
                    Displays at the top of the POS screen and on every printed receipt.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Store Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main Street"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Customer Service Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@mycarwash.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Receipt Footer */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Receipt Footer Note
                  </label>
                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="e.g. Thank you for visiting! Drive safe & shine bright."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-700 mt-1">
                    Custom greeting or thank-you note printed at the bottom of customer receipts.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

            {/* Live Receipt Preview Card */}
            <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-500 font-sans">
                <span className="font-bold flex items-center gap-1 text-xs">
                  <Receipt className="w-3.5 h-3.5" /> Live Receipt Preview
                </span>
                <span className="text-[10px] uppercase">Thermal 80mm</span>
              </div>

              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <p className="font-bold text-xs uppercase font-sans text-slate-900">
                  {businessName || 'Business Name'}
                </p>
                <p className="text-[10px] text-slate-600">{address || '123 Main Street'}</p>
                <p className="text-[10px] text-slate-600">Tel: {phone || '(555) 123-4567'}</p>
              </div>

              <div className="py-1 border-b border-dashed border-slate-300 space-y-1 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>Sample Wash:</span>
                  <span className="font-bold text-slate-900">$20.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal / Tax:</span>
                  <span>$20.00 / $1.65</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                  <span>TOTAL:</span>
                  <span>$21.65</span>
                </div>
              </div>

              <div className="text-center pt-1 text-[10px] text-slate-600 font-sans">
                <p className="font-medium italic">
                  "{receiptFooter || 'Thank you for visiting!'}"
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Services & Prices */}
      {(activeSubTab === 'all' || activeSubTab === 'services') && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Services & Prices</h3>
                <p className="text-xs text-slate-600">
                  Manage wash packages and optional add-on extras. Adjust pricing, activate, or add new services.
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
              <span>Add Service</span>
            </button>
          </div>

          {/* Wash Services Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Wash Packages ({washServices.length})</span>
              </h4>
              <span className="text-[11px] text-slate-700">
                Active packages show on the New Wash screen
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Service Name</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {washServices.map((service) => {
                    const isUsed = isServiceUsedInTransactions(service);
                    return (
                      <tr
                        key={service.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          !service.active ? 'bg-slate-50/40 text-slate-600' : 'text-slate-800'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{service.name}</span>
                            {service.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-semibold uppercase">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-[11px] text-slate-700 font-normal mt-0.5">
                              {service.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-slate-900">
                          {formatCurrency(service.price)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Wash Package
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(service)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              service.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title={service.active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {service.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setServiceToEdit(service);
                              setIsServiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit service details & price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isUsed ? (
                            <span
                              className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                              title="Used in past transactions. Historical record protected; deactivate instead."
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(service)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete service"
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Optional Add-ons ({addOnServices.length})</span>
              </h4>
              <span className="text-[11px] text-slate-700">
                Multi-select extras available at checkout
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Add-on Name</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {addOnServices.map((addon) => {
                    const isUsed = isServiceUsedInTransactions(addon);
                    return (
                      <tr
                        key={addon.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          !addon.active ? 'bg-slate-50/40 text-slate-600' : 'text-slate-800'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <span>{addon.name}</span>
                          {addon.description && (
                            <p className="text-[11px] text-slate-700 font-normal mt-0.5">
                              {addon.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-sm text-slate-900">
                          {formatCurrency(addon.price)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            Add-on
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleServiceActive(addon)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              addon.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title={addon.active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {addon.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setServiceToEdit(addon);
                              setIsServiceModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit addon price & details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isUsed ? (
                            <span
                              className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                              title="Used in past transactions. Deactivate instead of deleting."
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(addon)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete addon"
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
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Vehicle Types & Surcharges</h3>
                <p className="text-xs text-slate-600">
                  Configure vehicle classifications and oversize surcharges (e.g. SUV/Truck +$5.00).
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
              <span>Add Vehicle Type</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-4">Vehicle Type</th>
                  <th className="py-2.5 px-4">Surcharge</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.vehicleTypes.map((vehicle) => {
                  const isUsed = isVehicleUsedInTransactions(vehicle);
                  return (
                    <tr
                      key={vehicle.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !vehicle.active ? 'bg-slate-50/40 text-slate-600' : 'text-slate-800'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {vehicle.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        {vehicle.surcharge > 0 ? (
                          <span className="text-amber-700 font-extrabold">
                            +{formatCurrency(vehicle.surcharge)}
                          </span>
                        ) : (
                          <span className="text-slate-700">$0.00 (Standard)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {vehicle.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVehicleActive(vehicle)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            vehicle.active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {vehicle.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setVehicleToEdit(vehicle);
                            setIsVehicleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit surcharge & details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {isUsed ? (
                          <span
                            className="inline-block p-1.5 text-slate-500 cursor-not-allowed"
                            title="Used in past transactions. Deactivate instead of deleting."
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(vehicle)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete vehicle type"
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
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sales Tax Settings</h3>
                <p className="text-xs text-slate-600">
                  Configure the default tax percentage applied to all walk-in services and add-ons.
                </p>
              </div>
            </div>
          </div>

          {taxSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{taxSuccessMsg}</span>
            </div>
          )}

          {taxErrorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{taxErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <form onSubmit={handleTaxSubmit} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tax Rate (%) <span className="text-rose-500">*</span>
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-600 text-sm">
                      %
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Tax Rate</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Quick Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {[0, 5, 7.5, 8.25, 9.5, 10].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRateInput(rate.toString())}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        parseFloat(taxRateInput) === rate
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-700 flex items-start gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                <span>
                  Past transactions preserve the exact tax amount recorded at the time of sale. Changing the tax rate here will only apply to new sales created going forward.
                </span>
              </p>
            </form>

            {/* Calculation Example Box */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-700 font-sans">
                <span className="font-bold text-xs">Live Calculation Example</span>
                <span className="text-[10px]">Tax: {(sampleTaxRate * 100).toFixed(2)}%</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>Sample Subtotal:</span>
                  <span>{formatCurrency(sampleSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Calculated Tax:</span>
                  <span>{formatCurrency(sampleTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-xs">
                  <span>Sample Total:</span>
                  <span className="text-blue-600 font-extrabold">{formatCurrency(sampleTotal)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 font-sans italic pt-1">
                Rounded to 2 decimal places.
              </p>
            </div>
          </div>
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
