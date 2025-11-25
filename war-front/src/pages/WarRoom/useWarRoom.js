import { useState } from 'react';

const useWarRoom = () => {
  const [stateWarRoom, setState] = useState({
    videoLink: '',
    warRoomItems: [],
    loading: true,
    error: null
  });

  const setWarRoom = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateWarRoom,
    setWarRoom,
  };
};

export default useWarRoom;
