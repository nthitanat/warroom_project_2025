import { useState } from 'react';

const useAnalyticMaps = (provinces) => {
  const [stateAnalyticMaps, setState] = useState({
    isMounted: false,
    searchValue: '',
    mapCenter: [100.5, 13.5],
    mapStyle: 'street',
    orderedLayers: [],
    activeLayers: {},
  });

  const setAnalyticMaps = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateAnalyticMaps,
    setAnalyticMaps,
  };
};

export default useAnalyticMaps;
