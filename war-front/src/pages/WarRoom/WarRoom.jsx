import React, { useEffect } from 'react';
import useWarRoom from './useWarRoom';
import WarRoomHandler from './WarRoomHandler';
import WarRoomMainContent from '../../components/warRoom/WarRoomMainContent';
import { LoadingIndicator } from '../../components/common';
import styles from './WarRoom.module.scss';

export default function WarRoom() {
  const { stateWarRoom, setWarRoom } = useWarRoom();
  const handlers = WarRoomHandler(stateWarRoom, setWarRoom);

  useEffect(() => {
    handlers.fetchWarRoomData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stateWarRoom.loading) {
    return <LoadingIndicator message="Loading War Room data..." />;
  }

  if (stateWarRoom.error) {
    return (
      <div className={styles.Container}>
        <div className={styles.ErrorState}>
          <p className={styles.ErrorMessage}>{stateWarRoom.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      <WarRoomMainContent 
        onVideoSelect={handlers.handleVideoSelect} 
        items={stateWarRoom.warRoomItems} 
      />
      
      {stateWarRoom.videoLink ? (
        <div className={styles.VideoWrapper}>
          <iframe
            src={stateWarRoom.videoLink}
            title="War Room Video Player"
            className={styles.VideoFrame}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className={styles.VideoWrapper}>
          <img
            src={`${process.env.PUBLIC_URL}/warroom/liveCover.jpg`}
            alt="War Room Live Cover"
            className={styles.LiveCover}
          />
        </div>
      )}

      <div className={styles.VideoWrapper}>
        <iframe
          src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61566778827798&amp;tabs=timeline&amp;width=2000&amp;height=500&amp;small_header=false&amp;adapt_container_width=true&amp;hide_cover=false&amp;show_facepile=true&amp;appId=3786443284954505"
          title="War Room Facebook Feed"
          className={styles.FacebookFrame}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
