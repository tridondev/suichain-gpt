// Network configuration
export const NETWORK = 'devnet';  // Options: 'devnet', 'testnet', 'mainnet'

// Contract configuration
export const CONTRACT_ADDRESS = '0x0c732e6326FC2A5c21cB40ca35465e6A0C5A32Ec14cb0746e2b52b5e04597234'; // Replace with your deployed contract address
export const MODULE_NAME = 'marketplace';
export const CREATE_NFT_FUNCTION = 'create_nft';
export const LIST_NFT_FUNCTION = 'list_nft';
export const BUY_NFT_FUNCTION = 'buy_nft';
export const CANCEL_LISTING_FUNCTION = 'cancel_listing';

// Gas budget for transactions (in MIST)
export const DEFAULT_GAS_BUDGET = 10000000;

// Local storage keys
export const STORAGE_WALLET_KEY = 'sui_marketplace_wallet';