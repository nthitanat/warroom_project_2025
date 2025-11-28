import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCharityDetail from './useCharityDetail';
import CharityDetailHandler from './CharityDetailHandler';
import Slide from '../../components/charities/Slide/Slide';
import DonateModal from '../../components/charities/DonateModal/DonateModal';
import styles from './CharityDetail.module.scss';

export default function CharityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { stateCharityDetail, setCharityDetail, setMultipleFields } = useCharityDetail();
  const handlers = CharityDetailHandler(
    stateCharityDetail,
    setCharityDetail,
    setMultipleFields,
    id
  );

  useEffect(() => {
    handlers.fetchCharityData();
    handlers.fetchCharitySlideData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBackClick = () => {
    navigate(-1);
  };

  if (stateCharityDetail.loading) {
    return (
      <div className={styles.Container}>
        <div className={styles.LoadingWrapper}>
          <div className={styles.LoadingSpinner}>
            <div className={styles.Spinner}></div>
          </div>
          <p className={styles.LoadingText}>Loading charity details...</p>
        </div>
      </div>
    );
  }

  if (stateCharityDetail.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>
          <span className="material-icons">error_outline</span>
          <h2>Oops! Something went wrong</h2>
          <p>{stateCharityDetail.error}</p>
          <button onClick={handleBackClick} className={styles.ErrorButton}>
            <span className="material-icons">arrow_back</span>
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  if (
    !stateCharityDetail.charityData ||
    stateCharityDetail.charityData.length === 0
  ) {
    return (
      <div className={styles.Container}>
        <div className={styles.Empty}>
          <span className="material-icons">search_off</span>
          <h2>Charity Not Found</h2>
          <p>The charity you're looking for doesn't exist or has been removed.</p>
          <button onClick={handleBackClick} className={styles.ErrorButton}>
            <span className="material-icons">arrow_back</span>
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const charity = stateCharityDetail.charityData[0];

  return (
    <div className={styles.Container}>
      {/* Header Section */}
      <div className={styles.Header}>
        <button
          onClick={handleBackClick}
          className={styles.BackButton}
          aria-label="Go back"
        >
          <span className="material-icons">arrow_back</span>
          <span>Back to Campaigns</span>
        </button>
        
        <div className={styles.HeaderBadge}>
          <span className="material-icons">verified</span>
          <span>Verified Campaign</span>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.ContentWrapper}>
        {/* Title Section */}
        <div className={styles.TitleSection}>
          <h1 className={styles.PageTitle}>{charity.title}</h1>
          <div className={styles.CampaignMeta}>
            <div className={styles.MetaItem}>
              <span className="material-icons">volunteer_activism</span>
              <span>Active Campaign</span>
            </div>
            <div className={styles.MetaDivider}></div>
            <div className={styles.MetaItem}>
              <span className="material-icons">favorite</span>
              <span>Help Now</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className={styles.ContentGrid}>
          {/* Left Column - Slider & Description */}
          <div className={styles.MainColumn}>
            <div className={styles.SliderWrapper}>
              {stateCharityDetail.slideItems.length > 0 ? (
                <Slide items={stateCharityDetail.slideItems} />
              ) : (
                <div className={styles.EmptySlides}>
                  <span className="material-icons">image_not_supported</span>
                  <p>No images available</p>
                </div>
              )}
            </div>
            
            {charity && charity.description && (
              <div className={styles.DescriptionCard}>
                <div className={styles.DescriptionHeader}>
                  <span className="material-icons">description</span>
                  <h2>About This Campaign</h2>
                </div>
                <div className={styles.DescriptionContent}>
                  <p>{charity.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className={styles.SidebarColumn}>
            <div className={styles.ActionCard}>
              <div className={styles.ActionHeader}>
                <span className="material-icons">volunteer_activism</span>
                <h3>Support This Cause</h3>
              </div>
              
              <div className={styles.ImpactSection}>
                <p className={styles.ImpactText}>
                  Your donation can make a real difference in the lives of those affected by disasters.
                </p>
                
                <div className={styles.ImpactStats}>
                  <div className={styles.StatBox}>
                    <span className="material-icons">groups</span>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatLabel}>Community</span>
                      <span className={styles.StatValue}>Impact</span>
                    </div>
                  </div>
                  <div className={styles.StatBox}>
                    <span className="material-icons">favorite</span>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatLabel}>Direct</span>
                      <span className={styles.StatValue}>Support</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlers.handleOpenModal}
                className={styles.DonateButton}
                aria-label="Donate to charity"
              >
                <span className="material-icons">volunteer_activism</span>
                <span>Donate Now</span>
              </button>
              
              <div className={styles.SecurityNote}>
                <span className="material-icons">lock</span>
                <span>Secure donation process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DonateModal 
        open={stateCharityDetail.modalOpen} 
        handleClose={handlers.handleCloseModal} 
      />
    </div>
  );
}
