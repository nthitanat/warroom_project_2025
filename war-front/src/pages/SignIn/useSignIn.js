import { useState } from 'react';

const useSignIn = () => {
  const [stateSignIn, setState] = useState({
    form: {
      email: '',
      password: ''
    },
    error: '',
    loading: false
  });

  const setSignIn = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateSignIn,
    setSignIn,
  };
};

export default useSignIn;
