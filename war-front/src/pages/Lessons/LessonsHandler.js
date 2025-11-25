import { getAllLessons, getLessonPlaylists } from '../../api/lessonsService';

const LessonsHandler = (stateLessons, setLessons) => {
  const fetchLessonData = async () => {
    try {
      const response = await getAllLessons();
      setLessons('lessonItems', response.data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons('error', 'Failed to load lessons');
    } finally {
      setLessons('loading', false);
    }
  };

  const fetchLessonPlaylistData = async () => {
    try {
      const response = await getLessonPlaylists();
      setLessons('lessonPlaylistItems', response.data.playlists || []);
    } catch (error) {
      console.error('Error fetching lesson playlists:', error);
    }
  };

  const handleTabChange = (tabIndex) => {
    setLessons('selectedTab', tabIndex);
  };

  const handleOpenModal = (videoLink) => {
    setLessons({
      modalOpen: true,
      currentVideo: videoLink,
    });
  };

  const handleCloseModal = () => {
    setLessons({
      modalOpen: false,
      currentVideo: '',
    });
  };

  return {
    fetchLessonData,
    fetchLessonPlaylistData,
    handleTabChange,
    handleOpenModal,
    handleCloseModal,
  };
};

export default LessonsHandler;
