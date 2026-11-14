import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function CinematicBrandMark() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="SINA AI STUDIO"
      style={styles.stage}
    >
      <View style={styles.outerOrbit} />
      <View style={styles.innerOrbit} />
      <View style={styles.core}>
        <Text style={styles.letter}>S</Text>
      </View>
      <View style={styles.orbitPoint} />
      <View style={styles.spark} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: 144,
    height: 144,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  outerOrbit: {
    position: 'absolute',
    width: 132,
    height: 72,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(72, 217, 242, 0.48)',
    transform: [{ rotate: '-28deg' }],
    shadowColor: colors.accent,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 4,
  },
  innerOrbit: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: 'rgba(232, 195, 106, 0.42)',
    transform: [{ rotate: '42deg' }],
  },
  core: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  letter: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -2,
    textShadowColor: 'rgba(72, 217, 242, 0.75)',
    textShadowRadius: 12,
  },
  orbitPoint: {
    position: 'absolute',
    right: 12,
    top: 31,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 9,
    elevation: 5,
  },
  spark: {
    position: 'absolute',
    left: 19,
    bottom: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
});
