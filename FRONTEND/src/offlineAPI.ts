// Modo Offline para testes sem API
import type { User } from "firebase/auth";

export interface OfflineProfile {
  id: string;
  name: string;
  income: number;
}

export interface OfflineBudget {
  id: string;
  profileId: string;
  category: string;
  percent: number;
}

export interface OfflineExpense {
  id: string;
  profileId: string;
  value: number;
  date: string;
  description: string;
  category: string;
  recurring: boolean;
}

// Simula localStorage para persistência
class StorageManager {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`${this.prefix}_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(`${this.prefix}_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
}

// Mock API com persistência em localStorage
export class OfflineAPI {
  private storage: StorageManager;
  private currentUser: User | null = null;
  
  constructor() {
    this.storage = new StorageManager('org_financeiro');
  }

  setUser(user: User | null) {
    this.currentUser = user;
  }

  // Profiles API
  async getProfiles(): Promise<OfflineProfile[]> {
    if (!this.currentUser) return [];
    return this.storage.getItem<OfflineProfile[]>(`profiles_${this.currentUser.uid}`, []);
  }

  async createProfile(name: string): Promise<OfflineProfile> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    const profiles = await this.getProfiles();
    const newProfile: OfflineProfile = {
      id: `p_${Date.now()}`,
      name,
      income: 0
    };
    
    profiles.push(newProfile);
    this.storage.setItem(`profiles_${this.currentUser.uid}`, profiles);
    return newProfile;
  }

  async updateProfileIncome(profileId: string, income: number): Promise<OfflineProfile> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    const profiles = await this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) throw new Error('Perfil não encontrado');
    
    profile.income = income;
    this.storage.setItem(`profiles_${this.currentUser.uid}`, profiles);
    return profile;
  }

  // Budgets API
  async getBudgets(profileId: string): Promise<OfflineBudget[]> {
    if (!this.currentUser) return [];
    return this.storage.getItem<OfflineBudget[]>(
      `budgets_${this.currentUser.uid}_${profileId}`,
      []
    );
  }

  async saveBudgets(profileId: string, categories: {key: string, percent: number}[]): Promise<OfflineBudget[]> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    const budgets: OfflineBudget[] = categories.map(cat => ({
      id: `b_${Date.now()}_${cat.key}`,
      profileId,
      category: cat.key,
      percent: cat.percent
    }));
    
    this.storage.setItem(`budgets_${this.currentUser.uid}_${profileId}`, budgets);
    return budgets;
  }

  // Expenses API
  async getExpenses(profileId: string): Promise<OfflineExpense[]> {
    if (!this.currentUser) return [];
    return this.storage.getItem<OfflineExpense[]>(
      `expenses_${this.currentUser.uid}_${profileId}`,
      []
    );
  }

  async addExpense(profileId: string, expense: Omit<OfflineExpense, 'id' | 'profileId'>): Promise<OfflineExpense> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    const expenses = await this.getExpenses(profileId);
    const newExpense: OfflineExpense = {
      id: `e_${Date.now()}`,
      profileId,
      ...expense
    };
    
    expenses.push(newExpense);
    this.storage.setItem(`expenses_${this.currentUser.uid}_${profileId}`, expenses);
    return newExpense;
  }

  async updateExpense(expenseId: string, update: Partial<Omit<OfflineExpense, 'id' | 'profileId'>>): Promise<OfflineExpense> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    // Precisamos verificar todas as despesas de todos os perfis
    const profiles = await this.getProfiles();
    
    for (const profile of profiles) {
      const expenses = await this.getExpenses(profile.id);
      const index = expenses.findIndex(e => e.id === expenseId);
      
      if (index !== -1) {
        expenses[index] = { ...expenses[index], ...update };
        this.storage.setItem(`expenses_${this.currentUser.uid}_${profile.id}`, expenses);
        return expenses[index];
      }
    }
    
    throw new Error('Despesa não encontrada');
  }

  async deleteExpense(expenseId: string): Promise<void> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    
    // Precisamos verificar todas as despesas de todos os perfis
    const profiles = await this.getProfiles();
    
    for (const profile of profiles) {
      const expenses = await this.getExpenses(profile.id);
      const index = expenses.findIndex(e => e.id === expenseId);
      
      if (index !== -1) {
        expenses.splice(index, 1);
        this.storage.setItem(`expenses_${this.currentUser.uid}_${profile.id}`, expenses);
        return;
      }
    }
    
    throw new Error('Despesa não encontrada');
  }
}

// Singleton para uso em toda a aplicação
export const offlineAPI = new OfflineAPI();
