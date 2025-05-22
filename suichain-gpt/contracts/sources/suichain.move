module sui_marketplace::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::url::{Self, Url};
    use sui::event;
    use sui::dynamic_object_field as dof;
    use std::string::{Self, String};

    // ===== Errors =====
    const ENOT_OWNER: u64 = 0;
    const EINCORRECT_PAYMENT: u64 = 1;
    const EINSUFFICIENT_FUNDS: u64 = 2;
    const ELISTING_NOT_FOUND: u64 = 3;
    const EWRONG_LISTING_OWNER: u64 = 4;

    // ===== Objects =====
    /// An NFT representing a digital asset
    struct NFT has key, store {
        id: UID,
        /// Name of the NFT
        name: String,
        /// Description of the NFT
        description: String,
        /// URL to the NFT image
        url: Url,
        /// The creator of the NFT
        creator: address,
    }

    /// A listing of an NFT for sale in the marketplace
    struct Listing has key, store {
        id: UID,
        /// ID of the NFT being sold
        nft_id: ID,
        /// Price in SUI tokens
        price: u64,
        /// Seller's address
        seller: address,
    }

    // ===== Events =====
    /// Event emitted when a new NFT is created
    struct NFTCreated has copy, drop {
        nft_id: ID,
        name: String,
        creator: address,
    }

    /// Event emitted when an NFT is listed for sale
    struct NFTListed has copy, drop {
        nft_id: ID,
        listing_id: ID,
        price: u64,
        seller: address,
    }

    /// Event emitted when an NFT is sold
    struct NFTSold has copy, drop {
        nft_id: ID,
        listing_id: ID,
        price: u64,
        seller: address,
        buyer: address,
    }

    /// Event emitted when a listing is cancelled
    struct ListingCancelled has copy, drop {
        listing_id: ID,
        nft_id: ID,
        seller: address,
    }

    // ===== Public Functions =====
    /// Create a new NFT
    public entry fun create_nft(
        name: vector<u8>,
        description: vector<u8>,
        url_string: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Create a new NFT
        let nft = NFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url_string),
            creator: sender,
        };
        
        // Emit NFT created event
        let nft_id = object::id(&nft);
        event::emit(NFTCreated {
            nft_id,
            name: nft.name,
            creator: sender,
        });
        
        // Transfer NFT to the sender
        transfer::public_transfer(nft, sender);
    }

    /// List an NFT for sale
    public entry fun list_nft(
        nft: NFT,
        price: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let nft_id = object::id(&nft);
        
        // Create a new listing
        let listing = Listing {
            id: object::new(ctx),
            nft_id,
            price,
            seller: sender,
        };
        
        // Emit NFT listed event
        let listing_id = object::id(&listing);
        event::emit(NFTListed {
            nft_id,
            listing_id,
            price,
            seller: sender,
        });
        
        // Store the NFT in the listing as a dynamic field
        dof::add(&mut listing.id, b"nft", nft);
        
        // Transfer listing to the sender (they can cancel it later if needed)
        transfer::public_transfer(listing, sender);
    }

    /// Buy an NFT from the marketplace
    public entry fun buy_nft(
        listing: Listing,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if payment amount matches the price
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= listing.price, EINCORRECT_PAYMENT);
        
        // Take the payment amount from the coin
        let paid = if (payment_amount == listing.price) {
            payment
        } else {
            // Split the coin and return the change
            let change_amount = payment_amount - listing.price;
            let paid = coin::split(&mut payment, listing.price, ctx);
            transfer::public_transfer(payment, sender);
            paid
        };
        
        // Transfer payment to the seller
        transfer::public_transfer(paid, listing.seller);
        
        // Get the NFT from the listing
        let nft: NFT = dof::remove(&mut listing.id, b"nft");
        
        // Emit NFT sold event
        let listing_id = object::id(&listing);
        let nft_id = object::id(&nft);
        event::emit(NFTSold {
            nft_id,
            listing_id,
            price: listing.price,
            seller: listing.seller,
            buyer: sender,
        });
        
        // Transfer NFT to the buyer
        transfer::public_transfer(nft, sender);
        
        // Delete the listing
        let Listing { id, nft_id: _, price: _, seller: _ } = listing;
        object::delete(id);
    }

    /// Cancel an NFT listing
    public entry fun cancel_listing(
        listing: Listing,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if sender is the seller
        assert!(listing.seller == sender, EWRONG_LISTING_OWNER);
        
        // Get the NFT from the listing
        let nft: NFT = dof::remove(&mut listing.id, b"nft");
        
        // Emit listing cancelled event
        let listing_id = object::id(&listing);
        let nft_id = object::id(&nft);
        event::emit(ListingCancelled {
            listing_id,
            nft_id,
            seller: sender,
        });
        
        // Return the NFT to the seller
        transfer::public_transfer(nft, sender);
        
        // Delete the listing
        let Listing { id, nft_id: _, price: _, seller: _ } = listing;
        object::delete(id);
    }

    // ===== View Functions =====
    /// Get NFT info - for off-chain access
    public fun get_nft_info(nft: &NFT): (ID, String, String, Url, address) {
        (
            object::id(nft),
            nft.name,
            nft.description,
            nft.url,
            nft.creator
        )
    }

    /// Get listing info - for off-chain access
    public fun get_listing_info(listing: &Listing): (ID, ID, u64, address) {
        (
            object::id(listing),
            listing.nft_id,
            listing.price,
            listing.seller
        )
    }
}