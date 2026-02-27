import React, { useRef, useEffect, useState } from 'react';
import { LevelData, Snake } from '../types';
import { getSnakeSegments, canSnakeExit, isCoordinateInArray } from '../utils/gameLogic';
import { soundManager } from '../utils/sound';
import { useGameStore } from '../store/gameStore';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface GameBoardProps {
  levelData: LevelData;
  onLevelComplete: () => void;
  onLevelFail: () => void;
  onSnakeExit: () => void;
  turtleProgress: number;
  scale: number;
  onScaleChange: (scale: number) => void;
  hintSnakeId?: string | null;
  onInvalidMove?: () => void;
  isBombActive?: boolean;
  onUseBomb?: (snakeId: string) => void;
}

const CELL_SIZE = 40;
const TRACK_PADDING = 20;
const GRID_OFFSET_X = 60;
const GRID_OFFSET_Y = 60;

const GRID_COLOR = '#E6D7B9';
const TRACK_COLOR = '#333333';
const TURTLE_COLOR = '#00BFFF';

// Helper to track animating snakes
interface AnimatingSnake extends Snake {
  offsetX: number;
  offsetY: number;
  startTime: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  levelData, 
  onLevelComplete, 
  onLevelFail,
  onSnakeExit,
  turtleProgress,
  scale,
  onScaleChange,
  hintSnakeId,
  onInvalidMove,
  isBombActive,
  onUseBomb
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snakes, setSnakes] = useState<Snake[]>(levelData.snakes);
  
  // Store
  const { skins, selectedSkinId } = useGameStore();
  const currentSkin = skins.find(s => s.id === selectedSkinId) || skins[0];

  // Pan State (Internal to GameBoard for drag)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  // Use a ref for animating snakes to avoid re-renders during animation loop
  const animatingSnakesRef = useRef<AnimatingSnake[]>([]);
  const requestRef = useRef<number>();
  
  // Initialize snakes when level changes
  useEffect(() => {
    setSnakes(levelData.snakes);
    animatingSnakesRef.current = [];
    onScaleChange(1); // Reset zoom via prop
    setPan({ x: 0, y: 0 }); // Reset pan
    lastPinchDist.current = null;
  }, [levelData]);

  // Check for win condition
  useEffect(() => {
    // Only win if no static snakes AND no animating snakes
    if (snakes.length === 0 && animatingSnakesRef.current.length === 0) {
      // Delay slightly to let animation finish
      const timer = setTimeout(() => {
        if (snakes.length === 0 && animatingSnakesRef.current.length === 0) {
           onLevelComplete();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [snakes, onLevelComplete]);

  // Main Game Loop
  const render = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = levelData.grid_config;
    const totalWidth = width * CELL_SIZE + GRID_OFFSET_X * 2;
    const totalHeight = height * CELL_SIZE + GRID_OFFSET_Y * 2;

    canvas.width = window.innerWidth; // Use full width for canvas
    canvas.height = window.innerHeight * 0.75; // Slightly larger

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Zoom and Pan
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(scale, scale);
    ctx.translate(-totalWidth / 2, -totalHeight / 2); // Center content

    // 1. Draw Grid Background (Translated)
    ctx.save();
    ctx.translate(GRID_OFFSET_X, GRID_OFFSET_Y);
    ctx.fillStyle = GRID_COLOR;
    ctx.fillRect(0, 0, width * CELL_SIZE, height * CELL_SIZE);
    
    // 2. Draw Grid Lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // 3. Draw Animating Snakes (Flying under the track visual)
    animatingSnakesRef.current = animatingSnakesRef.current.filter(snake => {
        const elapsed = time - snake.startTime;
        const speed = 1.0; // Slightly faster
        
        const moveDist = elapsed * speed;

        switch(snake.direction) {
            case 'right': snake.offsetX = moveDist; break;
            case 'left': snake.offsetX = -moveDist; break;
            case 'down': snake.offsetY = moveDist; break;
            case 'up': snake.offsetY = -moveDist; break;
        }

        const maxDist = Math.max(width, height) * CELL_SIZE + 200;
        if (Math.abs(snake.offsetX) > maxDist || Math.abs(snake.offsetY) > maxDist) {
            return false; 
        }

        drawSnake(ctx, snake, snake.offsetX, snake.offsetY);
        return true;
    });

    // 4. Draw Static Snakes
    snakes.forEach(snake => {
      drawSnake(ctx, snake, 0, 0);
    });
    
    ctx.restore(); // Stop translation for track

    // 5. Draw Track (On top, masking the exiting snakes)
    // Draw "Frame" that covers everything outside the grid area, with a hole for the grid.
    
    // 1. Draw solid background color outside the grid area
    ctx.save();
    ctx.beginPath();
    ctx.rect(-2000, -2000, totalWidth + 4000, totalHeight + 4000); // Large Outer
    
    // Inner cutout (the grid area)
    const innerX = GRID_OFFSET_X;
    const innerY = GRID_OFFSET_Y;
    const innerW = width * CELL_SIZE;
    const innerH = height * CELL_SIZE;
    
    // Use sub-path for cutout (winding rule)
    ctx.rect(innerX, innerY, innerW, innerH); 
    
    // Fill using even-odd rule to create hole
    ctx.fillStyle = '#111827'; // Match game background (gray-900)
    ctx.fill("evenodd");
    ctx.restore();

    // 2. Draw Track Ring on top
    drawTrack(ctx, totalWidth, totalHeight, turtleProgress, levelData.track_length, time);
    
    ctx.restore(); // Restore Zoom/Pan

    requestRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [levelData, snakes, turtleProgress, scale, pan]);

  const drawTrack = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, totalLength: number, time: number) => {
    const trackRect = {
      x: TRACK_PADDING,
      y: TRACK_PADDING,
      w: w - TRACK_PADDING * 2,
      h: h - TRACK_PADDING * 2,
      r: 30
    };

    ctx.beginPath();
    ctx.roundRect(trackRect.x, trackRect.y, trackRect.w, trackRect.h, trackRect.r);
    ctx.strokeStyle = TRACK_COLOR;
    ctx.lineWidth = 20;
    ctx.stroke();

    const point = getPointOnRect(trackRect.x, trackRect.y, trackRect.w, trackRect.h, progress / totalLength);
    
    // Draw Turtle
    ctx.save();
    ctx.translate(point.x, point.y);
    
    // Calculate rotation based on which side of the track we are on
    // Simplified rotation logic
    const t = progress / totalLength;
    const p = 2 * (trackRect.w + trackRect.h);
    const dist = t * p;
    let angle = 0;
    
    if (dist <= trackRect.w) angle = 0; // Top: Moving Right
    else if (dist <= trackRect.w + trackRect.h) angle = Math.PI / 2; // Right: Moving Down
    else if (dist <= 2 * trackRect.w + trackRect.h) angle = Math.PI; // Bottom: Moving Left
    else angle = -Math.PI / 2; // Left: Moving Up

    ctx.rotate(angle);

    // Wobble effect for crawling
    const wobble = Math.sin(time * 0.01) * 2;
    
    // Draw Legs
    ctx.fillStyle = '#008B8B'; // Dark Cyan for legs
    ctx.beginPath();
    // FL
    ctx.ellipse(12, -12 + wobble, 6, 3, Math.PI / 4, 0, Math.PI * 2);
    // FR
    ctx.ellipse(12, 12 - wobble, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
    // BL
    ctx.ellipse(-12, -12 - wobble, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
    // BR
    ctx.ellipse(-12, 12 + wobble, 6, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Body
    ctx.fillStyle = TURTLE_COLOR;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Head
    ctx.fillStyle = '#008B8B';
    ctx.beginPath();
    ctx.arc(20, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Shell details
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐢', 0, 0);
    
    ctx.restore();

    const startPoint = getPointOnRect(trackRect.x, trackRect.y, trackRect.w, trackRect.h, 0);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('🕳️', startPoint.x, startPoint.y);
  };

  const getPointOnRect = (x: number, y: number, w: number, h: number, t: number) => {
    const p = 2 * (w + h);
    const dist = t * p;
    
    if (dist <= w) return { x: x + dist, y: y };
    if (dist <= w + h) return { x: x + w, y: y + (dist - w) };
    if (dist <= 2 * w + h) return { x: x + w - (dist - (w + h)), y: y + h };
    return { x: x, y: y + h - (dist - (2 * w + h)) };
  };

  const drawSnake = (ctx: CanvasRenderingContext2D, snake: Snake, offsetX: number, offsetY: number) => {
    const segments = getSnakeSegments(snake);
    const isHinted = snake.id === hintSnakeId;

    // Highlight hinted snake
    if (isHinted) {
        ctx.save();
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.8 + Math.sin(performance.now() * 0.01) * 0.2; // Pulse
    }

    // Use Skin Color (Override snake color from level data if we want consistent skins, 
    // OR blend them? Requirement says "Skin to be replaced". So we use skin color.)
    // But maybe we keep different colors for different snakes? 
    // Usually skins in these games apply to ALL snakes or the player's snake. 
    // Here we control all snakes. Let's apply the skin color to ALL snakes.
    const bodyColor = currentSkin.color; 
    ctx.fillStyle = bodyColor;
    
    // Draw continuous body
    // First pass: Draw connections to ensure no gaps
    ctx.fillStyle = bodyColor;
    segments.forEach((seg, i) => {
      if (i === 0) return; // Skip head for connections
      
      const prev = segments[i-1];
      const px = seg.x * CELL_SIZE + offsetX;
      const py = seg.y * CELL_SIZE + offsetY;
      const prevX = prev.x * CELL_SIZE + offsetX;
      const prevY = prev.y * CELL_SIZE + offsetY;
      
      const dx = seg.x - prev.x;
      const dy = seg.y - prev.y;
      
      // Draw connection block
      ctx.beginPath();
      const margin = 4; // Slightly smaller than full cell width to keep rounded look
      if (Math.abs(dx) > 0) { // Horizontal
        const left = Math.min(px, prevX);
        ctx.fillRect(left + CELL_SIZE/2, py + margin, CELL_SIZE, CELL_SIZE - margin * 2);
      } else { // Vertical
        const top = Math.min(py, prevY);
        ctx.fillRect(px + margin, top + CELL_SIZE/2, CELL_SIZE - margin * 2, CELL_SIZE);
      }
    });

    // Second pass: Draw segments (Head, Body, Tail)
    segments.forEach((seg, i) => {
      const px = seg.x * CELL_SIZE + offsetX;
      const py = seg.y * CELL_SIZE + offsetY;
      
      // Use head color for head, body color for others
      if (i === 0) {
          ctx.fillStyle = currentSkin.headColor;
      } else {
          ctx.fillStyle = bodyColor;
      }
      
      if (i === 0) {
        // HEAD: Minimalist Design
        // Simple rounded shape with direction indicator
        ctx.beginPath();
        ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 12); 
        ctx.fill();

        // Eyes
        ctx.fillStyle = currentSkin.eyeColor;
        const eyeSize = 4;
        const pupilSize = 2;
        
        const headCx = px + CELL_SIZE / 2;
        const headCy = py + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(headCx, headCy);
        let rotation = 0;
        switch(snake.direction) {
            case 'right': rotation = 0; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
            case 'up': rotation = -Math.PI / 2; break;
        }
        ctx.rotate(rotation);
        
        // Draw Eyes relative to rotated head (facing right by default in rotation logic)
        // Top Eye
        ctx.beginPath();
        ctx.arc(6, -8, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        // Bottom Eye
        ctx.beginPath();
        ctx.arc(6, 8, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (Black)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(7, -8, pupilSize, 0, Math.PI * 2);
        ctx.arc(7, 8, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

      } else if (i === segments.length - 1) {
        // TAIL: Simple Tapered End
        const prev = segments[i-1];
        const dx = seg.x - prev.x; 
        const dy = seg.y - prev.y;
        
        const center = CELL_SIZE / 2;
        const cx = px + center;
        const cy = py + center;
        
        ctx.beginPath();
        
        // Draw a simple rounded triangle/drop shape
        if (dx === 1) { // Right
             ctx.moveTo(px, py + 4);
             ctx.lineTo(px + CELL_SIZE - 8, cy);
             ctx.lineTo(px, py + CELL_SIZE - 4);
             ctx.quadraticCurveTo(px - 4, cy, px, py + 4);
        } else if (dx === -1) { // Left
             ctx.moveTo(px + CELL_SIZE, py + 4);
             ctx.lineTo(px + 8, cy);
             ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE - 4);
             ctx.quadraticCurveTo(px + CELL_SIZE + 4, cy, px + CELL_SIZE, py + 4);
        } else if (dy === 1) { // Down
             ctx.moveTo(px + 4, py);
             ctx.lineTo(cx, py + CELL_SIZE - 8);
             ctx.lineTo(px + CELL_SIZE - 4, py);
             ctx.quadraticCurveTo(cx, py - 4, px + 4, py);
        } else if (dy === -1) { // Up
             ctx.moveTo(px + 4, py + CELL_SIZE);
             ctx.lineTo(cx, py + 8);
             ctx.lineTo(px + CELL_SIZE - 4, py + CELL_SIZE);
             ctx.quadraticCurveTo(cx, py + CELL_SIZE + 4, px + 4, py + CELL_SIZE);
        }
        ctx.fill();

      } else {
        // BODY: Simple Round Segment
        ctx.beginPath();
        ctx.roundRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8, 8);
        ctx.fill();
        
        // Minimalist center dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (isHinted) {
        ctx.restore();
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setLastPos({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const dx = clientX - lastPos.x;
    const dy = clientY - lastPos.y;
    
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // If we were dragging significantly, it's not a tap
    if (Math.abs(pan.x) > 5 && isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // For mouse events, clientX is on e. For touch, it's on changedTouches[0]
    let clientX, clientY;
    if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    // ... rest of logic
    
    // Canvas center
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Mouse relative to canvas center (including pan)
    // IMPORTANT: The translate order in render is:
    // translate(cx + pan.x, cy + pan.y) -> scale(s, s) -> translate(-totalW/2, -totalH/2)
    
    // So to reverse:
    // 1. Mouse relative to screen: (clientX - rect.left, clientY - rect.top)
    // 2. Relative to origin of first translate: (mx - (cx + pan.x), my - (cy + pan.y))
    // 3. Unscale: (/ scale)
    // 4. Reverse second translate: (+ totalW/2, + totalH/2)
    
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    
    const relX = mx - (cx + pan.x);
    const relY = my - (cy + pan.y);
    
    const unscaledX = relX / scale;
    const unscaledY = relY / scale;
    
    const { width, height } = levelData.grid_config;
    const totalWidth = width * CELL_SIZE + GRID_OFFSET_X * 2;
    const totalHeight = height * CELL_SIZE + GRID_OFFSET_Y * 2;
    
    const clickX = unscaledX + totalWidth / 2;
    const clickY = unscaledY + totalHeight / 2;
    
    // ... rest of validation and finding snake


    if (clickX < GRID_OFFSET_X || clickX > totalWidth - GRID_OFFSET_X ||
        clickY < GRID_OFFSET_Y || clickY > totalHeight - GRID_OFFSET_Y) {
        return;
    }

    const gridX = Math.floor((clickX - GRID_OFFSET_X) / CELL_SIZE);
    const gridY = Math.floor((clickY - GRID_OFFSET_Y) / CELL_SIZE);

    const clickedSnake = snakes.find(s => 
        isCoordinateInArray({x: gridX, y: gridY}, getSnakeSegments(s))
    );

    if (clickedSnake) {
        soundManager.playClick();
        handleSnakeClick(clickedSnake);
    }
  };

  const handleSnakeClick = (snake: Snake) => {
    // Bomb Logic
    if (isBombActive && onUseBomb) {
        onUseBomb(snake.id);
        // Animate removal (simplified for bomb)
        setSnakes(prev => prev.filter(s => s.id !== snake.id));
        soundManager.playLaunch(); // Or explosion sound
        return;
    }

    if (canSnakeExit(snake, snakes, levelData.grid_config)) {
        setSnakes(prev => prev.filter(s => s.id !== snake.id));
        
        animatingSnakesRef.current.push({
            ...snake,
            offsetX: 0,
            offsetY: 0,
            startTime: performance.now()
        });

        soundManager.playLaunch();
        onSnakeExit(); 
    } else {
        soundManager.playBlock();
        if (onInvalidMove) onInvalidMove();
        console.log("被阻挡!");
    }
  };

  // Separate click vs drag logic is tricky with one event handler
  // Simple approach: Use click for tap, and mouse move for pan
  // But we need to distinguish pan vs click.
  // Using a separate state to track "didMove".
  const [didMove, setDidMove] = useState(false);

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e && e.touches.length === 2) {
          // Start pinch
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          lastPinchDist.current = dist;
          setIsDragging(false); // Stop dragging if pinching
      } else {
          handlePointerDown(e);
          setDidMove(false);
      }
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e && e.touches.length === 2 && lastPinchDist.current !== null) {
          // Handle Pinch
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const delta = dist - lastPinchDist.current;
          
          // Sensitivity
          const zoomSpeed = 0.005;
          onScaleChange(Math.min(Math.max(scale + delta * zoomSpeed, 0.5), 3));
          
          lastPinchDist.current = dist;
          return;
      }

      if (isDragging) {
          handlePointerMove(e);
          setDidMove(true);
      }
  };

  const onUp = (e: React.MouseEvent | React.TouchEvent) => {
      lastPinchDist.current = null;
      handlePointerUp();
      
      // Only tap if we didn't drag and didn't pinch
      if (!didMove) { 
          // Note: isDragging is set true in onDown for 1 finger.
          // If we pinched, onDown set isDragging=false.
          // If we dragged, didMove is true.
          
          // But wait, isDragging is set to false in handlePointerUp just before this check.
          // handlePointerUp sets isDragging to false.
          // So we rely on 'didMove' state which tracks if onMove was called while dragging.
          
          handleTap(e);
      }
      setDidMove(false); // Reset for next interaction
  };

  const handleWheel = (e: React.WheelEvent) => {
      const delta = -e.deltaY * 0.001;
      onScaleChange(Math.min(Math.max(scale + delta, 0.5), 3));
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative" onWheel={handleWheel}>
      {/* Zoom buttons moved to parent UI */}
      
      <canvas
        ref={canvasRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        className="rounded-lg cursor-grab active:cursor-grabbing touch-none"
        style={{ width: '100%', height: '75vh' }}
      />
    </div>
  );
};

export default GameBoard;
