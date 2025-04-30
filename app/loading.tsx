import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/lottie-jsons/hand-loader.json')}
        autoPlay
        loop
        style={{ width: 400, height: 400 }} // ← Required!
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingScreen;
