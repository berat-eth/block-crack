import React from 'react';
import { View, StyleSheet } from 'react-native';

const Ball = ({ x, y, size }) => {
  return (
    <View
      style={[
        styles.ball,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

export default Ball;
