
import React, { useState } from 'react';
import { AppState, DailyEntry } from '../types';
import { ChevronLeft, ChevronRight, Calendar, User, Save } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const MealTab: React.FC<Props> = ({ state, updateState }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const currentEntry = state.dailyEntries[selectedDate] || {
    date: selectedDate,
    bazaarAmount: 0,
    bazaarDescription: '',
    meals: {}
  };

  const handleMealToggle = (memberId: string, type: 'lunch' | 'dinner') => {
    updateState(prev => {
      const entry = prev.dailyEntries[selectedDate] || {
        date: selectedDate,
        bazaarAmount: 0,
        bazaarDescription: '',
        meals: {}
      };

      const userMeals = entry.meals[memberId] || { breakfast: 0, lunch: 0, dinner: 0 };
      const updatedUserMeals = {
        ...userMeals,
        [type]: userMeals[type] === 1 ? 0 : 1
      };

      return {
        ...prev,
        dailyEntries: {
          ...prev.dailyEntries,
          [selectedDate]: {
            ...entry,
            meals: {
              ...entry.meals,
              [memberId]: updatedUserMeals
            }
          }
        }
      };
    });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">মিল ট্র্যাকিং</h1>
          <p className="text-gray-500 dark:text-gray-400">দুপুর ও রাতের মিলের হিসাব রাখুন সহজেই।</p>
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <User size={18} className="text-indigo-600 dark:text-indigo-400" />
            মেম্বারদের তালিকা
          </h2>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-lg">
            {selectedDate}
          </span>
        </div>
        
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {state.members.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">
              কোনো সদস্য যোগ করা হয়নি। আগে সদস্য যোগ করুন।
            </div>
          ) : (
            state.members.map(member => {
              const meals = currentEntry.meals[member.id] || { breakfast: 0, lunch: 0, dinner: 0 };
              return (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{member.phone || 'ফোন রেকর্ড নেই'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-4 font-bold">
                    <button 
                      onClick={() => handleMealToggle(member.id, 'lunch')}
                      className={`px-4 py-2 rounded-xl transition-all flex flex-col items-center min-w-[70px] ${
                        meals.lunch 
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500 ring-inset' 
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider mb-0.5">দুপুর</span>
                      <span className="text-sm">{meals.lunch ? '১.০' : '০.০'}</span>
                    </button>
                    <button 
                      onClick={() => handleMealToggle(member.id, 'dinner')}
                      className={`px-4 py-2 rounded-xl transition-all flex flex-col items-center min-w-[70px] ${
                        meals.dinner 
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500 ring-inset' 
                          : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider mb-0.5">রাত</span>
                      <span className="text-sm">{meals.dinner ? '১.০' : '০.০'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-indigo-700 dark:text-indigo-400 text-sm flex items-center gap-3 shadow-sm shadow-indigo-100 dark:shadow-none">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg text-indigo-600"><Save size={16} /></div>
        <p>আপনার আপডেটগুলি সাথে সাথেই সংরক্ষিত হচ্ছে।</p>
      </div>
    </div>
  );
};

export default MealTab;
