import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCharityDetail from './useCharityDetail';
import CharityDetailHandler from './CharityDetailHandler';
import Slide from '../../components/charities/Slide/Slide';
import DonateModal from '../../components/charities/DonateModal/DonateModal';
import CharityItemCard from '../../components/charities/CharityItemCard/CharityItemCard';
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
    handlers.fetchCharityItems();
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
          <p className={styles.LoadingText}>กำลังโหลดรายละเอียดการกุศล...</p>
        </div>
      </div>
    );
  }

  if (stateCharityDetail.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>
          <span className="material-icons">error_outline</span>
          <h2>ขออภัย! มีบางอย่างผิดพลาด</h2>
          <p>{stateCharityDetail.error}</p>
          <button onClick={handleBackClick} className={styles.ErrorButton}>
            <span className="material-icons">arrow_back</span>
            <span>กลับ</span>
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
          <h2>ไม่พบการกุศล</h2>
          <p>การกุศลที่คุณกำลังมองหาไม่มีอยู่หรือถูกลบไปแล้ว</p>
          <button onClick={handleBackClick} className={styles.ErrorButton}>
            <span className="material-icons">arrow_back</span>
            <span>กลับ</span>
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
          aria-label="กลับ"
        >
          <span className="material-icons">arrow_back</span>
          <span>กลับหน้าแคมเปญ</span>
        </button>
        
        <div className={styles.HeaderBadge}>
          <span className="material-icons">verified</span>
          <span>แคมเปญที่ได้รับการยืนยัน</span>
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
              <span>แคมเปญที่กำลังดำเนินการ</span>
            </div>
            <div className={styles.MetaDivider}></div>
            <div className={styles.MetaItem}>
              <span className="material-icons">favorite</span>
              <span>ช่วยเหลือตอนนี้</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className={styles.ContentGrid}>
          {/* Left Column - Slider & Items */}
          <div className={styles.MainColumn}>
            <div className={styles.SliderWrapper}>
              {stateCharityDetail.slideItems.length > 0 ? (
                <Slide items={stateCharityDetail.slideItems} />
              ) : (
                <div className={styles.EmptySlides}>
                  <span className="material-icons">image_not_supported</span>
                  <p>ไม่มีรูปภาพ</p>
                </div>
              )}
            </div>
            
            {/* Charity Items Section - Always visible */}
            <CharityItemCard items={stateCharityDetail.charityItems || []} />
          </div>

          {/* Right Column - Sidebar */}
          <div className={styles.SidebarColumn}>
            <div className={styles.ActionCard}>
              <div className={styles.ActionHeader}>
                <span className="material-icons">volunteer_activism</span>
                <h3>สนับสนุนกิจกรรมนี้</h3>
              </div>
              
              <div className={styles.ImpactSection}>
                <p className={styles.ImpactText}>
                  การบริจาคของคุณสามารถสร้างความแตกต่างให้กับชีวิตของผู้ประสบภัยได้อย่างแท้จริง
                </p>
                
                <div className={styles.ImpactStats}>
                  <div className={styles.StatBox}>
                    <span className="material-icons">groups</span>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatLabel}>ชุมชน</span>
                      <span className={styles.StatValue}>ผลกระทบ</span>
                    </div>
                  </div>
                  <div className={styles.StatBox}>
                    <span className="material-icons">favorite</span>
                    <div className={styles.StatInfo}>
                      <span className={styles.StatLabel}>ช่วยเหลือ</span>
                      <span className={styles.StatValue}>โดยตรง</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlers.handleOpenModal}
                className={styles.DonateButton}
                aria-label="บริจาคให้การกุศล"
              >
                <span className="material-icons">volunteer_activism</span>
                <span>บริจาคตอนนี้</span>
              </button>
              
              <div className={styles.SecurityNote}>
                <span className="material-icons">lock</span>
                <span>กระบวนการบริจาคที่ปลอดภัย</span>
              </div>
            </div>
            
            {/* Description Card - Below Donate */}
            {charity && charity.description && (
              <div className={styles.DescriptionCard}>
                <div className={styles.DescriptionHeader}>
                  <span className="material-icons">description</span>
                  <h2>เกี่ยวกับแคมเปญนี้</h2>
                </div>
                <div className={styles.DescriptionContent}>
                  <p>{charity.description}</p>
                </div>
              </div>
            )}
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
