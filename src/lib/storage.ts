// Admin storage utility with different prefix to avoid conflicts
const ADMIN_STORAGE_PREFIX = 'pemira_admin_';

export const adminStorage = {
  setItem: (key: string, value: string) => {
    localStorage.setItem(`${ADMIN_STORAGE_PREFIX}${key}`, value);
  },
  
  getItem: (key: string): string | null => {
    return localStorage.getItem(`${ADMIN_STORAGE_PREFIX}${key}`);
  },
  
  removeItem: (key: string) => {
    localStorage.removeItem(`${ADMIN_STORAGE_PREFIX}${key}`);
  },
  
  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(ADMIN_STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
};