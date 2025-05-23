import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { NETWORK, CONTRACT_ADDRESS, MODULE_NAME, DEFAULT_GAS_BUDGET } from './config';

// Create a singleton SuiClient instance
let suiClient: SuiClient | null = null;

/**
 * Get or initialize the SuiClient
 */
export function getSuiClient(): SuiClient {
  if (!suiClient) {
    suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  }
  return suiClient;
}

/**
 * Get coins owned by an address
 * @param owner The owner's address
 */
export async function getCoins(owner: string) {
  const client = getSuiClient();
  return await client.getCoins({
    owner,
  });
}

/**
 * Get objects owned by an address
 * @param owner The owner's address
 */
export async function getOwnedObjects(owner: string) {
  const client = getSuiClient();
  return await client.getOwnedObjects({
    owner,
  });
}

/**
 * Get object details
 * @param objectId The object ID
 */
export async function getObject(objectId: string) {
  const client = getSuiClient();
  return await client.getObject({
    id: objectId,
    options: {
      showContent: true,
      showDisplay: true,
      showType: true,
    },
  });
}

/**
 * Execute a move call transaction
 * @param signer The transaction signer
 * @param target The target function (module::function)
 * @param typeArguments Type arguments for the function
 * @param arguments Arguments for the function
 */
export async function executeTransaction(
  signer: any,
  target: string,
  typeArguments: string[] = [],
  args: any[] = []
) {
  const client = getSuiClient();
  
  const tx = new Transaction();
  
  // Add the move call
  const fullTarget = `${CONTRACT_ADDRESS}::${MODULE_NAME}::${target}`;
  tx.moveCall({
    target: fullTarget,
    typeArguments,
    arguments: args,
  });
  
  // Set gas budget
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  
  // Execute the transaction
  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}

/**
 * Create a new NFT
 * @param signer The transaction signer
 * @param name NFT name
 * @param description NFT description
 * @param url NFT image URL
 */
export async function createNFTTransaction(
  signer: any,
  name: string,
  description: string,
  url: string
) {
  const tx = new Transaction();
  
  // Add string arguments
  //const nameArg = tx.pure(name);
  //const descriptionArg = tx.pure(description);
 // const urlArg = tx.pure(url);
  
  // Add the move call
  const fullTarget = `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_nft`;
  tx.moveCall({
    target: fullTarget,
   // arguments: [nameArg, descriptionArg, urlArg],
  });
  
  // Set gas budget
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  
  // Execute the transaction
  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}

/**
 * List an NFT on the marketplace
 * @param signer The transaction signer
 * @param nftId The NFT object ID
 * @param price The listing price
 */
export async function listNFTTransaction(
  signer: any,
  nftId: string,
  price: number
) {
  const tx = new Transaction();
  
  // Use the NFT object
  const nft = tx.object(nftId);
  
  // Add price argument - renamed variable to avoid confusion
  //const priceValue = tx.pure(price);
  
  // Add the move call
  const fullTarget = `${CONTRACT_ADDRESS}::${MODULE_NAME}::list_nft`;
  tx.moveCall({
    target: fullTarget,
   // arguments: [nft, priceValue],
  });
  
  // Set gas budget
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  
  // Execute the transaction
  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}

/**
 * Buy an NFT from the marketplace
 * @param signer The transaction signer
 * @param listingId The listing object ID
 * @param price The price to pay
 */
export async function buyNFTTransaction(
  signer: any,
  listingId: string,
  price: number
) {
  const tx = new Transaction();
  
  // Split coins for payment
 // const [coin] = tx.splitCoins(tx.gas, [tx.pure(price)]);
  
  // Use the listing object
  const listing = tx.object(listingId);
  
  // Add the move call
  const fullTarget = `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_nft`;
  tx.moveCall({
    target: fullTarget,
    //arguments: [listing, coin],
  });
  
  // Set gas budget
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  
  // Execute the transaction
  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}

/**
 * Cancel an NFT listing
 * @param signer The transaction signer
 * @param listingId The listing object ID
 */
export async function cancelListingTransaction(
  signer: any,
  listingId: string
) {
  const tx = new Transaction();
  
  // Use the listing object
  const listing = tx.object(listingId);
  
  // Add the move call
  const fullTarget = `${CONTRACT_ADDRESS}::${MODULE_NAME}::cancel_listing`;
  tx.moveCall({
    target: fullTarget,
    arguments: [listing],
  });
  
  // Set gas budget
  tx.setGasBudget(DEFAULT_GAS_BUDGET);
  
  // Execute the transaction
  const result = await signer.signAndExecuteTransaction({
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}