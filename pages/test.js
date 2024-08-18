// components/ChartComponent.js
import React from 'react';
import dynamic from 'next/dynamic';
// import CanvasJSReact from '@canvasjs/react-stockcharts';

// const CanvasJSReact = dynamic(() => import('@canvasjs/react-stockcharts'), { ssr: false });
// const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const CanvasJSChart = dynamic(() =>
    import('@canvasjs/react-stockcharts').then((mod) => mod.default.CanvasJSChart),
    { ssr: false }
  );

const ChartComponent = () => {
  const options = {
    animationEnabled: true,
    title: {
      text: "Basic Column Chart"
    },
    data: [{
      type: "column",
      dataPoints: [
        { label: "Apple", y: 10 },
        { label: "Orange", y: 15 },
        { label: "Banana", y: 25 },
        { label: "Mango", y: 30 },
        { label: "Grape", y: 28 }
      ]
    }]
  };
  return (
    <div>
      <CanvasJSChart options={options} />
    </div>
  );
}

export default ChartComponent;
