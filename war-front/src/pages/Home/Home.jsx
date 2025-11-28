import React from 'react';
import { useNavigate } from 'react-router-dom';
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
      image: '/about/dsn-team-1.jpg'
    },
    {
      name: 'Associate Professor Siridej Sujiva, Ph.D.',
      title: 'Vice President',
      description: 'Supporting university leadership and driving institutional development initiatives.',
      image: '/about/dsn-team-2.jpg'
    },
    {
      name: 'Professor JAITIP NASONGKHLA, Ph.D.',
      title: 'Educational Technologies',
      description: 'Distinguished professor specializing in educational technologies and innovation.',
      image: '/about/dsn-team-3.jpg'
    },
    {
      name: 'Professor Dr. Santi Pailoplee',
      title: 'Earthquake Geology Specialist',
      description: 'Expert in earthquake geology, seismic hazard analysis, and statistical seismology.',
      image: '/about/dsn-team-4.jpg'
    }
  ];

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
            Thailand faces continuous natural disasters from devastating floods to PM2.5 air pollution. In response, Chulalongkorn University launched the Digital War Room (DSN) as a pioneering innovation in disaster management, empowering society to proactively prevent, mitigate, prepare for, respond to, and recover from disasters through digital technologies.
          </p>
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
        <div className={styles.ActivityGrid}>
          {nanLearningActivities.map((activity, index) => (
            <div key={index} className={styles.ActivityCard}>
              <h3 className={styles.ActivityTitle}>{activity.title}</h3>
              <p className={styles.ActivityDescription}>{activity.description}</p>
              <p className={styles.ActivityLocation}>{activity.location}</p>
            </div>
          ))}
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
