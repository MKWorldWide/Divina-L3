/**
 * GameDin L3 - State Management
 * 
 * This module provides a centralized state management solution using Zustand
 * with middleware for persistence, logging, and optimizations.
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { v4 as uuidv4 } from 'uuid';
import { throttle } from 'lodash';

// Types
/** @typedef {import('zustand').StateCreator} StateCreator */

/**
 * Create a namespaced store with middleware
 * @param {string} name - Store name for devtools and storage
 * @param {Function} storeCreator - Store creator function
 * @param {Object} [options] - Options for the store
 * @param {boolean} [options.persist] - Whether to persist the store
 * @param {Array<string>} [options.persistKeys] - Keys to persist (if not all)
 * @param {boolean} [options.devtools] - Whether to enable devtools
 * @param {boolean} [options.immer] - Whether to use Immer for state updates
 * @returns {Function} A hook to use the store
 */
const createStore = (name, storeCreator, options = {}) => {
  const {
    persist: shouldPersist = true,
    persistKeys,
    devtools: enableDevtools = process.env.NODE_ENV !== 'production',
    immer: useImmer = true,
  } = options;

  let storeCreatorWithMiddleware = storeCreator;

  // Apply Immer middleware for immutable updates
  if (useImmer) {
    storeCreatorWithMiddleware = immer(storeCreatorWithMiddleware);
  }

  // Apply devtools middleware
  if (enableDevtools) {
    storeCreatorWithMiddleware = devtools(storeCreatorWithMiddleware, {
      name,
      anonymousActionType: `${name}/anonymous`,
    });
  }

  // Apply persistence middleware
  if (shouldPersist && typeof window !== 'undefined') {
    storeCreatorWithMiddleware = persist(storeCreatorWithMiddleware, {
      name: `${name}-store`,
      partialize: persistKeys ? (state) => {
        const persistedState = {};
        persistKeys.forEach((key) => {
          if (state[key] !== undefined) {
            persistedState[key] = state[key];
          }
        });
        return persistedState;
      } : undefined,
      version: 1,
      // Use local storage for persistence
      getStorage: () => localStorage,
      // Handle migration if needed
      migrate: (persistedState, version) => {
        // Migration logic here if needed
        return persistedState;
      },
    });
  }

  // Create the store
  return create(
    subscribeWithSelector(storeCreatorWithMiddleware),
    { name }
  );
};

/**
 * Wallet Store
 * Manages wallet connection and account state
 */
const useWalletStore = createStore('wallet', (set, get) => ({
  // State
  isConnected: false,
  isConnecting: false,
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  error: null,
  walletType: null, // 'metamask', 'walletconnect', etc.
  
  // Actions
  connect: async (walletType = 'metamask') => {
    try {
      set({ isConnecting: true, error: null });
      
      // Simulate wallet connection
      // In a real app, this would use Web3Modal, Web3React, or similar
      const mockAccount = `0x${uuidv4().replace(/-/g, '')}`;
      
      set({
        isConnected: true,
        isConnecting: false,
        account: mockAccount,
        chainId: 1, // Mainnet
        walletType,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        isConnecting: false, 
        error: error.message || 'Failed to connect wallet',
      });
      return false;
    }
  },
  
  disconnect: () => {
    set({
      isConnected: false,
      account: null,
      chainId: null,
      provider: null,
      signer: null,
      walletType: null,
    });
  },
  
  switchChain: async (chainId) => {
    // Implementation for switching chains
    set({ chainId });
    return true;
  },
  
  // Listen for account/chain changes
  subscribeToEvents: () => {
    if (typeof window === 'undefined') return () => {};
    
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        get().disconnect();
      } else {
        set({ account: accounts[0] });
      }
    };
    
    const handleChainChanged = (chainId) => {
      set({ chainId: parseInt(chainId, 16) });
    };
    
    // In a real app, you would subscribe to the provider events here
    // provider.on('accountsChanged', handleAccountsChanged);
    // provider.on('chainChanged', handleChainChanged);
    
    // Return cleanup function
    return () => {
      // provider.off('accountsChanged', handleAccountsChanged);
      // provider.off('chainChanged', handleChainChanged);
    };
  },
}), {
  persist: true,
  persistKeys: ['isConnected', 'account', 'chainId', 'walletType'],
});

/**
 * UI Store
 * Manages UI state like theme, modals, toasts, etc.
 */
const useUIStore = createStore('ui', (set) => ({
  // Theme
  theme: 'light',
  
  // Modals
  modals: {},
  
  // Toasts
  toasts: [],
  
  // Actions
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light',
  })),
  
  // Modal management
  openModal: (name, props = {}) => set((state) => ({
    modals: {
      ...state.modals,
      [name]: { isOpen: true, ...props },
    },
  })),
  
  closeModal: (name) => set((state) => ({
    modals: {
      ...state.modals,
      [name]: { ...state.modals[name], isOpen: false },
    },
  })),
  
  // Toast management
  addToast: (message, options = {}) => {
    const id = uuidv4();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      onDismiss: options.onDismiss,
    };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    
    // Auto-dismiss
    if (toast.duration !== 0) {
      setTimeout(() => {
        useUIStore.getState().removeToast(id);
      }, toast.duration);
    }
    
    return id;
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  })),
  
  // Other UI state
  setLoading: (key, isLoading) => set((state) => ({
    loading: {
      ...state.loading,
      [key]: isLoading,
    },
  })),
}), {
  persist: true,
  persistKeys: ['theme'],
});

/**
 * Game State Store
 * Manages game-related state
 */
const useGameStore = createStore('game', (set, get) => ({
  // Game state
  currentGame: null,
  playerState: {
    level: 1,
    xp: 0,
    achievements: [],
    inventory: [],
    stats: {},
  },
  
  // Game settings
  settings: {
    sound: true,
    music: true,
    notifications: true,
    controlScheme: 'keyboard', // 'keyboard', 'gamepad', 'touch'
  },
  
  // Actions
  startGame: (gameId) => {
    // Load game data and initialize state
    set({
      currentGame: gameId,
      playerState: {
        ...get().playerState,
        // Reset game-specific state
      },
    });
  },
  
  updatePlayerState: (updates) => {
    set((state) => ({
      playerState: {
        ...state.playerState,
        ...updates,
      },
    }));
  },
  
  addXp: (amount) => {
    set((state) => {
      const newXp = state.playerState.xp + amount;
      const xpToNextLevel = getXpForLevel(state.playerState.level + 1);
      
      if (newXp >= xpToNextLevel) {
        // Level up!
        return {
          playerState: {
            ...state.playerState,
            level: state.playerState.level + 1,
            xp: newXp - xpToNextLevel,
          },
        };
      }
      
      // Just add XP
      return {
        playerState: {
          ...state.playerState,
          xp: newXp,
        },
      };
    });
  },
  
  // Helper function to calculate XP needed for a level
  getXpForLevel: (level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },
  
  // Settings actions
  updateSettings: (updates) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...updates,
      },
    }));
  },
}), {
  persist: true,
  persistKeys: ['playerState', 'settings'],
});

/**
 * Token Store
 * Manages token balances and approvals
 */
const useTokenStore = createStore('tokens', (set) => ({
  // Token balances
  balances: {},
  
  // Token allowances
  allowances: {},
  
  // Token metadata
  metadata: {},
  
  // Actions
  setBalance: (tokenAddress, balance) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress.toLowerCase()]: balance,
      },
    }));
  },
  
  setAllowance: (tokenAddress, spender, amount) => {
    const tokenKey = tokenAddress.toLowerCase();
    set((state) => ({
      allowances: {
        ...state.allowances,
        [tokenKey]: {
          ...(state.allowances[tokenKey] || {}),
          [spender.toLowerCase()]: amount,
        },
      },
    }));
  },
  
  // Fetch token metadata
  fetchTokenMetadata: async (tokenAddress) => {
    // Implementation would fetch token metadata from the blockchain
    const metadata = {
      name: 'GameDin Token',
      symbol: 'GDI',
      decimals: 18,
      // ... other metadata
    };
    
    set((state) => ({
      metadata: {
        ...state.metadata,
        [tokenAddress.toLowerCase()]: metadata,
      },
    }));
    
    return metadata;
  },
}), {
  persist: true,
  persistKeys: ['balances', 'allowances', 'metadata'],
});

/**
 * Transaction Store
 * Manages transaction state and history
 */
const useTransactionStore = createStore('transactions', (set) => ({
  // Pending transactions
  pending: {},
  
  // Transaction history
  history: [],
  
  // Actions
  addPending: (txHash, txData) => {
    const id = txHash || `tx-${Date.now()}`;
    
    set((state) => ({
      pending: {
        ...state.pending,
        [id]: {
          ...txData,
          hash: id,
          submittedAt: Date.now(),
          status: 'pending',
        },
      },
    }));
    
    return id;
  },
  
  updateStatus: (txHash, status, receipt = null) => {
    set((state) => {
      const tx = state.pending[txHash];
      if (!tx) return state;
      
      const updatedTx = {
        ...tx,
        status,
        completedAt: ['confirmed', 'failed'].includes(status) ? Date.now() : tx.completedAt,
        receipt,
      };
      
      // Move to history if completed
      if (['confirmed', 'failed'].includes(status)) {
        const { [txHash]: _, ...remainingPending } = state.pending;
        
        return {
          pending: remainingPending,
          history: [updatedTx, ...state.history].slice(0, 100), // Keep last 100 txs
        };
      }
      
      // Otherwise just update the pending tx
      return {
        pending: {
          ...state.pending,
          [txHash]: updatedTx,
        },
      };
    });
  },
  
  // Clear old transactions
  clearHistory: (maxAge = 30 * 24 * 60 * 60 * 1000) => {
    const cutoff = Date.now() - maxAge;
    
    set((state) => ({
      history: state.history.filter((tx) => tx.completedAt > cutoff),
    }));
  },
}));

/**
 * Hook to use the store with selector and equality function
 * @param {Function} selector - Selector function
 * @param {Function} [equalityFn] - Equality function for comparison (default: shallow)
 * @returns {any} Selected state
 */
function useStore(store, selector, equalityFn = shallow) {
  return store(selector, equalityFn);
}

// Export all stores and hooks
export {
  useWalletStore,
  useUIStore,
  useGameStore,
  useTokenStore,
  useTransactionStore,
  useStore,
  createStore,
};

// Initialize default stores
if (typeof window !== 'undefined') {
  // Initialize any default state or subscriptions here
  const initStores = () => {
    // Example: Subscribe to wallet store changes
    const unsubscribe = useWalletStore.subscribe(
      (state) => state.account,
      (account) => {
        if (account) {
          // User connected their wallet
          console.log('Wallet connected:', account);
        } else {
          // User disconnected their wallet
          console.log('Wallet disconnected');
        }
      },
      { fireImmediately: true }
    );
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  };
  
  // Initialize stores when the app loads
  initStores();
}

// Export a hook to use the stores with TypeScript support
export const useStores = () => ({
  wallet: useWalletStore(),
  ui: useUIStore(),
  game: useGameStore(),
  tokens: useTokenStore(),
  transactions: useTransactionStore(),
});
