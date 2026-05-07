
import React, { useState } from 'react';
import { AppState, Member } from '../types';
import { Plus, Trash2, Edit2, UserPlus, Phone, Camera, User } from 'lucide-react';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const MemberTab: React.FC<Props> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', photo: '' });

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert("ছবির সাইজ ২ মেগাবাইটের কম হতে হবে।");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, photo: reader.result as string }));
    };
    reader.onerror = () => {
      alert("ছবি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Check for files
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
      return;
    }

    // Check for images dragged from other tabs (URLs)
    const imageUrl = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('URL');
    if (imageUrl) {
      // Attempt to convert URL to Base64 (might hit CORS, but common for data URIs)
      if (imageUrl.startsWith('data:image/')) {
        setFormData(prev => ({ ...prev, photo: imageUrl }));
      } else {
        // Simple proxy/fetch attempt could be made here, but for now we'll support data URIs and direct file drops
        // alert("সরাসরি লিঙ্ক থেকে ছবি আপলোড সমর্থিত নয়, দয়া করে ফাইলটি ড্রাগ করুন।");
        // Actually, many social media images work with text/uri-list. 
        // For a mes manager app, local file drag or data URI is safest.
      }
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      updateState(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === editingId ? { 
          ...m, 
          name: formData.name, 
          phone: formData.phone,
          photo: formData.photo
        } : m)
      }));
      setEditingId(null);
    } else {
      const newMember: Member = {
        id: generateId(),
        name: formData.name,
        phone: formData.phone,
        photo: formData.photo,
        joinDate: new Date().toISOString()
      };

      updateState(prev => ({
        ...prev,
        members: [...prev.members, newMember]
      }));
    }
    
    setFormData({ name: '', phone: '', photo: '' });
    setIsAdding(false);
  };

  const removeMember = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত যে আপনি এই সদস্যকে অপসারণ করতে চান? এটি পূর্বের ডাটাতে প্রভাব ফেলতে পারে।")) {
      updateState(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== id)
      }));
    }
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setFormData({ name: member.name, phone: member.phone || '', photo: member.photo || '' });
    setIsAdding(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">সদস্যরা</h1>
          <p className="text-gray-500 dark:text-gray-400">আপনার মেসের সকল সদস্য ম্যানেজ করুন</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingId(null);
              setFormData({ name: '', phone: '', photo: '' });
            } else {
              setIsAdding(true);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isAdding 
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400' 
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700'
          }`}
        >
          {isAdding ? 'বাতিল করুন' : <><UserPlus size={18} /> নতুন সদস্য যোগ করুন</>}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div 
              className="flex flex-col items-center gap-2"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={`relative group w-24 h-24 rounded-full transition-all duration-200 ${isDraggingOver ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                {formData.photo ? (
                  <>
                    <img src={formData.photo} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-colors"
                      title="ছবি মুছুন"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isDraggingOver ? 'text-indigo-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                    {isDraggingOver ? <Camera size={40} className="animate-bounce" /> : <User size={40} />}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Camera size={14} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} // Allow re-selecting same file
                  />
                </label>
              </div>
              <span className="text-[10px] text-gray-400">
                {isDraggingOver ? 'এখানে ছেড়ে দিন' : (formData.photo ? 'ছবি পরিবর্তন করুন' : 'ছবি যোগ করুন (Drag & Drop)')}
              </span>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">পুরো নাম</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="সদস্যের নাম লিখুন"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="017xxxxxxxx"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <button 
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', phone: '', photo: '' });
              }}
              className="px-6 py-2 rounded-xl font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              বাতিল
            </button>
            <button 
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              {editingId ? 'আপডেট করুন' : 'সদস্য সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.members.map((member, idx) => (
          <div key={member.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-slate-800" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-100 dark:border-slate-800">
                  {idx + 1}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
                  <Phone size={12} />
                  <span>{member.phone || 'ফোন রেকর্ড নেই'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => startEdit(member)}
                className="p-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => removeMember(member.id)}
                className="p-2 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {state.members.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
            এখনো কোনো সদস্য যোগ করা হয়নি। নতুন সদস্য যোগ করুন।
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberTab;
