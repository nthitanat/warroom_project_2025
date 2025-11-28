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
        // Create a thumbnail slide object to prepend
        const thumbnailSlide = {
          id: `thumbnail-${charityId}`,
          charity_id: charityId,
          img: null, // Will be fetched by Slide component using charity thumbnail endpoint
          description: 'Campaign Overview',
          display_order: 0,
          isThumbnail: true // Flag to identify this as the thumbnail slide
        };
        
        // Prepend thumbnail slide to the slides array
        const slidesWithThumbnail = [thumbnailSlide, ...response.data.slides];
        setCharityDetail('slideItems', slidesWithThumbnail);
      } else {
        // If no slides, just show the thumbnail
        const thumbnailSlide = {
          id: `thumbnail-${charityId}`,
          charity_id: charityId,
          img: null,
          description: 'Campaign Overview',
          display_order: 0,
          isThumbnail: true
        };
        setCharityDetail('slideItems', [thumbnailSlide]);
      }
    } catch (error) {
      console.error('Error fetching charity slide data:', error);
      // Even on error, try to show the thumbnail
      const thumbnailSlide = {
        id: `thumbnail-${charityId}`,
        charity_id: charityId,
        img: null,
        description: 'Campaign Overview',
        display_order: 0,
        isThumbnail: true
      };
      setCharityDetail('slideItems', [thumbnailSlide]);
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
