import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

async function main() {
  // Create a client connected to devnet
  const client = new SuiClient({ url: getFullnodeUrl('devnet') });
  
  // Get coins owned by an address
  const coins = await client.getCoins({
    owner: '0x0c732e6326FC2A5c21cB40ca35465e6A0C5A32Ec14cb0746e2b52b5e04597234',
  });
  
  console.log(coins);
}

main().catch((error) => console.error(error));