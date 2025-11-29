import { useNavigate } from 'react-router-dom';
import {
  getAllCharities,
  createCharity,
  updateCharity,
  deleteCharity,
  getCharitySlides,
  createCharitySlide,
  updateCharitySlide,
  deleteCharitySlide,
  createCharityItem,
  updateCharityItem,
} from '../../api/charitiesService';

const CharityDashboardHandler = (stateCharityDashboard, setCharityDashboard) => {
  const navigate = useNavigate();

  // ===== Charity Handlers =====
  const fetchCharities = async () => {
    try {
      setCharityDashboard('loading', true);
      const response = await getAllCharities();
      setCharityDashboard('charities', response.data.charities || []);
    } catch (error) {
      console.error('Error fetching charities:', error);
      setCharityDashboard('error', 'Failed to load charities');
    } finally {
      setCharityDashboard('loading', false);
    }
  };

  const handleOpenCharityModal = (charity = null) => {
    setCharityDashboard({
      selectedCharity: charity,
      charityModalOpen: true,
      isEditing: !!charity,
    });
  };

  const handleCloseCharityModal = () => {
    setCharityDashboard({
      selectedCharity: null,
      charityModalOpen: false,
      isEditing: false,
    });
  };

  const handleSaveCharity = async (charityData) => {
    try {
      setCharityDashboard('saving', true);
      
      if (stateCharityDashboard.isEditing && stateCharityDashboard.selectedCharity) {
        await updateCharity(stateCharityDashboard.selectedCharity.id, charityData);
      } else {
        await createCharity(charityData);
      }
      
      await fetchCharities();
      handleCloseCharityModal();
      return { success: true };
    } catch (error) {
      console.error('Error saving charity:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to save charity' };
    } finally {
      setCharityDashboard('saving', false);
    }
  };

  const handleOpenDeleteModal = (charity) => {
    setCharityDashboard({
      selectedCharity: charity,
      deleteModalOpen: true,
    });
  };

  const handleCloseDeleteModal = () => {
    setCharityDashboard({
      selectedCharity: null,
      deleteModalOpen: false,
    });
  };

  const handleDeleteCharity = async () => {
    try {
      setCharityDashboard('saving', true);
      await deleteCharity(stateCharityDashboard.selectedCharity.id);
      await fetchCharities();
      handleCloseDeleteModal();
      return { success: true };
    } catch (error) {
      console.error('Error deleting charity:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete charity' };
    } finally {
      setCharityDashboard('saving', false);
    }
  };

  // ===== Slide Handlers =====
  const fetchSlides = async (charityId) => {
    try {
      const response = await getCharitySlides(charityId);
      setCharityDashboard('slides', response.data.slides || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
    }
  };

  const handleOpenSlideModal = (charity, slide = null) => {
    setCharityDashboard({
      selectedCharity: charity,
      slideModalOpen: true,
      isEditingSlide: !!slide,
      selectedSlide: slide,
    });
    if (!slide) {
      fetchSlides(charity.id);
    }
  };

  const handleCloseSlideModal = () => {
    setCharityDashboard({
      slideModalOpen: false,
      isEditingSlide: false,
      selectedSlide: null,
    });
  };

  const handleSaveSlide = async (slideData, editingSlide = null) => {
    try {
      setCharityDashboard('saving', true);
      
      if (editingSlide) {
        await updateCharitySlide(editingSlide.id, slideData);
      } else {
        await createCharitySlide(stateCharityDashboard.selectedCharity.id, slideData);
      }
      
      await fetchSlides(stateCharityDashboard.selectedCharity.id);
      return { success: true };
    } catch (error) {
      console.error('Error saving slide:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to save slide' };
    } finally {
      setCharityDashboard('saving', false);
    }
  };

  const handleOpenDeleteSlideModal = (slide) => {
    setCharityDashboard({
      selectedSlide: slide,
      deleteSlideModalOpen: true,
    });
  };

  const handleCloseDeleteSlideModal = () => {
    setCharityDashboard({
      selectedSlide: null,
      deleteSlideModalOpen: false,
    });
  };

  const handleDeleteSlide = async () => {
    try {
      setCharityDashboard('saving', true);
      await deleteCharitySlide(stateCharityDashboard.selectedSlide.id);
      await fetchSlides(stateCharityDashboard.selectedCharity.id);
      handleCloseDeleteSlideModal();
      return { success: true };
    } catch (error) {
      console.error('Error deleting slide:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete slide' };
    } finally {
      setCharityDashboard('saving', false);
    }
  };

  // ===== Item Handlers =====
  const handleOpenItemModal = (charity) => {
    setCharityDashboard({
      selectedCharity: charity,
      itemModalOpen: true,
    });
  };

  const handleCloseItemModal = () => {
    setCharityDashboard({
      itemModalOpen: false,
    });
  };

  const handleSaveItem = async (itemData, editingItem = null) => {
    try {
      setCharityDashboard('saving', true);
      
      if (editingItem) {
        await updateCharityItem(editingItem.id, itemData);
      } else {
        await createCharityItem(stateCharityDashboard.selectedCharity.id, itemData);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving item:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to save item' };
    } finally {
      setCharityDashboard('saving', false);
    }
  };

  // ===== Filter Handlers =====
  const handleSearchChange = (query) => {
    setCharityDashboard('searchQuery', query);
  };

  const handleStatusFilterChange = (status) => {
    setCharityDashboard('statusFilter', status);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // Filter charities based on search and status, sorted by display_order
  const getFilteredCharities = () => {
    let filtered = stateCharityDashboard.charities;

    if (stateCharityDashboard.searchQuery) {
      const query = stateCharityDashboard.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (charity) =>
          charity.title?.toLowerCase().includes(query) ||
          charity.description?.toLowerCase().includes(query)
      );
    }

    if (stateCharityDashboard.statusFilter) {
      filtered = filtered.filter(
        (charity) => charity.status === stateCharityDashboard.statusFilter
      );
    }

    // Sort by display_order (ascending)
    return [...filtered].sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
  };

  return {
    fetchCharities,
    fetchSlides,
    handleOpenCharityModal,
    handleCloseCharityModal,
    handleSaveCharity,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleDeleteCharity,
    handleOpenSlideModal,
    handleCloseSlideModal,
    handleSaveSlide,
    handleOpenDeleteSlideModal,
    handleCloseDeleteSlideModal,
    handleDeleteSlide,
    handleOpenItemModal,
    handleCloseItemModal,
    handleSaveItem,
    handleSearchChange,
    handleStatusFilterChange,
    handleNavigate,
    getFilteredCharities,
  };
};

export default CharityDashboardHandler;
