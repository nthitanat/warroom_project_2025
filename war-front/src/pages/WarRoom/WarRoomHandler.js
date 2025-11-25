import { getAllWarroom } from '../../api/warroomService';

const WarRoomHandler = (stateWarRoom, setWarRoom) => {
  const handleVideoSelect = (link) => {
    setWarRoom('videoLink', link);
  };

  const fetchWarRoomData = async () => {
    try {
      const response = await getAllWarroom();
      setWarRoom('warRoomItems', response.data.warrooms || []);
    } catch (error) {
      console.error('Error fetching war room data:', error);
      setWarRoom('error', 'Failed to load war room data');
    } finally {
      setWarRoom('loading', false);
    }
  };

  return {
    handleVideoSelect,
    fetchWarRoomData,
  };
};

export default WarRoomHandler;
