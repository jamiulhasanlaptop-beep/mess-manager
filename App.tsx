
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Wallet, 
  BarChart3, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  ShoppingBag,
  Moon,
  Sun,
  LogOut,
  Loader2,
  ShieldAlert,
  LogIn
} from 'lucide-react';
import { Member, DailyEntry, Deposit, AppState, MealCounts } from './types';
import Dashboard from './components/Dashboard';
import MemberTab from './components/MemberTab';
import BazaarTab from './components/BazaarTab';
import MealTab from './components/MealTab';
import DepositTab from './components/DepositTab';
import ReportTab from './components/ReportTab';
import { Auth } from './components/Auth';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, writeBatch, query, where } from 'firebase/firestore';

const STORAGE_KEY = 'mess_manager_v1';
const DARK_MODE_KEY = 'mess_manager_dark_mode';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'bazaar' | 'meals' | 'deposits' | 'reports'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    return saved === 'true';
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      members: [],
      dailyEntries: {},
      deposits: [],
      otherExpenses: 0
    };
  });

  const [dataLoading, setDataLoading] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  // Check for local data that could be migrated
  useEffect(() => {
    if (user && state.members.length === 0) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const localData = JSON.parse(saved);
        if (localData.members && localData.members.length > 0) {
          setShowMigrationBanner(true);
        }
      }
    }
  }, [user, state.members.length]);

  // Authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      
      // If logging out, revert to local storage data
      if (!u) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const localData = JSON.parse(saved);
          // Standardize local data to avoid missing properties
          setState({
            members: localData.members || [],
            dailyEntries: localData.dailyEntries || {},
            deposits: localData.deposits || [],
            otherExpenses: localData.otherExpenses || 0
          });
        } else {
          setState({
            members: [],
            dailyEntries: {},
            deposits: [],
            otherExpenses: 0
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch data from Firestore using subcollections
  useEffect(() => {
    if (!user) return;

    setDataLoading(true);
    
    // Sync trackers
    const syncStatus = { meta: false, members: false, entries: false, deposits: false };
    const checkSync = () => {
      if (syncStatus.meta && syncStatus.members && syncStatus.entries && syncStatus.deposits) {
        setDataLoading(false);
      }
    };

    // 1. Initial metadata and migration
    const messDocRef = doc(db, 'messes', user.uid);
    const unsubMeta = onSnapshot(messDocRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setState(prev => ({ ...prev, otherExpenses: data.otherExpenses || 0 }));
        
        // --- MIGRATION LOGIC ---
        const hasOldData = data.members || data.dailyEntries || data.deposits;
        if (hasOldData) {
          console.log("Migrating old data to subcollections...");
          try {
            // Migrate members
            if (data.members && Array.isArray(data.members)) {
              for (const m of data.members) {
                await setDoc(doc(db, 'messes', user.uid, 'members', m.id), m);
              }
            }
            // Migrate daily entries
            if (data.dailyEntries) {
              for (const [date, entry] of Object.entries(data.dailyEntries)) {
                await setDoc(doc(db, 'messes', user.uid, 'dailyEntries', date), entry);
              }
            }
            // Migrate deposits
            if (data.deposits && Array.isArray(data.deposits)) {
              for (const d of data.deposits) {
                await setDoc(doc(db, 'messes', user.uid, 'deposits', d.id), d);
              }
            }

            // After successful migration, cleanup the root document
            const { updateDoc, deleteField } = await import('firebase/firestore');
            await updateDoc(messDocRef, {
              members: deleteField(),
              dailyEntries: deleteField(),
              deposits: deleteField()
            });
            console.log("Migration complete!");
          } catch (migrateErr) {
            console.error("Migration failed:", migrateErr);
          }
        }
      } else {
        setDoc(messDocRef, { otherExpenses: 0 });
      }
      syncStatus.meta = true;
      checkSync();
    });

    // 2. Members subcollection
    const membersRef = collection(db, 'messes', user.uid, 'members');
    const unsubMembers = onSnapshot(membersRef, (snap) => {
      if (snap.metadata.hasPendingWrites) return; 
      const membersList: Member[] = [];
      snap.forEach(doc => membersList.push({ ...doc.data() as Member, id: doc.id }));
      setState(prev => ({ ...prev, members: membersList }));
      syncStatus.members = true;
      checkSync();
    });

    // 3. Daily Entries subcollection
    const entriesRef = collection(db, 'messes', user.uid, 'dailyEntries');
    const unsubEntries = onSnapshot(entriesRef, (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const entries: Record<string, DailyEntry> = {};
      snap.forEach(doc => {
        entries[doc.id] = doc.data() as DailyEntry;
      });
      setState(prev => ({ ...prev, dailyEntries: entries }));
      syncStatus.entries = true;
      checkSync();
    });

    // 4. Deposits subcollection
    const depositsRef = collection(db, 'messes', user.uid, 'deposits');
    const unsubDeposits = onSnapshot(depositsRef, (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const depositsList: Deposit[] = [];
      snap.forEach(doc => depositsList.push({ ...doc.data() as Deposit, id: doc.id }));
      setState(prev => ({ ...prev, deposits: depositsList }));
      syncStatus.deposits = true;
      checkSync();
    });

    return () => {
      unsubMeta();
      unsubMembers();
      unsubEntries();
      unsubDeposits();
    };
  }, [user]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  const updateState = async (updater: (prev: AppState) => AppState) => {
    const newState = updater(state);
    
    // Optimistic UI update for all users
    setState(newState);
    
    // For guest users, save to local storage
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return;
    }

    // For authenticated users, sync to Firestore subcollections
    try {
      // 1. Metadata (otherExpenses)
      if (newState.otherExpenses !== state.otherExpenses) {
        await setDoc(doc(db, 'messes', user.uid), { otherExpenses: newState.otherExpenses }, { merge: true });
      }

      // 2. Members (Sync additions, updates, and deletions)
      const oldMembersMap = new Map(state.members.map(m => [m.id, m]));
      const newMembersMap = new Map(newState.members.map(m => [m.id, m]));

      // Add or Update
      for (const [id, m] of newMembersMap.entries()) {
        const oldM = oldMembersMap.get(id);
        if (!oldM || JSON.stringify(oldM) !== JSON.stringify(m)) {
          await setDoc(doc(db, 'messes', user.uid, 'members', id), m);
        }
      }
      // Delete
      for (const id of oldMembersMap.keys()) {
        if (!newMembersMap.has(id)) {
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'messes', user.uid, 'members', id));
        }
      }

      // 3. Daily Entries (Sync additions and updates)
      const oldEntriesDates = Object.keys(state.dailyEntries);
      const newEntriesDates = Object.keys(newState.dailyEntries);

      for (const date of newEntriesDates) {
        const newEntry = newState.dailyEntries[date];
        const oldEntry = state.dailyEntries[date];
        if (!oldEntry || JSON.stringify(oldEntry) !== JSON.stringify(newEntry)) {
          await setDoc(doc(db, 'messes', user.uid, 'dailyEntries', date), newEntry);
        }
      }
      // Deletion of entries usually doesn't happen in the UI, but could be added here if needed

      // 4. Deposits (Sync additions, updates, and deletions)
      const oldDepositsMap = new Map(state.deposits.map(d => [d.id, d]));
      const newDepositsMap = new Map(newState.deposits.map(d => [d.id, d]));

      // Add or Update
      for (const [id, d] of newDepositsMap.entries()) {
        const oldD = oldDepositsMap.get(id);
        if (!oldD || JSON.stringify(oldD) !== JSON.stringify(d)) {
          await setDoc(doc(db, 'messes', user.uid, 'deposits', id), d);
        }
      }
      // Delete
      for (const id of oldDepositsMap.keys()) {
        if (!newDepositsMap.has(id)) {
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'messes', user.uid, 'deposits', id));
        }
      }

    } catch (err) {
      console.error("Failed to save to Firestore:", err);
      // Optional: Rollback state on error if needed, but onSnapshot will eventually reconcile
    }
  };

  const handleLogout = () => {
    if (window.confirm('আপনি কি লগআউট করতে চান?')) {
      signOut(auth);
    }
  };

  const migrateLocalData = async () => {
    if (!user) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      setDataLoading(true);
      const localData = JSON.parse(saved);
      
      // Perform migration using the existing updateState logic implicitly
      // or manually for efficiency
      const batch = writeBatch(db);
      
      // 1. Metadata
      const messDocRef = doc(db, 'messes', user.uid);
      batch.set(messDocRef, { otherExpenses: localData.otherExpenses || 0 }, { merge: true });

      // 2. Members
      if (localData.members) {
        for (const m of localData.members) {
          const mRef = doc(db, 'messes', user.uid, 'members', m.id);
          batch.set(mRef, m);
        }
      }

      // 3. Entries
      if (localData.dailyEntries) {
        for (const [date, entry] of Object.entries(localData.dailyEntries as Record<string, DailyEntry>)) {
          const eRef = doc(db, 'messes', user.uid, 'dailyEntries', date);
          batch.set(eRef, entry);
        }
      }

      // 4. Deposits
      if (localData.deposits) {
        for (const d of localData.deposits) {
          const dRef = doc(db, 'messes', user.uid, 'deposits', d.id);
          batch.set(dRef, d);
        }
      }

      await batch.commit();
      
      // Clear local storage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      setShowMigrationBanner(false);
      setDataLoading(false);
      alert('সফলভাবে ডাটা মাইগ্রেট করা হয়েছে!');
    } catch (err) {
      console.error("Migration failed:", err);
      alert('মাইগ্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {/* Mobile Header Profile */}
        {!authLoading && user && (
          <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.displayName || 'ম্যানেজার'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl"
              title="লগআউট"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}

        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return <Dashboard state={state} onTabChange={setActiveTab} updateState={updateState} />;
            case 'members':
              return <MemberTab state={state} updateState={updateState} />;
            case 'bazaar':
              return <BazaarTab state={state} updateState={updateState} />;
            case 'meals':
              return <MealTab state={state} updateState={updateState} />;
            case 'deposits':
              return <DepositTab state={state} updateState={updateState} />;
            case 'reports':
              return <ReportTab state={state} updateState={updateState} />;
            default:
              return <Dashboard state={state} onTabChange={setActiveTab} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 text-left">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 z-10 p-2 text-gray-500 hover:text-gray-700 bg-white dark:bg-slate-800 rounded-full shadow-sm"
            >
              <LogOut size={20} className="rotate-180" />
            </button>
            <Auth onComplete={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-screen sticky top-0 transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Utensils size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-gray-100">মেস ম্যানেজার</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 space-y-1 px-3">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<BarChart3 size={20} />} 
            label="ড্যাশবোর্ড" 
          />
          <NavButton 
            active={activeTab === 'members'} 
            onClick={() => setActiveTab('members')} 
            icon={<Users size={20} />} 
            label="সদস্যরা" 
          />
          <NavButton 
            active={activeTab === 'bazaar'} 
            onClick={() => setActiveTab('bazaar')} 
            icon={<ShoppingBag size={20} />} 
            label="বাজার খরচ" 
          />
          <NavButton 
            active={activeTab === 'meals'} 
            onClick={() => setActiveTab('meals')} 
            icon={<Calendar size={20} />} 
            label="মিল ট্র্যাকিং" 
          />
          <NavButton 
            active={activeTab === 'deposits'} 
            onClick={() => setActiveTab('deposits')} 
            icon={<Wallet size={20} />} 
            label="জমা টাকা" 
          />
          <NavButton 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
            icon={<TrendingUp size={20} />} 
            label="হিসাব-নিকাশ" 
          />
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2 border border-indigo-100 dark:border-indigo-900/30 rounded-lg mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{user.displayName || 'ম্যানেজার'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {isDarkMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-600" />}
                  {isDarkMode ? 'লাইট' : 'ডার্ক'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center p-2 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                  title="লগআউট"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all"
              >
                <LogIn size={18} /> লগইন করুন
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                {isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
              </button>
            </div>
          )}
           <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 text-sm text-indigo-700 dark:text-indigo-400 font-medium">
             সক্রিয়: {state.members.length} জন সদস্য
           </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div id="mobile-top-bar" className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Utensils className="text-indigo-600" size={24} />
          <span className="font-bold text-lg text-gray-800 dark:text-gray-100">মেস ম্যানেজার</span>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
        >
          {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative">
        {/* Migration Banner */}
        {user && showMigrationBanner && (
          <div className="bg-emerald-600 text-white px-4 py-3 sticky top-[65px] md:top-0 z-40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg text-left">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg shrink-0">
                <Plus size={20} />
              </div>
              <p className="text-sm font-medium">
                আপনার ব্রাউজারে কিছু আগের ডাটা (গেস্ট ডাটা) পাওয়া গেছে। আপনি কি এই ডাটা আপনার একাউন্টে যুক্ত করতে চান?
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowMigrationBanner(false)}
                className="px-4 py-2 rounded-full text-xs font-bold border border-white/30 hover:bg-white/10 transition-colors"
              >
                এখন না
              </button>
              <button 
                onClick={migrateLocalData}
                className="bg-white text-emerald-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap"
              >
                ডাটা যুক্ত করুন
              </button>
            </div>
          </div>
        )}

        {/* Guest Banner */}
        {!user && (
          <div className="bg-indigo-600 text-white px-4 py-3 sticky top-[65px] md:top-0 z-40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg text-left">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg shrink-0">
                <ShieldAlert size={20} />
              </div>
              <p className="text-sm font-medium">
                আপনি গেস্ট মোডে আছেন। একাউন্ট না খুললে আপনার ডাটা সেভ থাকবে না এবং সব ফিচারের এক্সেস পাবেন না।
              </p>
            </div>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-indigo-600 px-6 py-2 rounded-full text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
            >
              একাউন্ট খুলুন
            </button>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden flex justify-around items-center p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 sticky bottom-0 z-50">
        <MobileNavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<BarChart3 size={20} />} 
        />
        <MobileNavButton 
          active={activeTab === 'members'} 
          onClick={() => setActiveTab('members')} 
          icon={<Users size={20} />} 
        />
        <MobileNavButton 
          active={activeTab === 'bazaar'} 
          onClick={() => setActiveTab('bazaar')} 
          icon={<ShoppingBag size={20} />} 
        />
        <MobileNavButton 
          active={activeTab === 'meals'} 
          onClick={() => setActiveTab('meals')} 
          icon={<Calendar size={20} />} 
        />
        <MobileNavButton 
          active={activeTab === 'deposits'} 
          onClick={() => setActiveTab('deposits')} 
          icon={<Wallet size={20} />} 
        />
        <MobileNavButton 
          active={activeTab === 'reports'} 
          onClick={() => setActiveTab('reports')} 
          icon={<TrendingUp size={20} />} 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string 
}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

const MobileNavButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode 
}> = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center p-3 transition-all active:scale-95 ${
      active 
        ? 'text-indigo-600 dark:text-indigo-400' 
        : 'text-gray-400 dark:text-gray-500'
    }`}
  >
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
      {icon}
    </div>
  </button>
);

export default App;
