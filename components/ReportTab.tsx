
import React, { useMemo, useState } from 'react';
import { AppState, DailyEntry, MealCounts } from '../types';
import { Download, FileText, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const ReportTab: React.FC<Props> = ({ state, updateState }) => {
  const [otherExpenses, setOtherExpenses] = useState(state.otherExpenses);

  const stats = useMemo(() => {
    let totalBazaar = 0;
    let totalMeals = 0;
    const memberMeals: Record<string, number> = {};
    const memberDeposits: Record<string, number> = {};
    const activeMemberIds = new Set(state.members.map(m => m.id));

    state.members.forEach(m => {
      memberMeals[m.id] = 0;
      memberDeposits[m.id] = 0;
    });

    Object.values(state.dailyEntries).forEach((entry: DailyEntry) => {
      totalBazaar += entry.bazaarAmount;
      Object.entries(entry.meals).forEach(([mId, counts]: [string, MealCounts]) => {
        if (activeMemberIds.has(mId)) {
          const count = counts.lunch + counts.dinner;
          totalMeals += count;
          memberMeals[mId] += count;
        }
      });
    });

    state.deposits.forEach(d => {
      if (memberDeposits[d.memberId] !== undefined) memberDeposits[d.memberId] += d.amount;
    });

    const mealRate = totalMeals > 0 ? (totalBazaar + state.otherExpenses) / totalMeals : 0;

    const memberRows = state.members.map(m => {
      const meals = memberMeals[m.id];
      const cost = meals * mealRate;
      const deposit = memberDeposits[m.id];
      const balance = deposit - cost;
      return {
        id: m.id,
        name: m.name,
        photo: m.photo,
        meals,
        cost,
        deposit,
        balance,
        status: balance >= 0 ? 'পাবেন' : 'দিতে হবে'
      };
    });

    return { totalBazaar, totalMeals, mealRate, memberRows };
  }, [state]);

  const saveOtherExpenses = () => {
    updateState(prev => ({ ...prev, otherExpenses }));
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [79, 70, 229]; // Indigo-600

    // Title & Header
    const reportDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[reportDate.getMonth()];
    const currentYear = reportDate.getFullYear();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(`Mess Report - ${currentMonth} ${currentYear}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${reportDate.toLocaleString()}`, 14, 28);
    
    // 1. Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Summary Overview (${currentMonth})`, 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Bazaar Cost', `${stats.totalBazaar.toFixed(2)} TK`],
        ['Other Expenses', `${state.otherExpenses.toFixed(2)} TK`],
        ['Grand Total Cost', `${(stats.totalBazaar + state.otherExpenses).toFixed(2)} TK`],
        ['Total Meals Consumed', stats.totalMeals.toString()],
        ['Calculated Meal Rate', `${stats.mealRate.toFixed(2)} TK`],
      ],
      theme: 'striped',
      headStyles: { fillColor: primaryColor }
    });

    // 2. Individual Member Balances
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Individual Member Balances', 14, finalY);
    
    const balanceTableData = stats.memberRows.map(row => [
      row.name,
      row.meals.toString(),
      `${row.cost.toFixed(2)} TK`,
      `${row.deposit.toFixed(2)} TK`,
      `${row.balance.toFixed(2)} TK`,
      row.balance >= 0 ? 'Paben' : 'Dite Hobe'
    ]);

    // Footer row for totals
    balanceTableData.push([
      'TOTAL',
      stats.totalMeals.toString(),
      `${(stats.totalBazaar + state.otherExpenses).toFixed(2)} TK`,
      `${state.deposits.reduce((a, b) => a + b.amount, 0).toFixed(2)} TK`,
      '',
      ''
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Member Name', 'Meals', 'Total Cost', 'Deposited', 'Balance', 'Status']],
      body: balanceTableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // 3. Deposit History (New Page)
    doc.addPage();
    doc.text('Deposit History Details', 14, 20);
    
    const depositTableData = [...state.deposits]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(d => {
        const member = state.members.find(m => m.id === d.memberId);
        return [
          d.date,
          member?.name || 'Unknown',
          `${d.amount.toFixed(2)} TK`,
          d.note || '-'
        ];
      });

    autoTable(doc, {
      startY: 25,
      head: [['Date', 'Member Name', 'Amount', 'Note']],
      body: depositTableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor }
    });

    // 4. Detailed Meal Log (Daily)
    doc.addPage();
    doc.text('Daily Meal Consumed Log', 14, 20);
    
    const sortedDates = Object.keys(state.dailyEntries).sort((a, b) => b.localeCompare(a));
    const mealDetailRows: any[][] = [];
    
    sortedDates.forEach(date => {
      const entry = state.dailyEntries[date];
      state.members.forEach(member => {
        const counts = entry.meals[member.id] || { breakfast: 0, lunch: 0, dinner: 0 };
        const total = (counts.breakfast || 0) + counts.lunch + counts.dinner;
        if (total > 0) {
          mealDetailRows.push([
            date,
            member.name,
            (counts.breakfast || 0).toString(),
            counts.lunch.toString(),
            counts.dinner.toString(),
            total.toString()
          ]);
        }
      });
    });

    autoTable(doc, {
      startY: 25,
      head: [['Date', 'Member Name', 'Breakfast', 'Lunch', 'Dinner', 'Subtotal']],
      body: mealDetailRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      showHead: 'everyPage'
    });

    doc.save(`Mess_Detailed_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">হিসাব-নিকাশ</h1>
          <p className="text-gray-500 dark:text-gray-400">মিলের হার এবং ব্যক্তিগত ব্যালেন্সের সারাংশ</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleDownloadPDF}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
           >
             <Download size={16} /> পিডিএফ ডাউনলোড
           </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100 dark:shadow-none">
          <p className="text-indigo-100 text-sm font-medium">প্রতি মিলের রেট</p>
          <p className="text-3xl font-bold mt-1">৳{stats.mealRate.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">মোট মিল সংখ্যা</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalMeals}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <label className="text-gray-500 dark:text-gray-400 text-sm font-medium block">অতিরিক্ত খরচ (টাকা)</label>
          <div className="flex gap-2 mt-2">
            <input 
              type="number"
              value={otherExpenses}
              onChange={e => setOtherExpenses(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
            />
            <button 
              onClick={saveOtherExpenses}
              className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
            >
              আপডেট
            </button>
          </div>
        </div>
      </div>

      {/* Detail Balance Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
            বিস্তারিত মেম্বার ব্যালেন্স
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">সদস্যের নাম</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">মোট মিল</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">ব্যালেন্স</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">অবস্থা (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {stats.memberRows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {row.photo ? (
                        <img src={row.photo} alt={row.name} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-slate-800" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs">
                          {row.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.meals}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      row.balance >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      ৳{row.balance >= 0 ? '+' : ''}{row.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {row.balance >= 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-900/50">
                          <CheckCircle2 size={16} /> {row.status}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl text-sm font-bold border border-rose-100 dark:border-rose-900/50">
                          <XCircle size={16} /> {row.status}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
          <h3 className="text-emerald-800 dark:text-emerald-400 font-bold mb-2 flex items-center gap-2">
            <TrendingUp size={18} /> আর্থিক অবস্থা
          </h3>
          <p className="text-emerald-700 dark:text-emerald-500 text-sm">
            অন্যান্য খরচসহ মোট বাজার খরচ ৳{(stats.totalBazaar + state.otherExpenses).toFixed(2)}। 
            সংগৃহীত মোট জমা ৳{state.deposits.reduce((a, b) => a + b.amount, 0).toFixed(2)}। 
            মেস বর্তমানে {
              (state.deposits.reduce((a, b) => a + b.amount, 0) >= (stats.totalBazaar + state.otherExpenses))
                ? 'উদ্বৃত্ত (Surplus)'
                : 'ঘাটতি (Short)'
            } অবস্থায় আছে।
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
           <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
            <AlertCircle size={18} /> গুরুত্বপূর্ণ তথ্য
          </h3>
          <ul className="text-amber-700 dark:text-amber-500 text-sm space-y-1 list-disc list-inside">
            <li>মিলের হার সকল সদস্যের উপর ভিত্তি করে গণনা করা হয়।</li>
            <li>ব্যালেন্স নির্দেশ করে কার কত টাকা জমা আছে বা কে কত পাবে।</li>
            <li>সদস্যদের জন্য সঠিক হিসাবের জন্য প্রতিদিনের বাজার খরচ আপডেট নিশ্চিত করুন।</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
