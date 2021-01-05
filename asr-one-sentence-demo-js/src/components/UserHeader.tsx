import React from 'react';
import { Menu, Layout } from 'antd';
import styles from './userheader.less';
import { Link } from 'umi';
const { Header } = Layout;

export default () => {
  return (
    <Header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <a href="/">
            <img
              src={require('@/assets/header-logo.png')}
              className={styles.headerLogo}
            />
            <img
              src={require('@/assets/icon_beta.png')}
              style={{ marginRight: 26 }}
            />
          </a>
        </div>
        <Menu
          mode="horizontal"
          className={styles.pcMenu}
          selectedKeys={['']}
          selectable={false}
        >
          <Menu.Item key="asr-real-time">
            <Link to="/asr-real-time">实时语音转写</Link>
          </Menu.Item>
          <Menu.Item key="sa-call-eval">
            <Link to="/sa-call-eval">口语评测</Link>
          </Menu.Item>
          <Menu.Item key="asr-audio-file">
            <Link to="/asr-audio-file">音频文件转写</Link>
          </Menu.Item>
        </Menu>
      </div>
    </Header>
  );
};
