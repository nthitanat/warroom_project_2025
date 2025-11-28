import React from 'react';
import styles from './LoadingIndicator.module.scss';

export default function LoadingIndicator({ message = 'Loading...', fullScreen = true }) {
  if (fullScreen) {
    return (
      <div className={styles.FullScreenContainer}>
        <div className={styles.LoadingContent}>
          <div className={styles.Spinner}>
            <div className={styles.SpinnerRing}></div>
            <div className={styles.SpinnerRing}></div>
            <div className={styles.SpinnerRing}></div>
          </div>
          <p className={styles.Message}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.InlineContainer}>
      <div className={styles.Spinner}>
        <div className={styles.SpinnerRing}></div>
        <div className={styles.SpinnerRing}></div>
        <div className={styles.SpinnerRing}></div>
      </div>
      <p className={styles.Message}>{message}</p>
    </div>
  );
}
