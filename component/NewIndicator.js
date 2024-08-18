import { useState } from 'react';
//  customize
import { indicatorsEnum } from '@/lib/utility';

const NewIndicator = ({ onChange }) => {
  const [new_indicator, setNewIndicator] = useState("");

  const addNewIndicator = (event) => {
    const new_text = event.target.value;
    //  input text (new_indicator) is exist in indicatorsEnum, return the specify object
    let new_indicator = indicatorsEnum.find(indicator => indicator.short_name === new_text) || false;
    
    setNewIndicator(new_text);
    if(new_indicator && onChange){
      //  set other properties value
      new_indicator.period = 0;
      new_indicator.id = `${new_indicator.short_name}_${new_indicator.period}`;
      new_indicator.enable = true;
      
      onChange(new_indicator);
    }
  }

  return <div className="flex w-full items-center justify-center my-3 px-4">
    <div className="form-floating w-full md:w-1/3 text-black">
      <input id="new-indicator" list="indicator-list" 
        className="form-control" placeholder="Select Indicator" 
        value={new_indicator} onChange={addNewIndicator} />
      <label htmlFor="new-indicator">New Indicator</label>

      <datalist id="indicator-list">
      {
        indicatorsEnum.map(indicator => 
          <option key={indicator.short_name} value={indicator.short_name}>
            { indicator.full_name }
          </option>
        )
      }
      </datalist>
    </div>
  </div>;
}

export default NewIndicator;