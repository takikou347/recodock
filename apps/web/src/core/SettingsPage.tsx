import { useState } from 'react';

import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';

import layout from './pageLayout.module.css';
import styles from './SettingsPage.module.css';

/**
 * アプリ設定。デザインでは iOS の「その他」タブに項目が定義されているため、
 * 同じ項目を Web の設定画面として並べている。
 * TODO: user_settings への保存を接続する。
 */
export function SettingsPage() {
  const [isBiometricLockOn, setIsBiometricLockOn] = useState(true);
  const [isNotificationOn, setIsNotificationOn] = useState(true);

  return (
    <div className={layout.page}>
      <h1 className={layout.titleSm}>設定</h1>

      <Card isFlush>
        <div className={styles.row}>
          <span className={styles.label}>生体認証ロック</span>
          <Toggle
            isOn={isBiometricLockOn}
            onChange={setIsBiometricLockOn}
            ariaLabel="生体認証ロック"
          />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>通知設定</span>
          <Toggle isOn={isNotificationOn} onChange={setIsNotificationOn} ariaLabel="通知設定" />
        </div>
        <div className={styles.row}>
          <span className={styles.label}>データエクスポート</span>
          <span className={styles.meta}>ZIP</span>
        </div>
      </Card>
    </div>
  );
}
