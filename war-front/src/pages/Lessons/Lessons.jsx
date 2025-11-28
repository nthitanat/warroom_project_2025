import React, { useEffect, useState } from 'react';
import useLessons from './useLessons';
import LessonsHandler from './LessonsHandler';
import { getLessonThumbnail, getAuthorAvatar } from '../../api/lessonsService';
import VideoModal from '../../components/lesson/VideoModal';
import { LoadingIndicator } from '../../components/common';
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
  const latestLesson = filteredLessons[0]; // Get the first lesson as the latest

  if (stateLessons.loading) {
    return (
      <div className={styles.Container}>
        <div className={styles.Loading}>
          <span className="material-icons">hourglass_empty</span>
          <p>Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      {/* Featured Latest Video */}
      {latestLesson && (
        <div className={styles.FeaturedSection}>
          <div className={styles.FeaturedLabel}>
            <span className="material-icons">new_releases</span>
            <span>Latest Lesson</span>
          </div>
          <div className={styles.FeaturedCard}>
            <div className={styles.FeaturedImageWrapper}>
              {thumbnailUrls[latestLesson.id] && (
                <img
                  src={thumbnailUrls[latestLesson.id]}
                  alt={latestLesson.title}
                  className={styles.FeaturedImage}
                  onError={(e) => {
                    console.error('Thumbnail loading error:', e);
                    e.target.src = '/images/fallback.jpg';
                  }}
                />
              )}
              <div className={styles.FeaturedBadge}>
                <span className="material-icons">fiber_new</span>
                <span>New</span>
              </div>
              <div className={styles.FeaturedGradientOverlay}></div>
            </div>
            
            <div className={styles.FeaturedContent}>
              <div className={styles.FeaturedMeta}>
                <div className={styles.FeaturedAuthors}>
                  {latestLesson.authors?.slice(0, 3).map((author, idx) => (
                    avatarUrls[author.id] && (
                      <img
                        key={idx}
                        src={avatarUrls[author.id]}
                        alt={author.name}
                        className={styles.FeaturedAvatar}
                        title={author.name}
                        onError={(e) => {
                          console.error('Avatar loading error:', e);
                          e.target.src = '/images/fallback-avatar.jpg';
                        }}
                      />
                    )
                  ))}
                  <span className={styles.FeaturedAuthorName}>
                    {latestLesson.authors?.length > 0 
                      ? latestLesson.authors[0].name 
                      : 'Unknown Author'}
                  </span>
                  {latestLesson.authors?.length > 1 && (
                    <span className={styles.FeaturedMoreAuthors}>
                      +{latestLesson.authors.length - 1}
                    </span>
                  )}
                </div>
              </div>
              
              <h2 className={styles.FeaturedTitle}>{latestLesson.title}</h2>
              <p className={styles.FeaturedDescription}>{latestLesson.description}</p>
              
              <div className={styles.FeaturedActions}>
                <button
                  onClick={() => handlers.handleOpenModal(latestLesson.videoLink)}
                  className={styles.FeaturedPlayButton}
                  aria-label="play latest video"
                >
                  <span className="material-icons">play_circle_filled</span>
                  <span>Watch Now</span>
                </button>
                <div className={styles.FeaturedInfo}>
                  <span className={styles.FeaturedInfoItem}>
                    <span className="material-icons">schedule</span>
                    <span>45 min</span>
                  </span>
                  <span className={styles.FeaturedInfoItem}>
                    <span className="material-icons">visibility</span>
                    <span>Featured</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content with Sidebar */}
      <div className={styles.ContentWrapper}>
        {/* Vertical Sidebar Navigation */}
        <aside className={styles.Sidebar}>
          <div className={styles.SidebarHeader}>
            <span className="material-icons">playlist_play</span>
            <span>Playlists</span>
          </div>
          <button
            className={`${styles.SidebarTab} ${stateLessons.selectedTab === 0 ? styles.SidebarTabActive : ''}`}
            onClick={() => handlers.handleTabChange(0)}
          >
            <span className="material-icons">star</span>
            <span>Recommended</span>
          </button>
          {stateLessons.lessonPlaylistItems.map((playlist, index) => (
            <button
              key={playlist.id || index}
              className={`${styles.SidebarTab} ${stateLessons.selectedTab === index + 1 ? styles.SidebarTabActive : ''}`}
              onClick={() => handlers.handleTabChange(index + 1)}
            >
              <span className="material-icons">folder</span>
              <span>{playlist.title}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <div className={styles.MainContent}>
          {/* Playlist Title */}
          {currentTitle && (
            <div className={styles.PlaylistHeader}>
              <h1 className={styles.PlaylistTitle}>
                <span className="material-icons">library_books</span>
                {currentTitle}
              </h1>
            </div>
          )}

          {/* Lesson Grid */}
          <div className={styles.Grid}>
        {filteredLessons.slice(1).map((lesson, index) => (
          <div key={lesson.id || index} className={styles.Card}>
            <div className={styles.CardImageWrapper}>
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
              <div className={styles.CardImageOverlay}>
                <button
                  onClick={() => handlers.handleOpenModal(lesson.videoLink)}
                  className={styles.PlayButtonOverlay}
                  aria-label="play video"
                >
                  <span className="material-icons">play_circle</span>
                </button>
              </div>
            </div>
            
            <div className={styles.CardContent}>
              <div className={styles.CardHeader}>
                <h4 className={styles.CardTitle}>{lesson.title}</h4>
              </div>
              
              <p className={styles.CardDescription}>{lesson.description}</p>
              
              <div className={styles.CardFooter}>
                <div className={styles.Authors}>
                  <div className={styles.AuthorAvatars}>
                    {lesson.authors?.slice(0, 3).map((author, idx) => (
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
                  </div>
                  <div className={styles.AuthorInfo}>
                    <span className={styles.AuthorLabel}>
                      <span className="material-icons">person</span>
                      {lesson.authors?.length > 0 
                        ? lesson.authors[0].name 
                        : 'Unknown Author'}
                    </span>
                    {lesson.authors?.length > 1 && (
                      <span className={styles.MoreAuthors}>
                        +{lesson.authors.length - 1} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handlers.handleOpenModal(lesson.videoLink)}
                  className={styles.PlayButton}
                  aria-label="play video"
                >
                  <span className="material-icons">play_arrow</span>
                  <span>Watch Now</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
        </div>
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
