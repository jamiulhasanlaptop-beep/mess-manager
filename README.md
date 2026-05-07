# 🍽️ মেস ম্যানেজার - মিল ট্র্যাকিং সিস্টেম
(Mess Manager - Meal Tracking System)

একটি পূর্ণাঙ্গ এবং আধুনিক মেস ম্যানেজমেন্ট ওয়েব অ্যাপ্লিকেশন। যার মাধ্যমে মেস মেম্বারদের মিল, বাজার খরচ, এবং মাসিক হিসাব রাখা যায় অত্যন্ত সহজে। এটি বিশেষ করে ছাত্র এবং কর্মজীবীদের কথা মাথায় রেখে তৈরি করা হয়েছে।

## ✨ বৈশিষ্ট্যসমূহ (Features)

- 🔐 **নিরাপদ লগইন**: গুগল এবং ইমেইল/পাসওয়ার্ড ভিত্তিক সিকিউর অথেন্টিকেশন।
- 📊 **স্মার্ট ড্যাশবোর্ড**: এক পলকে মেসের বর্তমান ব্যালেন্স, মিল রেট এবং মিলের পরিসংখ্যান।
- 👥 **সদস্য ব্যবস্থাপনা**: মেম্বার লিস্ট আপডেট এবং প্রোফাইল দেখার ব্যবস্থা।
- 🛒 **বাজার খরচ**: প্রতিদিনের বাজার খরচের রেকর্ড এবং বাজারের বিবরণ।
- 📅 **মিল ট্র্যাকিং**: মেম্বারদের ব্রেকফাস্ট, লাঞ্চ এবং ডিনারের রেকর্ড রাখা।
- 💰 **জমা এবং খরচ**: মেম্বারদের জমা টাকা এবং অন্যান্য অফিসিয়াল খরচের ট্র্যাকিং।
- 📑 **হিসাব-নিকাশ**: স্বয়ংক্রিয়ভাবে মিল রেট ক্যালকুলেশন এবং মাসিক রিপোর্ট জেনারেট করা।
- 🌓 **ডার্ক মোড**: আরামদায়ক ব্যবহারের জন্য ডার্ক এবং লাইট মোড সাপোর্ট।
- 📱 **রেসপন্সিভ ডিজাইন**: মোবাইল, ট্যাবলেট এবং পিসি সব ডিভাইসেই ব্যবহারযোগ্য।

## 🚀 টেক স্ট্যাক (Tech Stack)

- **Frontend**: Vite + React + Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Icons**: Lucide React
- **Charts**: Recharts

## 🛠️ সেটআপ (Installation)

১. প্রজেক্টটি ক্লোন করুন:
```bash
git clone https://github.com/YourUsername/mess-manager.git
cd mess-manager
```

২. ডিপেন্ডেন্সি ইনস্টল করুন:
```bash
npm install
```

৩. ফায়ারবেস কনফিগারেশন:
- `.env.example` ফাইলটি কপি করে `.env` নাম দিন।
- ফায়ারবেস কনসোল থেকে আপনার প্রজেক্টের কনফিগারেশন কীগুলো নিচের ভেরিয়েবলগুলোতে সেট করুন:
  ```env
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  VITE_FIREBASE_DATABASE_ID=(default)
  ```

৪. অ্যাপটি রান করুন:
```bash
npm run dev
```

## 🤝 অবদান (Contributing)
আপনি যদি এই প্রজেক্টে অবদান রাখতে চান, তাহলে একটি পুল রিকোয়েস্ট (Pull Request) পাঠাতে পারেন। যে কোনো ফিডব্যাক বা সমস্যার জন্য ইস্যু (Issue) ওপেন করুন।

## 📄 লাইসেন্স (License)
এই প্রজেক্টটি [MIT License](LICENSE) এর অধীনে লাইসেন্সপ্রাপ্ত।
