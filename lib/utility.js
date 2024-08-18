const delay = (ms = 60000) => 
  new Promise(resolve => setTimeout(resolve, ms));

const convertDatetime = (d = new Date(), UTC = 8) => {
  d.setHours(d.getHours() + UTC);

  return d;
}

const intervalEnum = () => {
  //  1 second
  const s = 1000;
  //  1 minute (60 * s)
  const m = 60000;
  //  1 hour (60 * m)
  const h = 3600000;
  //  1 day (24 * h)
  const d = 86400000;
  //  1 week (7 * d)
  const w = 604800000;
  //  1 Month (30 * d)
  const M = 2592000000;

  return {
    s, m, h, 
    d, w, M, 
  }; 
}

/*
  Support of indicators Enum
*/
const indicatorsEnum = [
  {
    //  measure market volatility
    short_name: "ATR", 
    full_name: "Average True Range", 
    period: 14, 
    
  }, 
  {
    //  detect new trend or over-bought / over-sold
    short_name: "CCI", 
    full_name: "Commodity Channel Index", 
    period: 20, 
    overlay: false, 
  }, 
  
  /*
  {
    //  rate of price changing
    short_name: "ROC", 
    full_name: "Rate of Change", 
    period: 12, 
    overlay: false, 
  },
  */ 
  
  {
    short_name: "RSI", 
    full_name: "Relative Strength Index", 
    period: 14, 
    overlay: false, 
  }, 

  /*
  {
    short_name: "StochRSI", 
    full_name: "Stochastic RSI", 
    period: 14, 
    overlay: false, 
  },
  */ 

  {
    short_name: "SMA", 
    full_name: "Simple Moving Average", 
    period: 20, 
    overlay: true, 
  }, 
  {
    short_name: "EMA", 
    full_name: "Exponential Moving Average", 
    period: 20, 
    overlay: true, 
  }, 
  
  {
    //  detect over-bought / over-sold
    short_name: "W%R", 
    full_name: "WilliamsR", 
    period: 14, 
    overlay: false, 
  }, 
];

const candlestick_pattern = [
  {
    short_name: "bullishhammer", 
    full_name: "Bullish Hammer", 
    period: 1, 
  }, 
  {
    
  }
];

module.exports = {
  delay, convertDatetime, intervalEnum, 
  indicatorsEnum
}