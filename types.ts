
export interface Member {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  joinDate: string;
}

export interface MealCounts {
  breakfast: number; // usually 0 or 1
  lunch: number;
  dinner: number;
}

export interface DailyEntry {
  date: string; // ISO string YYYY-MM-DD
  bazaarAmount: number;
  bazaarDescription: string;
  shopperId?: string;
  meals: Record<string, MealCounts>; // memberId -> counts
}

export interface Deposit {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface AppState {
  members: Member[];
  dailyEntries: Record<string, DailyEntry>; // date -> entry
  deposits: Deposit[];
  otherExpenses: number;
}
