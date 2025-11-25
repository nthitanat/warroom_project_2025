import React from 'react';
import styles from './VideoModal.module.scss';

export default function VideoModal({ open, handleClose, videoLink }) {
  const [loading, setLoading] = React.useState(true);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleModalClose = () => {
    setLoading(true);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className={styles.Overlay} onClick={handleModalClose}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={handleModalClose} className={styles.CloseButton}>
          Close
        </button>

        {loading && (
          <div className={styles.LoadingContainer}>
            <div className={styles.Spinner}></div>
          </div>
        )}

        <iframe
          width="100%"
          height="400px"
          src={videoLink}
          title="Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          style={{ display: loading ? 'none' : 'block', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
}
