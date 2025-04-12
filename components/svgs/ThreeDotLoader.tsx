import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ThreeDotLoader() {
  const opacities = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  React.useEffect(() => {
    opacities.forEach((opacity, index) => {
      return opacity.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1,
        true,
        () => index * 400
      );
    });
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 40, right: 0, justifyContent: 'center', alignItems: 'center' }}>
      <Svg height="100" width="80" viewBox="0 0 100 100">
        {opacities.map((opacity, i) => {
          const animatedProps = useAnimatedProps(() => ({
            opacity: opacity.value,
          }));

          return (
            <AnimatedCircle
              key={i}
              cx={6 + i * 20}
              cy={50}
              r={6}
              fill="#fff"
              animatedProps={animatedProps}
            />
          );
        })}
      </Svg>
    </View>
  );
}
