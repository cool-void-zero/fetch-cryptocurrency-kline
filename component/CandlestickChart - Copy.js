import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
//  dynamic load the client side js library
const CanvasJSStockChart = dynamic(() => 
  import('@canvasjs/react-stockcharts').then(mod => mod.default.CanvasJSStockChart), 
  { ssr: false }
);

const CandlestickChart = ({
	title_text, 
	indicator_builder, 
}) => {
	const [klines, setKlines] = useState(null);
	const [chart_options, setChartOptions] = useState(null);

	useEffect(() => {
		if(indicator_builder?.klines){
			const options = buildChartOptions(indicator_builder);

			setKlines(indicator_builder.klines);
			setChartOptions(options);
		}
	}, [indicator_builder]);

	const buildChartOptions = (indicator_builder) => {
		// const { klines } = indicator_builder;
		const { klines, indicator_configs, indicator_datas } = indicator_builder;
		//	convert klines into dataPoints format
		const dataPoints = klines.map(json => {
			const x = new Date(json.timestamp);
			const y = [json.open, json.high, json.low, json.close];

			return { x, y };
		});

		/*
		//	only show enable config
		let indicator_configs = [];
		let indicator_datas = [];

		for(let i=0; i<indicator_builder.indicator_configs.length; i++){
			const config = indicator_builder.indicator_configs[i];
			const datas = indicator_builder.indicator_datas[i];
			const is_enable = config.enable;
			
			if(is_enable){
				indicator_configs.push(config);
				indicator_datas.push(datas);
			}
		}
		*/
		
		const overlay_chart = indicator_configs
			.map((config, i) => {
				let chart_data = null;

				if(config.overlay){
					chart_data = {
						type: "line", 
						dataPoints: indicator_datas[i].map((value, j) => ({
							x: new Date(klines[j]['timestamp']), 
							y: value
						}))
					};
				}
				
				return chart_data;
			})
			.filter(config => (config !== null));
		
		const options = {
			title: { text: title_text }, 
			
			charts: [
				{
					data: [
						{
							type: "candlestick", 
							yValueFormatString: "$###0.00", 
							xValueFormatString: "MMMM YY", 
							dataPoints, 
						}, 
						
						...overlay_chart, 
					]
				}, 
				
				//	not overlay chart 
			], 
			
			navigator: {
				slider: {
					minimum: new Date(`${new Date().getFullYear()}-01-01`), 
					maximum: new Date(), 
				}
			}
		}

		return options;
	}

	return <div>
		{ chart_options && <CanvasJSStockChart options={chart_options} /> }
	</div>;
}

export default CandlestickChart;