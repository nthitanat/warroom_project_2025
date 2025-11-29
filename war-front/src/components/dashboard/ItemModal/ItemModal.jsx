import React, { useState, useEffect } from 'react';
import { getCharityItemsByCharityId, deleteCharityItem } from '../../../api/charitiesService';
import styles from './ItemModal.module.scss';

export default function ItemModal({
  open,
  handleClose,
  charity,
  onSaveItem,
  saving,
}) {
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({
    name: '',
    needed_quantity: '',
    current_quantity: '',
    status: 'pending',
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingForms, setEditingForms] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const fetchItems = async () => {
    if (!charity) return;
    try {
      setLoading(true);
      const response = await getCharityItemsByCharityId(charity.id);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && charity) {
      fetchItems();
      resetForm();
    }
  }, [open, charity]);

  const resetForm = () => {
    setItemForm({
      name: '',
      needed_quantity: '',
      current_quantity: '',
      status: 'pending',
    });
    setErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setItemForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!itemForm.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อสิ่งของ';
    }
    
    if (!itemForm.needed_quantity || parseInt(itemForm.needed_quantity) <= 0) {
      newErrors.needed_quantity = 'จำนวนที่ต้องการต้องมากกว่า 0';
    }
    
    if (itemForm.current_quantity && parseInt(itemForm.current_quantity) < 0) {
      newErrors.current_quantity = 'จำนวนปัจจุบันต้องไม่ติดลบ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const itemData = {
      name: itemForm.name.trim(),
      needed_quantity: parseInt(itemForm.needed_quantity),
      current_quantity: parseInt(itemForm.current_quantity) || 0,
      status: itemForm.status,
    };

    const result = await onSaveItem(itemData, null);

    if (result.success) {
      resetForm();
      setIsAddFormOpen(false);
      await fetchItems();
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingForms({
      ...editingForms,
      [item.id]: {
        name: item.name || '',
        needed_quantity: item.needed_quantity?.toString() || '',
        current_quantity: item.current_quantity?.toString() || '',
        status: item.status || 'pending',
      }
    });
  };

  const handleCancelEdit = (itemId) => {
    setEditingItemId(null);
    const newForms = { ...editingForms };
    delete newForms[itemId];
    setEditingForms(newForms);
    setErrors({});
  };

  const handleEditFormChange = (itemId, field, value) => {
    setEditingForms({
      ...editingForms,
      [itemId]: {
        ...editingForms[itemId],
        [field]: value
      }
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSaveEdit = async (itemId) => {
    const form = editingForms[itemId];
    if (!form) return;

    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'กรุณากรอกชื่อสิ่งของ';
    if (!form.needed_quantity || parseInt(form.needed_quantity) <= 0) {
      newErrors.needed_quantity = 'จำนวนที่ต้องการต้องมากกว่า 0';
    }
    if (form.current_quantity && parseInt(form.current_quantity) < 0) {
      newErrors.current_quantity = 'จำนวนปัจจุบันต้องไม่ติดลบ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const itemData = {
      name: form.name.trim(),
      needed_quantity: parseInt(form.needed_quantity),
      current_quantity: parseInt(form.current_quantity) || 0,
      status: form.status,
    };

    const item = items.find(i => i.id === itemId);
    const result = await onSaveItem(itemData, item);

    if (result.success) {
      handleCancelEdit(itemId);
      await fetchItems();
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirm(item);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        setDeleting(true);
        await deleteCharityItem(deleteConfirm.id);
        await fetchItems();
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting item:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'in_progress':
        return 'pending';
      default:
        return 'hourglass_empty';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้นแล้ว';
      case 'in_progress':
        return 'กำลังดำเนินการ';
      default:
        return 'รอดำเนินการ';
    }
  };

  const getProgressPercentage = (current, needed) => {
    if (!needed || needed === 0) return 0;
    return Math.min(100, Math.round((current / needed) * 100));
  };

  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ModalHeader}>
          <h2 className={styles.ModalTitle}>
            <span className="material-icons">inventory_2</span>
            จัดการสิ่งของ - {charity?.title}
          </h2>
          <button onClick={handleClose} className={styles.CloseButton}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.Content}>
          {/* Add Item Form - Collapsible */}
          <div className={styles.FormSection}>
            <button 
              type="button"
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className={styles.SectionTitleButton}
            >
              <span className="material-icons">
                {isAddFormOpen ? 'expand_less' : 'expand_more'}
              </span>
              <h3 className={styles.SectionTitle}>
                <span className="material-icons">add_box</span>
                เพิ่มสิ่งของใหม่
              </h3>
            </button>

            {isAddFormOpen && (
              <form onSubmit={handleSubmit} className={styles.Form}>
              <div className={styles.FormRow}>
                <div className={styles.FormGroup}>
                  <label className={styles.Label}>
                    ชื่อสิ่งของ <span className={styles.Required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={itemForm.name}
                    onChange={handleFormChange}
                    placeholder="กรอกชื่อสิ่งของ"
                    className={`${styles.Input} ${errors.name ? styles.InputError : ''}`}
                  />
                  {errors.name && <span className={styles.FieldError}>{errors.name}</span>}
                </div>

                <div className={styles.FormGroup}>
                  <label className={styles.Label}>สถานะ</label>
                  <select
                    name="status"
                    value={itemForm.status}
                    onChange={handleFormChange}
                    className={styles.Select}
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้นแล้ว</option>
                  </select>
                </div>
              </div>

              <div className={styles.FormRow}>
                <div className={styles.FormGroup}>
                  <label className={styles.Label}>
                    จำนวนที่ต้องการ <span className={styles.Required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="needed_quantity"
                    value={itemForm.needed_quantity}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="1"
                    className={`${styles.Input} ${errors.needed_quantity ? styles.InputError : ''}`}
                  />
                  {errors.needed_quantity && (
                    <span className={styles.FieldError}>{errors.needed_quantity}</span>
                  )}
                </div>

                <div className={styles.FormGroup}>
                  <label className={styles.Label}>จำนวนปัจจุบัน</label>
                  <input
                    type="number"
                    name="current_quantity"
                    value={itemForm.current_quantity}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className={`${styles.Input} ${errors.current_quantity ? styles.InputError : ''}`}
                  />
                  {errors.current_quantity && (
                    <span className={styles.FieldError}>{errors.current_quantity}</span>
                  )}
                </div>
              </div>

              <div className={styles.FormActions}>
                <button 
                  type="button" 
                  onClick={() => {
                    resetForm();
                    setIsAddFormOpen(false);
                  }} 
                  className={styles.CancelButton}
                >
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
                      <span className="material-icons">add</span>
                      <span>เพิ่มสิ่งของ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>

          {/* Items List */}
          <div className={styles.ItemsSection}>
            <h3 className={styles.SectionTitle}>
              <span className="material-icons">list_alt</span>
              สิ่งของ ({items?.length || 0})
            </h3>

            {loading ? (
              <div className={styles.LoadingState}>
                <span className="material-icons">hourglass_empty</span>
                <p>กำลังโหลดสิ่งของ...</p>
              </div>
            ) : !items || items.length === 0 ? (
              <div className={styles.EmptyState}>
                <span className="material-icons">inventory</span>
                <p>ยังไม่มีสิ่งของ เพิ่มสิ่งของแรกของคุณด้านบน</p>
              </div>
            ) : (
              <>
                {/* Stats Summary */}
                <div className={styles.StatsSummary}>
                  <div className={`${styles.StatCard} ${styles.pending}`}>
                    <div className={styles.StatIcon}>
                      <span className="material-icons">schedule</span>
                    </div>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatValue}>
                        {items.filter(i => i.status === 'pending').length}
                      </span>
                      <span className={styles.StatLabel}>รอดำเนินการ</span>
                    </div>
                  </div>
                  <div className={`${styles.StatCard} ${styles.in_progress}`}>
                    <div className={styles.StatIcon}>
                      <span className="material-icons">autorenew</span>
                    </div>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatValue}>
                        {items.filter(i => i.status === 'in_progress').length}
                      </span>
                      <span className={styles.StatLabel}>กำลังดำเนินการ</span>
                    </div>
                  </div>
                  <div className={`${styles.StatCard} ${styles.completed}`}>
                    <div className={styles.StatIcon}>
                      <span className="material-icons">check_circle</span>
                    </div>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatValue}>
                        {items.filter(i => i.status === 'completed').length}
                      </span>
                      <span className={styles.StatLabel}>เสร็จสิ้นแล้ว</span>
                    </div>
                  </div>
                </div>

                <div className={styles.ItemsGrid}>
                  {items.map((item) => {
                    const progress = getProgressPercentage(item.current_quantity, item.needed_quantity);
                    const isEditing = editingItemId === item.id;
                    const editForm = editingForms[item.id];
                    
                    return (
                      <div key={item.id} className={`${styles.ItemCard} ${styles[item.status]} ${isEditing ? styles.editing : ''}`}>
                        {!isEditing ? (
                          <>
                            <div className={styles.ItemHeader}>
                              <h4 className={styles.ItemName}>{item.name}</h4>
                              <span className={`${styles.StatusBadge} ${styles[item.status]}`}>
                                <span className="material-icons">{getStatusIcon(item.status)}</span>
                                <span>{getStatusLabel(item.status)}</span>
                              </span>
                            </div>
                            
                            <div className={styles.ItemProgress}>
                              <div className={styles.CircularProgressWrapper}>
                                <div className={`${styles.CircularProgress} ${styles[item.status]}`}>
                                  <svg className={styles.CircularSvg} viewBox="0 0 100 100">
                                    <circle
                                      className={styles.CircularBackground}
                                      cx="50"
                                      cy="50"
                                      r="42"
                                    />
                                    <circle
                                      className={`${styles.CircularFill} ${styles[item.status]}`}
                                      cx="50"
                                      cy="50"
                                      r="42"
                                      style={{
                                        strokeDasharray: `${progress * 2.64} 264`,
                                      }}
                                    />
                                  </svg>
                                  <div className={styles.CircularCenter}>
                                    <span className={`${styles.CircularPercent} ${styles[item.status]}`}>
                                      {progress}%
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.ProgressInfo}>
                                  <span>{item.current_quantity} / {item.needed_quantity}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className={styles.ItemActions}>
                              <button
                                onClick={() => handleEditItem(item)}
                                className={`${styles.ItemActionButton} ${styles.edit}`}
                                title="แก้ไข"
                              >
                                <span className="material-icons">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className={`${styles.ItemActionButton} ${styles.delete}`}
                                title="ลบ"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className={styles.EditForm}>
                            <div className={styles.EditFormHeader}>
                              <span className="material-icons">edit</span>
                              <h4>แก้ไขสิ่งของ</h4>
                            </div>
                            
                            <div className={styles.EditFormGroup}>
                              <label className={styles.Label}>ชื่อสิ่งของ</label>
                              <input
                                type="text"
                                value={editForm?.name || ''}
                                onChange={(e) => handleEditFormChange(item.id, 'name', e.target.value)}
                                className={styles.Input}
                              />
                            </div>
                            
                            <div className={styles.EditFormRow}>
                              <div className={styles.EditFormGroup}>
                                <label className={styles.Label}>จำนวนที่ต้องการ</label>
                                <input
                                  type="number"
                                  value={editForm?.needed_quantity || ''}
                                  onChange={(e) => handleEditFormChange(item.id, 'needed_quantity', e.target.value)}
                                  min="1"
                                  className={styles.Input}
                                />
                              </div>
                              
                              <div className={styles.EditFormGroup}>
                                <label className={styles.Label}>จำนวนปัจจุบัน</label>
                                <input
                                  type="number"
                                  value={editForm?.current_quantity || ''}
                                  onChange={(e) => handleEditFormChange(item.id, 'current_quantity', e.target.value)}
                                  min="0"
                                  className={styles.Input}
                                />
                              </div>
                            </div>
                            
                            <div className={styles.EditFormGroup}>
                              <label className={styles.Label}>สถานะ</label>
                              <select
                                value={editForm?.status || 'pending'}
                                onChange={(e) => handleEditFormChange(item.id, 'status', e.target.value)}
                                className={styles.Select}
                              >
                                <option value="pending">รอดำเนินการ</option>
                                <option value="in_progress">กำลังดำเนินการ</option>
                                <option value="completed">เสร็จสิ้นแล้ว</option>
                              </select>
                            </div>
                            
                            <div className={styles.EditFormActions}>
                              <button
                                onClick={() => handleCancelEdit(item.id)}
                                className={styles.CancelButton}
                              >
                                ยกเลิก
                              </button>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={saving}
                                className={styles.SubmitButton}
                              >
                                {saving ? (
                                  <>
                                    <span className="material-icons">hourglass_empty</span>
                                    <span>กำลังบันทึก...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-icons">save</span>
                                    <span>บันทึก</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className={styles.DeleteOverlay}>
            <div className={styles.DeleteConfirm}>
              <span className="material-icons">warning</span>
              <p>ลบ "{deleteConfirm.name}"?</p>
              <div className={styles.DeleteActions}>
                <button onClick={() => setDeleteConfirm(null)} className={styles.CancelButton}>
                  ยกเลิก
                </button>
                <button onClick={handleConfirmDelete} disabled={deleting} className={styles.DeleteButton}>
                  {deleting ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
