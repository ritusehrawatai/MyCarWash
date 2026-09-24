import React from 'react';
import { Flame, Wind, Disc, Check, Plus, Sparkles } from 'lucide-react';
import { POSServiceItem } from '../types/pos';
import { formatCurrency } from '../data/constants';

interface AddOnSelectorProps {
  addOns: POSServiceItem[];
  selectedAddOnIds: Set<string>;
  onToggleAddOn: (addon: POSServiceItem) => void;
}

export const AddOnSelector: React.FC<AddOnSelectorProps> = ({
  addOns,
  selectedAddOnIds,
  onToggleAddOn,
}) => {
  const getAddonIcon = (addon: POSServiceItem) => {
    const id = addon.id.toLowerCase();
    const name = addon.name.toLowerCase();

    if (id.includes('wax') || name.includes('wax')) {
      return <Flame className="w-5 h-5 text-orange-500" />;
    }
    if (id.includes('vacuum') || name.includes('vacuum') || name.includes('interior')) {
      return <Wind className="w-5 h-5 text-teal-500" />;
    }
    if (id.includes('tire') || name.includes('tire') || name.includes('wheel')) {
      return <Disc className="w-5 h-5 text-slate-700" />;
    }
    return <Sparkles className="w-5 h-5 text-blue-500" />;
  };

  if (addOns.length === 0) {
    return (
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h2 className="text-base font-bold text-slate-900">Optional Add-ons</h2>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-700 text-xs">
          No active add-ons available.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h2 className="text-base font-bold text-slate-900">Optional Add-ons</h2>
        </div>
        <span className="text-xs text-slate-700 font-medium">Select multiple</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {addOns.map((addon) => {
          const isSelected = selectedAddOnIds.has(addon.id);

          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => onToggleAddOn(addon)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 flex flex-col justify-between min-h-[120px] cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 shadow-md ring-1 ring-blue-600/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {getAddonIcon(addon)}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{addon.name}</h3>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {addon.description && (
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                    {addon.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Extra</span>
                <span className="text-base font-bold text-slate-900 font-mono-numbers">
                  +{formatCurrency(addon.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
