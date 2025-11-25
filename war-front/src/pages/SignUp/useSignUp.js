import { useState } from 'react';

const useSignUp = () => {
  const [stateSignUp, setState] = useState({
    form: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    },
    error: '',
    loading: false,
    success: false
  });

  const setSignUp = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateSignUp,
    setSignUp,
  };
};

export default useSignUp;
