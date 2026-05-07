
import React, { useState, useMemo } from 'react';
import { AppState, DailyEntry } from '../types';
import { ChevronLeft, ChevronRight, ShoppingBag, Save, TrendingUp, User, Edit2, Trash2 } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const BazaarTab: React.FC<Props> = ({ state, updateState }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const currentEntry = state.dailyEntries[selectedDate] || {
    date: selectedDate,
    bazaarAmount: 0,
    bazaarDescription: '',
    meals: {}
  };

  const totalBazaarCost = useMemo(() => {
    return Object.values(state.dailyEntries).reduce((acc, entry) => acc + (entry.bazaarAmount || 0), 0);
  }, [state.dailyEntries]);

  const handleBazaarChange = (field: 'amount' | 'desc' | 'shopper', value: string) => {
    updateState(prev => {
      const entry = prev.dailyEntries[selectedDate] || {
        date: selectedDate,
        bazaarAmount: 0,
        bazaarDescription: '',
        meals: {}
      };

      const updatedEntry: DailyEntry = {
        ...entry,
        bazaarAmount: field === 'amount' ? Math.max(0, parseFloat(value) || 0) : entry.bazaarAmount,
        bazaarDescription: field === 'desc' ? value : entry.bazaarDescription,
        shopperId: field === 'shopper' ? value : entry.shopperId
      };

      return {
        ...prev,
        dailyEntries: {
          ...prev.dailyEntries,
          [selectedDate]: updatedEntry
        }
      };
    });
  };

  const getShopper = (id?: string) => {
    return state.members.find(m => m.id === id);
  };

  const handleDelete = (date: string) => {
    if (window.confirm('আপনি কি এই দিনের বাজারের তথ্য মুছে ফেলতে চান?')) {
      updateState(prev => {
        const entry = prev.dailyEntries[date];
        if (!entry) return prev;

        return {
          ...prev,
          dailyEntries: {
            ...prev.dailyEntries,
            [date]: {
              ...entry,
              bazaarAmount: 0,
              bazaarDescription: '',
              shopperId: undefined
            }
          }
        };
      });
    }
  };

  const moveDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().slice(0, 10));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">বাজার খরচ</h1>
          <p className="text-gray-500 dark:text-gray-400">আপনার মেসের প্রতিদিনের বাজার খরচ এখানে লিখে রাখুন।</p>
        </div>
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
          <button onClick={() => moveDate(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-400"><ChevronLeft size={20} /></button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-transparent outline-none"
          />
          <button onClick={() => moveDate(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-400"><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center text-emerald-600">
                ৳
              </div>
              খরচের তথ্য
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">বাজারের পরিমাণ (টাকা)</label>
                  <input 
                    type="number"
                    value={currentEntry.bazaarAmount || ''}
                    onChange={e => handleBazaarChange('amount', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">কে বাজার করেছে?</label>
                  <select
                    value={currentEntry.shopperId || ''}
                    onChange={e => handleBazaarChange('shopper', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none"
                  >
                    <option value="">সদস্য নির্বাচন করুন</option>
                    {state.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea 
                  value={currentEntry.bazaarDescription}
                  onChange={e => handleBazaarChange('desc', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-32"
                  placeholder="কি কি বাজার করলেন? (যেমন: মাছ, মাংস, সবজি ইত্যাদি)"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-medium">মোট বাজার খরচ</p>
              <p className="text-3xl font-bold mt-1">৳{totalBazaarCost.toFixed(2)}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-indigo-100 bg-indigo-500/30 w-fit px-2 py-1 rounded-full">
                <TrendingUp size={12} /> গত মাস থেকে বাড়ছে
              </div>
            </div>
            <ShoppingBag className="absolute -right-4 -bottom-4 text-indigo-500/20 w-32 h-32 rotate-12" />
          </div>

          {currentEntry.shopperId && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
              <div className="shrink-0">
                {getShopper(currentEntry.shopperId)?.photo ? (
                  <img src={getShopper(currentEntry.shopperId)?.photo} className="w-12 h-12 rounded-full object-cover" alt="Shopper" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">আজকের বাজার করেছন</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{getShopper(currentEntry.shopperId)?.name}</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-amber-700 dark:text-amber-500 text-sm flex items-start gap-3">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shrink-0 text-amber-600"><Save size={16} /></div>
            <p>আপনি যা লিখছেন তা অটোমেটিক সেইভ হচ্ছে। আলাদা করে সেইভ বাটনে চাপ দিতে হবে না।</p>
          </div>
        </div>
      </div>

      {/* Recent History Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          সাম্প্রতিক বাজারের ইতিহাস
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-400 text-xs font-bold uppercase">
              <tr>
                <th className="px-4 py-3">তারিখ</th>
                <th className="px-4 py-3">বাজারকারী</th>
                <th className="px-4 py-3">পরিমাণ</th>
                <th className="px-4 py-3">বিবরণ</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {Object.values(state.dailyEntries)
                .filter(entry => entry.bazaarAmount > 0)
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map(entry => {
                  const shopper = getShopper(entry.shopperId);
                  return (
                    <tr key={entry.date} className="text-sm group hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {shopper?.photo ? (
                            <img src={shopper.photo} className="w-6 h-6 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                              <User size={12} />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-gray-100">{shopper?.name || 'অজানা'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">৳{entry.bazaarAmount}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{entry.bazaarDescription || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setSelectedDate(entry.date);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="এডিট করুন"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.date)}
                            className="p-2 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {Object.values(state.dailyEntries).filter(entry => entry.bazaarAmount > 0).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">এখনো কোনো বাজারের তথ্য নেই।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BazaarTab;
