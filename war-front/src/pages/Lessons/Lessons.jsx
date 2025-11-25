import React, { useEffect, useState } from 'react';
import useLessons from './useLessons';
import LessonsHandler from './LessonsHandler';
import { getLessonThumbnail, getAuthorAvatar } from '../../api/lessonsService';
import VideoModal from '../../components/lesson/VideoModal';
import styles from './Lessons.module.scss';

export default function Lessons() {
  const { stateLessons, setLessons } = useLessons();
  const handlers = LessonsHandler(stateLessons, setLessons);
  const [thumbnailUrls, setThumbnailUrls] = useState({});
  const [avatarUrls, setAvatarUrls] = useState({});

  useEffect(() => {
    handlers.fetchLessonData();
    handlers.fetchLessonPlaylistData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch thumbnails and avatars from API
    const fetchImages = async () => {
      if (!stateLessons.lessonItems || stateLessons.lessonItems.length === 0) return;

      const thumbUrls = {};
      const avUrls = {};

      for (const lesson of stateLessons.lessonItems) {
        // Fetch lesson thumbnail
        try {
          const response = await getLessonThumbnail(lesson.id);
          const imageBlob = new Blob([response.data]);
          const imageObjectURL = URL.createObjectURL(imageBlob);
          thumbUrls[lesson.id] = imageObjectURL;
        } catch (error) {
          console.error(`Failed to load thumbnail for lesson ${lesson.id}:`, error);
          thumbUrls[lesson.id] = '/images/fallback.jpg';
        }

        // Fetch author avatars
        if (lesson.authors && Array.isArray(lesson.authors)) {
          for (const author of lesson.authors) {
            if (author.id && !avUrls[author.id]) {
              try {
                const response = await getAuthorAvatar(author.id);
                const imageBlob = new Blob([response.data]);
                const imageObjectURL = URL.createObjectURL(imageBlob);
                avUrls[author.id] = imageObjectURL;
              } catch (error) {
                console.error(`Failed to load avatar for author ${author.id}:`, error);
                avUrls[author.id] = '/images/fallback-avatar.jpg';
              }
            }
          }
        }
      }

      setThumbnailUrls(thumbUrls);
      setAvatarUrls(avUrls);
    };

    fetchImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(thumbnailUrls).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      Object.values(avatarUrls).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [stateLessons.lessonItems]);

  // Get filtered lessons based on selected tab
  const getFilteredLessons = () => {
    if (stateLessons.selectedTab === 0) {
      // Recommended - show all lessons
      return stateLessons.lessonItems;
    } else {
      // Filter by selected playlist
      const selectedPlaylist = stateLessons.lessonPlaylistItems[stateLessons.selectedTab - 1];
      return stateLessons.lessonItems.filter(
        (lesson) => lesson.playlist_id === selectedPlaylist.id
      );
    }
  };

  // Get title for current tab
  const getCurrentTitle = () => {
    if (stateLessons.selectedTab > 0) {
      return stateLessons.lessonPlaylistItems[stateLessons.selectedTab - 1]?.title;
    }
    return null;
  };

  const filteredLessons = getFilteredLessons();
  const currentTitle = getCurrentTitle();

  if (stateLessons.loading) {
    return (
      <div className={styles.Container}>
        <div className={styles.Loading}>Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      {/* Tab Navigation */}
      <div className={styles.Tabs}>
        <button
          className={`${styles.Tab} ${stateLessons.selectedTab === 0 ? styles.TabActive : ''}`}
          onClick={() => handlers.handleTabChange(0)}
        >
          Recommended
        </button>
        {stateLessons.lessonPlaylistItems.map((playlist, index) => (
          <button
            key={playlist.id || index}
            className={`${styles.Tab} ${stateLessons.selectedTab === index + 1 ? styles.TabActive : ''}`}
            onClick={() => handlers.handleTabChange(index + 1)}
          >
            {playlist.title}
          </button>
        ))}
      </div>

      {/* Playlist Title */}
      {currentTitle && <h1 className={styles.PlaylistTitle}>{currentTitle}</h1>}

      {/* Lesson Grid */}
      <div className={styles.Grid}>
        {filteredLessons.map((lesson, index) => (
          <div key={lesson.id || index} className={styles.Card}>
            {thumbnailUrls[lesson.id] && (
              <img
                src={thumbnailUrls[lesson.id]}
                alt={lesson.title}
                className={styles.CardImage}
                onError={(e) => {
                  console.error('Thumbnail loading error:', e);
                  e.target.src = '/images/fallback.jpg';
                }}
              />
            )}
            <div className={styles.CardContent}>
              <h4 className={styles.CardTitle}>{lesson.title}</h4>
              <p className={styles.CardDescription}>{lesson.description}</p>
              
              <div className={styles.Authors}>
                {lesson.authors?.slice(0, 2).map((author, idx) => (
                  avatarUrls[author.id] && (
                    <img
                      key={idx}
                      src={avatarUrls[author.id]}
                      alt={author.name}
                      className={styles.Avatar}
                      title={author.name}
                      onError={(e) => {
                        console.error('Avatar loading error:', e);
                        e.target.src = '/images/fallback-avatar.jpg';
                      }}
                    />
                  )
                ))}
                {lesson.authors?.length > 2 && (
                  <span className={styles.MoreAuthors}>
                    +{lesson.authors.length - 2}
                  </span>
                )}
              </div>

              <button
                onClick={() => handlers.handleOpenModal(lesson.videoLink)}
                className={styles.PlayButton}
                aria-label="play video"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Video Modal */}
      <VideoModal
        open={stateLessons.modalOpen}
        handleClose={handlers.handleCloseModal}
        videoLink={stateLessons.currentVideo}
      />
    </div>
  );
}
