import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.scss';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.Container}>
      <section className={styles.Hero}>
        <div className={styles.HeroContent}>
          <h1 className={styles.HeroTitle}>
            Chula Disaster Solutions Network
          </h1>
          <h2 className={styles.HeroSubtitle}>
            Digital War Room - Building Resilience Through Innovation
          </h2>
          <p className={styles.HeroDescription}>
            Thailand faces continuous natural disasters from devastating floods to PM2.5 air pollution.
            Our platform provides real-time disaster management, data analytics, and community support.
          </p>
          <div className={styles.HeroButtons}>
            <button
              onClick={() => navigate('/analytics')}
              className={styles.PrimaryButton}
            >
              View Analytics
            </button>
            <button
              onClick={() => navigate('/warroom')}
              className={styles.SecondaryButton}
            >
              War Room
            </button>
          </div>
        </div>
        <div className={styles.HeroImage}>
          <img
            src="/about/hero-illustration.png"
            alt="Disaster Management"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </section>

      <section className={styles.Features}>
        <div className={styles.SectionHeader}>
          <h2 className={styles.SectionTitle}>Our Solutions</h2>
          <p className={styles.SectionDescription}>
            Comprehensive tools for disaster management and community resilience
          </p>
        </div>
        <div className={styles.FeatureGrid}>
          <div className={styles.FeatureCard}>
            <div className={styles.FeatureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3 className={styles.FeatureTitle}>Real-Time Analytics</h3>
            <p className={styles.FeatureDescription}>
              Interactive maps and data visualization for disaster monitoring and response planning
            </p>
            <button onClick={() => navigate('/analytics')} className={styles.FeatureLink}>
              Learn More →
            </button>
          </div>

          <div className={styles.FeatureCard}>
            <div className={styles.FeatureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className={styles.FeatureTitle}>Community Support</h3>
            <p className={styles.FeatureDescription}>
              Connect with charities and learn from experts through our comprehensive lesson library
            </p>
            <button onClick={() => navigate('/charities')} className={styles.FeatureLink}>
              Learn More →
            </button>
          </div>

          <div className={styles.FeatureCard}>
            <div className={styles.FeatureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h3 className={styles.FeatureTitle}>War Room</h3>
            <p className={styles.FeatureDescription}>
              Live disaster updates, archived sessions, and podcasts for continuous learning
            </p>
            <button onClick={() => navigate('/warroom')} className={styles.FeatureLink}>
              Learn More →
            </button>
          </div>

          <div className={styles.FeatureCard}>
            <div className={styles.FeatureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3 className={styles.FeatureTitle}>Learning Resources</h3>
            <p className={styles.FeatureDescription}>
              Access curated lessons and playlists from disaster management experts
            </p>
            <button onClick={() => navigate('/lessons')} className={styles.FeatureLink}>
              Learn More →
            </button>
          </div>
        </div>
      </section>

      <section className={styles.CTA}>
        <div className={styles.CTAContent}>
          <h2 className={styles.CTATitle}>Join Our Mission</h2>
          <p className={styles.CTADescription}>
            Be part of the solution. Help build resilient communities through technology and collaboration.
          </p>
          <button onClick={() => navigate('/signup')} className={styles.CTAButton}>
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}
