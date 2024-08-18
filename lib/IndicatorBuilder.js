import { 
  atr, cci, rsi, stochasticrsi, 
  sma, ema, williamsr, 
} from 'technicalindicators';

class IndicatorBuilder{
  default_columns = [
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

  constructor({
    klines = [], indicator_configs = [], 
    auto_build = true, 
  }){
    this.klines = klines;
    this.open = klines.map(json => json.open);
    this.high = klines.map(json => json.high);
    this.low = klines.map(json => json.low);
    this.close = klines.map(json => json.close);
    this.volume = klines.map(json => json.volume);

    this.indicator_configs = indicator_configs;
    this.indicator_datas = [];
    this.columns = this.buildColumns();
    //  combine klines and indicator_datas
    this.datas = [];
    this.auto_build = auto_build;

    if(auto_build){
      this.buildIndicators();
      this.datas = this.combineKlineIndicators();
    }
  }

  buildColumns = ({
    columns = this.default_columns, 
    indicator_configs = this.indicator_configs, 
  } = {
    columns: this.default_columns, 
    indicator_configs: this.indicator_configs, 
  }) => {
    return [
      ...columns, 
      ...indicator_configs.map(indicator => 
        (indicator.column_name)? 
          indicator.column_name: 
          `${indicator.short_name}_${indicator.period}` 
      )
    ];
  }

  buildIndicator = ({
    indicator, 
    source_type = "close", 
    open = this.open, high = this.high, 
    low = this.low, close = this.close, 
  }) => {
    if(!indicator) return [];

    const short_name = indicator.short_name.toUpperCase() || "";
    const period = indicator.period || 14;
    const values = (source_type === "close")? 
      close: (source_type === "open")? 
      open: (source_type === "high")? 
      high: low;
    let data = [];
    
    if(short_name === "ATR") data = atr({ period, high, low, close });
    else if(short_name === "CCI") data = cci({ period, open, high, low, close });
    else if(short_name === "RSI") data = rsi({ period, values });
    else if(short_name === "StochRSI") data = stochasticrsi({ period, values });
    else if(short_name === "SMA") data = sma({ period, values });
    else if(short_name === "EMA") data = ema({ period, values });
    else if(short_name === "W%R") data = williamsr({ period, high, low, close });
    
    //  fill the value of before period with null
    const null_len = this.klines.length - data.length;
    data = [...new Array(null_len).fill(null), ...data];
    return data;
  }

  buildIndicators = () => {
    this.indicator_datas = [];

    for(const indicator of this.indicator_configs){
      const data = this.buildIndicator({ indicator });
      
      this.indicator_datas.push(data);
    }
    
    if(this.auto_build)
      this.datas = this.combineKlineIndicators();
    return this.indicator_datas;
  }

  combineKlineIndicators = ({
    klines = this.klines, 
    indicator_datas = this.indicator_datas, 
    indicator_configs = this.indicator_configs, 
  } = {
    klines: this.klines, 
    indicator_datas: this.indicator_datas, 
    indicator_configs: this.indicator_configs, 
  }) => {
    this.datas = [];
    
    for(let i=0; i<klines.length; i++){
      //  copy the klines[i] Object (can't use original will refer memory)
      const kline = {...klines[i]};
      
      this.datas.push(kline);

      for(let j=0; j<indicator_configs.length; j++){
        const indicator = indicator_configs[j];
        const property = (indicator.column_name)? 
          indicator.column_name: 
          `${indicator.short_name}_${indicator.period}`; 
        const values = indicator_datas[j][i];

        this.datas[i][property] = values;
      }
    }
    
    return this.datas;
  }
}

export default IndicatorBuilder;