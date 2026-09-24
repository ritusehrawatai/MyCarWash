import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { POSServiceItem, ServiceType } from '../../types/pos';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: POSServiceItem) => void;
  serviceToEdit?: POSServiceItem | null;
  existingServices: POSServiceItem[];
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
  existingServices,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ServiceType>('wash');
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setPrice(serviceToEdit.price.toString());
      setType(serviceToEdit.type);
      setActive(serviceToEdit.active);
      setDescription(serviceToEdit.description || '');
      setBadge(serviceToEdit.badge || '');
    } else {
      setName('');
      setPrice('');
      setType('wash');
      setActive(true);
      setDescription('');
      setBadge('');
    }
    setError(null);
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Service name cannot be empty.');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    // Check duplicate name (case-insensitive, excluding current editing item)
    const duplicate = existingServices.some(
      (s) =>
        s.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!serviceToEdit || s.id !== serviceToEdit.id)
    );

    if (duplicate) {
      setError(`A service named "${trimmedName}" already exists.`);
      return;
    }

    const serviceData: POSServiceItem = {
      id: serviceToEdit ? serviceToEdit.id : `srv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      price: Math.round(parsedPrice * 100) / 100,
      type,
      active,
      description: description.trim() || undefined,
      badge: badge.trim() || undefined,
      features: serviceToEdit?.features,
    };

    onSave(serviceData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {serviceToEdit ? 'Edit Service' : 'Add New Service'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Service Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('wash')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  type === 'wash'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Wash Package
              </button>
              <button
                type="button"
                onClick={() => setType('addon')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  type === 'addon'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Optional Add-on
              </button>
            </div>
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deluxe Wash or Ceramic Coating"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Price ($ USD) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-700 mt-1">
              Prices cannot be negative. Old transactions will preserve original charged prices.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Foam wash, power rinse, spot-free dry"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Badge (only for wash) */}
          {type === 'wash' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Badge Label (Optional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Popular or Best Value"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Active in POS</span>
              <span className="text-[11px] text-slate-700">
                Inactive services will not appear as options on the New Wash screen.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                active ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{serviceToEdit ? 'Save Changes' : 'Create Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
