import { useState } from 'react';

const useLessons = () => {
  const [stateLessons, setState] = useState({
    lessonItems: [],
    lessonPlaylistItems: [],
    selectedTab: 0,
    loading: true,
    error: null,
    modalOpen: false,
    currentVideo: '',
  });

  const setLessons = (field, value) => {
    if (typeof field === 'object') {
      setState((prevState) => ({ ...prevState, ...field }));
    } else {
      setState((prevState) => ({ ...prevState, [field]: value }));
    }
  };

  return {
    stateLessons,
    setLessons,
  };
};

export default useLessons;
