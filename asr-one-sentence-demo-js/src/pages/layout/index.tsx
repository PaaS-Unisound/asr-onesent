import React, { FC, useState, useEffect } from 'react';
import { Layout } from 'antd';
import styles from './index.less';

interface IndexProps {
  children?: React.ReactNode;
}
import UserHeader from '@/components/UserHeader';
const { Content } = Layout;
const Index: FC<IndexProps> = ({ children }) => {
  return (
    <Layout className={styles.page}>
      <UserHeader />
      <Content className={styles.content}>
        {children}
      </Content>
    </Layout>
  );
};
export default Index;
