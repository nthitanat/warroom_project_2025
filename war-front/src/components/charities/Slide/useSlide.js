import { useState } from 'react';

const useSlide = () => {
  const [stateSlide, setState] = useState({
    currentIndex: 0
  });

  const setSlide = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateSlide,
    setSlide,
  };
};

export default useSlide;
