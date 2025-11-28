import React, { useEffect, useState } from 'react';
import AnalyticMaps from '../../components/analytics/AnalyticMaps';
import { fetchAnalyticsData } from '../../api/analyticsService';
import { LoadingIndicator } from '../../components/common';
import styles from './Analytics.module.scss';

export default function Analytics() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAnalyticsData();
        setProvinces(data.provinces || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingIndicator message="Loading analytics data..." />;
  }

  if (error) {
    return <div className={styles.ErrorContainer}>Error: {error}</div>;
  }

  return (
    <div className={styles.Container}>
      <AnalyticMaps provinces={provinces} />
    </div>
  );
}
