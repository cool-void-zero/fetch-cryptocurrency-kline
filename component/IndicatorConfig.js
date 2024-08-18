import { useEffect, useState } from "react";

const IndicatorConfig = ({ 
  indicator = { short_name: "", full_name: "", period: 14, enable: false }, 
  onCheckboxClick, onChange, onRemove, 
}) => {
  const label_name = `Period (${indicator.short_name}, ${indicator.full_name})`;
  const [element_id, setElementId] = useState(`${indicator.short_name}_${indicator.period}`);
  const [is_checked, setIsChecked] = useState(indicator.enable);
  const [period, setPeriod] = useState(indicator.period);
  
  useEffect(() => {
    if(indicator){
      const new_element_id = `${indicator.short_name}_${indicator.period}`;
      
      setElementId(new_element_id);
    }
  }, [indicator]);

  //  handle checkbox clicked
  const handleEnableChange = (event) => {
    const is_checked = event.target.checked;

    setIsChecked(is_checked);
    if(onCheckboxClick)
      onCheckboxClick(event);
  }
  
  //  handle period input changed
  const handlePeriodChange = (event) => {
    const new_period = event.target.value;
    
    setPeriod(new_period);
    if(onChange)
      onChange(event);
  }

  //  handle remove icon clicked
  const handleRemoveClick = (event) => {
    const parent_element = event.target.parentElement.parentElement.parentElement;

    //  when updated the indicator config, React will render (remove) the UI
    if(onRemove)
      onRemove(event);
    // parent_element.remove();
  }

  return <div className="flex mb-3 px-4 w-full md:w-1/3">
    {/* Checkbox: enable or disable this indicator */}
    <div className="w-auto flex items-center pe-2">
      {
      (is_checked)? 
        <input data-id={element_id} className="form-check-input" type="checkbox" checked
           onChange={handleEnableChange} />: 
        <input data-id={element_id} className="form-check-input" type="checkbox" 
           onChange={handleEnableChange} />
      }
    </div>
    
    {/* Input: period */}
    <div className="w-full form-floating">
      {
      (is_checked)? 
      <input data-id={element_id} type="number" 
        className="form-control" placeholder="Input Period"
        min={0} step={1} value={period} 
        onChange={handlePeriodChange} />: 
      <input data-id={element_id} type="number" 
        className="form-control" placeholder="Input Period"
        min={0} step={1} value={period} 
        disabled />
      }
      
      <label htmlFor={element_id}>{ label_name }</label>
    </div>

    {/* Button: delete this indicator */}
    <div className="w-auto flex items-center ps-2">
      <button data-id={element_id} onClick={handleRemoveClick}>
        <i className="bi bi-trash-fill fs-4 text-danger" />
      </button>
    </div>
  </div>;
}

export default IndicatorConfig;