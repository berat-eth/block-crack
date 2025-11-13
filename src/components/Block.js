import React from 'react';
import { View, StyleSheet } from 'react-native';

const Block = ({ x, y, width, height, color }) => {
  return (
    <View
      style={[
        styles.block,
        {
          left: x,
          top: y,
          width: width,
          height: height,
          backgroundColor: color,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default Block;
