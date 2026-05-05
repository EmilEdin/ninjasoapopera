const SingUI = {
    canvas: null,
    ctx: null,
    pitchHistory: [], // Stores previous pitches to draw the scrolling line
    isDrawing: false,

    init: function() {
        this.canvas = document.getElementById("pitchGraph");
        this.ctx = this.canvas.getContext("2d");
        
        // Fill our history array with silence (-1) so the graph starts blank
        for (let i = 0; i < this.canvas.width; i++) {
            this.pitchHistory.push(-1);
        }
    },

    start: function() {
        this.isDrawing = true;
        this.drawLoop();
    },

    drawLoop: function() {
        if (!this.isDrawing) return;

        // 1. Get the latest pitch from the engine
        const currentPitch = SingEngine.getCurrentPitch();

        // 2. Scroll the history: Remove the oldest pitch (left), add the newest (right)
        this.pitchHistory.shift();
        this.pitchHistory.push(currentPitch);

        // 3. Clear the canvas for the new frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#222";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 4. Draw the pitch line
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#00ff00"; // Neon green
        this.ctx.lineWidth = 3;

        for (let i = 0; i < this.pitchHistory.length; i++) {
            const pitch = this.pitchHistory[i];
            if (pitch > 0) {
                // Map the pitch (Hz) to a Y coordinate on the screen.
                // We assume a rough vocal range of 100Hz (low) to 600Hz (high).
                let y = this.canvas.height - ((pitch - 100) / 500 * this.canvas.height);
                this.ctx.lineTo(i, Math.max(0, Math.min(this.canvas.height, y)));
            } else {
                this.ctx.moveTo(i, this.canvas.height); // Jump to bottom if silence
            }
        }
        this.ctx.stroke();

        // 5. Ask the browser to run this function again on the next visual frame (~60 FPS)
        requestAnimationFrame(() => this.drawLoop());
    }
};