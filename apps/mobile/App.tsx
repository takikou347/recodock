import { StyleSheet, Text, View } from 'react-native';

/**
 * iOS アプリのプレースホルダ。
 * 下部タブバー(ホーム=カレンダー / よく使うモジュール / その他)の構造は
 * docs/recodock/02_design/01_screen_design.md 3.3 を参照。
 * 生体認証ロック(NFR-S6)を起動時に挟む。
 */
export function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recodock</Text>
      <Text>Reco Calendar(実装予定)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
