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
        <div className={styles.Loading}>Loading charity details...</div>
      </div>
    );
  }

  if (stateCharityDetail.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>
          <h2>Error</h2>
          <p>{stateCharityDetail.error}</p>
          <button onClick={handleBackClick} className={styles.BackButton}>
            Go Back
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
          <p>Charity not found</p>
          <button onClick={handleBackClick} className={styles.BackButton}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const charity = stateCharityDetail.charityData[0];

  return (
    <div className={styles.Container}>
      <div className={styles.BackButtonContainer}>
        <button
          onClick={handleBackClick}
          className={styles.BackButton}
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>
        {charity && <h1 className={styles.Title}>{charity.title}</h1>}
      </div>

      <div className={styles.ContentGrid}>
        <div className={styles.SliderSection}>
          {stateCharityDetail.slideItems.length > 0 ? (
            <Slide items={stateCharityDetail.slideItems} />
          ) : (
            <div className={styles.Empty}>No images available</div>
          )}
          
          {charity && charity.description && (
            <div className={styles.Description}>
              <p>{charity.description}</p>
            </div>
          )}
        </div>

        <div className={styles.SidebarSection}>
          <div className={styles.InfoCard}>
            <h2 className={styles.InfoTitle}>{charity.title}</h2>
            
            {charity.description && (
              <div className={styles.InfoDescription}>
                <p>{charity.description}</p>
              </div>
            )}
            
            {charity.expected_fund && (
              <div className={styles.FundInfo}>
                <p className={styles.FundLabel}>Expected Fund:</p>
                <p className={styles.FundAmount}>
                  {charity.expected_fund.toLocaleString()} THB
                </p>
              </div>
            )}
            
            <button
              onClick={handlers.handleOpenModal}
              className={styles.DonateButton}
              aria-label="donate to charity"
            >
              Donate
            </button>
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
