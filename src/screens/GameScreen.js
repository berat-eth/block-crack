import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Ball from '../components/Ball';
import Paddle from '../components/Paddle';
import Block from '../components/Block';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 20;
const BLOCK_WIDTH = (SCREEN_WIDTH - 40) / 5;
const BLOCK_HEIGHT = 30;
const BLOCK_ROWS = 5;
const BLOCK_COLS = 5;

const GameScreen = () => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver', 'win'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  
  const [paddleX, setPaddleX] = useState((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
  const [ballX, setBallX] = useState(SCREEN_WIDTH / 2);
  const [ballY, setBallY] = useState(SCREEN_HEIGHT - 150);
  const [ballVelocityX, setBallVelocityX] = useState(3);
  const [ballVelocityY, setBallVelocityY] = useState(-3);
  
  const [blocks, setBlocks] = useState([]);
  const gameLoopRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lastPaddleX = useRef((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
  const ballPosRef = useRef({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 });
  const ballVelRef = useRef({ x: 3, y: -3 });
  const paddleXRef = useRef((SCREEN_WIDTH - PADDLE_WIDTH) / 2);
  const blocksRef = useRef([]);

  // Initialize blocks
  useEffect(() => {
    initializeBlocks();
  }, [level]);

  const initializeBlocks = () => {
    const newBlocks = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    
    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        newBlocks.push({
          id: `${row}-${col}`,
          x: col * BLOCK_WIDTH + 20,
          y: row * BLOCK_HEIGHT + 100,
          width: BLOCK_WIDTH - 4,
          height: BLOCK_HEIGHT - 4,
          color: colors[row % colors.length],
          hit: false,
        });
      }
    }
    setBlocks(newBlocks);
    blocksRef.current = newBlocks;
  };

  const startGame = () => {
    const initialVelX = 3 * (Math.random() > 0.5 ? 1 : -1);
    const initialPaddleX = (SCREEN_WIDTH - PADDLE_WIDTH) / 2;
    const initialBallPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 };
    
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setBallX(initialBallPos.x);
    setBallY(initialBallPos.y);
    setPaddleX(initialPaddleX);
    setBallVelocityX(initialVelX);
    setBallVelocityY(-3);
    
    // Update refs
    ballPosRef.current = initialBallPos;
    ballVelRef.current = { x: initialVelX, y: -3 };
    paddleXRef.current = initialPaddleX;
    lastPaddleX.current = initialPaddleX;
    
    initializeBlocks();
    startGameLoop();
  };


  useEffect(() => {
    ballPosRef.current = { x: ballX, y: ballY };
  }, [ballX, ballY]);

  useEffect(() => {
    ballVelRef.current = { x: ballVelocityX, y: ballVelocityY };
  }, [ballVelocityX, ballVelocityY]);

  useEffect(() => {
    paddleXRef.current = paddleX;
  }, [paddleX]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const startGameLoop = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    const gameLoop = () => {
      if (gameState !== 'playing') return;

      const currentBall = ballPosRef.current;
      const currentVel = ballVelRef.current;
      const currentPaddleX = paddleXRef.current;
      const currentBlocks = blocksRef.current;

      let newX = currentBall.x + currentVel.x;
      let newY = currentBall.y + currentVel.y;
      let newVelX = currentVel.x;
      let newVelY = currentVel.y;

      // Wall collisions
      if (newX <= BALL_SIZE / 2 || newX >= SCREEN_WIDTH - BALL_SIZE / 2) {
        newVelX = -currentVel.x;
        newX = newX <= BALL_SIZE / 2 ? BALL_SIZE / 2 : SCREEN_WIDTH - BALL_SIZE / 2;
      }

      if (newY <= BALL_SIZE / 2) {
        newVelY = -currentVel.y;
        newY = BALL_SIZE / 2;
      }

      // Bottom boundary - lose life
      if (newY >= SCREEN_HEIGHT - BALL_SIZE / 2) {
        handleBallLost();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Paddle collision
      if (
        newY + BALL_SIZE / 2 >= SCREEN_HEIGHT - 100 &&
        newY + BALL_SIZE / 2 <= SCREEN_HEIGHT - 80 &&
        newX >= currentPaddleX &&
        newX <= currentPaddleX + PADDLE_WIDTH
      ) {
        const hitPos = (newX - currentPaddleX) / PADDLE_WIDTH;
        const angle = (hitPos - 0.5) * Math.PI * 0.5;
        newVelX = Math.sin(angle) * 4;
        newVelY = -Math.abs(Math.cos(angle) * 4);
        newY = SCREEN_HEIGHT - 100 - BALL_SIZE / 2;
      }

      // Block collisions
      const remainingBlocks = currentBlocks.filter((block) => !block.hit);
      let blockHit = false;
      let hitBlockId = null;

      for (let block of remainingBlocks) {
        if (
          newX + BALL_SIZE / 2 >= block.x &&
          newX - BALL_SIZE / 2 <= block.x + block.width &&
          newY + BALL_SIZE / 2 >= block.y &&
          newY - BALL_SIZE / 2 <= block.y + block.height
        ) {
          blockHit = true;
          hitBlockId = block.id;
          
          // Determine bounce direction
          const ballCenterX = newX;
          const ballCenterY = newY;
          const blockCenterX = block.x + block.width / 2;
          const blockCenterY = block.y + block.height / 2;
          
          const dx = ballCenterX - blockCenterX;
          const dy = ballCenterY - blockCenterY;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            newVelX = -newVelX;
          } else {
            newVelY = -newVelY;
          }
          
          break;
        }
      }

      if (blockHit && hitBlockId) {
        setBlocks((prevBlocks) => {
          const updated = prevBlocks.map((b) =>
            b.id === hitBlockId ? { ...b, hit: true } : b
          );
          blocksRef.current = updated;
          
          // Check win condition
          const remaining = updated.filter((b) => !b.hit);
          if (remaining.length === 0) {
            setTimeout(() => handleLevelComplete(), 100);
          }
          
          return updated;
        });
        setScore((prev) => prev + 10);
      }

      // Update positions
      ballPosRef.current = { x: newX, y: newY };
      ballVelRef.current = { x: newVelX, y: newVelY };
      
      setBallX(newX);
      setBallY(newY);
      setBallVelocityX(newVelX);
      setBallVelocityY(newVelY);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const handleBallLost = () => {
    setLives((prev) => {
      if (prev <= 1) {
        setGameState('gameOver');
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current);
        }
        return 0;
      }
      // Reset ball position
      const resetVelX = 3 * (Math.random() > 0.5 ? 1 : -1);
      const resetPaddleX = (SCREEN_WIDTH - PADDLE_WIDTH) / 2;
      const resetBallPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 };
      
      setBallX(resetBallPos.x);
      setBallY(resetBallPos.y);
      setPaddleX(resetPaddleX);
      setBallVelocityX(resetVelX);
      setBallVelocityY(-3);
      
      // Update refs
      ballPosRef.current = resetBallPos;
      ballVelRef.current = { x: resetVelX, y: -3 };
      paddleXRef.current = resetPaddleX;
      lastPaddleX.current = resetPaddleX;
      
      return prev - 1;
    });
  };

  const handleLevelComplete = () => {
    setLevel((prev) => prev + 1);
    const resetVelX = 3 * (Math.random() > 0.5 ? 1 : -1);
    const resetPaddleX = (SCREEN_WIDTH - PADDLE_WIDTH) / 2;
    const resetBallPos = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 150 };
    
    setBallX(resetBallPos.x);
    setBallY(resetBallPos.y);
    setPaddleX(resetPaddleX);
    setBallVelocityX(resetVelX);
    setBallVelocityY(-3);
    
    // Update refs
    ballPosRef.current = resetBallPos;
    ballVelRef.current = { x: resetVelX, y: -3 };
    paddleXRef.current = resetPaddleX;
    lastPaddleX.current = resetPaddleX;
    
    initializeBlocks();
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    if (gameState === 'playing') {
      startGameLoop();
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);


  const handlePaddleMove = (event) => {
    if (gameState !== 'playing') return;
    const { translationX } = event.nativeEvent;
    const newX = Math.max(
      0,
      Math.min(SCREEN_WIDTH - PADDLE_WIDTH, lastPaddleX.current + translationX)
    );
    setPaddleX(newX);
  };

  const handlePaddleStateChange = (event) => {
    if (gameState !== 'playing') return;
    const { state, x } = event.nativeEvent;
    if (state === 2) { // ACTIVE
      const newX = Math.max(
        0,
        Math.min(SCREEN_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2)
      );
      setPaddleX(newX);
      lastPaddleX.current = newX;
    } else if (state === 5) { // END
      lastPaddleX.current = paddleX;
    }
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>BLOCK BREAKER</Text>
      <Text style={styles.subtitle}>Blokları Kır, Skorunu Artır!</Text>
      <TouchableOpacity style={styles.button} onPress={startGame}>
        <Text style={styles.buttonText}>OYUNA BAŞLA</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>OYUN BİTTİ</Text>
      <Text style={styles.scoreText}>Skor: {score}</Text>
      <Text style={styles.scoreText}>Seviye: {level}</Text>
      <TouchableOpacity style={styles.button} onPress={startGame}>
        <Text style={styles.buttonText}>TEKRAR DENE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Skor: {score}</Text>
          <Text style={styles.headerText}>Can: {lives}</Text>
          <Text style={styles.headerText}>Seviye: {level}</Text>
        </View>

        <Animated.View style={[styles.gameArea, { opacity: fadeAnim }]}>
          {blocks
            .filter((block) => !block.hit)
            .map((block) => (
              <Block key={block.id} {...block} />
            ))}
          
          <Ball x={ballX} y={ballY} size={BALL_SIZE} />
          
          <PanGestureHandler
            onGestureEvent={handlePaddleMove}
            onHandlerStateChange={handlePaddleStateChange}
            activeOffsetX={[-5, 5]}
            failOffsetY={[-10, 10]}
          >
            <View style={styles.paddleContainer}>
              <Paddle x={paddleX} y={SCREEN_HEIGHT - 100} width={PADDLE_WIDTH} height={PADDLE_HEIGHT} />
            </View>
          </PanGestureHandler>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );

  return (
    <View style={styles.container}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'gameOver' && renderGameOver()}
      {gameState === 'playing' && renderGame()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#4ECDC4',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#16213e',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  scoreText: {
    fontSize: 24,
    color: '#4ECDC4',
    marginBottom: 20,
  },
  paddleContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: PADDLE_HEIGHT + 20,
    top: SCREEN_HEIGHT - 110,
  },
});

export default GameScreen;
