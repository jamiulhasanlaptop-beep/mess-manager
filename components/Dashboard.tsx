
import React, { useMemo } from 'react';
// Explicitly import DailyEntry and MealCounts to use for loop variable typing
import { AppState, DailyEntry, MealCounts } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShoppingCart, UtensilsCrossed, PiggyBank, Receipt } from 'lucide-react';

interface Props {
  state: AppState;
  onTabChange: (tab: any) => void;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const Dashboard: React.FC<Props> = ({ state, onTabChange, updateState }) => {
  const stats = useMemo(() => {
    let totalBazaar = 0;
    let totalMeals = 0;
    const activeMemberIds = new Set(state.members.map(m => m.id));

    Object.values(state.dailyEntries).forEach((entry: DailyEntry) => {
      totalBazaar += entry.bazaarAmount;
      Object.entries(entry.meals).forEach(([mId, counts]: [string, MealCounts]) => {
        if (activeMemberIds.has(mId)) {
          totalMeals += (counts.lunch + counts.dinner);
        }
      });
    });

    const totalDeposits = state.deposits.reduce((acc, d) => acc + d.amount, 0);
    const mealRate = totalMeals > 0 ? (totalBazaar + state.otherExpenses) / totalMeals : 0;

    const sortedDates = Object.keys(state.dailyEntries).sort();
    const chartData = sortedDates.slice(-7).map(date => ({
      name: date.slice(8), // day only
      amount: state.dailyEntries[date].bazaarAmount
    }));

    return { totalBazaar, totalMeals, totalDeposits, mealRate, chartData };
  }, [state]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ড্যাশবোর্ড</h1>
        <p className="text-gray-500 dark:text-gray-400">মেসের বর্তমান অবস্থার সংক্ষিপ্ত বিবরণ</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<ShoppingCart className="text-emerald-600" />} 
          title="মোট বাজার" 
          value={`৳${stats.totalBazaar}`} 
          color="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard 
          icon={<UtensilsCrossed className="text-indigo-600" />} 
          title="মোট মিল" 
          value={stats.totalMeals.toString()} 
          color="bg-indigo-50 dark:bg-indigo-950/40"
        />
        <StatCard 
          icon={<PiggyBank className="text-amber-600" />} 
          title="মোট জমা" 
          value={`৳${stats.totalDeposits}`} 
          color="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard 
          icon={<Receipt className="text-rose-600" />} 
          title="মিল রেট" 
          value={`৳${stats.mealRate.toFixed(2)}`} 
          color="bg-rose-50 dark:bg-rose-950/40"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-6">সাম্প্রতিক বাজার খরচ (দৈনিক)</h3>
          <div className="h-[300px]">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc', opacity: 0.1}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#f8fafc'}}
                    labelFormatter={(label) => `তারিখ: ${label}`}
                    formatter={(value) => [`৳${value}`, 'বাজার খরচ']}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                চার্টের জন্য কোনো ডাটা নেই
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">দ্রুত অ্যাকশন</h3>
          <div className="space-y-3">
            <ActionButton 
              label="বাজার খরচ যোগ করুন" 
              onClick={() => onTabChange('bazaar')} 
              bgColor="bg-indigo-600 hover:bg-indigo-700" 
            />
            <ActionButton 
              label="মিল ট্র্যাকিং করুন" 
              onClick={() => onTabChange('meals')} 
              bgColor="bg-amber-600 hover:bg-amber-700" 
            />
            <ActionButton 
              label="জমা সংগ্রহ করুন" 
              onClick={() => onTabChange('deposits')} 
              bgColor="bg-emerald-600 hover:bg-emerald-700" 
            />
            <ActionButton 
              label="হিসাব-নিকাশ দেখুন" 
              onClick={() => onTabChange('reports')} 
              bgColor="bg-gray-800 hover:bg-gray-900" 
            />
          </div>
          
          <div className="mt-8 space-y-4">
             <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-2">ডাটা ম্যানেজমেন্ট</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href",     dataStr);
                      downloadAnchorNode.setAttribute("download", `mess_manager_backup_${new Date().toISOString().slice(0,10)}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="flex-1 text-[10px] bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                  >
                    এক্সপোর্ট
                  </button>
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'application/json';
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                          try {
                            const importedData = JSON.parse(event.target.result);
                            if (window.confirm('আপনি কি এই ডাটা ইমপোর্ট করতে চান? আপনার বর্তমান ডাটা ওভাররাইট হয়ে যাবে।')) {
                              updateState(() => importedData);
                              alert('সফলভাবে ডাটা ইমপোর্ট করা হয়েছে!');
                            }
                          } catch (err) {
                            alert('ভুল ফাইল ফরম্যাট।');
                          }
                        };
                        reader.readAsText(file);
                      };
                      input.click();
                    }}
                    className="flex-1 text-[10px] bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                  >
                    ইমপোর্ট
                  </button>
                </div>
             </div>

             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <h4 className="text-xs font-bold uppercase text-indigo-400 mb-2">নোটিশ</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 italic">"রাত ১০টার আগেই মিল কাউন্ট সম্পন্ন করুন।"</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string, color: string }> = ({ icon, title, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const ActionButton: React.FC<{ label: string, onClick: () => void, bgColor: string }> = ({ label, onClick, bgColor }) => (
  <button 
    onClick={onClick}
    className={`w-full py-3 rounded-xl text-white font-medium shadow-sm transition-all ${bgColor}`}
  >
    {label}
  </button>
);

export default Dashboard;
