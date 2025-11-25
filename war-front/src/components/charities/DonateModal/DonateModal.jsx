import React from 'react';
import styles from './DonateModal.module.scss';

export default function DonateModal({ open, handleClose }) {
  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.CloseButton}>
          Close
        </button>
        
        <h2 className={styles.Title}>
          ร่วมเป็นส่วนหนึ่งในการช่วยเหลือผู้ประสบภัย
        </h2>
        
        <div className={styles.ImageGrid}>
          <div className={styles.ImageWrapper}>
            <img
              src="/charities/image/donate1.png"
              alt="Donation QR Code 1"
              className={styles.Image}
            />
          </div>
          <div className={styles.ImageWrapper}>
            <img
              src="/charities/image/donate2.png"
              alt="Donation QR Code 2"
              className={styles.Image}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
