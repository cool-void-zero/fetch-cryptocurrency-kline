import FetchBinance from "@/lib/FetchBinance";

const fetcher_future = new FetchBinance({ symbol_type: "future" });

export const config = {
  api: { responseLimit: '16mb' }
}

//  /api/future/{symbol}/{interval}
export default async function handler(req, res){
  try{
    let { parameters, start, end, limit } = req.query;
    let symbol = parameters[0] || "BTCUSDT";
    let interval = parameters[1] || "1d";
    start = (start)? parseInt(start): 0; 
    end = (end)? parseInt(end): new Date().getTime(); 
    limit = (limit)? limit: 499; 
    
    let data_list = await fetcher_future.fecthHistory({
      symbol, interval, 
      start, end, limit, 
    });
    
    res.json(data_list);
  }catch(error){
    const err_msg = `[/api/future] Fail to get date from "buildDataList": \n${res.url}`;
    
    console.error(err_msg);
    res.status(500);
  }
}