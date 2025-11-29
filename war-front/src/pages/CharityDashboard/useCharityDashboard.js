import { useState } from 'react';

const useCharityDashboard = () => {
  const [stateCharityDashboard, setState] = useState({
    charities: [],
    selectedCharity: null,
    selectedSlide: null,
    slides: [],
    loading: true,
    error: null,
    charityModalOpen: false,
    slideModalOpen: false,
    itemModalOpen: false,
    deleteModalOpen: false,
    deleteSlideModalOpen: false,
    isEditing: false,
    isEditingSlide: false,
    searchQuery: '',
    statusFilter: '',
    saving: false,
  });

  const setCharityDashboard = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateCharityDashboard,
    setCharityDashboard,
  };
};

export default useCharityDashboard;
