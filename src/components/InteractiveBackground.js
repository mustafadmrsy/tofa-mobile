import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, RadialGradient as SvgRadial, Rect, Stop } from "react-native-svg";

export default function InteractiveBackground() {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const px = useSharedValue(180); // parmak x
  const py = useSharedValue(320); // parmak y
  const pr = useSharedValue(0);   // glow yarıçapı

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      px.value = e.absoluteX;
      py.value = e.absoluteY;
      pr.value = withTiming(220, { duration: 120 });
    })
    .onEnd(() => {
      tx.value = withTiming(0, { duration: 600 });
      ty.value = withTiming(0, { duration: 600 });
      pr.value = withTiming(0, { duration: 600 });
    })
    .onFinalize(() => {
      tx.value = withTiming(0, { duration: 600 });
      ty.value = withTiming(0, { duration: 600 });
      pr.value = withTiming(0, { duration: 600 });
    });

  const spot = (color, size, baseStyles, factorX, factorY, opacity = 0.12) => {
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: tx.value * factorX },
        { translateY: ty.value * factorY },
      ],
      opacity,
    }));
    return (
      <Animated.View
        style={[{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        }, baseStyles, style]}
      />
    );
  };

  const Glow = () => {
    const glowStyle = useAnimatedStyle(() => ({ opacity: pr.value > 0 ? 0.18 : 0 }));
    const gradient = (
      <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Defs>
          <SvgRadial id="fingerGlow" cx={px.value} cy={py.value} r={Math.max(1, pr.value)}>
            <Stop offset="0%" stopColor="#2DD4FD" stopOpacity="0.55" />
            <Stop offset="50%" stopColor="#9333EA" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#0f0f1a" stopOpacity="0" />
          </SvgRadial>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fingerGlow)" />
      </Svg>
    );
    return <Animated.View pointerEvents="none" style={[{ ...StyleSheet.absoluteFillObject }, glowStyle]}>{gradient}</Animated.View>;
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#0b0d16", "#0f1121"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {spot("#FF52B6", 180, { top: "-12%", left: "-20%" }, 0.02, 0.015, 0.08)}
        {spot("#2DD4FD", 160, { top: "-6%", right: "-18%" }, -0.02, 0.015, 0.08)}
        {spot("#9333EA", 200, { bottom: "-10%", left: "-15%" }, 0.015, -0.02, 0.06)}
        {/* koyu overlay */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <Glow />
      </Animated.View>
    </GestureDetector>
  );
}
