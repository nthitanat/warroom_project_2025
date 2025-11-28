import React, { useEffect, useState } from 'react';
import useCharities from './useCharities';
import CharitiesHandler from './CharitiesHandler';
import { getCharityThumbnail } from '../../api/charitiesService';
import Slide from '../../components/charities/Slide/Slide';
import DonateModal from '../../components/charities/DonateModal/DonateModal';
import { LoadingIndicator } from '../../components/common';
import styles from './Charities.module.scss';

export default function Charities() {
  const { stateCharities, setCharities } = useCharities();
  const handlers = CharitiesHandler(stateCharities, setCharities);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  useEffect(() => {
    handlers.fetchCharitiesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch thumbnails from API for each charity
    const fetchThumbnails = async () => {
      if (!stateCharities.charitiesItems || stateCharities.charitiesItems.length === 0) return;

      const urls = {};
      for (const charity of stateCharities.charitiesItems) {
        try {
          const response = await getCharityThumbnail(charity.id);
          const imageBlob = new Blob([response.data]);
          const imageObjectURL = URL.createObjectURL(imageBlob);
          urls[charity.id] = imageObjectURL;
        } catch (error) {
          console.error(`Failed to load thumbnail for charity ${charity.id}:`, error);
          urls[charity.id] = '/images/fallback.jpg';
        }
      }
      setThumbnailUrls(urls);
    };

    fetchThumbnails();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(thumbnailUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [stateCharities.charitiesItems]);

  if (stateCharities.loading) {
    return <LoadingIndicator message="Loading charities..." />;
  }

  if (stateCharities.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>{stateCharities.error}</div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      <h1 className={styles.Title}>Charities</h1>
      
      <div className={styles.Grid}>
        {stateCharities.charitiesItems.map((charity, index) => (
          <div key={charity.id || index} className={styles.GridItem}>
            <div className={styles.Card}>
              {thumbnailUrls[charity.id] && (
                <img 
                  src={thumbnailUrls[charity.id]} 
                  alt={charity.title}
                  className={styles.Thumbnail}
                  onError={(e) => {
                    console.error('Thumbnail loading error:', e);
                    e.target.src = '/images/fallback.jpg';
                  }}
                />
              )}
              
              <div className={styles.CardContent}>
                <h4 className={styles.CardTitle}>{charity.title}</h4>
                <p className={styles.Description}>
                  {charity.description}
                </p>
                <div className={styles.ButtonGroup}>
                  <button
                    onClick={() => handlers.handleRedirectToCharity(charity.id)}
                    className={styles.Button}
                    aria-label="View charity details"
                  >
                    View Charity
                  </button>
                  <button
                    onClick={handlers.handleOpenModal}
                    className={styles.Button}
                    aria-label="Donate to charity"
                  >
                    Donate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <DonateModal 
        open={stateCharities.modalOpen} 
        handleClose={handlers.handleCloseModal} 
      />
    </div>
  );
}
