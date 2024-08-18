import { delay, intervalEnum } from '@/lib/utility';

class FetchBinance{
    constructor({ symbol_type = "spot", quote_asset = "" }){
        symbol_type = symbol_type.toLowerCase();
        this.symbol_type = symbol_type; 
        this.quote_asset = quote_asset; 
        this.base_api = (symbol_type === "spot")? 
            'https://data-api.binance.vision/api/v3/': 
            'https://fapi.binance.com/fapi/v1/'; 
        //  number of kline data in once request
        this.kline_limit = (symbol_type === "spot")? 
            1000: 499; 
        this.columns = [
            // open time 
            'timestamp',
            'open', 'high', 'low', 'close', 
            'volume', 
            'close_time', 
            'quote_asset_volume', 
            'trades', 
            'taker_buy_base_asset_volume', 
            'taker_buy_quote_asset_volume', 
        ]; 
        //  interval type on Binance
        this.interval = [
            '1s', 
            '1m', '3m', '5m', '15m', '30m', 
            '1h', '2h', '4h', '6h', '8h', '12h', 
            '1d', '3d', '1w', '1M', 
        ];

        //  reference: https://binance-docs.github.io/apidocs/spot/en/#public-api-definitions
        this.rate_limit_interval = {
            //  convert to millisecond
            "SECOND": 1000, 
            "MINUTE": 60000, 
            "DAY": 86400000, 
        };
    }

    //  count the "rate_limit_interval"
    getRateLimit = ({ rate_limit_obj }) => {
        let {
            rateLimitType, 
            interval, intervalNum, limit
        } = rate_limit_obj;
        interval = this.rate_limit_interval[interval] * intervalNum;
        
        return {
            rateLimitType, interval, 
            request_limit: limit, 
        }
    }
    
    //  based on request "api_url" to count will be used of weight
    getWeight = ({
        api_url = "/api/v3/klines", 
        limit = 1, 
    }) => {
        let weight = 1;
        
        /*
            Spot 
        */
        if(api_url === "/api/v3/exchangeInfo") weight = 20;
        else if(api_url === "/api/v3/klines") weight = 2;

        /*
            Futures
        */
        else if(api_url === "/fapi/v1/exchangeInfo") weight = 1;
        /*
            re-assign the weight based on below table: 

            LIMIT	weight
            [1,100)	1
            [100, 500)	2
            [500, 1000]	5
            > 1000	10

            reference: 
            https://binance-docs.github.io/apidocs/futures/en/#kline-candlestick-data
        */
        else if(api_url === "/fapi/v1/klines"){
            if(limit < 100) weight = 1;
            else if(limit < 500) weight = 2;
            else if(limit <= 1000) weight = 5;
            else weight = 10;
        }

        return weight;
    }

    //  count the interval offet time
    intervalOffset = ({
        interval_str = "1d", 
        step = this.kline_limit
    }) => {
        const {
            s, m, h, 
            d, w, M, 
        } = intervalEnum();
        let offset = 0;
        
        if(interval_str.includes("M")){
            let months = parseInt(interval_str.replace(/M/gi, ""));

            offset = step * (months * M);
        }
        else if(interval_str.includes("w")){
            let weeks = parseInt(interval_str.replace(/w/gi, ""));

            offset = step * (weeks * w);
        }
        else if(interval_str.includes("d")){
            let days = parseInt(interval_str.replace(/d/gi, ""));
    
            offset = step * (days * d);
        }
        else if(interval_str.includes("h")){
            let hours = parseInt(interval_str.replace(/h/gi, ""));
            
            offset = step * (hours * h);
        }
        else if(interval_str.includes("m")){
            let minutes = parseInt(interval_str.replace(/m/gi, ""));
            
            offset = step * (minutes * m);
        }
        else if(interval_str.includes("s")){
            let seconds = parseInt(interval_str.replace(/s/gi, ""));

            offset = step * (seconds * s);
        }
        
        return offset;
    }

    //  get a symbol on board datetime
    onBoard = async({
        symbol, interval = "1m", 
        start = 0, end = new Date().getTime(), 
        limit = 1, 
    }) => {
        try{
            const json = await this.fecthData({
                symbol, interval, 
                start, end, limit
            });
            
            return json[0][0];
        }
        catch(error){
            return 0;
        }
    }

    //  get a symbol list on board datetime 
    //  (for spot, because the exchangeInfo not include the on board datetime)
    onBoardList = async({
        //  ["BTCUSDT", "..."]
        symbol_list = [], interval = "1m", 
        start = 0, end = new Date().getTime(), 
        limit = 1, 
    }) => {
        try{
            let promise_list = [];

            for(const symbol of symbol_list)
                promise_list.push(this.fecthData({ 
                    symbol, interval, 
                    start, end, limit
                }));
            
            const response_list = await Promise.all(promise_list);
            symbol_list = response_list.flat().map(arr => arr[0]);
            
            return symbol_list;
        }
        catch(error){
            return [];
        }
    }

    //  get the exchange info, based on "symbol_type"
    exchangeInfo = async(
        { quote_asset = this.quote_asset } = 
        { quote_asset: "USDT" }
    ) => {
        const url = `${this.base_api}exchangeInfo`;

        try{
            const response = await fetch(url);
            let json = await response.json();

            if(quote_asset !== ""){
                json.symbols = json.symbols.filter(
                    object => object.symbol.includes(quote_asset)
                );
            }

            return json;
        }catch(error){
            console.error(error);
            console.log(`[FetchBinance.exchangeInfo] Fail to request API. `);
            
            throw error;
        }
    }

    //  fetch data once from Binance API
    fecthData = async({
        symbol, interval, 
        start = 0, end = new Date().getTime(), 
        limit = this.kline_limit, 
    }) => {
        const parameters = `klines?symbol=${symbol}&interval=${interval}&startTime=${start}&endTime=${end}&limit=${limit}`;
        const url = this.base_api + parameters;
        const weight = this.getWeight({
            api_url: (this.symbol_type === "spot")? 
                "/api/v3/klines": "/fapi/v1/klines", 
            limit, 
        });

        return fetch(url)
            .then(res =>  res.json())
            .catch(error => {
                throw error;
            });
    }

    fecthHistory = async({
        symbol, interval = "1d", 
        start = 0, end = new Date().getTime(), 
        limit = this.kline_limit, 
        
        // weight = 2
    }) => {
        const weight = this.getWeight({
            api_url: (this.symbol_type === "spot")? 
                "/api/v3/klines": "/fapi/v1/klines", 
            limit, 
        });
        const offset = this.intervalOffset({
            interval_str: interval, 
            step: limit, 
        });
        let promise_list = [];
        
        try{
            //  try assign onboard time to "start"
            if(start === 0){
                start = await this.onBoard({ symbol, interval });
            }
            
            //  looping to build up promise list
            while(start <= end){
                promise_list.push(this.fecthData({
                    symbol, interval, 
                    start, end, limit, 
                }));

                start += offset; 
                
                /*
                if(this.symbol_type === "spot"){
                    const { request_count, request_limit } = global.BINANCE_SPOT_API;
                    
                    //  when the weight over 90%, sleep 1 minute 
                    if(request_count >= (0.9 * request_limit)){
                        console.log(`[Limited] the weight was reach over 90%`);
                        await delay();
                    }
                }
                else{
                    const { request_count, request_limit } = global.BINANCE_FUTURE_API;
                    
                    //  when the weight over 90%, sleep 1 minute 
                    if(request_count >= (0.9 * request_limit)){
                        console.log(`[Limited] the weight was reach over 90%`);
                        await delay();
                    }
                }
                */
            }
            
            const response_list = await Promise.all(promise_list);

            console.log(`promise_list length: ${promise_list.length}`);

            //  convert from 2d array [[]] to object of array [{}]
            const data_list = response_list.flat().map(arr => {
                let obj = {};
                
                for(let i=0; i<this.columns.length; i++){
                    const property = this.columns[i];
                    
                    //  convert "timestamp" and "close_time" from UNIX time to "yyyy-MM-ddThh:mm:ss" format
                    if(i === 0 || i === 6)
                        obj[property] = new Date(arr[i]);
                    else
                        obj[property] = parseFloat(arr[i]);
                }

                return obj;
            });

            return data_list;
        }catch(error){
            console.error(error);
            console.log(`[fecthHistory] Occurred error!`);
            console.log(`symbol: `, symbol, `interval: `, interval);
            console.log(`start: `, start, `end: `, end);

            return [];
        }
    }
}

export default FetchBinance;