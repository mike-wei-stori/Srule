import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Statistic } from 'antd';
import { SettingOutlined, ApiOutlined, ThunderboltOutlined, AreaChartOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import styles from './index.less';

const InfoCard: React.FC<{ title: string; icon: React.ReactNode; value: string | number; label: string }> = ({ title, icon, value, label }) => (
  <div className={`glass-card ${styles.card}`} style={{ padding: '20px', height: '100%' }}>
    <div className={styles.cardTitle}>
      {title}
      <SettingOutlined style={{ opacity: 0.5 }} />
    </div>
    <div className={styles.cardIcon}>{icon}</div>
    <div className={styles.statValue}>{value}</div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);

const HomePage: React.FC = () => {
  return (
    <PageContainer ghost header={{ title: '' }}>
      <div className={styles.container}>
        <div style={{ marginBottom: 24 }}>
          <h2 className={styles.neonText} style={{ margin: 0 }}>RULE ENGINE: CONTROL CENTER</h2>
        </div>

        <div className={styles.mainSection}>
          {/* Left Column */}
          <div className={styles.column}>
            <InfoCard
              title="Rule Sets"
              icon={<DeploymentUnitOutlined />}
              value="128"
              label="Active Rules"
            />
            <InfoCard
              title="Data Streams"
              icon={<ApiOutlined />}
              value="1.2M"
              label="Events / Sec"
            />
            <InfoCard
              title="Action Triggers"
              icon={<ThunderboltOutlined />}
              value="99.9%"
              label="Success Rate"
            />
          </div>

          {/* Center Column - Visualization */}
          <div className={`glass-card ${styles.centerPanel}`}>
            <div className={styles.activeRing}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Active Rules</div>
                <div style={{ color: 'var(--primary-color)' }}>Processing...</div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.column}>
            <InfoCard
              title="System Status"
              icon={<AreaChartOutlined />}
              value="Healthy"
              label="All Systems Operational"
            />
            <InfoCard
              title="Deployments"
              icon={<DeploymentUnitOutlined />}
              value="24"
              label="Last 24 Hours"
            />
            <InfoCard
              title="Alerts"
              icon={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
              value="0"
              label="Critical Issues"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default HomePage;
