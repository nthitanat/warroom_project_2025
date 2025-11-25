import { useState } from 'react';

const useNavbar = () => {
  const [stateNavbar, setState] = useState({
    mobileMenuOpen: false
  });

  const setNavbar = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateNavbar,
    setNavbar,
  };
};

export default useNavbar;
