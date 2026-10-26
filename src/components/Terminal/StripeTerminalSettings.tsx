import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wifi,
  Radio,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Shield,
  Key,
  MapPin,
  Laptop,
} from 'lucide-react';
import {
  TerminalReader,
  TerminalConfigResponse,
  fetchTerminalConfig,
  updateTerminalConfig,
  fetchTerminalReaders,
  registerTerminalReader,
} from '../../services/stripeTerminalService';

export const StripeTerminalSettings: React.FC = () => {
  const [config, setConfig] = useState<TerminalConfigResponse | null>(null);
  const [readers, setReaders] = useState<TerminalReader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for config
  const [locationId, setLocationId] = useState('');
  const [defaultReaderId, setDefaultReaderId] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Form state for registering new reader
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationCode, setRegistrationCode] = useState('');
  const [readerLabel, setReaderLabel] = useState('');
  const [isSubmittingReader, setIsSubmittingReader] = useState(false);

  const loadData = async () => {
    try {
      setError(null);
      const [cfg, readersData] = await Promise.all([
        fetchTerminalConfig(),
        fetchTerminalReaders(),
      ]);
      setConfig(cfg);
      setLocationId(cfg.locationId || '');
      setDefaultReaderId(cfg.defaultReaderId || '');
      setTestMode(cfg.testMode);
      setStripePublishableKey(cfg.publishableKey || '');
      setReaders(readersData.readers);
    } catch (err: any) {
      setError(err.message || 'Failed to load Stripe Terminal configuration.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await updateTerminalConfig({
        locationId,
        defaultReaderId,
        testMode,
        stripeSecretKey: stripeSecretKey.trim() || undefined,
        stripePublishableKey: stripePublishableKey.trim() || undefined,
      });
      setConfig(res.config);
      setSuccessMsg('Stripe Terminal configuration saved successfully.');
      setStripeSecretKey('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRegisterReader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationCode.trim() || !readerLabel.trim()) {
      setError('Registration code and reader label are required.');
      return;
    }

    setIsSubmittingReader(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await registerTerminalReader(registrationCode, readerLabel);
      setSuccessMsg(`Reader "${res.reader.label}" registered successfully!`);
      setRegistrationCode('');
      setReaderLabel('');
      setIsRegistering(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to register card reader.');
    } finally {
      setIsSubmittingReader(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-xs text-slate-500">Loading Stripe Terminal setup...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Stripe Terminal Physical Card Readers</span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    testMode
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {testMode ? 'Test & Simulated Mode' : 'Live Hardware Mode'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage BBPOS WisePOS E, Stripe Reader S700, and countertop POS terminal readers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Readers</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registered Readers List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Configured Card Readers</span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 font-mono">
                {readers.length}
              </span>
            </h4>

            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Reader</span>
            </button>
          </div>

          {/* Registration Sub-Form */}
          {isRegistering && (
            <form
              onSubmit={handleRegisterReader}
              className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Register a Stripe Terminal Reader
                </span>
                <span className="text-[11px] text-slate-500">
                  On reader, swipe from left edge &gt; Settings &gt; Generate pairing code
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Registration Code (3 Words or simulated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. whales-dance-charm or sim-lane3"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Reader Friendly Label / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Register 2 - WisePOS E"
                    value={readerLabel}
                    onChange={(e) => setReaderLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReader}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingReader && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Pair Reader</span>
                </button>
              </div>
            </form>
          )}

          {/* Readers Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readers.map((reader) => (
              <div
                key={reader.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      {reader.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        reader.status === 'online'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${reader.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {reader.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span className="font-sans">ID:</span>
                      <span>{reader.id}</span>
                    </div>
                    {reader.device_type && (
                      <div className="flex justify-between">
                        <span className="font-sans">Device:</span>
                        <span>{reader.device_type}</span>
                      </div>
                    )}
                    {reader.serial_number && (
                      <div className="flex justify-between">
                        <span className="font-sans">Serial:</span>
                        <span>{reader.serial_number}</span>
                      </div>
                    )}
                    {reader.ip_address && (
                      <div className="flex justify-between">
                        <span className="font-sans">IP Address:</span>
                        <span>{reader.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {reader.id === defaultReaderId ? (
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Default Register Reader
                      </span>
                    ) : (
                      'Available for POS'
                    )}
                  </span>
                  {reader.id !== defaultReaderId && (
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultReaderId(reader.id);
                        updateTerminalConfig({ defaultReaderId: reader.id });
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stripe Terminal Backend Configuration */}
      <form
        onSubmit={handleSaveConfig}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Terminal Connection Settings
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Terminal Location ID</span>
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              placeholder="e.g. loc_aquashine_main or tml_12345"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Stripe Terminal location under which physical readers are registered.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              <span>Operating Mode</span>
            </label>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Simulated / Test Mode (No physical reader needed)</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Allows immediate end-to-end checkout testing with virtual WisePOS E & S700 cards.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Stripe Secret Key (Server Only)</span>
            </label>
            <input
              type="password"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder={config?.hasSecretKey ? '•••••••••••••••••••••••• (Configured)' : 'sk_test_... or sk_live_...'}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Stored securely on the server and never exposed to the client browser.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Stripe Publishable Key</span>
            </label>
            <input
              type="text"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="pk_test_... or pk_live_..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Optional publishable key for client SDK discovery.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSavingConfig}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            {isSavingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Terminal Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
