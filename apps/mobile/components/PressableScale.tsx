import { useRef, ReactNode } from 'react'
import {
  Animated, Pressable, PressableProps, GestureResponderEvent, StyleProp, ViewStyle,
} from 'react-native'

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode
  scaleTo?: number
  style?: StyleProp<ViewStyle>
}

export function PressableScale({
  children, scaleTo = 0.96, style, onPressIn, onPressOut, ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn(e: GestureResponderEvent) {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start()
    onPressIn?.(e)
  }

  function handlePressOut(e: GestureResponderEvent) {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start()
    onPressOut?.(e)
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
