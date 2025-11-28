import React from 'react';
import useWarRoomMainContent from './useWarRoomMainContent';
import WarRoomMainContentHandler from './WarRoomMainContentHandler';
import styles from './WarRoomMainContent.module.scss';

export default function WarRoomMainContent({ onVideoSelect, items }) {
  const { stateWarRoomMainContent, setWarRoomMainContent } = useWarRoomMainContent();
  const handlers = WarRoomMainContentHandler(stateWarRoomMainContent, setWarRoomMainContent);

  const tabs = [
    { label: 'Upcoming', icon: 'rss', status: 0 },
    { label: 'Live Now', icon: 'play', status: 1 },
    { label: 'Archived', icon: 'archive', status: 2 },
    { label: 'Podcasts', icon: 'podcast', status: 3 }
  ];

  const getIcon = (iconType) => {
    const icons = {
      rss: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 11a9 9 0 0 1 9 9"></path>
          <path d="M4 4a16 16 0 0 1 16 16"></path>
          <circle cx="5" cy="19" r="1"></circle>
        </svg>
      ),
      play: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      ),
      archive: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
      ),
      podcast: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="11" r="3"></circle>
          <path d="M15.7 8.7a5 5 0 1 1-7.4 0"></path>
          <path d="M19.1 5.1a10 10 0 0 1 0 11.8"></path>
          <path d="M4.9 5.1a10 10 0 0 0 0 11.8"></path>
          <path d="M12 19v3"></path>
        </svg>
      )
    };
    return icons[iconType];
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Tabs}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`${styles.Tab} ${stateWarRoomMainContent.selectedTab === index ? styles.TabActive : ''}`}
            onClick={() => handlers.handleTabChange(index)}
          >
            <span className={styles.TabIcon}>{getIcon(tab.icon)}</span>
            <span className={styles.TabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.Content}>
        {(() => {
          const filteredItems = items.filter(card => card.status === stateWarRoomMainContent.selectedTab);
          
          if (filteredItems.length === 0) {
            const emptyMessages = [
              'No upcoming events at the moment',
              'No current live sessions',
              'No archived content available',
              'No podcasts available yet'
            ];
            
            return (
              <div className={styles.EmptyState}>
                <div className={styles.EmptyIcon}>
                  {getIcon(tabs[stateWarRoomMainContent.selectedTab].icon)}
                </div>
                <p className={styles.EmptyMessage}>
                  {emptyMessages[stateWarRoomMainContent.selectedTab]}
                </p>
                <p className={styles.EmptySubtext}>
                  Check back later for updates
                </p>
              </div>
            );
          }
          
          return (
            <div className={styles.Grid}>
              {filteredItems.map((card, index) => (
                <div key={index} className={styles.Card}>
                  <img
                    src={card.img}
                    alt={card.title}
                    className={styles.CardImage}
                  />
                  <div className={styles.CardContent}>
                    <h4 className={styles.CardTitle}>{card.title}</h4>
                    <p className={styles.CardDescription}>{card.description}</p>
                    {stateWarRoomMainContent.selectedTab !== 0 && (
                      <button
                        onClick={() => onVideoSelect(card.videoLink)}
                        className={styles.PlayButton}
                        aria-label="play video"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Play
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
