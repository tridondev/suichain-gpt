import { getWalletAddress, getWalletProvider, isConnected } from './wallet';
import { 
  getOwnedObjects, 
  getObject, 
  createNFTTransaction,
  listNFTTransaction,
  buyNFTTransaction,
  cancelListingTransaction
} from '../utils/sui-client';

// Type definitions
interface NFT {
  id: string;
  name: string;
  description: string;
  url: string;
  owner: string;
}

interface MarketplaceListing {
  id: string;
  nftId: string;
  nftName: string;
  nftDescription: string;
  nftUrl: string;
  price: number;
  seller: string;
}

// State for NFTs and marketplace listings
let myNFTs: NFT[] = [];
let marketplaceListings: MarketplaceListing[] = [];

/**
 * Load NFTs owned by the connected wallet
 */
export async function loadNFTs(): Promise<void> {
  if (!isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  const address = getWalletAddress();
  
  try {
    // Get all objects owned by the wallet
    const { data: ownedObjects } = await getOwnedObjects(address);
    
    // Filter for NFT objects by looking at object types
    const nftObjects = ownedObjects.filter(obj => 
      obj.data && 
      obj.data.type && 
      obj.data.type.includes('::nft::NFT')
    );
    
    // Clear previous NFTs
    myNFTs = [];
    
    // Fetch and process each NFT's details
    for (const nftObj of nftObjects) {
      const objectId = nftObj.data?.objectId;
      if (objectId) {
        const nftDetails = await getObject(objectId);
        
        if (nftDetails.data?.content) {
          const content = nftDetails.data.content;
          
          // Extract NFT data from content
          const nft: NFT = {
            id: objectId,
            name: content.fields?.name || 'Unnamed NFT',
            description: content.fields?.description || 'No description',
            url: content.fields?.url || '',
            owner: address
          };
          
          myNFTs.push(nft);
        }
      }
    }
    
    // Render the NFTs to the DOM
    renderNFTs();
    
    console.log('Loaded NFTs:', myNFTs);
  } catch (error) {
    console.error('Error loading NFTs:', error);
    throw error;
  }
}

/**
 * Load marketplace listings
 */
export async function loadMarketplace(): Promise<void> {
  try {
    // In a real app, you would query for all marketplace listings
    // For this example, we'll use a mock implementation since we'd need a marketplace index
    
    // Clear previous listings
    marketplaceListings = [];
    
    // TODO: Replace with actual marketplace query
    // This would typically involve getting listings from an indexer or querying the chain
    
    // For now, let's add a mock implementation to list sample items
    // In a real implementation, you would query a marketplace index
    
    // Render the marketplace listings to the DOM
    renderMarketplaceListings();
    
    console.log('Loaded marketplace listings:', marketplaceListings);
  } catch (error) {
    console.error('Error loading marketplace:', error);
    throw error;
  }
}

/**
 * Create a new NFT
 */
export async function createNFT(name: string, description: string, url: string): Promise<void> {
  if (!isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const walletProvider = getWalletProvider();
    
    // Create the NFT
    const result = await createNFTTransaction(
      walletProvider,
      name,
      description,
      url
    );
    
    console.log('NFT creation result:', result);
    
    // Reload NFTs to show the new one
    await loadNFTs();
  } catch (error) {
    console.error('Error creating NFT:', error);
    throw error;
  }
}

/**
 * List an NFT on the marketplace
 */
export async function listNFT(nftId: string, price: number): Promise<void> {
  if (!isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const walletProvider = getWalletProvider();
    
    // List the NFT
    const result = await listNFTTransaction(
      walletProvider,
      nftId,
      price
    );
    
    console.log('NFT listing result:', result);
    
    // Reload NFTs and marketplace
    await Promise.all([loadNFTs(), loadMarketplace()]);
  } catch (error) {
    console.error('Error listing NFT:', error);
    throw error;
  }
}

/**
 * Buy an NFT from the marketplace
 */
export async function buyNFT(listingId: string, price: number): Promise<void> {
  if (!isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const walletProvider = getWalletProvider();
    
    // Buy the NFT
    const result = await buyNFTTransaction(
      walletProvider,
      listingId,
      price
    );
    
    console.log('NFT purchase result:', result);
    
    // Reload NFTs and marketplace
    await Promise.all([loadNFTs(), loadMarketplace()]);
  } catch (error) {
    console.error('Error buying NFT:', error);
    throw error;
  }
}

/**
 * Cancel an NFT listing
 */
export async function cancelNFTListing(listingId: string): Promise<void> {
  if (!isConnected()) {
    throw new Error('Wallet not connected');
  }
  
  try {
    const walletProvider = getWalletProvider();
    
    // Cancel the listing
    const result = await cancelListingTransaction(
      walletProvider,
      listingId
    );
    
    console.log('Listing cancellation result:', result);
    
    // Reload NFTs and marketplace
    await Promise.all([loadNFTs(), loadMarketplace()]);
  } catch (error) {
    console.error('Error cancelling listing:', error);
    throw error;
  }
}

/**
 * Render NFTs to the DOM
 */
function renderNFTs(): void {
  const nftContainer = document.getElementById('nft-container');
  if (!nftContainer) return;
  
  if (myNFTs.length === 0) {
    nftContainer.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted">You don't have any NFTs yet. Create one below!</p>
      </div>
    `;
    return;
  }
  
  // Generate HTML for each NFT
  const nftHtml = myNFTs.map(nft => `
    <div class="col">
      <div class="card h-100 nft-card">
        <img src="${nft.url}" class="card-img-top nft-image" alt="${nft.name}">
        <div class="card-body">
          <h5 class="card-title">${nft.name}</h5>
          <p class="card-text">${nft.description}</p>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary list-nft-btn" data-nft-id="${nft.id}">List for Sale</button>
        </div>
      </div>
    </div>
  `).join('');
  
  nftContainer.innerHTML = nftHtml;
  
  // Add event listeners for list buttons
  document.querySelectorAll('.list-nft-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const nftId = target.getAttribute('data-nft-id');
      
      if (nftId) {
        showListNFTModal(nftId);
      }
    });
  });
}

/**
 * Render marketplace listings to the DOM
 */
function renderMarketplaceListings(): void {
  const marketplaceContainer = document.getElementById('marketplace-container');
  if (!marketplaceContainer) return;
  
  if (marketplaceListings.length === 0) {
    marketplaceContainer.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted">No NFTs are currently listed in the marketplace.</p>
      </div>
    `;
    return;
  }
  
  // Generate HTML for each listing
  const listingsHtml = marketplaceListings.map(listing => `
    <div class="col">
      <div class="card h-100 nft-card">
        <img src="${listing.nftUrl}" class="card-img-top nft-image" alt="${listing.nftName}">
        <div class="card-body">
          <h5 class="card-title">${listing.nftName}</h5>
          <p class="card-text">${listing.nftDescription}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="fw-bold">${listing.price} SUI</span>
            <small class="text-muted">Seller: ${formatAddress(listing.seller)}</small>
          </div>
        </div>
        <div class="card-footer">
          ${listing.seller.toLowerCase() === getWalletAddress().toLowerCase()
            ? `<button class="btn btn-warning cancel-listing-btn" data-listing-id="${listing.id}">Cancel Listing</button>`
            : `<button class="btn btn-success buy-nft-btn" data-listing-id="${listing.id}" data-price="${listing.price}">Buy Now</button>`
          }
        </div>
      </div>
    </div>
  `).join('');
  
  marketplaceContainer.innerHTML = listingsHtml;
  
  // Add event listeners for buy buttons
  document.querySelectorAll('.buy-nft-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const listingId = target.getAttribute('data-listing-id');
      const priceStr = target.getAttribute('data-price');
      
      if (listingId && priceStr) {
        const price = parseFloat(priceStr);
        try {
          await buyNFT(listingId, price);
        } catch (error) {
          console.error('Error buying NFT:', error);
          showErrorAlert('Failed to buy NFT');
        }
      }
    });
  });
  
  // Add event listeners for cancel buttons
  document.querySelectorAll('.cancel-listing-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const listingId = target.getAttribute('data-listing-id');
      
      if (listingId) {
        try {
          await cancelNFTListing(listingId);
        } catch (error) {
          console.error('Error cancelling listing:', error);
          showErrorAlert('Failed to cancel listing');
        }
      }
    });
  });
}

/**
 * Show modal for listing an NFT
 */
function showListNFTModal(nftId: string): void {
  // Find the NFT
  const nft = myNFTs.find(n => n.id === nftId);
  if (!nft) return;
  
  // Create modal
  const modalHtml = `
    <div class="modal fade" id="listNFTModal" tabindex="-1" aria-labelledby="listNFTModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="listNFTModalLabel">List "${nft.name}" for Sale</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="list-nft-form">
              <div class="mb-3">
                <label for="nft-price" class="form-label">Price (SUI)</label>
                <input type="number" class="form-control" id="nft-price" min="0.001" step="0.001" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirm-list-nft">List for Sale</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to body
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);
  
  // Initialize modal
  const modal = new bootstrap.Modal(document.getElementById('listNFTModal'));
  modal.show();
  
  // Add event listener for confirmation
  document.getElementById('confirm-list-nft')?.addEventListener('click', async () => {
    const priceInput = document.getElementById('nft-price') as HTMLInputElement;
    const price = parseFloat(priceInput.value);
    
    if (price > 0) {
      try {
        modal.hide();
        await listNFT(nftId, price);
      } catch (error) {
        console.error('Error listing NFT:', error);
        showErrorAlert('Failed to list NFT');
      } finally {
        // Remove modal from DOM
        document.getElementById('listNFTModal')?.remove();
        document.querySelector('.modal-backdrop')?.remove();
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
      }
    }
  });
  
  // Remove modal when hidden
  document.getElementById('listNFTModal')?.addEventListener('hidden.bs.modal', () => {
    document.getElementById('listNFTModal')?.remove();
    document.querySelector('.modal-backdrop')?.remove();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
  });
}

/**
 * Format address for display (truncate)
 */
function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Show error alert
 */
function showErrorAlert(message: string): void {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Add Bootstrap modal class if not present
declare class bootstrap {
  static Modal: any;
}