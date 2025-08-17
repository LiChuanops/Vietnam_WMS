// src/utils/storageUtils.js
export const storageUtils = {
  // 统一的存储方法
  getItem: (key, storageType = 'localStorage') => {
    try {
      const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  },

  setItem: (key, value, storageType = 'localStorage') => {
    try {
      const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage
      storage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error setting item to storage:', error)
    }
  },

  removeItem: (key, storageType = 'localStorage') => {
    try {
      const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage
      storage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from storage:', error)
    }
  },

  // 清除指定前缀的所有keys
  clearByPrefix: (prefix, storageType = 'localStorage') => {
    try {
      const storage = storageType === 'sessionStorage' ? sessionStorage : localStorage
      const keysToRemove = []
      
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => storage.removeItem(key))
    } catch (error) {
      console.error('Error clearing storage by prefix:', error)
    }
  }
}
