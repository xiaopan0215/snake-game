import { Coordinate, Snake, Direction } from '../types';

export const isCoordinateEqual = (c1: Coordinate, c2: Coordinate) => {
  return c1.x === c2.x && c1.y === c2.y;
};

export const isCoordinateInArray = (c: Coordinate, arr: Coordinate[]) => {
  return arr.some(item => isCoordinateEqual(item, c));
};

// Calculate all occupied cells for a snake based on its head, length, and direction
export const getSnakeSegments = (snake: Snake): Coordinate[] => {
  if (snake.segments && snake.segments.length > 0) {
    return snake.segments;
  }
  
  // Fallback for legacy data (straight lines)
  const segments: Coordinate[] = [];
  let { x, y } = snake.head;
  
  // The segments extend backwards from the head
  // So if head is facing 'right', body is to the 'left'
  let dx = 0;
  let dy = 0;

  switch (snake.direction) {
    case 'right': dx = -1; break;
    case 'left': dx = 1; break;
    case 'down': dy = -1; break;
    case 'up': dy = 1; break;
  }

  for (let i = 0; i < snake.length; i++) {
    segments.push({ x: x + dx * i, y: y + dy * i });
  }

  return segments;
};

export const getAllSnakeSegments = (snakes: Snake[], excludeSnakeId?: string): Coordinate[] => {
  let allSegments: Coordinate[] = [];
  snakes.forEach(snake => {
    if (snake.id !== excludeSnakeId && !snake.isExiting) {
      allSegments = allSegments.concat(getSnakeSegments(snake));
    }
  });
  return allSegments;
};

// Check if a snake can exit the board from its current position
// It moves in its facing direction until it leaves the grid
// Returns true if path is clear, false if blocked by another snake
export const canSnakeExit = (
  snake: Snake,
  snakes: Snake[],
  gridSize: { width: number; height: number }
): boolean => {
  const otherSegments = getAllSnakeSegments(snakes, snake.id);
  
  let { x, y } = snake.head;
  let dx = 0;
  let dy = 0;

  switch (snake.direction) {
    case 'right': dx = 1; break;
    case 'left': dx = -1; break;
    case 'down': dy = 1; break;
    case 'up': dy = -1; break;
  }

  // Trace the path from head to grid boundary
  // Start from next cell in front of head
  let currentX = x + dx;
  let currentY = y + dy;

  while (
    currentX >= 0 && currentX < gridSize.width &&
    currentY >= 0 && currentY < gridSize.height
  ) {
    // Check collision with other snakes
    if (isCoordinateInArray({ x: currentX, y: currentY }, otherSegments)) {
      return false; // Blocked
    }
    currentX += dx;
    currentY += dy;
  }

  return true; // Path clear to edge
};

// Get the coordinates for the visual exit path (for animation)
export const getExitPath = (
    snake: Snake,
    gridSize: { width: number; height: number }
): Coordinate => {
    // Return the coordinate just outside the grid
    let { x, y } = snake.head;
    let dx = 0;
    let dy = 0;

    switch (snake.direction) {
        case 'right': dx = 1; break;
        case 'left': dx = -1; break;
        case 'down': dy = 1; break;
        case 'up': dy = -1; break;
    }

    // Determine distance to edge
    let dist = 0;
    if (dx > 0) dist = gridSize.width - x;
    else if (dx < 0) dist = x + 1;
    else if (dy > 0) dist = gridSize.height - y;
    else if (dy < 0) dist = y + 1;

    return { x: x + dx * dist, y: y + dy * dist };
}
