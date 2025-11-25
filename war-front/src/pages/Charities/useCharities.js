import { useState } from 'react';

const useCharities = () => {
  const [stateCharities, setState] = useState({
    charitiesItems: [],
    loading: true,
    error: null,
    modalOpen: false,
  });

  const setCharities = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateCharities,
    setCharities,
  };
};

export default useCharities;
