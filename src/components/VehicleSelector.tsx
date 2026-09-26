import React from 'react';
import { Car, Truck, Check } from 'lucide-react';
import { POSVehicleType } from '../types/pos';
import { formatCurrency } from '../data/constants';
import { useLanguage } from '../context/LanguageContext';

interface VehicleSelectorProps {
  vehicleTypes: POSVehicleType[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicle: POSVehicleType) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicleTypes,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const { t } = useLanguage();

  const getVehicleIcon = (vehicle: POSVehicleType) => {
    const id = vehicle.id.toLowerCase();
    const name = vehicle.name.toLowerCase();
    if (id.includes('truck') || id.includes('suv') || name.includes('truck') || name.includes('suv') || name.includes('van')) {
      return <Truck className="w-6 h-6" />;
    }
    return <Car className="w-6 h-6" />;
  };

  if (vehicleTypes.length === 0) {
    return (
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('pos.step2VehicleType')}</h2>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-700 dark:text-slate-300 text-sm">
          {t('settings.vehiclesTitle')}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            2
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('pos.step2VehicleType')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {vehicleTypes.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;

          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onSelectVehicle(vehicle)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 flex items-center justify-between cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-600 shadow-md ring-1 ring-blue-600/30'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/60 dark:hover:bg-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {getVehicleIcon(vehicle)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{vehicle.name}</h3>
                    {vehicle.surcharge > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono-numbers">
                        +{formatCurrency(vehicle.surcharge)} {t('pos.surcharge')}
                      </span>
                    )}
                  </div>
                  {vehicle.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{vehicle.description}</p>
                  )}
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-3 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
