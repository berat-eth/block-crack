import React from 'react';
import { View, StyleSheet } from 'react-native';

const Paddle = ({ x, y, width, height }) => {
  return (
    <View
      style={[
        styles.paddle,
        {
          left: x,
          top: y,
          width: width,
          height: height,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  paddle: {
    position: 'absolute',
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
});

export default Paddle;
