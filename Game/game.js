// Ludo Game Logic and UI Controller

const BOARD_PATH = [
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // 0..5
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // 6..11
  { r: 0, c: 7 },                                                                                // 12
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // 13..18
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // 19..24
  { r: 7, c: 14 },                                                                               // 25
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // 26..31
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // 32..37
  { r: 14, c: 7 },                                                                               // 38
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // 39..44
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // 45..50
  { r: 7, c: 0 }                                                                                 // 51
];

const START_CELLS = {
  red: 1,      // (6, 1)
  green: 14,   // (1, 8)
  yellow: 27,  // (8, 13)
  blue: 40     // (13, 6)
};

const SAFE_CELLS = [
  1, 14, 27, 40,  // Starting spaces
  9, 22, 35, 48   // Star spaces: (2,6), (6,12), (12,8), (8,2)
];

class LudoGame {
  constructor() {
    this.players = {
      red: { type: 'human', name: 'Player Red', active: true, finished: false, stats: { rolls: 0, sixes: 0, captures: 0, avgRoll: 0, totalRollValue: 0 } },
      green: { type: 'computer', name: 'AI Green', active: true, finished: false, stats: { rolls: 0, sixes: 0, captures: 0, avgRoll: 0, totalRollValue: 0 } },
      yellow: { type: 'computer', name: 'AI Yellow', active: true, finished: false, stats: { rolls: 0, sixes: 0, captures: 0, avgRoll: 0, totalRollValue: 0 } },
      blue: { type: 'computer', name: 'AI Blue', active: true, finished: false, stats: { rolls: 0, sixes: 0, captures: 0, avgRoll: 0, totalRollValue: 0 } }
    };
    this.playerOrder = ['red', 'green', 'yellow', 'blue'];
    this.activePlayers = []; // colors active in current session
    this.currentPlayerIdx = 0;
    
    this.diceValue = 1;
    this.diceRolled = false;
    this.rollStreak = 0; // tracking 6s
    this.moving = false;
    this.gameState = 'setup'; // setup, playing, finished
    this.winners = [];
    this.tokens = [];
    
    this.soundEnabled = true;
    this.aiSpeed = 1000; // time in ms between AI actions
    
    // Confetti animation settings
    this.confettiActive = false;
    this.confettiParticles = [];
    this.confettiColors = ['#f43f5e', '#10b981', '#fbbf24', '#3b82f6', '#a78bfa', '#f472b6'];
  }

  initGame(config) {
    this.gameState = 'playing';
    this.winners = [];
    this.rollStreak = 0;
    this.diceRolled = false;
    this.moving = false;
    
    // Apply configurations
    this.activePlayers = [];
    this.playerOrder.forEach(color => {
      const type = config[color];
      this.players[color].type = type;
      this.players[color].finished = false;
      this.players[color].active = (type !== 'none');
      
      // Reset statistics
      this.players[color].stats = {
        rolls: 0,
        sixes: 0,
        captures: 0,
        avgRoll: 0,
        totalRollValue: 0
      };

      if (this.players[color].active) {
        this.activePlayers.push(color);
      }
    });

    // Generate tokens
    this.tokens = [];
    this.activePlayers.forEach(color => {
      for (let i = 0; i < 4; i++) {
        this.tokens.push({
          id: `${color}-${i}`,
          player: color,
          index: i,
          steps: 0 // 0 = base, 1..52 = outer path, 53..57 = home stretch, 58 = home
        });
      }
    });

    // Set first player index
    this.currentPlayerIdx = 0;
    
    // Render Board
    this.createBoardElements();
    this.renderTokenPositions();
    this.updateHUD();
    this.addLog(`Game started with ${this.activePlayers.length} players!`, 'system');

    // Trigger AI first turn if first player is computer
    this.checkAITurn();
  }

  getCurrentPlayer() {
    return this.activePlayers[this.currentPlayerIdx];
  }

  // Create 15x15 cell structure
  createBoardElements() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    // Grid generation
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Base spans
        if (r < 6 && c < 6) {
          if (r === 0 && c === 0) {
            board.appendChild(this.createBaseCell('red'));
          }
          continue;
        }
        if (r < 6 && c >= 9) {
          if (r === 0 && c === 9) {
            board.appendChild(this.createBaseCell('green'));
          }
          continue;
        }
        if (r >= 9 && c < 6) {
          if (r === 9 && c === 0) {
            board.appendChild(this.createBaseCell('blue'));
          }
          continue;
        }
        if (r >= 9 && c >= 9) {
          if (r === 9 && c === 9) {
            board.appendChild(this.createBaseCell('yellow'));
          }
          continue;
        }
        
        // Center Home spanning 3x3
        if (r >= 6 && r < 9 && c >= 6 && c < 9) {
          if (r === 6 && c === 6) {
            board.appendChild(this.createCenterHomeCell());
          }
          continue;
        }

        // Standard 1x1 Cell
        const cell = document.createElement('div');
        cell.id = `cell-${r}-${c}`;
        cell.style.gridRow = r + 1;
        cell.style.gridColumn = c + 1;
        cell.className = 'cell path-cell';

        // Check if outer track path
        const pathIndex = BOARD_PATH.findIndex(p => p.r === r && p.c === c);
        if (pathIndex !== -1) {
          cell.setAttribute('data-path-idx', pathIndex);
          
          // Style safe and start zones
          if (SAFE_CELLS.includes(pathIndex)) {
            cell.classList.add('safe-cell');
          }
          
          if (pathIndex === START_CELLS.red) cell.classList.add('start-cell', 'red');
          if (pathIndex === START_CELLS.green) cell.classList.add('start-cell', 'green');
          if (pathIndex === START_CELLS.yellow) cell.classList.add('start-cell', 'yellow');
          if (pathIndex === START_CELLS.blue) cell.classList.add('start-cell', 'blue');
        }

        // Check if home stretch cell
        if (r === 7 && c >= 1 && c <= 5) {
          cell.className = 'cell home-stretch-cell red';
          cell.setAttribute('data-stretch-player', 'red');
          cell.setAttribute('data-stretch-idx', c - 1);
        } else if (c === 7 && r >= 1 && r <= 5) {
          cell.className = 'cell home-stretch-cell green';
          cell.setAttribute('data-stretch-player', 'green');
          cell.setAttribute('data-stretch-idx', r - 1);
        } else if (r === 7 && c >= 9 && c <= 13) {
          cell.className = 'cell home-stretch-cell yellow';
          cell.setAttribute('data-stretch-player', 'yellow');
          cell.setAttribute('data-stretch-idx', 13 - c);
        } else if (c === 7 && r >= 9 && r <= 13) {
          cell.className = 'cell home-stretch-cell blue';
          cell.setAttribute('data-stretch-player', 'blue');
          cell.setAttribute('data-stretch-idx', 13 - r);
        }

        // Add tokens holder
        const tokenHolder = document.createElement('div');
        tokenHolder.className = 'cell-tokens-container';
        tokenHolder.id = `tokens-container-${r}-${c}`;
        cell.appendChild(tokenHolder);

        board.appendChild(cell);
      }
    }
  }

  createBaseCell(color) {
    const base = document.createElement('div');
    base.className = `base-cell ${color}`;
    base.style.gridRow = color === 'red' || color === 'green' ? '1 / 7' : '10 / 16';
    base.style.gridColumn = color === 'red' || color === 'blue' ? '1 / 7' : '10 / 16';

    const panel = document.createElement('div');
    panel.className = 'base-inner-panel';

    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'base-slot';
      slot.id = `base-${color}-slot-${i}`;
      panel.appendChild(slot);
    }

    base.appendChild(panel);
    return base;
  }

  createCenterHomeCell() {
    const home = document.createElement('div');
    home.className = 'center-home';
    home.style.gridRow = '7 / 10';
    home.style.gridColumn = '7 / 10';

    const colors = ['red', 'green', 'yellow', 'blue'];
    colors.forEach(col => {
      const tri = document.createElement('div');
      tri.className = `home-triangle ${col}`;
      tri.id = `home-triangle-${col}`;
      
      const tokensHolder = document.createElement('div');
      tokensHolder.className = 'cell-tokens-container';
      tokensHolder.id = `tokens-container-home-${col}`;
      tri.appendChild(tokensHolder);
      
      home.appendChild(tri);
    });

    return home;
  }

  // Map steps to visual coordinate or base slot/home triangle ID
  getTokenPlacement(token) {
    const player = token.player;
    const steps = token.steps;

    if (steps === 0) {
      return { type: 'base', targetId: `base-${player}-slot-${token.index}` };
    }
    
    if (steps === 58) {
      return { type: 'home', targetId: `tokens-container-home-${player}` };
    }

    if (steps >= 1 && steps <= 52) {
      // Outer path coordinates
      const startIdx = START_CELLS[player];
      const pathIdx = (startIdx + steps - 1) % 52;
      const coord = BOARD_PATH[pathIdx];
      return { type: 'path', targetId: `tokens-container-${coord.r}-${coord.c}`, r: coord.r, c: coord.c };
    }

    if (steps >= 53 && steps <= 57) {
      // Home stretch coordinates
      const idx = steps - 53;
      let r, c;
      if (player === 'red') { r = 7; c = 1 + idx; }
      else if (player === 'green') { r = 1 + idx; c = 7; }
      else if (player === 'yellow') { r = 7; c = 13 - idx; }
      else if (player === 'blue') { r = 13 - idx; c = 7; }
      return { type: 'stretch', targetId: `tokens-container-${r}-${c}`, r, c };
    }
  }

  // Draw tokens inside cells, handle overlaps cleanly
  renderTokenPositions() {
    // Clear all existing token DOM elements
    document.querySelectorAll('.token').forEach(el => el.remove());
    
    // Group tokens by target visual container ID
    const placementGroups = {};
    this.tokens.forEach(token => {
      const placement = this.getTokenPlacement(token);
      if (!placementGroups[placement.targetId]) {
        placementGroups[placement.targetId] = [];
      }
      placementGroups[placement.targetId].push(token);
    });

    // Render grouped tokens
    Object.keys(placementGroups).forEach(targetId => {
      const container = document.getElementById(targetId);
      if (!container) return;

      container.innerHTML = '';
      const tokensInCell = placementGroups[targetId];

      // Update styling based on token count
      container.className = `cell-tokens-container stack-${Math.min(tokensInCell.length, 4)}`;

      tokensInCell.forEach(token => {
        const tokenEl = document.createElement('div');
        tokenEl.id = `token-${token.id}`;
        tokenEl.className = `token ${token.player}`;
        
        // Highlight selectable/movable tokens
        if (this.isTokenMovable(token)) {
          tokenEl.classList.add('movable');
          tokenEl.addEventListener('click', () => this.handleTokenClick(token));
        }

        container.appendChild(tokenEl);
      });
    });
  }

  isTokenMovable(token) {
    if (this.moving || !this.diceRolled) return false;
    
    const currentPlayer = this.getCurrentPlayer();
    if (token.player !== currentPlayer) return false;
    
    // Human check
    if (this.players[currentPlayer].type !== 'human') return false;

    return this.canMoveToken(token, this.diceValue);
  }

  canMoveToken(token, amount) {
    if (token.steps === 58) return false; // Finished
    
    if (token.steps === 0) {
      return amount === 6; // Needs a 6 to deploy
    }

    return token.steps + amount <= 58; // Cannot overshoot home
  }

  getMovableTokens(playerColor, amount) {
    return this.tokens.filter(t => t.player === playerColor && this.canMoveToken(t, amount));
  }

  // Start the 3D dice roll animation
  rollDice() {
    if (this.moving || this.diceRolled || this.gameState !== 'playing') return;

    this.diceRolled = true;
    const playerColor = this.getCurrentPlayer();
    this.players[playerColor].stats.rolls++;
    
    // Play rolling sound
    window.ludoAudio.playRoll();

    const diceCube = document.getElementById('dice-cube');
    diceCube.classList.add('rolling');

    // Generate random roll
    const roll = Math.floor(Math.random() * 6) + 1;
    this.diceValue = roll;
    
    this.players[playerColor].stats.totalRollValue += roll;
    this.players[playerColor].stats.avgRoll = (this.players[playerColor].stats.totalRollValue / this.players[playerColor].stats.rolls).toFixed(1);

    if (roll === 6) {
      this.players[playerColor].stats.sixes++;
    }

    // Rotations mappings
    const rotations = {
      1: { x: 0, y: 0 },
      2: { x: -90, y: 0 },
      3: { x: 0, y: 90 },
      4: { x: 0, y: -90 },
      5: { x: 90, y: 0 },
      6: { x: 180, y: 0 }
    };

    setTimeout(() => {
      diceCube.classList.remove('rolling');
      
      // Calculate random multiple rotations to make it look unique
      const extraX = (Math.floor(Math.random() * 3) + 2) * 360;
      const extraY = (Math.floor(Math.random() * 3) + 2) * 360;
      
      const rot = rotations[roll];
      diceCube.style.transform = `rotateX(${rot.x + extraX}deg) rotateY(${rot.y + extraY}deg)`;
      
      document.getElementById('roll-status').textContent = `${this.players[playerColor].name} rolled a ${roll}!`;
      this.addLog(`${this.players[playerColor].name} rolled a ${roll}`, playerColor);

      this.processRollResult();
    }, 800); // matches CSS roll animation duration
  }

  processRollResult() {
    const playerColor = this.getCurrentPlayer();
    const roll = this.diceValue;

    // Streak Check (Three 6s skipped)
    if (roll === 6) {
      this.rollStreak++;
      if (this.rollStreak === 3) {
        this.addLog(`Three 6s in a row! Turn skipped.`, 'system');
        window.ludoAudio.playBuzzer();
        setTimeout(() => this.passTurn(), 1000);
        return;
      }
    } else {
      this.rollStreak = 0;
    }

    const movable = this.getMovableTokens(playerColor, roll);

    if (movable.length === 0) {
      // No moves possible
      document.getElementById('roll-status').textContent = `No moves possible!`;
      this.addLog(`No moves possible for ${this.players[playerColor].name}`, 'system');
      window.ludoAudio.playBuzzer();
      
      setTimeout(() => {
        this.passTurn();
      }, 1000);
    } else {
      // Movable options exist
      this.renderTokenPositions();
      
      if (this.players[playerColor].type === 'computer') {
        // AI Turn
        setTimeout(() => this.executeAIMove(movable), this.aiSpeed);
      } else {
        // Human interactive highlight helper
        this.highlightMovableTokens(movable);
      }
    }
  }

  highlightMovableTokens(movable) {
    movable.forEach(token => {
      const el = document.getElementById(`token-${token.id}`);
      if (el) el.classList.add('movable');
    });
  }

  handleTokenClick(token) {
    if (!this.isTokenMovable(token)) return;
    this.moveToken(token, this.diceValue);
  }

  // Animate token along the grid cells
  moveToken(token, amount) {
    this.moving = true;
    this.diceRolled = false;
    
    // Clear highlights
    document.querySelectorAll('.token').forEach(el => el.classList.remove('movable'));
    
    const targetSteps = token.steps === 0 ? 1 : token.steps + amount;
    
    this.moveTokenStepByStep(token, targetSteps, () => {
      this.moving = false;
      this.checkLandingRules(token);
    });
  }

  moveTokenStepByStep(token, finalTarget, callback) {
    if (token.steps === finalTarget) {
      callback();
      return;
    }

    // Deploy jump vs walk
    if (token.steps === 0) {
      token.steps = 1;
    } else {
      token.steps++;
    }

    this.renderTokenPositions();
    window.ludoAudio.playStep();

    // Visual bounce/hop animation
    const tokenEl = document.getElementById(`token-${token.id}`);
    if (tokenEl) {
      tokenEl.classList.add('hop-animation');
      setTimeout(() => {
        tokenEl.classList.remove('hop-animation');
      }, 150);
    }

    setTimeout(() => {
      this.moveTokenStepByStep(token, finalTarget, callback);
    }, 200);
  }

  checkLandingRules(token) {
    const player = token.player;
    const finalSteps = token.steps;
    const finalPlacement = this.getTokenPlacement(token);
    
    let extraRoll = false;

    // Case 1: Token finished (reaches 58)
    if (finalSteps === 58) {
      window.ludoAudio.playHome();
      this.addLog(`${this.players[player].name}'s piece reached HOME!`, player);
      
      // Check if player won the game (all 4 tokens home)
      const finishedCount = this.tokens.filter(t => t.player === player && t.steps === 58).length;
      if (finishedCount === 4) {
        this.players[player].finished = true;
        this.winners.push(player);
        this.addLog(`🏆 ${this.players[player].name} finished in position #${this.winners.length}!`, 'system');
        window.ludoAudio.playWin();
        this.triggerWinnerConfetti();

        // Check if only 1 active player remains or everyone finished
        const activeRemaining = this.activePlayers.filter(color => !this.players[color].finished);
        if (activeRemaining.length <= 1) {
          this.endGame();
          return;
        }
      }
      
      // Finishing a piece grants an extra roll
      extraRoll = true;
    }

    // Case 2: Capture Opponent
    if (finalPlacement.type === 'path' && !SAFE_CELLS.includes(BOARD_PATH.findIndex(p => p.r === finalPlacement.r && p.c === finalPlacement.c))) {
      // Find opponents in the same cell
      const cellIdx = BOARD_PATH.findIndex(p => p.r === finalPlacement.r && p.c === finalPlacement.c);
      
      const opponents = this.tokens.filter(t => 
        t.player !== player && 
        t.steps >= 1 && 
        t.steps <= 52 && 
        ((START_CELLS[t.player] + t.steps - 1) % 52) === cellIdx
      );

      if (opponents.length > 0) {
        // Landed on opponent!
        opponents.forEach(enemy => {
          this.captureToken(enemy);
        });
        
        this.players[player].stats.captures++;
        this.addLog(`${this.players[player].name} captured an opponent piece!`, player);
        
        // Capture grants extra roll
        extraRoll = true;
      }
    }

    // Case 3: Check if roll was a 6
    if (this.diceValue === 6) {
      extraRoll = true;
    }

    this.renderTokenPositions();
    this.updateHUD();

    if (extraRoll && !this.players[player].finished) {
      this.addLog(`Extra roll granted to ${this.players[player].name}`, 'system');
      this.diceRolled = false;
      this.checkAITurn();
    } else {
      this.rollStreak = 0;
      this.passTurn();
    }
  }

  captureToken(enemyToken) {
    const enemyEl = document.getElementById(`token-${enemyToken.id}`);
    if (enemyEl) {
      enemyEl.classList.add('captured-animation');
    }
    
    window.ludoAudio.playCapture();
    
    // Add screen shake effect
    const boardOuter = document.querySelector('.board-outer-container');
    boardOuter.classList.add('shake-screen');
    setTimeout(() => boardOuter.classList.remove('shake-screen'), 400);

    enemyToken.steps = 0; // Back to base
  }

  passTurn() {
    if (this.gameState !== 'playing') return;

    this.diceRolled = false;
    
    // Cycle to next active, unfinished player
    let attempts = 0;
    do {
      this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.activePlayers.length;
      attempts++;
    } while (this.players[this.getCurrentPlayer()].finished && attempts < this.activePlayers.length);

    this.updateHUD();
    document.getElementById('roll-status').textContent = 'Roll the dice!';

    this.checkAITurn();
  }

  checkAITurn() {
    const currentPlayer = this.getCurrentPlayer();
    if (this.players[currentPlayer].type === 'computer' && this.gameState === 'playing') {
      // Auto Roll for AI
      setTimeout(() => {
        this.rollDice();
      }, 800);
    }
  }

  // AI Decision Engine using heuristics
  executeAIMove(movable) {
    if (movable.length === 0) {
      this.passTurn();
      return;
    }

    // Heuristic Scorer
    const scores = movable.map(token => {
      let score = 10; // Base score
      const player = token.player;
      
      const amount = this.diceValue;
      const currentSteps = token.steps;
      const targetSteps = currentSteps === 0 ? 1 : currentSteps + amount;

      // Rule-out releases from base
      if (currentSteps === 0 && amount === 6) {
        score += 100; // High priority to deploy pieces
      }

      // Reaching home is awesome
      if (targetSteps === 58) {
        score += 150;
      }

      const placement = this.getTokenPlacement({ ...token, steps: targetSteps });

      // Check capture opportunities at landing site
      if (placement.type === 'path' && !SAFE_CELLS.includes(BOARD_PATH.findIndex(p => p.r === placement.r && p.c === placement.c))) {
        const landingIdx = BOARD_PATH.findIndex(p => p.r === placement.r && p.c === placement.c);
        
        const opponentsCount = this.tokens.filter(t => 
          t.player !== player && 
          t.steps >= 1 && 
          t.steps <= 52 && 
          ((START_CELLS[t.player] + t.steps - 1) % 52) === landingIdx
        ).length;

        if (opponentsCount > 0) {
          score += 200; // Maximum priority to capture
        }
      }

      // Landing on safe zones
      if (placement.type === 'path') {
        const landingIdx = BOARD_PATH.findIndex(p => p.r === placement.r && p.c === placement.c);
        if (SAFE_CELLS.includes(landingIdx)) {
          score += 35;
        }
      }

      // Escaping danger (is there an opponent behind this token within 6 cells?)
      if (currentSteps >= 1 && currentSteps <= 52) {
        const startIdx = START_CELLS[player];
        const currentIdx = (startIdx + currentSteps - 1) % 52;
        
        const dangerousEnemy = this.tokens.find(t => {
          if (t.player === player || t.steps < 1 || t.steps > 52) return false;
          const enemyIdx = (START_CELLS[t.player] + t.steps - 1) % 52;
          
          // distance behind
          const dist = (currentIdx - enemyIdx + 52) % 52;
          return dist > 0 && dist <= 6;
        });

        if (dangerousEnemy) {
          score += 55; // Escape danger!
        }
      }

      // Landing into danger zone
      if (placement.type === 'path') {
        const targetIdx = BOARD_PATH.findIndex(p => p.r === placement.r && p.c === placement.c);
        const dangerEnemy = this.tokens.find(t => {
          if (t.player === player || t.steps < 1 || t.steps > 52) return false;
          const enemyIdx = (START_CELLS[t.player] + t.steps - 1) % 52;
          const dist = (targetIdx - enemyIdx + 52) % 52;
          return dist > 0 && dist <= 6;
        });

        if (dangerEnemy) {
          score -= 25; // Try to avoid landing right in front of an enemy
        }
      }

      // Progress bias (prefer pushing further tokens home)
      score += Math.floor(targetSteps * 0.35);

      return { token, score };
    });

    // Select token with highest score
    scores.sort((a, b) => b.score - a.score);
    const chosen = scores[0].token;

    // Execute Move
    setTimeout(() => {
      this.moveToken(chosen, this.diceValue);
    }, 400);
  }

  endGame() {
    this.gameState = 'finished';
    this.addLog(`🎮 GAME OVER!`, 'system');
    
    // Open Winner Modal
    const modal = document.getElementById('winner-modal');
    const modalDesc = document.getElementById('winner-desc');
    const statsBody = document.getElementById('stats-table-body');
    
    // Sort all active players by finish condition
    const finalRanks = [...this.winners];
    this.activePlayers.forEach(color => {
      if (!finalRanks.includes(color)) {
        finalRanks.push(color);
      }
    });

    // Fill table
    statsBody.innerHTML = '';
    finalRanks.forEach((color, idx) => {
      const player = this.players[color];
      const finishedPieces = this.tokens.filter(t => t.player === color && t.steps === 58).length;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>#${idx + 1}</td>
        <td>
          <div class="stats-player">
            <span class="player-dot ${color}"></span>
            ${player.name}
          </div>
        </td>
        <td>${finishedPieces}/4</td>
        <td>${player.stats.rolls}</td>
        <td>${player.stats.captures}</td>
        <td>${player.stats.avgRoll}</td>
      `;
      statsBody.appendChild(row);
    });

    const winnerName = this.players[finalRanks[0]].name;
    document.getElementById('winner-title-text').textContent = `${winnerName} Wins!`;
    modal.classList.add('active');
    
    this.triggerWinnerConfetti();
  }

  updateHUD() {
    const activeColor = this.getCurrentPlayer();
    
    // Current player highlight
    const turnNameEl = document.getElementById('turn-name-display');
    turnNameEl.textContent = this.players[activeColor].name;
    turnNameEl.className = `turn-name turn-${activeColor}`;

    const diceContainer = document.getElementById('dice-interactive-container');
    if (this.players[activeColor].type === 'human') {
      diceContainer.style.pointerEvents = 'auto';
      diceContainer.style.opacity = '1';
    } else {
      diceContainer.style.pointerEvents = 'none';
      diceContainer.style.opacity = '0.7';
    }

    // Highlight Player Panels
    document.querySelectorAll('.player-card').forEach(card => {
      card.classList.remove('active');
    });
    
    const activeCard = document.getElementById(`card-${activeColor}`);
    if (activeCard) activeCard.classList.add('active');

    // Update Player Panel mini-token indicators
    this.activePlayers.forEach(color => {
      const card = document.getElementById(`card-${color}`);
      if (!card) return;

      if (this.players[color].finished) {
        card.classList.add('finished');
      } else {
        card.classList.remove('finished');
      }

      const dots = card.querySelectorAll('.mini-token-indicator');
      const playerTokens = this.tokens.filter(t => t.player === color);
      
      playerTokens.forEach((t, i) => {
        dots[i].className = 'mini-token-indicator';
        if (t.steps === 58) {
          dots[i].classList.add('home');
        } else if (t.steps > 0) {
          dots[i].classList.add('active');
        }
      });
    });
  }

  addLog(message, type = 'system') {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.textContent = `[${time}] ${message}`;
    
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
  }

  // Confetti celebration drawing
  triggerWinnerConfetti() {
    if (this.confettiActive) return;
    this.confettiActive = true;
    
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Spawn particles
    this.confettiParticles = [];
    for (let i = 0; i < 150; i++) {
      this.confettiParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    const drawConfetti = () => {
      if (!this.confettiActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let alive = false;
      this.confettiParticles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx/3) * 15;

        if (p.y <= canvas.height) {
          alive = true;
        } else {
          // Recycle
          if (this.gameState === 'finished') {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (alive || this.gameState === 'finished') {
        requestAnimationFrame(drawConfetti);
      } else {
        this.confettiActive = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    drawConfetti();
  }

  stopConfetti() {
    this.confettiActive = false;
  }
}

// Global Game Reference
window.ludoGame = new LudoGame();

// UI Triggers
function startNewGame() {
  const config = {
    red: document.getElementById('select-red').value,
    green: document.getElementById('select-green').value,
    yellow: document.getElementById('select-yellow').value,
    blue: document.getElementById('select-blue').value
  };

  // Count active players
  const activeCount = Object.values(config).filter(val => val !== 'none').length;
  if (activeCount < 2) {
    alert('Please select at least 2 active players!');
    return;
  }

  // Switch views
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('game-hud').style.display = 'flex';
  
  // Show base cards for active players
  const colors = ['red', 'green', 'yellow', 'blue'];
  colors.forEach(col => {
    const card = document.getElementById(`card-${col}`);
    if (config[col] !== 'none') {
      card.style.display = 'flex';
      card.querySelector('.player-card-type').textContent = config[col] === 'human' ? 'HUMAN' : 'AI';
    } else {
      card.style.display = 'none';
    }
  });

  window.ludoGame.initGame(config);
}

function resetToSetup() {
  window.ludoGame.gameState = 'setup';
  window.ludoGame.stopConfetti();
  document.getElementById('winner-modal').classList.remove('active');
  document.getElementById('game-hud').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'flex';
}

function showRules() {
  document.getElementById('rules-modal').classList.add('active');
}

function closeRules() {
  document.getElementById('rules-modal').classList.remove('active');
}

function toggleAudio() {
  const isEnabled = window.ludoGame.soundEnabled;
  window.ludoGame.soundEnabled = !isEnabled;
  window.ludoAudio.toggle(!isEnabled);
  
  const icon = document.getElementById('audio-icon');
  icon.textContent = isEnabled ? '🔇' : '🔊';
}

// DOM Setup on load
document.addEventListener('DOMContentLoaded', () => {
  // Bind Dice interaction
  document.getElementById('dice-cube').addEventListener('click', () => {
    window.ludoGame.rollDice();
  });
  
  // Listen for space key to roll dice
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      const activeColor = window.ludoGame.getCurrentPlayer();
      if (activeColor && window.ludoGame.players[activeColor].type === 'human' && !window.ludoGame.diceRolled && !window.ludoGame.moving) {
        window.ludoGame.rollDice();
      }
    }
  });
});
