import { useNavigate } from 'react-router-dom';
import { getAllCharities, getCharityItemsByCharityId } from '../../api/charitiesService';

const CharitiesHandler = (stateCharities, setCharities) => {
  const navigate = useNavigate();

  const fetchCharitiesData = async () => {
    try {
      const response = await getAllCharities();
      setCharities('charitiesItems', response.data.charities || []);
    } catch (error) {
      console.error('Error fetching charities:', error);
      setCharities('error', 'Failed to load charities');
    } finally {
      setCharities('loading', false);
    }
  };

  const fetchFeaturedItems = async (charityId) => {
    if (!charityId) return;
    
    setCharities('featuredItemsLoading', true);
    try {
      const response = await getCharityItemsByCharityId(charityId);
      setCharities('featuredItems', response.data.items || []);
    } catch (error) {
      console.error('Error fetching featured items:', error);
      setCharities('featuredItems', []);
    } finally {
      setCharities('featuredItemsLoading', false);
    }
  };

  const handleOpenModal = () => {
    setCharities('modalOpen', true);
  };

  const handleCloseModal = () => {
    setCharities('modalOpen', false);
  };

  const handleRedirectToCharity = (id) => {
    if (id) {
      navigate(`/charity/${id}`);
    }
  };

  return {
    fetchCharitiesData,
    fetchFeaturedItems,
    handleOpenModal,
    handleCloseModal,
    handleRedirectToCharity,
  };
};

export default CharitiesHandler;
