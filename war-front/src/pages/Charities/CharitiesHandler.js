import { useNavigate } from 'react-router-dom';
import { getAllCharities } from '../../api/charitiesService';

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
    handleOpenModal,
    handleCloseModal,
    handleRedirectToCharity,
  };
};

export default CharitiesHandler;
