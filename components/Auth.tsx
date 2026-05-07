import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { LogIn, UserPlus, KeyRound, Mail, User, Phone, ArrowLeft, Loader2, Eye, EyeOff, Globe } from 'lucide-react';

interface AuthProps {
  onComplete?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Save profile if new
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber || '',
        photo: user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      onComplete?.();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError('গুগল লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isReset) {
        await sendPasswordResetEmail(auth, email);
        setMessage('আপনার ইমেইলে পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে।');
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onComplete?.();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
        
        // Store user profile including phone
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name,
            email,
            phone,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error("Profile not saved:", dbErr);
        }
        
        onComplete?.();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/user-not-found') setError('এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      else if (err.code === 'auth/wrong-password') setError('ভুল পাসওয়ার্ড।');
      else if (err.code === 'auth/email-already-in-use') setError('এই ইমেইলটি ইতিমধ্যেই ব্যবহৃত হচ্ছে।');
      else if (err.code === 'auth/weak-password') setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      else if (err.code === 'auth/invalid-email') setError('সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।');
      else if (err.code === 'auth/operation-not-allowed') setError('ইমেইল/পাসওয়ার্ড লগইন ফায়ারবেস কনসোল থেকে এনাবল করা নেই। আপাতত গুগল দিয়ে লগইন করুন।');
      else setError(`কিছু সমস্যা হয়েছে: ${err.message || 'আবার চেষ্টা করুন'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 p-8 shadow-indigo-100/50 dark:shadow-none">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            {isReset ? <KeyRound size={32} /> : (isLogin ? <LogIn size={32} /> : <UserPlus size={32} />)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isReset ? 'পাসওয়ার্ড রিসেট' : (isLogin ? 'লগইন করুন' : 'অ্যাকাউন্ট তৈরি করুন')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isReset 
              ? 'আপনার ইমেইল দিন রিসেট লিঙ্ক পেতে' 
              : (isLogin ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'ম্যানেজার হিসেবে যুক্ত হন')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isReset && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="আপনার নাম"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="ইমেইল অ্যাড্রেস"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>

          {!isReset && (
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="পাসওয়ার্ড"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                title={showPassword ? "লুকান" : "দেখুন"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {!isLogin && !isReset && (
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                placeholder="মোবাইল নাম্বার"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
          )}

          {error && <p className="text-rose-500 text-sm text-center font-bold bg-rose-50 dark:bg-rose-900/20 py-2 rounded-lg">{error}</p>}
          {message && <p className="text-emerald-500 text-sm text-center font-bold bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-lg">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isReset ? 'লিঙ্ক পাঠান' : (isLogin ? 'প্রবেশ করুন' : 'অ্যাকাউন্ট খুলুন')}
              </>
            )}
          </button>
        </form>

        {!isReset && (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800"></div>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">অথবা</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              গুগল দিয়ে লগইন
            </button>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center space-y-3">
          {isReset ? (
            <button
              onClick={() => { setIsReset(false); setIsLogin(true); }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} /> লগইনে ফিরে যান
            </button>
          ) : (
            <>
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                className="text-gray-600 dark:text-gray-400 font-medium"
              >
                {isLogin ? (
                  <>অ্যাকাউন্ট নেই? <span className="text-indigo-600 dark:text-indigo-400 font-bold">নতুন খুলুন</span></>
                ) : (
                  <>ইতিমধ্যে অ্যাকাউন্ট আছে? <span className="text-indigo-600 dark:text-indigo-400 font-bold">লগইন করুন</span></>
                )}
              </button>
              
              {isLogin && (
                <div>
                  <button
                    onClick={() => setIsReset(true)}
                    className="text-gray-400 dark:text-gray-500 text-sm hover:text-indigo-600 transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
