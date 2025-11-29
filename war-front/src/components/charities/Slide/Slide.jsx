import React, { useState, useEffect } from 'react';
import useSlide from './useSlide';
import SlideHandler from './SlideHandler';
import { getCharitySlideImage, getCharityThumbnail } from '../../../api/charitiesService';
import styles from './Slide.module.scss';

// Helper function to determine if URL is a video
const isVideoUrl = (url) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || url.includes('drive.google.com');
};

export default function Slide({ items }) {
  const { stateSlide, setSlide } = useSlide();
  const handlers = SlideHandler(stateSlide, setSlide, items);
  const [imageUrls, setImageUrls] = useState({});
  const [videoItems, setVideoItems] = useState(new Set()); // Track which items are videos

  useEffect(() => {
    // Fetch images from API for each slide
    const fetchImages = async () => {
      if (!items || items.length === 0) return;

      const urls = {};
      const videos = new Set();
      
      for (const item of items) {
        // Check if this is the thumbnail slide
        if (item.isThumbnail) {
          try {
            const response = await getCharityThumbnail(item.charity_id);
            // Check content type to determine if it's a video or image
            const contentType = response.headers['content-type'];
            const imageBlob = new Blob([response.data], { type: contentType });
            const imageObjectURL = URL.createObjectURL(imageBlob);
            urls[item.id] = imageObjectURL;
            
            // Check if it's a video based on content type
            if (contentType && contentType.startsWith('video/')) {
              videos.add(item.id);
            }
          } catch (error) {
            console.error(`Failed to load thumbnail for charity ${item.charity_id}:`, error);
            urls[item.id] = '/images/fallback.jpg';
          }
        }
        // Skip if it's an external URL (video)
        else if (item.img && (item.img.startsWith('http://') || item.img.startsWith('https://'))) {
          urls[item.id] = item.img;
          // Check if it's a video URL
          if (isVideoUrl(item.img)) {
            videos.add(item.id);
          }
        } else {
          try {
            const response = await getCharitySlideImage(item.id);
            const imageBlob = new Blob([response.data]);
            const imageObjectURL = URL.createObjectURL(imageBlob);
            urls[item.id] = imageObjectURL;
          } catch (error) {
            console.error(`Failed to load image for slide ${item.id}:`, error);
            urls[item.id] = '/images/fallback.jpg';
          }
        }
      }
      setImageUrls(urls);
      setVideoItems(videos);
    };

    fetchImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [items]);

  if (!items || items.length === 0) {
    return <div className={styles.Empty}>ไม่มีรูปภาพ</div>;
  }

  const currentItem = items[stateSlide.currentIndex];
  const mediaUrl = imageUrls[currentItem.id] || '';
  const isVideo = videoItems.has(currentItem.id);

  return (
    <div className={styles.Container}>
      <button
        aria-label="previous slide"
        className={styles.NavButton}
        style={{ left: 0 }}
        onClick={handlers.handlePrevClick}
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
      </button>

      <button
        aria-label="next slide"
        className={styles.NavButton}
        style={{ right: 0 }}
        onClick={handlers.handleNextClick}
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
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className={styles.SlideCard}>
        {!mediaUrl ? (
          <div className={styles.Loading}>กำลังโหลด...</div>
        ) : isVideo ? (
          <div className={styles.MediaContainer}>
            {mediaUrl.startsWith('blob:') ? (
              // Local video file served via blob URL
              <video
                src={mediaUrl}
                controls
                className={styles.Video}
                onError={(e) => {
                  console.error('Video loading error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              // External video URL (YouTube, Google Drive, etc.)
              <iframe
                src={mediaUrl}
                title={currentItem.description || 'Slide video'}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className={styles.Video}
              />
            )}
          </div>
        ) : (
          <img
            src={mediaUrl}
            alt={currentItem.description || 'Slide image'}
            className={styles.Image}
            onError={(e) => {
              console.error('Image loading error:', e);
              e.target.src = '/images/fallback.jpg';
            }}
          />
        )}
        
        {currentItem.description && (
          <div className={styles.Description}>
            <p>{currentItem.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
