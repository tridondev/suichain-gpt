import { STORAGE_WALLET_KEY } from '../utils/config';

// Wallet state
let walletProvider: any = null;
let walletAddress: string = '';
let connected: boolean = false;

/**
 * Initialize the wallet connection
 */
export async function initializeWallet(): Promise<void> {
  // Check if window.suiWallet exists
  if (typeof window.suiWallet === 'undefined') {
    console.warn('Sui wallet extension not found. Please install it first.');
    return;
  }
  
  try {
    walletProvider = window.suiWallet;
    
    // Check if already connected from local storage
    const savedAddress = localStorage.getItem(STORAGE_WALLET_KEY);
    if (savedAddress) {
      // Verify the connection is still valid
      const { success, accounts } = await walletProvider.getAccounts();
      
      if (success && accounts.length > 0) {
        walletAddress = accounts[0];
        connected = true;
        console.log('Wallet reconnected:', walletAddress);
      } else {
        // Clear invalid storage data
        localStorage.removeItem(STORAGE_WALLET_KEY);
      }
    }
    
    console.log('Wallet initialized successfully');
  } catch (error) {
    console.error('Error initializing wallet:', error);
    throw new Error('Failed to initialize wallet');
  }
}

/**
 * Connect to wallet
 */
export async function connectWallet(): Promise<void> {
  if (!walletProvider) {
    throw new Error('Wallet provider not initialized');
  }
  
  try {
    // Request connection
    const connectResult = await walletProvider.requestPermissions();
    if (!connectResult.success) {
      throw new Error('User rejected wallet connection');
    }
    
    // Get accounts
    const { success, accounts } = await walletProvider.getAccounts();
    
    if (success && accounts.length > 0) {
      walletAddress = accounts[0];
      connected = true;
      
      // Save to local storage
      localStorage.setItem(STORAGE_WALLET_KEY, walletAddress);
      
      console.log('Wallet connected:', walletAddress);
    } else {
      throw new Error('No accounts found or user rejected permission');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  if (!walletProvider) {
    throw new Error('Wallet provider not initialized');
  }
  
  try {
    // Clear local state
    walletAddress = '';
    connected = false;
    
    // Clear from local storage
    localStorage.removeItem(STORAGE_WALLET_KEY);
    
    console.log('Wallet disconnected');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    throw error;
  }
}

/**
 * Check if wallet is connected
 */
export function isConnected(): boolean {
  return connected;
}

/**
 * Get wallet address
 */
export function getWalletAddress(): string {
  return walletAddress;
}

/**
 * Get wallet provider for transactions
 */
export function getWalletProvider(): any {
  return walletProvider;
}

/**
 * Execute a transaction using the connected wallet
 */
export async function executeWalletTransaction(tx: any): Promise<any> {
  if (!walletProvider || !connected) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const result = await walletProvider.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error('Error executing wallet transaction:', error);
    throw error;
  }
}

// Add TypeScript declarations for window.suiWallet
declare global {
  interface Window {
    suiWallet?: any;
  }
}