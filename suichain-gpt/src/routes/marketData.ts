import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Fetch BTC and ETH data from CoinGecko
    const coinGeckoUrl =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
    const coinGeckoResponse = await axios.get(coinGeckoUrl);
    const coinGeckoData = coinGeckoResponse.data;
    
    // Log for debugging
    console.log("CoinGecko data:", coinGeckoData);

    // Fetch live SUI data from Mobula API (or another provider)
    const suiApiUrl = "https://api.mobula.io/v1/marketdata/sui";
    const suiResponse = await axios.get(suiApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.MOBULA_API_KEY}`,
      },
    });
    const suiData = suiResponse.data;

    // Log for debugging
    console.log("SUI data:", suiData);
    
    // Construct your marketData object.
    const marketData = {
      btc: { price: coinGeckoData.bitcoin.usd },
      eth: { price: coinGeckoData.ethereum.usd },
      sui: {
        // Assuming the SUI API returns an object with a numeric "price" field.
        price: suiData.price,
        ...suiData,
      },
      timestamp: new Date(),
    };

    res.json(marketData);
  } catch (error) {
    console.error("Error fetching market data:", error);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

export default router;