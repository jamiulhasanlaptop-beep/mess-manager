
import React, { useState, useMemo } from 'react';
import { AppState, Deposit } from '../types';
import { Plus, Trash2, Wallet, PlusCircle, Search, Edit2 } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const DepositTab: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ memberId: '', amount: '', note: '' });

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount) return;

    if (editingId) {
      updateState(prev => ({
        ...prev,
        deposits: prev.deposits.map(d => d.id === editingId ? { 
          ...d, 
          memberId: formData.memberId, 
          amount: Math.max(0, parseFloat(formData.amount) || 0), 
          note: formData.note 
        } : d)
      }));
      setEditingId(null);
    } else {
      const newDeposit: Deposit = {
        id: generateId(),
        memberId: formData.memberId,
        amount: Math.max(0, parseFloat(formData.amount) || 0),
        date: new Date().toISOString().slice(0, 10),
        note: formData.note
      };

      updateState(prev => ({
        ...prev,
        deposits: [newDeposit, ...prev.deposits]
      }));
    }
    
    setFormData({ memberId: '', amount: '', note: '' });
    setIsAdding(false);
  };

  const removeDeposit = (id: string) => {
    if (confirm("আপনি কি এই জমার রেকর্ডটি মুছে ফেলতে চান?")) {
      updateState(prev => ({
        ...prev,
        deposits: prev.deposits.filter(d => d.id !== id)
      }));
    }
  };

  const startEdit = (deposit: Deposit) => {
    setEditingId(deposit.id);
    setFormData({ 
      memberId: deposit.memberId, 
      amount: deposit.amount.toString(), 
      note: deposit.note || '' 
    });
    setIsAdding(true);
  };

  const getMemberName = (id: string) => state.members.find(m => m.id === id)?.name || 'অজানা সদস্য';

  const totalDeposits = useMemo(() => {
    return state.deposits.reduce((acc, d) => acc + d.amount, 0);
  }, [state.deposits]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">জমা টাকা</h1>
          <p className="text-gray-500 dark:text-gray-400">সদস্যদের কাছ থেকে সংগ্রহ করা টাকা ট্র্যাক করুন</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-emerald-600 px-4 py-2 rounded-xl text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 flex flex-col items-end">
            <span className="text-[10px] font-medium text-emerald-100 uppercase tracking-wider">মোট জমা</span>
            <span className="text-xl font-bold leading-tight">৳{totalDeposits.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ memberId: '', amount: '', note: '' });
              } else {
                setIsAdding(true);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isAdding 
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 hover:bg-emerald-700'
            }`}
          >
            {isAdding ? 'বাতিল করুন' : <><PlusCircle size={18} /> নতুন জমা</>}
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">সদস্য</label>
              <select 
                required
                value={formData.memberId}
                onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">সদস্য নির্বাচন করুন</option>
                {state.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">পরিমাণ (টাকা)</label>
              <input 
                type="number"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">নোট (ঐচ্ছিক)</label>
              <input 
                type="text"
                value={formData.note}
                onChange={e => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="অতিরিক্ত তথ্য"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="mt-4 w-full sm:w-auto bg-emerald-600 text-white px-8 py-2 rounded-xl font-medium hover:bg-emerald-700"
          >
            {editingId ? 'আপডেট করুন' : 'জমা নিশ্চিত করুন'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">তারিখ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">সদস্য</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">পরিমাণ</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">নোট</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {state.deposits.map(deposit => (
                <tr key={deposit.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{deposit.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const member = state.members.find(m => m.id === deposit.memberId);
                        return member?.photo ? (
                          <img src={member.photo} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-slate-800" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs">
                            {(member?.name || 'O').charAt(0)}
                          </div>
                        );
                      })()}
                      <span className="font-medium text-gray-900 dark:text-gray-100">{getMemberName(deposit.memberId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">৳{deposit.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500 italic">{deposit.note || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => startEdit(deposit)}
                        className="p-1 text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => removeDeposit(deposit.id)}
                        className="p-1 text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.deposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">কোনো জমার রেকর্ড পাওয়া যায়নি।</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepositTab;
