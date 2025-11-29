import React, { useState, useEffect } from 'react';
import { getCharitySlideImage, deleteCharitySlide } from '../../../api/charitiesService';
import styles from './SlideModal.module.scss';

export default function SlideModal({
  open,
  handleClose,
  charity,
  slides,
  onSaveSlide,
  fetchSlides,
  saving,
}) {
  const [slideForm, setSlideForm] = useState({
    description: '',
    display_order: '',
  });
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideImages, setSlideImages] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && charity) {
      fetchSlides(charity.id);
    }
  }, [open, charity]);

  useEffect(() => {
    const loadSlideImages = async () => {
      if (!slides || slides.length === 0) return;

      const images = {};
      for (const slide of slides) {
        try {
          const response = await getCharitySlideImage(slide.id);
          const imageBlob = new Blob([response.data]);
          const imageObjectURL = URL.createObjectURL(imageBlob);
          images[slide.id] = imageObjectURL;
        } catch (error) {
          images[slide.id] = null;
        }
      }
      setSlideImages(images);
    };

    loadSlideImages();

    return () => {
      Object.values(slideImages).forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [slides]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSlideForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    // No required fields - img and display_order are auto-generated
    return true;
  };

  const handleAddSlide = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await onSaveSlide(
      {
        description: slideForm.description,
        display_order: slideForm.display_order ? parseInt(slideForm.display_order) : undefined,
      },
      editingSlide
    );

    if (result.success) {
      setSlideForm({ description: '', display_order: '' });
      setEditingSlide(null);
    }
  };

  const handleEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      description: slide.description || '',
      display_order: slide.display_order || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    setSlideForm({ description: '', display_order: '' });
    setErrors({});
  };

  const handleDeleteClick = (slide) => {
    setDeleteConfirm(slide);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        setDeleting(true);
        await deleteCharitySlide(deleteConfirm.id);
        await fetchSlides(charity.id);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting slide:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ModalHeader}>
          <h2 className={styles.ModalTitle}>
            <span className="material-icons">collections</span>
            Manage Slides - {charity?.title}
          </h2>
          <button onClick={handleClose} className={styles.CloseButton}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.Content}>
          {/* Add/Edit Slide Form */}
          <div className={styles.FormSection}>
            <h3 className={styles.SectionTitle}>
              <span className="material-icons">
                {editingSlide ? 'edit' : 'add_photo_alternate'}
              </span>
              {editingSlide ? 'Edit Slide' : 'Add New Slide'}
            </h3>

            <form onSubmit={handleAddSlide} className={styles.Form}>
              <div className={styles.FormRow}>
                <div className={styles.FormGroup}>
                  <label className={styles.Label}>Description</label>
                  <input
                    type="text"
                    name="description"
                    value={slideForm.description}
                    onChange={handleFormChange}
                    placeholder="Enter slide description (optional)"
                    className={styles.Input}
                  />
                </div>

                <div className={styles.FormGroup}>
                  <label className={styles.Label}>Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={slideForm.display_order}
                    onChange={handleFormChange}
                    placeholder="Auto"
                    min="1"
                    className={styles.Input}
                  />
                  <span className={styles.HelpText}>Leave empty for auto-increment</span>
                </div>
              </div>

              <div className={styles.FormActions}>
                {editingSlide && (
                  <button type="button" onClick={handleCancelEdit} className={styles.CancelButton}>
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={saving} className={styles.SubmitButton}>
                  {saving ? (
                    <>
                      <span className="material-icons">hourglass_empty</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons">{editingSlide ? 'save' : 'add'}</span>
                      <span>{editingSlide ? 'Update Slide' : 'Add Slide'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Slides List */}
          <div className={styles.SlidesSection}>
            <h3 className={styles.SectionTitle}>
              <span className="material-icons">view_carousel</span>
              Slides ({slides?.length || 0})
            </h3>

            {!slides || slides.length === 0 ? (
              <div className={styles.EmptyState}>
                <span className="material-icons">image_not_supported</span>
                <p>No slides yet. Add your first slide above.</p>
              </div>
            ) : (
              <div className={styles.SlidesGrid}>
                {[...slides].sort((a, b) => a.display_order - b.display_order).map((slide) => (
                  <div key={slide.id} className={styles.SlideCard}>
                    <div className={styles.SlideImage}>
                      {slideImages[slide.id] ? (
                        <img src={slideImages[slide.id]} alt={`Slide ${slide.id}`} />
                      ) : (
                        <div className={styles.ImagePlaceholder}>
                          <span className="material-icons">image</span>
                        </div>
                      )}
                      <div className={styles.SlideOrder}>#{slide.display_order}</div>
                    </div>
                    <div className={styles.SlideInfo}>
                      <p className={styles.SlideDescription}>
                        {slide.description || 'No description'}
                      </p>
                      <div className={styles.SlideActions}>
                        <button
                          onClick={() => handleEditSlide(slide)}
                          className={`${styles.SlideActionButton} ${styles.edit}`}
                          title="Edit"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(slide)}
                          className={`${styles.SlideActionButton} ${styles.delete}`}
                          title="Delete"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className={styles.DeleteOverlay}>
            <div className={styles.DeleteConfirm}>
              <span className="material-icons">warning</span>
              <p>Delete this slide?</p>
              <div className={styles.DeleteActions}>
                <button onClick={() => setDeleteConfirm(null)} className={styles.CancelButton}>
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} disabled={deleting} className={styles.DeleteButton}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
