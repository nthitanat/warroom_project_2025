import React from 'react';
import styles from './ConfirmModal.module.scss';

export default function ConfirmModal({
  open,
  handleClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  saving,
  variant = 'danger', // 'danger' | 'warning' | 'info'
}) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.IconWrapper} ${styles[variant]}`}>
          <span className="material-icons">
            {variant === 'danger' && 'delete_forever'}
            {variant === 'warning' && 'warning'}
            {variant === 'info' && 'info'}
          </span>
        </div>

        <h2 className={styles.Title}>{title}</h2>
        <p className={styles.Message}>{message}</p>

        <div className={styles.Actions}>
          <button onClick={handleClose} className={styles.CancelButton}>
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className={`${styles.ConfirmButton} ${styles[variant]}`}
          >
            {saving ? (
              <>
                <span className="material-icons">hourglass_empty</span>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
