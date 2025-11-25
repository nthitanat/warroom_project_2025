import { useState } from 'react';

const useWarRoomMainContent = () => {
  const [stateWarRoomMainContent, setState] = useState({
    selectedTab: 0,
    focusedCardIndex: null
  });

  const setWarRoomMainContent = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateWarRoomMainContent,
    setWarRoomMainContent,
  };
};

export default useWarRoomMainContent;
