class AllFoursScorekeeper {
    constructor() {
        this.gameState = {
            players: [],
            targetScore: 7,
            rounds: [],
            currentPlayerCount: 4,
            selectedCell: null
        };
        
        this.init();
    }
    
    init() {
        this.loadGameState();
        this.bindEvents();
        this.renderSetupScreen();
        this.playSound('card-sound');
    }
    
    bindEvents() {
        // Setup screen events
        document.querySelectorAll('.player-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePlayerCountChange(e));
        });
        
        document.querySelectorAll('.target-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTargetChange(e));
        });
        
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        
        // Game screen events
        document.getElementById('back-to-setup').addEventListener('click', () => this.showSetupScreen());
        document.getElementById('add-round').addEventListener('click', () => this.addRound());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoLastEntry());
        document.getElementById('clear-game').addEventListener('click', () => this.clearGame());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('change-target').addEventListener('click', () => this.changeTarget());
        
        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.hideModal());
        document.getElementById('apply-points').addEventListener('click', () => this.applyPoints());
        
        // Quick buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickAdd(e));
        });
        
        // Custom input controls
        document.querySelector('.num-btn.minus').addEventListener('click', () => this.adjustPoints(-1));
        document.querySelector('.num-btn.plus').addEventListener('click', () => this.adjustPoints(1));
        
        document.querySelectorAll('.point-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePresetPoints(e));
        });
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePresetInput(e));
        });
        
        document.getElementById('points-input').addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            if (value < 0) value = 0;
            if (value > 100) value = 100;
            e.target.value = value;
        });
        
        // Custom target input
        document.getElementById('custom-target').addEventListener('change', (e) => {
            this.gameState.targetScore = parseInt(e.target.value) || 7;
            this.updateTargetDisplay();
        });
        
        // Player name inputs
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`player${i}`).addEventListener('input', (e) => {
                this.savePlayerNames();
            });
        }
        
        // Auto-save on blur
        document.addEventListener('blur', () => this.saveGameState(), true);
    }
    
    handlePlayerCountChange(e) {
        const count = parseInt(e.target.dataset.count);
        this.gameState.currentPlayerCount = count;
        
        // Update UI
        document.querySelectorAll('.player-option').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Show/hide player inputs
        document.getElementById('player3-container').style.display = count >= 3 ? 'block' : 'none';
        document.getElementById('player4-container').style.display = count >= 4 ? 'block' : 'none';
        
        this.playSound('click-sound');
    }
    
    handleTargetChange(e) {
        const target = parseInt(e.target.dataset.target);
        this.gameState.targetScore = target;
        document.getElementById('custom-target').value = target;
        
        // Update UI
        document.querySelectorAll('.target-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        this.updateTargetDisplay();
        this.playSound('click-sound');
    }
    
    startGame() {
        // Get player names
        this.gameState.players = [];
        const playerCount = this.gameState.currentPlayerCount;
        
        for (let i = 1; i <= playerCount; i++) {
            const nameInput = document.getElementById(`player${i}`);
            const name = nameInput.value.trim() || `Player ${i}`;
            this.gameState.players.push({
                id: i,
                name: name,
                total: 0,
                isWinner: false
            });
        }
        
        // Initialize rounds
        this.gameState.rounds = [
            this.createEmptyRound()
        ];
        
        // Switch to game screen
        this.showGameScreen();
        this.renderGameScreen();
        this.saveGameState();
        this.playSound('card-sound');
    }
    
    createEmptyRound() {
        const round = {};
        this.gameState.players.forEach(player => {
            round[player.id] = 0;
        });
        return round;
    }
    
    showSetupScreen() {
        document.getElementById('setup-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
        this.playSound('click-sound');
    }
    
    showGameScreen() {
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }
    
    renderSetupScreen() {
        // Set active player count
        document.querySelectorAll('.player-option').forEach(btn => {
            btn.classList.toggle('active', 
                parseInt(btn.dataset.count) === this.gameState.currentPlayerCount
            );
        });
        
        // Set player input visibility
        document.getElementById('player3-container').style.display = 
            this.gameState.currentPlayerCount >= 3 ? 'block' : 'none';
        document.getElementById('player4-container').style.display = 
            this.gameState.currentPlayerCount >= 4 ? 'block' : 'none';
        
        // Set target score
        document.getElementById('custom-target').value = this.gameState.targetScore;
        
        // Set active target button
        document.querySelectorAll('.target-btn').forEach(btn => {
            btn.classList.toggle('active', 
                parseInt(btn.dataset.target) === this.gameState.targetScore
            );
        });
    }
    
    renderGameScreen() {
        this.renderPlayerHeaders();
        this.renderRounds();
        this.renderTotals();
        this.updateTargetDisplay();
        this.checkForWinner();
    }
    
    renderPlayerHeaders() {
        const headersRow = document.getElementById('player-headers');
        headersRow.innerHTML = '';
        
        // Add round header cell
        const roundHeader = document.createElement('th');
        roundHeader.className = 'round-header';
        roundHeader.textContent = 'Round';
        headersRow.appendChild(roundHeader);
        
        // Add player headers
        this.gameState.players.forEach(player => {
            const th = document.createElement('th');
            th.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-score" id="total-${player.id}">${player.total}</span>
            `;
            headersRow.appendChild(th);
        });
    }
    
    renderRounds() {
        const tbody = document.getElementById('score-body');
        tbody.innerHTML = '';
        
        this.gameState.rounds.forEach((round, roundIndex) => {
            const row = document.createElement('tr');
            
            // Round number cell
            const roundCell = document.createElement('td');
            roundCell.className = 'round-number';
            roundCell.textContent = `Round ${roundIndex + 1}`;
            row.appendChild(roundCell);
            
            // Score cells for each player
            this.gameState.players.forEach(player => {
                const td = document.createElement('td');
                const score = round[player.id] || 0;
                td.className = `score-cell ${score > 0 ? 'filled' : 'empty'}`;
                td.dataset.playerId = player.id;
                td.dataset.roundIndex = roundIndex;
                td.textContent = score > 0 ? score : '';
                td.addEventListener('click', () => this.openScoreModal(player.id, roundIndex));
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        });
    }
    
    renderTotals() {
        const totalRow = document.getElementById('total-row');
        totalRow.innerHTML = '';
        
        // Total label
        const totalLabel = document.createElement('td');
        totalLabel.textContent = 'TOTAL';
        totalLabel.style.fontWeight = '800';
        totalRow.appendChild(totalLabel);
        
        // Total for each player
        this.gameState.players.forEach(player => {
            const td = document.createElement('td');
            td.id = `total-display-${player.id}`;
            td.textContent = player.total;
            
            if (player.isWinner) {
                td.classList.add('winner');
            }
            
            totalRow.appendChild(td);
        });
    }
    
    openScoreModal(playerId, roundIndex) {
        this.gameState.selectedCell = { playerId, roundIndex };
        
        const player = this.gameState.players.find(p => p.id === playerId);
        document.getElementById('modal-player-name').textContent = player.name;
        
        const currentScore = this.gameState.rounds[roundIndex][playerId] || 0;
        document.getElementById('points-input').value = currentScore;
        
        document.getElementById('score-modal').classList.add('active');
        this.playSound('click-sound');
    }
    
    hideModal() {
        document.getElementById('score-modal').classList.remove('active');
        this.playSound('click-sound');
    }
    
    applyPoints() {
        const { playerId, roundIndex } = this.gameState.selectedCell;
        const points = parseInt(document.getElementById('points-input').value) || 0;
        
        if (points >= 0) {
            this.gameState.rounds[roundIndex][playerId] = points;
            this.updateTotals();
            this.renderRounds();
            this.renderTotals();
            this.checkForWinner();
            this.saveGameState();
            this.hideModal();
            this.playSound('click-sound');
        }
    }
    
    handleQuickAdd(e) {
        const points = parseInt(e.target.dataset.points);
        const playerId = Math.floor(Math.random() * this.gameState.players.length) + 1;
        const roundIndex = this.gameState.rounds.length - 1;
        
        this.openScoreModal(playerId, roundIndex);
        document.getElementById('points-input').value = points;
        this.playSound('click-sound');
    }
    
    handlePresetPoints(e) {
        const points = parseInt(e.target.dataset.points);
        document.getElementById('points-input').value = points;
        this.playSound('click-sound');
    }
    
    handlePresetInput(e) {
        const points = parseInt(e.target.dataset.preset);
        const current = parseInt(document.getElementById('points-input').value) || 0;
        document.getElementById('points-input').value = current + points;
        this.playSound('click-sound');
    }
    
    adjustPoints(change) {
        const input = document.getElementById('points-input');
        let value = parseInt(input.value) || 0;
        value += change;
        if (value < 0) value = 0;
        if (value > 100) value = 100;
        input.value = value;
        this.playSound('click-sound');
    }
    
    addRound() {
        this.gameState.rounds.push(this.createEmptyRound());
        this.renderRounds();
        this.saveGameState();
        this.playSound('card-sound');
    }
    
    undoLastEntry() {
        if (this.gameState.rounds.length > 0) {
            const lastRound = this.gameState.rounds[this.gameState.rounds.length - 1];
            let hasScores = false;
            
            // Check if last round has any scores
            for (const playerId in lastRound) {
                if (lastRound[playerId] > 0) {
                    hasScores = true;
                    lastRound[playerId] = 0; // Reset scores
                }
            }
            
            if (hasScores) {
                this.updateTotals();
                this.renderRounds();
                this.renderTotals();
                this.saveGameState();
                this.playSound('click-sound');
            } else if (this.gameState.rounds.length > 1) {
                // If no scores and more than one round, remove the empty round
                this.gameState.rounds.pop();
                this.renderRounds();
                this.saveGameState();
                this.playSound('click-sound');
            }
        }
    }
    
    updateTotals() {
        // Reset totals
        this.gameState.players.forEach(player => {
            player.total = 0;
            player.isWinner = false;
        });
        
        // Sum up all rounds
        this.gameState.rounds.forEach(round => {
            this.gameState.players.forEach(player => {
                player.total += round[player.id] || 0;
            });
        });
        
        // Update header totals
        this.gameState.players.forEach(player => {
            const totalElement = document.getElementById(`total-${player.id}`);
            if (totalElement) {
                totalElement.textContent = player.total;
            }
        });
    }
    
    checkForWinner() {
        let winnerFound = false;
        
        this.gameState.players.forEach(player => {
            player.isWinner = player.total >= this.gameState.targetScore;
            if (player.isWinner) {
                winnerFound = true;
            }
        });
        
        if (winnerFound) {
            this.renderTotals(); // Update UI to show winners
            this.triggerVictory();
        }
    }
    
    triggerVictory() {
        // Play victory sound
        this.playSound('win-sound');
        
        // Launch confetti
        this.launchConfetti();
        
        // Show alert
        const winners = this.gameState.players.filter(p => p.isWinner);
        if (winners.length === 1) {
            setTimeout(() => {
                alert(`🎉 ${winners[0].name} wins with ${winners[0].total} points! 🎉`);
            }, 500);
        } else {
            setTimeout(() => {
                const names = winners.map(w => w.name).join(' and ');
                alert(`🎉 ${names} tie with ${winners[0].total} points! 🎉`);
            }, 500);
        }
    }
    
    launchConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        // Add more confetti bursts
        setTimeout(() => confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        }), 250);
        
        setTimeout(() => confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        }), 400);
    }
    
    clearGame() {
        if (confirm('Are you sure you want to clear all scores? This cannot be undone.')) {
            this.gameState.rounds = [this.createEmptyRound()];
            this.gameState.players.forEach(player => {
                player.total = 0;
                player.isWinner = false;
            });
            this.renderRounds();
            this.renderTotals();
            this.saveGameState();
            this.playSound('card-sound');
        }
    }
    
    newGame() {
        if (confirm('Start a new game with the same players?')) {
            this.gameState.rounds = [this.createEmptyRound()];
            this.gameState.players.forEach(player => {
                player.total = 0;
                player.isWinner = false;
            });
            this.renderRounds();
            this.renderTotals();
            this.saveGameState();
            this.playSound('card-sound');
        }
    }
    
    changeTarget() {
        const newTarget = prompt('Enter new target score:', this.gameState.targetScore);
        if (newTarget && !isNaN(newTarget) && parseInt(newTarget) > 0) {
            this.gameState.targetScore = parseInt(newTarget);
            document.getElementById('custom-target').value = this.gameState.targetScore;
            this.updateTargetDisplay();
            this.checkForWinner();
            this.saveGameState();
        }
    }
    
    updateTargetDisplay() {
        document.getElementById('current-target').textContent = this.gameState.targetScore;
    }
    
    savePlayerNames() {
        // This will be called automatically when names are changed
        this.saveGameState();
    }
    
    saveGameState() {
        const state = {
            players: this.gameState.players,
            targetScore: this.gameState.targetScore,
            rounds: this.gameState.rounds,
            currentPlayerCount: this.gameState.currentPlayerCount,
            playerNames: {}
        };
        
        // Save player names
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`player${i}`);
            if (input) {
                state.playerNames[`player${i}`] = input.value;
            }
        }
        
        localStorage.setItem('allFoursGame', JSON.stringify(state));
        
        // Show save indicator
        const saveIndicator = document.querySelector('.auto-save');
        saveIndicator.style.opacity = '1';
        setTimeout(() => {
            saveIndicator.style.opacity = '0.7';
        }, 1000);
    }
    
    loadGameState() {
        const saved = localStorage.getItem('allFoursGame');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                
                if (state.players) this.gameState.players = state.players;
                if (state.targetScore) this.gameState.targetScore = state.targetScore;
                if (state.rounds) this.gameState.rounds = state.rounds;
                if (state.currentPlayerCount) this.gameState.currentPlayerCount = state.currentPlayerCount;
                
                // Restore player names
                if (state.playerNames) {
                    for (const key in state.playerNames) {
                        const input = document.getElementById(key);
                        if (input) {
                            input.value = state.playerNames[key];
                        }
                    }
                }
                
                // If we have a saved game, show game screen
                if (state.players && state.players.length > 0) {
                    this.showGameScreen();
                    this.renderGameScreen();
                }
            } catch (e) {
                console.error('Error loading saved game:', e);
            }
        }
    }
    
    playSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AllFoursScorekeeper();
});
