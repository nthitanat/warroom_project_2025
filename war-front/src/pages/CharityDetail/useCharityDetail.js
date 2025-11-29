import { useState } from 'react';

const useCharityDetail = () => {
  const [stateCharityDetail, setStateCharityDetail] = useState({
    charityData: [],
    slideItems: [],
    charityItems: [],
    loading: true,
    error: null,
    modalOpen: false,
  });

  const setCharityDetail = (field, value) => {
    setStateCharityDetail((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setMultipleFields = (fields) => {
    setStateCharityDetail((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  return { stateCharityDetail, setCharityDetail, setMultipleFields };
};

export default useCharityDetail;
