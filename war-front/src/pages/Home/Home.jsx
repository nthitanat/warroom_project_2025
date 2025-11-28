import React from 'react';
import { useNavigate } from 'react-router-dom';
import WaveDivider from '../../components/common/WaveDivider/WaveDivider';
import styles from './Home.module.scss';

export default function Home() {
  const navigate = useNavigate();

  const nanLearningActivities = [
    {
      title: 'Landslide Risk Analysis',
      description: 'Understanding pan-shaped mountain formations and their impact on water penetration and landslide risks.',
      location: 'Ban Sob Puen, Chalerm Prakiat District'
    },
    {
      title: 'Sustainable Agriculture',
      description: 'Learning sediment and water retention agriculture and the "3 forests, 4 benefits" planting concept.',
      location: 'Alternative to monoculture farming'
    },
    {
      title: 'Forest Rehabilitation',
      description: 'Implementing King Bhumibol\'s philosophy of "forest mountains" and "wet forests" for resilient production systems.',
      location: 'Restoring Life to the Land'
    },
    {
      title: 'Nan Province Field Study',
      description: 'Exploring areas affected by severe floods and mudslides in August 2024, intensified by Yagi and Sulik typhoons.',
      location: 'March 29-31, 2025'
    }
  ];

  const executiveTeam = [
    {
      name: 'Professor Wilert Puriwat, D.Phil. (Oxon)',
      title: 'Chulalongkorn University President',
      description: 'Leading the university with academic excellence and innovation in higher education.',
      image: `${process.env.PUBLIC_URL}/about/dsn-team-1.jpg`
    },
    {
      name: 'Associate Professor Siridej Sujiva, Ph.D.',
      title: 'Vice President',
      description: 'Supporting university leadership and driving institutional development initiatives.',
      image: `${process.env.PUBLIC_URL}/about/dsn-team-2.jpg`
    },
    {
      name: 'Professor JAITIP NASONGKHLA, Ph.D.',
      title: 'Educational Technologies',
      description: 'Distinguished professor specializing in educational technologies and innovation.',
      image: `${process.env.PUBLIC_URL}/about/dsn-team-3.jpg`
    },
    {
      name: 'Professor Dr. Santi Pailoplee',
      title: 'Earthquake Geology Specialist',
      description: 'Expert in earthquake geology, seismic hazard analysis, and statistical seismology.',
      image: `${process.env.PUBLIC_URL}/about/dsn-team-4.jpg`
    }
  ];

  return (
    <div className={styles.Container}>
      <section className={styles.Hero}>
        <div className={styles.HeroBackground}>
          <div className={styles.HeroPattern}></div>
        </div>
        <div className={styles.HeroWrapper}>
          <div className={styles.HeroContent}>

            <h1 className={styles.HeroTitle}>
              Chula Disaster Solutions Network
            </h1>
            <h2 className={styles.HeroSubtitle}>
              Digital War Room - Building Resilience Through Innovation
            </h2>
            <p className={styles.HeroDescription}>
              Thailand faces continuous natural disasters from devastating floods to PM2.5 air pollution. In response, Chulalongkorn University launched the Digital War Room (DSN) as a pioneering innovation in disaster management, empowering society to proactively prevent, mitigate, prepare for, respond to, and recover from disasters through digital technologies.
            </p>
          </div>
          <div className={styles.EbookContainer}>
            <div className={styles.EbookWrapper}>
              <iframe
                src="https://heyzine.com/flip-book/9b5323a325.html#page/1"
                title="DSN eBook"
                className={styles.EbookFrame}
                allowFullScreen
              />
            </div>
          </div>
        </div>
        <div className={styles.HeroWave}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"/>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"/>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"/>
          </svg>
        </div>
      </section>

      <section className={styles.NanLearning}>
        <div className={styles.SectionHeader}>
          <h2 className={styles.SectionTitle}>Nan Learning Journey</h2>
          <h3 className={styles.SectionSubtitle}>Building awareness through community-based natural resource restoration</h3>
        </div>
        <div className={styles.NanIntro}>
          <p className={styles.NanDescription}>
            Thailand, a land of beauty, faces continuous natural disasters and environmental challenges. From widespread floods, like the devastating 2011 event that impacted 65 provinces, to the more recent floods in 2019 affecting over 400,000 people, and persistent issues like PM2.5 air pollution, these events have caused significant economic damage and hardship to millions.
          </p>
          <p className={styles.NanDescription}>
            Our Nan Learning Journey is a field trip designed for international graduate students from Chulalongkorn University, aimed at building awareness and understanding of community-based natural resource restoration processes, especially in Nan's headwater areas. This immersive experience brings together students from diverse academic backgrounds to address complex environmental and social challenges through hands-on learning and cultural exchange.
          </p>
        </div>
        <div className={styles.ActivityContainer}>
          <div className={styles.ActivityGrid}>
            {nanLearningActivities.map((activity, index) => (
              <div key={index} className={styles.ActivityItem}>
                <span className="material-symbols-outlined" style={{fontSize: '28px', color: 'rgba(255, 255, 255, 0.9)'}}>
                  {index === 0 ? 'landslide' : index === 1 ? 'agriculture' : index === 2 ? 'forest' : 'explore'}
                </span>
                <h3 className={styles.ActivityTitle}>{activity.title}</h3>
                <p className={styles.ActivityDescription}>{activity.description}</p>
                <div className={styles.ActivityLocation}>
                  <span className="material-icons" style={{fontSize: '16px'}}>location_on</span>
                  <span>{activity.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.NanConclusion}>
          <h3 className={styles.ConclusionTitle}>"Restoring Life to the Land"</h3>
          <p className={styles.NanDescription}>
            The impact of this journey on international students is profound. Many reflect on the importance of cross-disciplinary collaboration and the direct application of theoretical research to real-world problems, especially in social dimensions. They recognize the crucial role of local communities in strengthening resilience against crises through sustainable forest management and cooperation with government agencies.
          </p>
          <p className={styles.NanDescription}>
            This journey exemplifies Chulalongkorn University's commitment to sustainable development, aligning with SDG 13: Climate Action, by enhancing resilience, integrating climate change measures into national policies, and raising awareness. Through these initiatives, we continue to drive impactful change, foster social responsibility, and empower future leaders.
          </p>
        </div>
      </section>

      <section className={styles.ExecutiveTeam}>
        <div className={styles.SectionHeader}>
          <h2 className={styles.SectionTitle}>Executive Team</h2>
          <h3 className={styles.SectionSubtitle}>Executive and leading researchers from Chulalongkorn University driving innovation in disaster management</h3>
        </div>
        <div className={styles.TeamGrid}>
          {executiveTeam.map((member, index) => (
            <div key={index} className={styles.TeamCard}>
              <div className={styles.TeamImageWrapper}>
                <img 
                  src={member.image} 
                  alt={member.name}
                  className={styles.TeamImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className={styles.TeamInfo}>
                <h3 className={styles.TeamName}>{member.name}</h3>
                <h4 className={styles.TeamTitle}>{member.title}</h4>
                <p className={styles.TeamDescription}>{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
