import { getCharityById, getCharitySlides } from '../../api/charitiesService';

const CharityDetailHandler = (stateCharityDetail, setCharityDetail, setMultipleFields, charityId) => {
  const fetchCharityData = async () => {
    if (!charityId) {
      setMultipleFields({
        loading: false,
        error: 'No charity ID provided',
      });
      return;
    }

    try {
      setCharityDetail('loading', true);
      setCharityDetail('error', null);

      // Try to fetch from API
      const response = await getCharityById(charityId);
      if (response && response.data && response.data.charity) {
        const filteredData = [response.data.charity];
        setCharityDetail('charityData', filteredData);
      } else {
        throw new Error('No data returned from API');
      }
    } catch (error) {
      console.error('Error fetching charity data:', error);
      setCharityDetail('error', 'Failed to load charity information');
    } finally {
      setCharityDetail('loading', false);
    }
  };

  const fetchCharitySlideData = async () => {
    if (!charityId) return;

    try {
      const response = await getCharitySlides(charityId);
      if (response && response.data && response.data.slides) {
        setCharityDetail('slideItems', response.data.slides);
      } else {
        setCharityDetail('slideItems', []);
      }
    } catch (error) {
      console.error('Error fetching charity slide data:', error);
      setCharityDetail('slideItems', []);
    }
  };

  const handleOpenModal = () => {
    setCharityDetail('modalOpen', true);
  };

  const handleCloseModal = () => {
    setCharityDetail('modalOpen', false);
  };

  return {
    fetchCharityData,
    fetchCharitySlideData,
    handleOpenModal,
    handleCloseModal,
  };
};

export default CharityDetailHandler;
