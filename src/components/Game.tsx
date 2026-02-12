import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface GameProps {
  onLogin: (userType: 'boy' | 'girl') => void;
}

const Game: React.FC<GameProps> = ({ onLogin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [code, setCode] = useState("");
  const [gameOver, setGameOver] = useState(false);

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_FORCE = -10;
  const OBSTACLE_SPEED = 5;

  // Game state
  const gameState = useRef({
    playerY: 200,
    velocity: 0,
    obstacles: [] as { x: number, width: number, height: number }[],
    frameId: 0,
    score: 0
  });

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    gameState.current = {
      playerY: 200,
      velocity: 0,
      obstacles: [],
      frameId: 0,
      score: 0
    };
    setScore(0);
    gameLoop();
  };

  const jump = () => {
    if (!isPlaying) return;
    if (gameState.current.playerY >= 200) { // Ground level
      gameState.current.velocity = JUMP_FORCE;
    }
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player
    gameState.current.velocity += GRAVITY;
    gameState.current.playerY += gameState.current.velocity;

    // Ground collision
    if (gameState.current.playerY > 200) {
      gameState.current.playerY = 200;
      gameState.current.velocity = 0;
    }

    // Draw Player (Simple Cube for now, maybe replace with sprite later)
    ctx.fillStyle = '#10b981'; // Primary color
    ctx.fillRect(50, gameState.current.playerY, 30, 30);

    // Obstacle Logic
    if (gameState.current.frameId % 100 === 0) {
      gameState.current.obstacles.push({
        x: canvas.width,
        width: 30,
        height: 40 + Math.random() * 40
      });
    }

    // Update and Draw Obstacles
    ctx.fillStyle = '#ef4444'; // Red obstacle
    for (let i = gameState.current.obstacles.length - 1; i >= 0; i--) {
      const obs = gameState.current.obstacles[i];
      obs.x -= OBSTACLE_SPEED;

      ctx.fillRect(obs.x, 200 + 30 - obs.height, obs.width, obs.height);

      // Collision Detection
      if (
        50 < obs.x + obs.width &&
        50 + 30 > obs.x &&
        gameState.current.playerY < 200 + 30 &&
        gameState.current.playerY + 30 > 200 + 30 - obs.height
      ) {
        setGameOver(true);
        setIsPlaying(false);
        cancelAnimationFrame(gameState.current.frameId);
        return;
      }

      // Remove off-screen obstacles
      if (obs.x + obs.width < 0) {
        gameState.current.obstacles.splice(i, 1);
        gameState.current.score += 1;
        setScore(gameState.current.score);
      }
    }

    // Draw Ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 230, canvas.width, 20);

    gameState.current.frameId = requestAnimationFrame(gameLoop);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toLowerCase();
    
    if (cleanCode === 'asthipanjaram') {
      onLogin('girl');
      toast.success("Welcome back, Bhavya!");
    } else if (cleanCode === 'bachii') {
      onLogin('boy');
      toast.success("Welcome back, Vamsi!");
    } else {
      toast.error("Incorrect code");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2 tracking-tighter">Runner Chat</h1>
        <p className="text-muted-foreground">Jump to survive. Enter code to chat.</p>
      </div>

      <div className="relative group">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300} 
          className="bg-card rounded-lg shadow-2xl border border-border cursor-pointer max-w-full"
          onClick={jump}
        />
        
        {(!isPlaying && !gameOver) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
            <Button onClick={startGame} size="lg" className="text-xl font-bold px-8 py-6">
              Start Running
            </Button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-md p-6">
            <h2 className="text-2xl font-bold text-destructive mb-2">Game Over</h2>
            <p className="text-xl mb-6">Score: {score}</p>
            <Button onClick={startGame}>Try Again</Button>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Tap / Click to Jump
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 w-full max-w-sm"
      >
        <form onSubmit={handleCodeSubmit} className="flex gap-2">
          <Input 
            type="password" 
            placeholder="Enter secret code..." 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="bg-secondary border-none"
          />
          <Button type="submit" variant="secondary">Enter</Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Game;
