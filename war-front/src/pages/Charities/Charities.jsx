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

  const latestCharity = stateCharities.charitiesItems[0];
  const remainingCharities = stateCharities.charitiesItems.slice(1);

  if (stateCharities.loading) {
    return (
      <div className={styles.Container}>
        <div className={styles.Loading}>
          <span className="material-icons">hourglass_empty</span>
          <p>Loading charities...</p>
        </div>
      </div>
    );
  }

  if (stateCharities.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>
          <span className="material-icons">error_outline</span>
          <p>{stateCharities.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      {/* Featured Latest Charity */}
      {latestCharity && (
        <div className={styles.FeaturedSection}>
          <div className={styles.FeaturedLabel}>
            <span className="material-icons">campaign</span>
            <span>Featured Campaign</span>
          </div>
          
          <div className={styles.FeaturedCard}>
            <div className={styles.FeaturedImageWrapper}>
              {thumbnailUrls[latestCharity.id] && (
                <img
                  src={thumbnailUrls[latestCharity.id]}
                  alt={latestCharity.title}
                  className={styles.FeaturedImage}
                  onError={(e) => {
                    console.error('Thumbnail loading error:', e);
                    e.target.src = '/images/fallback.jpg';
                  }}
                />
              )}
              <div className={styles.FeaturedBadge}>
                <span className="material-icons">volunteer_activism</span>
                <span>Help Now</span>
              </div>
              <div className={styles.FeaturedOverlay}></div>
            </div>
            
            <div className={styles.FeaturedContent}>
              <div className={styles.FeaturedHeader}>
                <h2 className={styles.FeaturedTitle}>{latestCharity.title}</h2>
                <p className={styles.FeaturedDescription}>{latestCharity.description}</p>
              </div>
              
              <div className={styles.FeaturedStats}>
                <div className={styles.StatItem}>
                  <span className="material-icons">favorite</span>
                  <div className={styles.StatInfo}>
                    <span className={styles.StatValue}>Active</span>
                    <span className={styles.StatLabel}>Campaign</span>
                  </div>
                </div>
                <div className={styles.StatDivider}></div>
                <div className={styles.StatItem}>
                  <span className="material-icons">verified</span>
                  <div className={styles.StatInfo}>
                    <span className={styles.StatValue}>Verified</span>
                    <span className={styles.StatLabel}>Organization</span>
                  </div>
                </div>
                <div className={styles.StatDivider}></div>
                <div className={styles.StatItem}>
                  <span className="material-icons">support</span>
                  <div className={styles.StatInfo}>
                    <span className={styles.StatValue}>Urgent</span>
                    <span className={styles.StatLabel}>Need</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.FeaturedActions}>
                <button
                  onClick={handlers.handleOpenModal}
                  className={styles.FeaturedDonateButton}
                  aria-label="Donate to featured charity"
                >
                  <span className="material-icons">volunteer_activism</span>
                  <span>Donate Now</span>
                </button>
                <button
                  onClick={() => handlers.handleRedirectToCharity(latestCharity.id)}
                  className={styles.FeaturedDetailsButton}
                  aria-label="View charity details"
                >
                  <span className="material-icons">info</span>
                  <span>Learn More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Charities Section */}
      <div className={styles.CharitiesSection}>
        <div className={styles.SectionHeader}>
          <h2 className={styles.SectionTitle}>
            <span className="material-icons">volunteer_activism</span>
            <span>All Campaigns</span>
          </h2>
          <p className={styles.SectionSubtitle}>Make a difference in the lives of those affected by disasters</p>
        </div>
        
        <div className={styles.Grid}>
          {remainingCharities.map((charity, index) => (
            <div key={charity.id || index} className={styles.Card}>
              <div className={styles.CardImageWrapper}>
                {thumbnailUrls[charity.id] && (
                  <img 
                    src={thumbnailUrls[charity.id]} 
                    alt={charity.title}
                    className={styles.CardImage}
                    onError={(e) => {
                      console.error('Thumbnail loading error:', e);
                      e.target.src = '/images/fallback.jpg';
                    }}
                  />
                )}
                <div className={styles.CardImageOverlay}>
                  <button
                    onClick={() => handlers.handleRedirectToCharity(charity.id)}
                    className={styles.QuickViewButton}
                    aria-label="Quick view charity"
                  >
                    <span className="material-icons">visibility</span>
                  </button>
                </div>
              </div>
              
              <div className={styles.CardContent}>
                <div className={styles.CardHeader}>
                  <h4 className={styles.CardTitle}>{charity.title}</h4>
                  <div className={styles.CardBadge}>
                    <span className="material-icons">verified</span>
                    <span>Verified</span>
                  </div>
                </div>
                
                <p className={styles.CardDescription}>{charity.description}</p>
                
                <div className={styles.CardProgress}>
                  <div className={styles.ProgressBar}>
                    <div className={styles.ProgressFill} style={{ width: '75%' }}></div>
                  </div>
                  <div className={styles.ProgressInfo}>
                    <span className={styles.ProgressText}>
                      <span className="material-icons">favorite</span>
                      <span>In progress</span>
                    </span>
                    <span className={styles.ProgressDonors}>Accepting donations</span>
                  </div>
                </div>
                
                <div className={styles.CardActions}>
                  <button
                    onClick={handlers.handleOpenModal}
                    className={styles.DonateButton}
                    aria-label="Donate to charity"
                  >
                    <span className="material-icons">volunteer_activism</span>
                    <span>Donate</span>
                  </button>
                  <button
                    onClick={() => handlers.handleRedirectToCharity(charity.id)}
                    className={styles.ViewButton}
                    aria-label="View charity details"
                  >
                    <span className="material-icons">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <DonateModal 
        open={stateCharities.modalOpen} 
        handleClose={handlers.handleCloseModal} 
      />
    </div>
  );
}
