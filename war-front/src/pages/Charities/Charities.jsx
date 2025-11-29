import React, { useEffect, useState } from 'react';
import useCharities from './useCharities';
import CharitiesHandler from './CharitiesHandler';
import { getCharityThumbnail } from '../../api/charitiesService';
import DonateModal from '../../components/charities/DonateModal/DonateModal';
import { LoadingIndicator } from '../../components/common';
import styles from './Charities.module.scss';

// Helper function to get item icon based on category/name
const getItemIcon = (item) => {
  const name = (item.name || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  
  if (name.includes('น้ำ') || name.includes('water') || category.includes('water')) return 'water_drop';
  if (name.includes('อาหาร') || name.includes('food') || category.includes('food')) return 'restaurant';
  if (name.includes('ยา') || name.includes('medicine') || category.includes('medical')) return 'medication';
  if (name.includes('เสื้อผ้า') || name.includes('cloth') || category.includes('clothing')) return 'checkroom';
  if (name.includes('ผ้าห่ม') || name.includes('blanket')) return 'bed';
  if (name.includes('เต็นท์') || name.includes('tent') || category.includes('shelter')) return 'holiday_village';
  if (name.includes('ของใช้') || name.includes('supply') || category.includes('supplies')) return 'inventory_2';
  if (name.includes('เงิน') || name.includes('money') || category.includes('money')) return 'payments';
  return 'category';
};

export default function Charities() {
  const { stateCharities, setCharities } = useCharities();
  const handlers = CharitiesHandler(stateCharities, setCharities);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  useEffect(() => {
    handlers.fetchCharitiesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch items for featured charity
  useEffect(() => {
    if (stateCharities.charitiesItems && stateCharities.charitiesItems.length > 0) {
      const featuredCharity = stateCharities.charitiesItems[0];
      handlers.fetchFeaturedItems(featuredCharity.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateCharities.charitiesItems]);

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
          <p>กำลังโหลดข้อมูลการกุศล...</p>
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
            <span>แคมเปญแนะนำ</span>
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
                <span>ช่วยเหลือตอนนี้</span>
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
                    <span className={styles.StatValue}>กำลังดำเนินการ</span>
                    <span className={styles.StatLabel}>แคมเปญ</span>
                  </div>
                </div>
                <div className={styles.StatDivider}></div>
                <div className={styles.StatItem}>
                  <span className="material-icons">verified</span>
                  <div className={styles.StatInfo}>
                    <span className={styles.StatValue}>ได้รับการยืนยัน</span>
                    <span className={styles.StatLabel}>องค์กร</span>
                  </div>
                </div>
                <div className={styles.StatDivider}></div>
                <div className={styles.StatItem}>
                  <span className="material-icons">support</span>
                  <div className={styles.StatInfo}>
                    <span className={styles.StatValue}>เร่งด่วน</span>
                    <span className={styles.StatLabel}>ต้องการความช่วยเหลือ</span>
                  </div>
                </div>
              </div>

              {/* Mini Items Widget */}
              <div className={styles.MiniItemsWidget}>
                <div className={styles.MiniItemsHeader}>
                  <span className="material-icons">inventory_2</span>
                  <span className={styles.MiniItemsTitle}>สิ่งของที่ต้องการ</span>
                  {stateCharities.featuredItems.length > 0 && (
                    <span className={styles.MiniItemsCount}>{stateCharities.featuredItems.length} รายการ</span>
                  )}
                </div>
                
                {stateCharities.featuredItemsLoading ? (
                  <div className={styles.MiniItemsLoading}>
                    <span className="material-icons">hourglass_empty</span>
                    <span>กำลังโหลด...</span>
                  </div>
                ) : stateCharities.featuredItems.length > 0 ? (
                  <div className={styles.MiniItemsList}>
                    {stateCharities.featuredItems.slice(0, 4).map((item, index) => {
                      const progress = item.target_quantity > 0 
                        ? Math.min((item.current_quantity / item.target_quantity) * 100, 100) 
                        : 0;
                      const isComplete = progress >= 100;
                      
                      return (
                        <div key={item.id || index} className={`${styles.MiniItem} ${isComplete ? styles.MiniItemComplete : ''}`}>
                          <div className={styles.MiniItemIcon}>
                            <span className="material-icons">{getItemIcon(item)}</span>
                          </div>
                          <div className={styles.MiniItemInfo}>
                            <span className={styles.MiniItemName}>{item.name}</span>
                            <div className={styles.MiniItemProgress}>
                              <div className={styles.MiniProgressBar}>
                                <div 
                                  className={styles.MiniProgressFill} 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className={styles.MiniProgressText}>
                                {item.current_quantity}/{item.target_quantity}
                              </span>
                            </div>
                          </div>
                          {isComplete && (
                            <span className={`material-icons ${styles.MiniItemCheck}`}>check_circle</span>
                          )}
                        </div>
                      );
                    })}
                    {stateCharities.featuredItems.length > 4 && (
                      <div className={styles.MiniItemsMore}>
                        <span>+{stateCharities.featuredItems.length - 4} รายการเพิ่มเติม</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.MiniItemsEmpty}>
                    <span className="material-icons">inbox</span>
                    <span>ยังไม่มีรายการสิ่งของ</span>
                  </div>
                )}
              </div>
              
              <div className={styles.FeaturedActions}>
                <button
                  onClick={handlers.handleOpenModal}
                  className={styles.FeaturedDonateButton}
                  aria-label="บริจาคให้แคมเปญแนะนำ"
                >
                  <span className="material-icons">volunteer_activism</span>
                  <span>บริจาคตอนนี้</span>
                </button>
                <button
                  onClick={() => handlers.handleRedirectToCharity(latestCharity.id)}
                  className={styles.FeaturedDetailsButton}
                  aria-label="ดูรายละเอียดการกุศล"
                >
                  <span className="material-icons">info</span>
                  <span>ดูรายละเอียด</span>
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
            <span>แคมเปญทั้งหมด</span>
          </h2>
          <p className={styles.SectionSubtitle}>ร่วมสร้างความแตกต่างให้กับชีวิตของผู้ประสบภัย</p>
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
                    style={{ maxHeight: '200px', height: '200px' }}
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
                    <span>ได้รับการยืนยัน</span>
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
                      <span>กำลังดำเนินการ</span>
                    </span>
                    <span className={styles.ProgressDonors}>รับบริจาคอยู่</span>
                  </div>
                </div>
                
                <div className={styles.CardActions}>
                  <button
                    onClick={handlers.handleOpenModal}
                    className={styles.DonateButton}
                    aria-label="บริจาคให้การกุศล"
                  >
                    <span className="material-icons">volunteer_activism</span>
                    <span>บริจาค</span>
                  </button>
                  <button
                    onClick={() => handlers.handleRedirectToCharity(charity.id)}
                    className={styles.ViewButton}
                    aria-label="ดูรายละเอียดการกุศล"
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
