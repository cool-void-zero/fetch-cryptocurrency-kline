import FetchBinance from "@/lib/FetchBinance";

const fetcher_spot = new FetchBinance({ symbol_type: "spot" });
const fetcher_future = new FetchBinance({ symbol_type: "future" });

//  /api/exchange-info/{spot | future}
export default async function handler(req, res){
  try{
    const symbol_type = req.query.parameters[0] || "spot";
    const quote_asset = req.query.quote_asset || "";

    console.log(`symbol_type: ${symbol_type}`);
    console.log(`quote_asset: ${quote_asset}`);

    const data = (symbol_type === "spot")? 
      await fetcher_spot.exchangeInfo({ quote_asset }): 
      await fetcher_future.exchangeInfo({ quote_asset });
    
    res.json(data);
  }catch(error){
    // console.error(error);
    console.log(`[/api/exchange-info] Fail to fetch Binance Exchange Info.`);
    
    res.status(500).json({ symbols: [] });
  }
}