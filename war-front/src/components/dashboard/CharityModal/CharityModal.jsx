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
    if (!formData.title.trim()) newErrors.title = 'กรุณากรอกชื่อ';
    if (!formData.expected_fund) newErrors.expected_fund = 'กรุณากรอกเงินทุนที่คาดหวัง';
    if (formData.expected_fund && isNaN(formData.expected_fund)) newErrors.expected_fund = 'ต้องเป็นตัวเลข';
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
            {isEditing ? 'แก้ไขการกุศล' : 'เพิ่มการกุศลใหม่'}
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
              ชื่อ <span className={styles.Required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="กรอกชื่อการกุศล"
              className={`${styles.Input} ${errors.title ? styles.InputError : ''}`}
            />
            {errors.title && <span className={styles.FieldError}>{errors.title}</span>}
          </div>

          <div className={styles.FormGroup}>
            <label className={styles.Label}>รายละเอียด</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="กรอกรายละเอียดการกุศล"
              rows={4}
              className={styles.Textarea}
            />
          </div>

          <div className={styles.FormRow}>
            <div className={styles.FormGroup}>
              <label className={styles.Label}>
                เงินทุนที่คาดหวัง (บาท) <span className={styles.Required}>*</span>
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
              <label className={styles.Label}>เงินทุนปัจจุบัน (บาท)</label>
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
            <label className={styles.Label}>สถานะ</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.Select}
            >
              <option value="active">กำลังดำเนินการ</option>
              <option value="paused">หยุดชั่วคราว</option>
              <option value="completed">เสร็จสิ้นแล้ว</option>
            </select>
          </div>

          <div className={styles.ModalActions}>
            <button type="button" onClick={handleClose} className={styles.CancelButton}>
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className={styles.SubmitButton}>
              {saving ? (
                <>
                  <span className="material-icons">hourglass_empty</span>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <span className="material-icons">{isEditing ? 'save' : 'add'}</span>
                  <span>{isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างการกุศล'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
