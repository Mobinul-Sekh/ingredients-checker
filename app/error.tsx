import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ErrorScreen({errorText} : {errorText?: string}) {
  return (
    <ThemedView style={styles.viewContainer}>
      <ThemedText style={styles.textStyle}>{errorText ?? 'Some thing went wrong'}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  viewContainer: {
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    fontSize: 25,
    color: 'red'
  }
});
