const SingUI = {
    canvas: null,
    ctx: null,
    pitchHistory: [], // Stores previous pitches to draw the scrolling line
    isDrawing: false,
    smoothedPitch: -1, // NEW: Helps prevent sudden jumps
    startTime: 0,
    targetPitchHistory: [], // NEW: Stores the target melody pitch over time

    init: function() {
        this.canvas = document.getElementById("pitchGraph");
        this.ctx = this.canvas.getContext("2d");
        
        // Fill our history array with silence (-1) so the graph starts blank
        for (let i = 0; i < this.canvas.width; i++) {
            this.pitchHistory.push(-1);
            this.targetPitchHistory.push(-1);
        }
    },

    start: function() {
        this.isDrawing = true;
        this.startTime = Date.now();
        this.drawLoop();
    },

    drawLoop: function() {
        if (!this.isDrawing) return;

        // 1. Get the latest pitch from the engine
        let currentPitch = SingEngine.getCurrentPitch();

        // --- NEW: SMOOTHING THE PITCH ---
        if (currentPitch > 0) {
            // If we have a previous pitch, and the jump isn't a massive error (>100Hz)
            if (this.smoothedPitch > 0 && Math.abs(currentPitch - this.smoothedPitch) < 100) {
                // Glide 70% from old pitch, 30% towards new pitch
                currentPitch = (this.smoothedPitch * 0.7) + (currentPitch * 0.3);
            }
            this.smoothedPitch = currentPitch;
        } else {
            this.smoothedPitch = -1; // Reset on silence
        }

        // 2. Scroll the history: Remove the oldest pitch (left), add the newest (right)
        this.pitchHistory.shift();
        this.pitchHistory.push(currentPitch);

        // 3. Clear the canvas for the new frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#222";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // --- NEW: DRAW FREQUENCY GUIDE LINES ---
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 1;
        this.ctx.font = "12px Arial";
        this.ctx.fillStyle = "#888";
        // FIXED: Expanded the frequency range! A4 is 440Hz, C5 is 523Hz, C6 is 1046Hz.
        const minFreq = 100;   
        const maxFreq = 1200;  
        const range = maxFreq - minFreq;

        [200, 400, 600, 800, 1000].forEach(freq => {
            let y = this.canvas.height - ((freq - minFreq) / range * this.canvas.height);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
            this.ctx.fillText(freq + "Hz", 10, y - 5);
        });

        // --- NEW: DRAW THE TARGET MELODY LINE ---
        const elapsedTimeInSeconds = (Date.now() - this.startTime) / 1000;
        let currentTargetPitch = SingEngine.getTargetPitchAtTime(elapsedTimeInSeconds);
        
        // Scroll the target history
        this.targetPitchHistory.shift();
        this.targetPitchHistory.push(currentTargetPitch);

        // FIXED: Draw the blue line as a continuous scrolling graph
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(0, 150, 255, 0.8)"; // Bright Blue Line
        this.ctx.lineWidth = 5;
        let isTracingTarget = false;
        for (let i = 0; i < this.targetPitchHistory.length; i++) {
            const tPitch = this.targetPitchHistory[i];
            if (tPitch > 0) {
                let y = this.canvas.height - ((tPitch - minFreq) / range * this.canvas.height);
                if (!isTracingTarget) {
                    this.ctx.moveTo(i, y);
                    isTracingTarget = true;
                } else {
                    this.ctx.lineTo(i, y);
                }
            } else {
                isTracingTarget = false;
            }
        }
        this.ctx.stroke();

        // --- NEW: DRAW KARAOKE LYRICS ---
        const activeLyrics = SingEngine.getCurrentLyrics(elapsedTimeInSeconds);
        
        if (activeLyrics) {
            this.ctx.font = "bold 32px Arial";
            
            // 1. Calculate the total width of the lyric line so we can perfectly center it
            let totalWidth = 0;
            activeLyrics.syllables.forEach(syl => {
                totalWidth += this.ctx.measureText(syl.text).width;
            });

            // 2. Determine our starting position coordinates
            let currentX = (this.canvas.width / 2) - (totalWidth / 2);
            let startY = 40; // Near the top of the canvas
            this.ctx.textAlign = "left"; // Draw text left-to-right to piece the sentence together
            
            // 3. Draw each syllable and highlight it if its time has come!
            activeLyrics.syllables.forEach(syl => {
                if (elapsedTimeInSeconds >= syl.time) {
                    this.ctx.fillStyle = "#00ff00"; // Neon Green for active sung words!
                } else {
                    this.ctx.fillStyle = "#ffffff"; // White for upcoming words
                }
                this.ctx.fillText(syl.text, currentX, startY);
                currentX += this.ctx.measureText(syl.text).width; // Shift X to draw the next word
            });
        }

        // 4. Draw the pitch line
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#00ff00"; // Neon green
        this.ctx.lineWidth = 3;
        let isTracingPitch = false;
        
        for (let i = 0; i < this.pitchHistory.length; i++) {
            const pitch = this.pitchHistory[i];
            if (pitch > 0) {
                // Map the pitch using our new realistic vocal range bounds
                let y = this.canvas.height - ((pitch - minFreq) / range * this.canvas.height);
                y = Math.max(0, Math.min(this.canvas.height, y)); // Keep inside canvas
                
                if (!isTracingPitch) {
                    this.ctx.moveTo(i, y);
                    isTracingPitch = true;
                } else {
                    this.ctx.lineTo(i, y);
                }
            } else {
                isTracingPitch = false; // Break the line on silence
            }
        }
        this.ctx.stroke();

        // 5. Ask the browser to run this function again on the next visual frame (~60 FPS)
        requestAnimationFrame(() => this.drawLoop());
    }
};