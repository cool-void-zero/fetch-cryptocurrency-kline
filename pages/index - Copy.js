import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import '@/app/globals.css';
//  customize
import { convertDatetime, indicatorsEnum } from '@/lib/utility';
import IndicatorBuilder from '@/lib/IndicatorBuilder';
import NewIndicator from '@/component/NewIndicator';
import IndicatorConfig from '@/component/IndicatorConfig';
import CandlestickChart from '@/component/CandlestickChart';

const fetcher = (url) => fetch(url).then(res => res.json()).catch(error => {throw error});

export const metadata = {
  title: "Download Binance Kline",
  description: "Download Binance crytocurrency via UI.",
};

export default function Home(){
  const { data, error, isLoading } = useSWR('/api/exchange-info/spot?quote_asset=USDT', fetcher);
  const [symbol_list, setSymbolList] = useState(null);
  const [symbol_type, setSymbolType] = useState("spot");
  const [search_config, setSearchConfig] = useState({
    symbol: "BTCUSDT", 
    interval: "1d", 
    output_format: "csv", 
    start: "", 
    end: convertDatetime().toISOString().substring(0, 16), 
  });
  /*
    Kline, Chart & Indicator config, datas (includes: klines and indicators)
  */
  const [kline_list, setKlineList] = useState(null);
  const [indicator_config, setIndicatorConfig] = useState(
    indicatorsEnum
      .filter(indicator => 
        ["ATR", "SMA", "EMA", "RSI"].includes(indicator.short_name)
      )
      .map(indicator => ({
        id: `${indicator.short_name}_${indicator.period}`, 
        ...indicator, 
        enable: true, 
      }))
  );
  const [indicator_builder, setIndicatorBuilder] = useState(null);
  
  /*
    [Handle Indicator]
    add, enable, edit (period), remove
  */
  const handleIndicatorAdd = (new_indicator) => {
    const new_config = [...indicator_config, new_indicator];

    setIndicatorConfig(new_config);
  }

  const handleIndicatorEnable = (event) => {
    const id = event.target.dataset.id;
    const enable = event.target.checked;
    let new_config = [];
    
    for(const indicator of indicator_config){
      if(id === indicator.id)
        new_config.push({
          ...indicator, 
          enable, 
        });
      else
        new_config.push(indicator);
    }

    setIndicatorConfig(new_config);
  }

  const handleIndicatorConfig = (event) => {
    const id = event.target.dataset.id;
    const short_name = id.split('_')[0] || "";
    const period = parseInt(event.target.value) || 0;
    const new_id = `${short_name}_${period}`;
    let new_config = [];

    for(const indicator of indicator_config){
      if(id === indicator.id){
        new_config.push({
          ...indicator, 
          id: new_id, 
          period, 
        });
      }
      else
        new_config.push(indicator);
    }
    
    console.log(`new_config: `);
    console.log(new_config);

    setIndicatorConfig(new_config);
  }

  const handleIndicatorRemove = (event) => {
    const id = event.target.parentElement.dataset.id;
    const new_config = indicator_config.filter(config => id !== config.id);
    
    setIndicatorConfig(new_config);
  }

  useEffect(() => {
    if(kline_list && indicator_config){
      const klines = [...kline_list];
      const config = [...indicator_config];
      const builder = new IndicatorBuilder({ klines, indicator_configs: config });
      
      console.log(`[useEffect] indicator_config: `);
      console.log(indicator_config);
      console.log(`[useEffect] builder: `);
      console.log(builder);
      
      setIndicatorBuilder(builder);
    }
  }, [kline_list, indicator_config]);

  //  Load the symbol list once
  useEffect(() => {
    if(data){
      const new_symbol_list = data.symbols.map(obj => obj.symbol);
      
      setSymbolList(new_symbol_list);
    }
  }, [data]);

  //  Update Website Title and symbol list (when switch the type)
  useEffect(() => {
    const url = `/api/exchange-info/${symbol_type}?quote_asset=USDT`;
    fetch(url)
      .then(res => res.json())
      .then(json => {
        const new_symbol_list = json.symbols.map(obj => obj.symbol);
      
        setSymbolList(new_symbol_list);
      });
  }, [symbol_type]);

  //  Get the symbol onboard time, when change symbol or type
  useEffect(() => {
    const url = `/api/onboard/${symbol_type}/${search_config.symbol}/`;
    
    fetch(url)
      .then(res => res.json())
      .then(json => {
        const new_start = new Date(json.onboard_time).toISOString().substring(0, 16);

        setSearchConfig({
          ...search_config, 
          start: new_start
        });
      });
  }, [search_config.symbol, symbol_type]);
  
  /*
      [onChange] Event Handle
  */
  const handleConfig = (event) => {
    const id = event.target.id;
    const new_value = event.target.value;
    let new_config = {...search_config};
    
    new_config[id] = new_value;
    setSearchConfig(new_config);
  }

  const handleSwitch = (event) => {
    const checked = event.target.checked; 
    const new_type = (checked)? 
      "future": "spot"; 
    setSymbolType(new_type);
  }

  /*
    Handle download button
  */
  const downloadFile = ({
    filename = `[${symbol_type.toUpperCase()}] ${search_config.symbol}_${search_config.interval}.${search_config.output_format}`, 
    data = [[]], 
    columns = [
      'timestamp',    // open time
      'open', 'high', 'low', 'close', 
      'volume', 
      'close_time', 
      'quote_asset_volume', 
      'trades', 
      'taker_buy_base_asset_volume', 
      'taker_buy_quote_asset_volume', 
    ], 
  }) => {
    let blob = null;

    if(filename.includes(".csv")){
        let csv = columns.join(",") + "\n";
        csv += data.map(obj => Object.values(obj).join(',')).join('\n');
        
        blob = new Blob([csv], { type: 'text/csv' });
    }
    else if(filename.includes(".json")){
        let json = JSON.stringify(data, null , 2);
        
        blob = new Blob([json], { type: 'application/json' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    //  click a url to trigger download
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const fetchKlineDatas = async({
    symbol = search_config.symbol, 
    interval = search_config.interval, 
    start = search_config.start, 
    end = search_config.end, 
  }) => {
    try{
      //  convert start and end into UNIX time
      start = new Date(start).getTime();
      end = new Date(end).getTime();
      const request_url = `/api/${symbol_type}/${symbol}/${interval}?start=${start}&end=${end}`;
      const response = await fetch(request_url);
      const json = await response.json();
      setKlineList(json);

      const builder = new IndicatorBuilder({ klines: [...json], indicator_configs: indicator_config });
      setIndicatorBuilder(builder);
    }catch(error){
      console.error(error);
      console.log(`[fetchKlineDatas] Appear error.`);

      alert(`Fail to fetch data from server...`);
    }
  };

  //  Waiting load some data from server
  if(isLoading){
    return <>
      <Head>
        <title>Download Binance Kline | Loading</title>
      </Head>

      <h1>Loading...</h1>
    </>
  }

  return (
    <>
      <Head>
        <title>
          Download Binance Kline | { " " + symbol_type[0].toUpperCase() + symbol_type.substring(1) }
        </title>
      </Head>
      <main className="container mx-auto p-4">
       {/* Button: Symbol Config */}
       <button className="btn btn-primary" type="button" data-bs-toggle="collapse" 
          data-bs-target="#symbol-config" aria-expanded="false" aria-controls="collapseWidthExample">
          
          Symbol Config
       </button>
       {/* Button: Indicators Config */}
       <button className="btn btn-primary" type="button" data-bs-toggle="collapse" 
          data-bs-target="#indicator-config" aria-expanded="false" aria-controls="collapseWidthExample">
          
          Indicators Config
       </button>
       
       {/* Section: Symbol Config */}
       <div id="symbol-config" className="collapse visible flex flex-wrap w-full items-center justify-center">
        
        {/* Column: Symbol Type */}
        <div className="flex mb-6 px-4 w-full items-center justify-center text-white">
         {/* Spot */}
         <span className={
          (symbol_type === "spot")? 
            "text-2xl font-bold": 
            "text-2xl text-gray-500"
         }>
          Spot
         </span>
         {/* Switch Button */}
         <div className="m-0 p-0 form-check form-switch">
          <input id="symbol_type" checked={symbol_type === "future"}
            className="flex mt-2 mx-4 form-check-input" type="checkbox" role="switch"
            onChange={handleSwitch} />
         </div>
         {/* Future */}
         <span className={
          (symbol_type === "future")? 
            "text-2xl font-bold": 
            "text-2xl text-gray-500"
         }>
          Future
         </span>
        </div>
        {/* End of Column: Switch */}

        {/* Column: Symbol */}
        <div className="flex mb-6 px-4 w-full md:w-1/3">
         <div className="form-floating w-full">
          <input id="symbol" list="symbol_list" value={search_config.symbol} 
             className="form-control" placeholder="Select Symbol" 
             onChange={handleConfig} />
          <label htmlFor="symbol_list">Select Symbol</label>
          <datalist id="symbol_list">
          {
            symbol_list && symbol_list.map(symbol => 
              <option key={symbol} value={symbol}>
                { symbol }
              </option>
            )
          }
          </datalist>
         </div>
        </div>
        {/* End of Column: Symbol */}

        {/* Column: Interval */}
        <div className="flex mb-6 px-4 w-full md:w-1/3">
         <div className="form-floating w-100">
          <select className="form-select" value={search_config.interval}
            id="interval" aria-label="Interval"
            onChange={handleConfig}>

            <option value="1w">1w</option>
            <option value="3d">3d</option>
            <option value="1d">1d</option>

            <option value="12h">12h</option>
            <option value="8h">8h</option>
            <option value="6h">6h</option>
            <option value="4h">4h</option>
            <option value="2h">2h</option>
            <option value="1h">1h</option>
            
            <option value="30m">30m</option>
            <option value="15m">15m</option>
            <option value="5m">5m</option>
            <option value="3m">3m</option>
            <option value="1m">1m</option>
          </select>
          <label htmlFor="interval">Select Interval</label>
         </div>
        </div>
        {/* End of Column: Interval */}

        {/* Column: Ouput Format */}
        <div className="flex mb-6 px-4 w-full md:w-1/3">
         <div className="form-floating w-100">
          <select id="output_format" value={search_config.output_format} 
             className="form-select" aria-label="Ouput Format" 
             onChange={handleConfig}>
           <option value="csv">csv</option>
           <option value="json">json</option>
          </select>
          
          <label htmlFor="output">Ouput Format</label>
         </div>
        </div>
        {/* End of Column: Ouput Format */}

        {/* Column: Start Datetime */}
        <div className="flex mb-16 px-4 w-full md:w-1/3">
         <div className="form-floating w-full">
          <input id="start" value={search_config.start}
            type="datetime-local" className="form-control"
            onChange={handleConfig} />
          <label htmlFor="start">Start Datetime</label>
         </div>
        </div>
        {/* End of Column: Start Datetime */}

        {/* Column: End Datetime */}
        <div className="flex mb-16 px-4 w-full md:w-1/3">
         <div className="form-floating w-full">
          <input id="end" value={search_config.end} 
             type="datetime-local" className="form-control" 
             onChange={handleConfig} />
          <label htmlFor="end">End Datetime</label>
         </div>
        </div>
        {/* End of Column: End Datetime */}
       </div>
       {/* End of Section: Symbol Config */}
       

       {/* Section: Indicators Config */}
       <div id="indicator-config" 
        className="collapse visible flex flex-wrap w-full items-start justify-start mb-4">
        
        {/* Column: New Indicator */}
        <NewIndicator onChange={handleIndicatorAdd} />
        
        {
          // indicatorsEnum.map(indicator => 
          
          [...indicator_config].map(indicator => 
            <IndicatorConfig key={`${indicator.short_name}_${indicator.period}`} indicator={indicator} 
              onCheckboxClick={handleIndicatorEnable} onChange={handleIndicatorConfig} 
              onRemove={handleIndicatorRemove} 
            />
          )
        }
       </div>
       {/* End of Section: Indicators Config */}
       

       <div className="flex items-center justify-center">
        {/* Button: Fetch Kline & Preview Chart */}
        <button className="btn mx-4 px-5 btn-outline-info" 
          onClick={() => fetchKlineDatas({})}>
          
          <i className="bi bi-eye me-2" />
          <span>Preview</span>
        </button>

        {/* Button: Download Kline with Indicators */}
        {
          (kline_list && kline_list.length)? 
          <button className="btn mx-4 px-5 btn-outline-success" 
            onClick={() => {
              const { datas: data, columns } = indicator_builder;

              downloadFile({ data, columns });
            }}>
            
            <i className="bi bi-download me-2" />
            <span>Download</span>
          </button>:
          //  Disabled (not data exist)
          <button className="btn mx-4 px-5 btn-outline-success" disabled>
            <i className="bi bi-download me-2" />
            <span>Download</span>
          </button>
        }
       </div>
       
       <CandlestickChart 
        title_text={`[${symbol_type}] ${search_config.symbol} ${search_config.interval}`} 
        indicator_builder={indicator_builder}
       />

      </main>
    </>
  );
}