import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useCharityDashboard from './useCharityDashboard';
import CharityDashboardHandler from './CharityDashboardHandler';
import { getCharityThumbnail } from '../../api/charitiesService';
import { useAuth } from '../../context/AuthContext';
import CharityModal from '../../components/dashboard/CharityModal/CharityModal';
import SlideModal from '../../components/dashboard/SlideModal/SlideModal';
import ItemModal from '../../components/dashboard/ItemModal/ItemModal';
import ConfirmModal from '../../components/dashboard/ConfirmModal/ConfirmModal';
import { LoadingIndicator } from '../../components/common';
import styles from './CharityDashboard.module.scss';

export default function CharityDashboard() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const { stateCharityDashboard, setCharityDashboard } = useCharityDashboard();
  const handlers = CharityDashboardHandler(stateCharityDashboard, setCharityDashboard);
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      handlers.fetchCharities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  // Fetch thumbnails
  useEffect(() => {
    const fetchThumbnails = async () => {
      if (!stateCharityDashboard.charities || stateCharityDashboard.charities.length === 0) return;

      const urls = {};
      for (const charity of stateCharityDashboard.charities) {
        try {
          const response = await getCharityThumbnail(charity.id);
          const imageBlob = new Blob([response.data]);
          const imageObjectURL = URL.createObjectURL(imageBlob);
          urls[charity.id] = imageObjectURL;
        } catch (error) {
          urls[charity.id] = null;
        }
      }
      setThumbnailUrls(urls);
    };

    fetchThumbnails();

    return () => {
      Object.values(thumbnailUrls).forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [stateCharityDashboard.charities]);

  // Auth loading state
  if (authLoading) {
    return <LoadingIndicator message="กำลังตรวจสอบสิทธิ์..." />;
  }

  // Auth check - redirect if not admin
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Data loading state
  if (stateCharityDashboard.loading) {
    return <LoadingIndicator message="กำลังโหลดข้อมูลการกุศล..." />;
  }

  // Error state
  if (stateCharityDashboard.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.Error}>
          <span className="material-icons">error_outline</span>
          <p className={styles.ErrorText}>{stateCharityDashboard.error}</p>
        </div>
      </div>
    );
  }

  const filteredCharities = handlers.getFilteredCharities();
  const stats = {
    total: stateCharityDashboard.charities.length,
    active: stateCharityDashboard.charities.filter(c => c.status === 'active').length,
    paused: stateCharityDashboard.charities.filter(c => c.status === 'paused').length,
    completed: stateCharityDashboard.charities.filter(c => c.status === 'completed').length,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getProgressPercentage = (current, expected) => {
    if (!expected || expected === 0) return 0;
    return Math.min(100, Math.round((current / expected) * 100));
  };

  return (
    <div className={styles.Container}>
      {/* Back Button */}
      <button onClick={() => handlers.handleNavigate('/')} className={styles.BackButton}>
        <span className="material-icons">arrow_back</span>
        <span>กลับหน้าหลัก</span>
      </button>

      {/* Header */}
      <div className={styles.Header}>
        <div className={styles.HeaderLeft}>
          <h1 className={styles.Title}>แดชบอร์ดการกุศล</h1>
          <p className={styles.Subtitle}>จัดการแคมเปญการกุศลและสไลด์ของคุณ</p>
        </div>
        <div className={styles.HeaderActions}>
          <button onClick={() => handlers.handleOpenCharityModal()} className={styles.AddButton}>
            <span className="material-icons">add</span>
            <span>เพิ่มการกุศล</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.StatsGrid}>
        <div className={styles.StatCard}>
          <div className={styles.StatHeader}>
            <span className={styles.StatLabel}>การกุศลทั้งหมด</span>
            <div className={`${styles.StatIcon} ${styles.total}`}>
              <span className="material-icons">volunteer_activism</span>
            </div>
          </div>
          <span className={styles.StatValue}>{stats.total}</span>
        </div>
        <div className={styles.StatCard}>
          <div className={styles.StatHeader}>
            <span className={styles.StatLabel}>กำลังดำเนินการ</span>
            <div className={`${styles.StatIcon} ${styles.active}`}>
              <span className="material-icons">play_circle</span>
            </div>
          </div>
          <span className={styles.StatValue}>{stats.active}</span>
        </div>
        <div className={styles.StatCard}>
          <div className={styles.StatHeader}>
            <span className={styles.StatLabel}>หยุดชั่วคราว</span>
            <div className={`${styles.StatIcon} ${styles.paused}`}>
              <span className="material-icons">pause_circle</span>
            </div>
          </div>
          <span className={styles.StatValue}>{stats.paused}</span>
        </div>
        <div className={styles.StatCard}>
          <div className={styles.StatHeader}>
            <span className={styles.StatLabel}>เสร็จสิ้นแล้ว</span>
            <div className={`${styles.StatIcon} ${styles.completed}`}>
              <span className="material-icons">check_circle</span>
            </div>
          </div>
          <span className={styles.StatValue}>{stats.completed}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.Filters}>
        <div className={styles.SearchWrapper}>
          <span className={`material-icons ${styles.SearchIcon}`}>search</span>
          <input
            type="text"
            placeholder="ค้นหาการกุศล..."
            value={stateCharityDashboard.searchQuery}
            onChange={(e) => handlers.handleSearchChange(e.target.value)}
            className={styles.SearchInput}
          />
        </div>
        <select
          value={stateCharityDashboard.statusFilter}
          onChange={(e) => handlers.handleStatusFilterChange(e.target.value)}
          className={styles.FilterSelect}
        >
          <option value="">สถานะทั้งหมด</option>
          <option value="active">กำลังดำเนินการ</option>
          <option value="paused">หยุดชั่วคราว</option>
          <option value="completed">เสร็จสิ้นแล้ว</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.TableContainer}>
        <div className={styles.TableHeader}>
          <h2 className={styles.TableTitle}>
            <span className="material-icons">list</span>
            <span>รายการการกุศล</span>
          </h2>
          <span className={styles.TableCount}>
            {filteredCharities.length} จาก {stateCharityDashboard.charities.length} การกุศล
          </span>
        </div>

        {filteredCharities.length === 0 ? (
          <div className={styles.EmptyState}>
            <span className="material-icons">inbox</span>
            <h3 className={styles.EmptyTitle}>ไม่พบการกุศล</h3>
            <p className={styles.EmptyText}>
              {stateCharityDashboard.searchQuery || stateCharityDashboard.statusFilter
                ? 'ลองปรับคำค้นหาหรือตัวกรองของคุณ'
                : 'เริ่มต้นโดยเพิ่มแคมเปญการกุศลแรกของคุณ'}
            </p>
            {!stateCharityDashboard.searchQuery && !stateCharityDashboard.statusFilter && (
              <button onClick={() => handlers.handleOpenCharityModal()} className={styles.AddButton}>
                <span className="material-icons">add</span>
                <span>เพิ่มการกุศล</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.TableWrapper}>
            <table className={styles.Table}>
              <thead>
                <tr>
                  <th>การกุศล</th>
                  <th>รายละเอียด</th>
                  <th>สถานะ</th>
                  <th>ความคืบหน้าเงินทุน</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharities.map((charity) => (
                  <tr key={charity.id}>
                    <td>
                      <div className={styles.CharityInfo}>
                        {thumbnailUrls[charity.id] ? (
                          <img
                            src={thumbnailUrls[charity.id]}
                            alt={charity.title}
                            className={styles.CharityImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.CharityImagePlaceholder}>
                            <span className="material-icons">image</span>
                          </div>
                        )}
                        <span className={styles.CharityTitle}>{charity.title}</span>
                      </div>
                    </td>
                    <td>
                      <p className={styles.CharityDescription}>
                        {charity.description || 'ไม่มีรายละเอียด'}
                      </p>
                    </td>
                    <td>
                      <span className={`${styles.StatusBadge} ${styles[charity.status]}`}>
                        <span className={styles.StatusDot}></span>
                        {charity.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.FundProgress}>
                        <div className={styles.ProgressBar}>
                          <div
                            className={styles.ProgressFill}
                            style={{
                              width: `${getProgressPercentage(charity.current_fund, charity.expected_fund)}%`,
                            }}
                          ></div>
                        </div>
                        <span className={styles.ProgressText}>
                          {formatCurrency(charity.current_fund)} / {formatCurrency(charity.expected_fund)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.Actions}>
                        <button
                          onClick={() => handlers.handleNavigate(`/charity/${charity.id}`)}
                          className={`${styles.ActionButton} ${styles.view}`}
                          title="ดู"
                        >
                          <span className="material-icons">visibility</span>
                        </button>
                        <button
                          onClick={() => handlers.handleOpenCharityModal(charity)}
                          className={`${styles.ActionButton} ${styles.edit}`}
                          title="แก้ไข"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                        <button
                          onClick={() => handlers.handleOpenSlideModal(charity)}
                          className={`${styles.ActionButton} ${styles.slides}`}
                          title="จัดการสไลด์"
                        >
                          <span className="material-icons">collections</span>
                        </button>
                        <button
                          onClick={() => handlers.handleOpenItemModal(charity)}
                          className={`${styles.ActionButton} ${styles.items}`}
                          title="จัดการสิ่งของ"
                        >
                          <span className="material-icons">inventory_2</span>
                        </button>
                        <button
                          onClick={() => handlers.handleOpenDeleteModal(charity)}
                          className={`${styles.ActionButton} ${styles.delete}`}
                          title="ลบ"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charity Modal */}
      <CharityModal
        open={stateCharityDashboard.charityModalOpen}
        handleClose={handlers.handleCloseCharityModal}
        charity={stateCharityDashboard.selectedCharity}
        isEditing={stateCharityDashboard.isEditing}
        onSave={handlers.handleSaveCharity}
        saving={stateCharityDashboard.saving}
      />

      {/* Slide Modal */}
      <SlideModal
        open={stateCharityDashboard.slideModalOpen}
        handleClose={handlers.handleCloseSlideModal}
        charity={stateCharityDashboard.selectedCharity}
        slides={stateCharityDashboard.slides}
        onSaveSlide={handlers.handleSaveSlide}
        fetchSlides={handlers.fetchSlides}
        saving={stateCharityDashboard.saving}
      />

      {/* Item Modal */}
      <ItemModal
        open={stateCharityDashboard.itemModalOpen}
        handleClose={handlers.handleCloseItemModal}
        charity={stateCharityDashboard.selectedCharity}
        onSaveItem={handlers.handleSaveItem}
        saving={stateCharityDashboard.saving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={stateCharityDashboard.deleteModalOpen}
        handleClose={handlers.handleCloseDeleteModal}
        title="ลบการกุศล"
        message={`คุณแน่ใจหรือว่าต้องการลบ "${stateCharityDashboard.selectedCharity?.title}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบ"
        onConfirm={handlers.handleDeleteCharity}
        saving={stateCharityDashboard.saving}
        variant="danger"
      />
    </div>
  );
}
