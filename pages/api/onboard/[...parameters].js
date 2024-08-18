import FetchBinance from "@/lib/FetchBinance";

const fetcher_spot = new FetchBinance({ symbol_type: "spot" });
const fetcher_future = new FetchBinance({ symbol_type: "future" });

//  /api/onboard/{spot | future}/{symbol}
export default async function handler(req, res){
  try{
    const { parameters } = req.query;
    const symbol_type = parameters[0] || "spot";
    const symbol = parameters[1] || "BTCUSDT";
    const onboard_time = (symbol_type === "spot")? 
      await fetcher_spot.onBoard({ symbol }): 
      await fetcher_future.onBoard({ symbol }); 
    
    res.json({ onboard_time });
  }catch(error){
    console.error(error);
    console.log(`[api/onboard]  ${req.url}`);
    
    res.status(200).json({ onboard_time: 0 });
  }
}