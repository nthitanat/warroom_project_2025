import React from 'react';
import styles from './CharityItemCard.module.scss';

export default function CharityItemCard({ items }) {
  const hasItems = items && items.length > 0;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: 'task_alt',
          label: 'เสร็จสิ้นแล้ว',
          emoji: '🎉'
        };
      case 'in_progress':
        return {
          icon: 'autorenew',
          label: 'กำลังดำเนินการ',
          emoji: '⚡'
        };
      default:
        return {
          icon: 'schedule',
          label: 'รอดำเนินการ',
          emoji: '🙏'
        };
    }
  };

  const getItemIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('water') || lowerName.includes('น้ำ')) return 'water_drop';
    if (lowerName.includes('food') || lowerName.includes('อาหาร') || lowerName.includes('rice')) return 'restaurant';
    if (lowerName.includes('medicine') || lowerName.includes('ยา') || lowerName.includes('medical')) return 'medication';
    if (lowerName.includes('cloth') || lowerName.includes('เสื้อ') || lowerName.includes('shirt')) return 'checkroom';
    if (lowerName.includes('blanket') || lowerName.includes('ผ้าห่ม')) return 'bedroom_parent';
    if (lowerName.includes('book') || lowerName.includes('หนังสือ')) return 'menu_book';
    if (lowerName.includes('toy') || lowerName.includes('ของเล่น')) return 'toys';
    if (lowerName.includes('money') || lowerName.includes('fund') || lowerName.includes('เงิน')) return 'payments';
    if (lowerName.includes('mask') || lowerName.includes('หน้ากาก')) return 'masks';
    if (lowerName.includes('sanitizer') || lowerName.includes('gel')) return 'sanitizer';
    if (lowerName.includes('volunteer') || lowerName.includes('อาสา')) return 'volunteer_activism';
    if (lowerName.includes('tool') || lowerName.includes('equipment')) return 'construction';
    return 'category';
  };

  const getProgressPercentage = (current, needed) => {
    if (!needed || needed === 0) return 0;
    return Math.min(100, Math.round((current / needed) * 100));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num || 0);
  };

  // Calculate overall stats
  const totalItems = hasItems ? items.length : 0;
  const completedItems = hasItems ? items.filter(i => i.status === 'completed').length : 0;
  const inProgressItems = hasItems ? items.filter(i => i.status === 'in_progress').length : 0;

  return (
    <div className={styles.Container}>
      {/* Header with animated icon */}
      <div className={styles.Header}>
        <div className={styles.HeaderIcon}>
          <span className="material-icons">volunteer_activism</span>
        </div>
        <div className={styles.HeaderContent}>
          <h2>สิ่งของที่ต้องการ</h2>
          <p className={styles.HeaderSubtitle}>ช่วยเรารวบรวมสิ่งของจำเป็น</p>
        </div>
        <div className={styles.HeaderStats}>
          <div className={styles.StatPill}>
            <span className="material-icons">checklist</span>
            <span>{completedItems}/{totalItems}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className={styles.StatsBar}>
        <div className={`${styles.StatItem} ${styles.waiting}`}>
          <span className="material-icons">schedule</span>
          <span>{totalItems - completedItems - inProgressItems} รอดำเนินการ</span>
        </div>
        <div className={`${styles.StatItem} ${styles.progress}`}>
          <span className="material-icons">autorenew</span>
          <span>{inProgressItems} กำลังดำเนินการ</span>
        </div>
        <div className={`${styles.StatItem} ${styles.done}`}>
          <span className="material-icons">task_alt</span>
          <span>{completedItems} เสร็จสิ้น</span>
        </div>
      </div>

      {/* Items Grid or Empty State */}
      {hasItems ? (
        <div className={styles.ItemsGrid}>
        {items.map((item, index) => {
          const progress = getProgressPercentage(item.current_quantity, item.needed_quantity);
          const statusConfig = getStatusConfig(item.status);
          const itemIcon = getItemIcon(item.name);
          
          return (
            <div 
              key={item.id} 
              className={`${styles.ItemCard} ${styles[item.status]}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Item Icon */}
              <div className={styles.ItemIconWrapper}>
                <div className={`${styles.ItemIcon} ${styles[item.status]}`}>
                  <span className="material-icons">{itemIcon}</span>
                </div>
                {item.status === 'completed' && (
                  <div className={styles.CompletedBadge}>
                    <span className="material-icons">verified</span>
                  </div>
                )}
              </div>

              {/* Item Content */}
              <div className={styles.ItemContent}>
                <div className={styles.ItemHeader}>
                  <h3 className={styles.ItemName}>{item.name}</h3>
                  <span className={styles.StatusEmoji}>{statusConfig.emoji}</span>
                </div>

                {/* Quantity Display */}
                <div className={styles.QuantitySection}>
                  <div className={styles.QuantityInfo}>
                    <div className={styles.CurrentQuantity}>
                      <span className="material-icons">inventory</span>
                      <span className={styles.QuantityValue}>{formatNumber(item.current_quantity)}</span>
                    </div>
                    <span className={styles.QuantityDivider}>/</span>
                    <div className={styles.NeededQuantity}>
                      <span className="material-icons">flag</span>
                      <span className={styles.QuantityValue}>{formatNumber(item.needed_quantity)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.ProgressWrapper}>
                  <div className={styles.ProgressBar}>
                    <div 
                      className={`${styles.ProgressFill} ${styles[item.status]}`}
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 20 && (
                        <span className={styles.ProgressGlow}></span>
                      )}
                    </div>
                  </div>
                  <div className={styles.ProgressLabel}>
                    <span className={`${styles.ProgressPercent} ${styles[item.status]}`}>
                      {progress}%
                    </span>
                    <span className={`${styles.StatusLabel} ${styles[item.status]}`}>
                      <span className="material-icons">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className={styles.EmptyState}>
          <span className="material-icons">inventory_2</span>
          <p>ยังไม่มีรายการสิ่งของที่ต้องการ</p>
        </div>
      )}

      {/* Call to Action */}
      <div className={styles.CallToAction}>
        <span className="material-icons">favorite</span>
        <span>ทุกการช่วยเหลือมีคุณค่า!</span>
      </div>
    </div>
  );
}
