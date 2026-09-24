import React from 'react';
import { Droplets, Sparkles, Shield, Crown, Check } from 'lucide-react';
import { POSServiceItem } from '../types/pos';
import { formatCurrency } from '../data/constants';

interface ServiceSelectorProps {
  services: POSServiceItem[];
  selectedServiceId: string;
  onSelectService: (service: POSServiceItem) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServiceId,
  onSelectService,
}) => {
  const getServiceIcon = (service: POSServiceItem) => {
    const id = service.id.toLowerCase();
    const name = service.name.toLowerCase();

    if (id.includes('basic') || name.includes('basic')) {
      return <Droplets className="w-5 h-5 text-sky-500" />;
    }
    if (id.includes('deluxe') || name.includes('deluxe')) {
      return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
    if (id.includes('premium') || name.includes('premium')) {
      return <Shield className="w-5 h-5 text-indigo-500" />;
    }
    if (id.includes('full') || name.includes('full') || name.includes('ultimate')) {
      return <Crown className="w-5 h-5 text-amber-500" />;
    }
    return <Sparkles className="w-5 h-5 text-blue-500" />;
  };

  if (services.length === 0) {
    return (
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-base font-bold text-slate-900">Select Wash Service</h2>
        </div>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-700 text-sm">
          No active wash services available. Please activate or create a wash service in Settings.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-base font-bold text-slate-900">Select Wash Service</h2>
        </div>
        <span className="text-xs text-slate-700 font-medium">Choose 1 package</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 flex flex-col justify-between min-h-[140px] cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 shadow-md ring-1 ring-blue-600/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              {/* Badge if available */}
              {service.badge && (
                <span
                  className={`absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {service.badge}
                </span>
              )}

              {/* Service header */}
              <div className="pr-12">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    {getServiceIcon(service)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {service.name}
                  </h3>
                </div>
                {service.description && (
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Price and selected indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xl font-extrabold text-slate-900 font-mono-numbers">
                  {formatCurrency(service.price)}
                </span>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
