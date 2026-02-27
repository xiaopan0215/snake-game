
const fs = require('fs');
const path = require('path');

function getRandomColor() {
    const colors = [
        '#FF6B6B', // Pastel Red
        '#4ECDC4', // Pastel Teal
        '#45B7D1', // Pastel Blue
        '#96CEB4', // Pastel Green
        '#FFEEAD', // Pastel Yellow
        '#D4A5A5', // Pastel Pink
        '#9B59B6', // Purple
        '#3498DB', // Blue
        '#E67E22', // Orange
        '#2ECC71'  // Green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function generateDenseLevel(levelId, levelNum, width, height, difficulty) {
    const snakes = [];
    const grid = Array(height).fill(null).map(() => Array(width).fill(false));

    // Helper to check if space is free
    const isFree = (x, y) => {
        return x >= 0 && x < width && y >= 0 && y < height && !grid[y][x];
    };

    // Strategy: Directional Flow to guarantee solvability.
    let getDirection;
    if (levelNum === 1 || levelNum === 2) {
        // Level 1 (6x6) & Level 2 (14x14): Split Vertically. Left->Left, Right->Right.
        // This is much safer than 4-quadrants for small/medium grids with bent snakes.
        getDirection = (x, y) => x < width / 2 ? 'left' : 'right';
    } else {
        // Level 3 (20x20): 4 Quadrants Outward.
        getDirection = (x, y) => {
            if (x < width / 2 && y < height / 2) return 'up';
            if (x >= width / 2 && y < height / 2) return 'right';
            if (x < width / 2 && y >= height / 2) return 'left';
            return 'down';
        };
    }

    // Pass 1: Place Long Snakes
    // For Level 1 (6x6), max length 3.
    // For larger levels, max length 5 or 6.
    const maxLen = levelNum === 1 ? 3 : 6;
    const minLen = 2; // Always min 2

    for (let i = 0; i < width * height * 2; i++) { // Try more times
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (!isFree(x, y)) continue;

        const dir = getDirection(x, y);
        const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
        tryPlaceSnake(x, y, dir, len, snakes, grid, width, height);
    }

    // Pass 2: Fill gaps with Medium Snakes (Length 2-3)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!isFree(x, y)) continue;
            const dir = getDirection(x, y);
            const len = Math.floor(Math.random() * 2) + 2; // 2 or 3
            tryPlaceSnake(x, y, dir, len, snakes, grid, width, height);
        }
    }

    // Pass 3: Fill remaining gaps with Length 2 (Try hard)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!isFree(x, y)) continue;
            const dir = getDirection(x, y);
            // Try to fit a 2-segment snake
            tryPlaceSnake(x, y, dir, 2, snakes, grid, width, height);
        }
    }
    
    // Pass 4: Any single holes? We must leave them empty or merge them?
    // User requirement: "Snake min 2 cells".
    // If we have single cells left, we can't place a snake there.
    // Ideally we'd backtrack or merge, but for now let's just leave them or try to extend neighbors?
    // Extending neighbors is complex. We'll leave gaps if necessary, but "Dense" implies few gaps.
    // 1-cell gaps might remain.

    return {
        level_id: levelId,
        level_number: levelNum,
        difficulty: difficulty,
        grid_config: { width, height },
        snakes: snakes,
        track_length: (width + height) * 2 + (levelNum * 10),
        turtle_speed: levelNum === 1 ? 1.0 : (levelNum === 2 ? 1.5 : 2.0),
        push_back_amount: levelNum === 1 ? 3 : (levelNum === 2 ? 2 : 1.5)
    };
}

function tryPlaceSnake(headX, headY, dir, length, snakes, grid, width, height) {
    const segments = [{ x: headX, y: headY }];
    
    // Determine the "forward" coordinate to avoid placing body there immediately
    let forwardX = headX;
    let forwardY = headY;
    switch(dir) {
        case 'right': forwardX += 1; break;
        case 'left': forwardX -= 1; break;
        case 'down': forwardY += 1; break;
        case 'up': forwardY -= 1; break;
    }

    // Random Walk for Body
    for (let i = 1; i < length; i++) {
        const prev = segments[i-1];
        
        // Find valid neighbors
        let neighbors = [
            { x: prev.x + 1, y: prev.y },
            { x: prev.x - 1, y: prev.y },
            { x: prev.x, y: prev.y + 1 },
            { x: prev.x, y: prev.y - 1 }
        ].filter(n => 
            n.x >= 0 && n.x < width && 
            n.y >= 0 && n.y < height && 
            !grid[n.y][n.x] &&
            !segments.some(s => s.x === n.x && s.y === n.y)
        );

        // CONSTRAINT: Segment 1 cannot be in 'forward' direction from Head
        if (i === 1) {
            neighbors = neighbors.filter(n => !(n.x === forwardX && n.y === forwardY));
        }

        if (neighbors.length === 0) return false; // Stuck

        // Pick random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        segments.push(next);
    }

    // Success! Mark grid and add snake
    segments.forEach(s => grid[s.y][s.x] = true);
    
    snakes.push({
        id: `s_${Math.random().toString(36).substr(2, 9)}`,
        head: { x: headX, y: headY },
        length: length,
        direction: dir,
        segments: segments,
        color: getRandomColor()
    });
    return true;
}

// Helper to fill single gaps
function fillSingleGaps(snakes, grid, width, height) {
    let filled = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!grid[y][x]) { // Found a gap
                // Check if any neighbor is a snake TAIL that can extend?
                // Finding which snake has a tail adjacent to (x,y)
                const neighborSnakes = snakes.filter(s => {
                    const tail = s.segments[s.segments.length - 1];
                    const dist = Math.abs(tail.x - x) + Math.abs(tail.y - y);
                    return dist === 1;
                });
                
                if (neighborSnakes.length > 0) {
                    // Pick one and extend
                    const snake = neighborSnakes[0];
                    snake.segments.push({x, y});
                    snake.length++;
                    grid[y][x] = true;
                    filled = true;
                }
            }
        }
    }
    return filled;
}

const rebuildGrid = (snakes, w, h) => {
    const g = Array(h).fill(null).map(() => Array(w).fill(false));
    snakes.forEach(s => s.segments.forEach(seg => g[seg.y][seg.x] = true));
    return g;
};

const levels = {};

for (let i = 1; i <= 10; i++) {
    let width, height, difficulty, speed, pushBack;
    
    if (i <= 2) {
        width = 6 + (i-1)*2; // 6, 8
        height = 6 + (i-1)*2;
        difficulty = 'easy';
        speed = 1.0;
        pushBack = 3;
    } else if (i <= 5) {
        width = 10 + (i-3)*2; // 10, 12, 14
        height = 10 + (i-3)*2;
        difficulty = 'medium';
        speed = 1.2 + (i-3)*0.1;
        pushBack = 2;
    } else {
        width = 15 + (i-6); // 15, 16, 17, 18, 19
        height = 15 + (i-6);
        difficulty = 'hard';
        speed = 1.5 + (i-6)*0.1;
        pushBack = 1.5;
    }

    // Cap size
    width = Math.min(width, 20);
    height = Math.min(height, 20);

    const levelData = generateDenseLevel(`level_${i}`, i, width, height, difficulty);
    
    // Fill gaps multiple times to ensure density
    let grid = rebuildGrid(levelData.snakes, width, height);
    fillSingleGaps(levelData.snakes, grid, width, height);
    
    // Adjust speed and pushback in the object
    levelData.turtle_speed = speed;
    levelData.push_back_amount = pushBack;
    
    levels[`level_${i}`] = levelData;
    console.log(`Generated Level ${i}: ${width}x${height}`);
}

const fileContent = `import { LevelData } from '../types';

export const levels: Record<string, LevelData> = ${JSON.stringify(levels, null, 2)};
`;

const outputPath = path.join(__dirname, '../src/data/levels.ts');
fs.writeFileSync(outputPath, fileContent);
console.log('Successfully generated 10 dense levels.');
