import React, { useState, useEffect } from 'react';
import { X, Check, Car } from 'lucide-react';
import { POSVehicleType } from '../../types/pos';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: POSVehicleType) => void;
  vehicleToEdit?: POSVehicleType | null;
  existingVehicles: POSVehicleType[];
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleToEdit,
  existingVehicles,
}) => {
  const [name, setName] = useState('');
  const [surcharge, setSurcharge] = useState('');
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicleToEdit) {
      setName(vehicleToEdit.name);
      setSurcharge(vehicleToEdit.surcharge.toString());
      setActive(vehicleToEdit.active);
      setDescription(vehicleToEdit.description || '');
    } else {
      setName('');
      setSurcharge('0');
      setActive(true);
      setDescription('');
    }
    setError(null);
  }, [vehicleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vehicle type name cannot be empty.');
      return;
    }

    const parsedSurcharge = parseFloat(surcharge);
    if (isNaN(parsedSurcharge) || parsedSurcharge < 0) {
      setError('Surcharge must be a valid non-negative number ($0 or greater).');
      return;
    }

    // Check duplicate name
    const duplicate = existingVehicles.some(
      (v) =>
        v.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!vehicleToEdit || v.id !== vehicleToEdit.id)
    );

    if (duplicate) {
      setError(`A vehicle type named "${trimmedName}" already exists.`);
      return;
    }

    const vehicleData: POSVehicleType = {
      id: vehicleToEdit
        ? vehicleToEdit.id
        : `veh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      surcharge: Math.round(parsedSurcharge * 100) / 100,
      active,
      description: description.trim() || undefined,
    };

    onSave(vehicleData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {vehicleToEdit ? 'Edit Vehicle Type' : 'Add Vehicle Type'}
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

          {/* Vehicle Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Vehicle Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Car, SUV/Truck, Van, Motorcycle"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Surcharge */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Surcharge ($ USD) <span className="text-rose-500">*</span>
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
                value={surcharge}
                onChange={(e) => setSurcharge(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-700 mt-1">
              Enter 0 for no surcharge (e.g. standard car). Enter extra amount for oversize vehicles.
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
              placeholder="e.g. Sedan, Coupe, Compact or Pickup, Minivan"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Active in POS</span>
              <span className="text-[11px] text-slate-700">
                Inactive vehicle types will not be shown as options during new sales.
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
              <span>{vehicleToEdit ? 'Save Changes' : 'Create Vehicle Type'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
