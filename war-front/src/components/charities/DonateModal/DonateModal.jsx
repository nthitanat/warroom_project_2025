import React from 'react';
import styles from './DonateModal.module.scss';

export default function DonateModal({ open, handleClose }) {
  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className={styles.CloseButton}>
          ปิด
        </button>
        
        <h2 className={styles.Title}>
          ร่วมเป็นส่วนหนึ่งในการช่วยเหลือผู้ประสบภัย
        </h2>
        
        <div className={styles.QRCodeContainer}>
          <div className={styles.QRCodeWrapper}>
            <img
              src={`${process.env.PUBLIC_URL}/charities/images/donate1.png`}
              alt="Donation QR Code"
              className={styles.QRCodeImage}
            />
          </div>
          <p className={styles.Instructions}>
            สแกน QR Code เพื่อบริจาคผ่านธนาคาร
          </p>
        </div>
      </div>
    </div>
  );
}
