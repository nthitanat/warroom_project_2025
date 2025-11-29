import React, { useState, useEffect } from 'react';
import styles from './CharityModal.module.scss';

export default function CharityModal({ 
  open, 
  handleClose, 
  charity, 
  isEditing, 
  onSave, 
  saving 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expected_fund: '',
    current_fund: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (charity && isEditing) {
      setFormData({
        title: charity.title || '',
        description: charity.description || '',
        expected_fund: charity.expected_fund || '',
        current_fund: charity.current_fund || '',
        status: charity.status || 'active',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        expected_fund: '',
        current_fund: '',
        status: 'active',
      });
    }
    setErrors({});
    setSubmitError('');
  }, [charity, isEditing, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.expected_fund) newErrors.expected_fund = 'Expected fund is required';
    if (formData.expected_fund && isNaN(formData.expected_fund)) newErrors.expected_fund = 'Must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validate()) return;

    const result = await onSave({
      ...formData,
      expected_fund: parseFloat(formData.expected_fund) || 0,
      current_fund: parseFloat(formData.current_fund) || 0,
    });

    if (!result.success) {
      setSubmitError(result.error);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ModalHeader}>
          <h2 className={styles.ModalTitle}>
            <span className="material-icons">
              {isEditing ? 'edit' : 'add_circle'}
            </span>
            {isEditing ? 'Edit Charity' : 'Add New Charity'}
          </h2>
          <button onClick={handleClose} className={styles.CloseButton}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.Form}>
          {submitError && (
            <div className={styles.ErrorAlert}>
              <span className="material-icons">error</span>
              <span>{submitError}</span>
            </div>
          )}

          <div className={styles.FormGroup}>
            <label className={styles.Label}>
              Title <span className={styles.Required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter charity title"
              className={`${styles.Input} ${errors.title ? styles.InputError : ''}`}
            />
            {errors.title && <span className={styles.FieldError}>{errors.title}</span>}
          </div>

          <div className={styles.FormGroup}>
            <label className={styles.Label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter charity description"
              rows={4}
              className={styles.Textarea}
            />
          </div>

          <div className={styles.FormRow}>
            <div className={styles.FormGroup}>
              <label className={styles.Label}>
                Expected Fund (THB) <span className={styles.Required}>*</span>
              </label>
              <input
                type="number"
                name="expected_fund"
                value={formData.expected_fund}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={`${styles.Input} ${errors.expected_fund ? styles.InputError : ''}`}
              />
              {errors.expected_fund && <span className={styles.FieldError}>{errors.expected_fund}</span>}
            </div>

            <div className={styles.FormGroup}>
              <label className={styles.Label}>Current Fund (THB)</label>
              <input
                type="number"
                name="current_fund"
                value={formData.current_fund}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className={styles.Input}
              />
            </div>
          </div>

          <div className={styles.FormGroup}>
            <label className={styles.Label}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.Select}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className={styles.ModalActions}>
            <button type="button" onClick={handleClose} className={styles.CancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={styles.SubmitButton}>
              {saving ? (
                <>
                  <span className="material-icons">hourglass_empty</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-icons">{isEditing ? 'save' : 'add'}</span>
                  <span>{isEditing ? 'Save Changes' : 'Create Charity'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
