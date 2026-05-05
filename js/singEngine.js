        // We create a global 'SingEngine' object so sing.js can talk to it
const SingEngine = {
    audioContext: null,
    analyser: null,
    microphone: null,
    audioBuffer: null, // NEW: Will hold the raw sound wave snapshot
    songData: null,    // Holds the loaded JSON song data
    lyricsLines: [],   // NEW: Will hold the processed lines of karaoke lyrics

    init: function(stream) {
        // 1. Create the AudioContext (This is the main brain of the Web Audio API)
        // We check for webkitAudioContext to support Safari as well
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 2. Create the AnalyserNode (This extracts frequency/pitch data from the audio)
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048; // A standard buffer size for pitch detection

        // Create a blank array to hold the audio data, matching the size of the analyser
        this.audioBuffer = new Float32Array(this.analyser.fftSize);

        // 3. Create an audio source from the microphone stream we got in Phase 1
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        
        // 4. Connect the microphone to the analyser
        this.microphone.connect(this.analyser);

        // NOTE: We do NOT connect the analyser to the speakers (audioContext.destination)
        // If we did, the user would hear their own voice echoing back at them!
    },

    loadSongData: function(jsonData) {
        this.songData = jsonData;
        this.processLyrics(); // Match words to notes immediately
    },

    // --- NEW: EXTRACT AND SYNC LYRICS ---
    processLyrics: function() {
        this.lyricsLines = [];
        if (!this.songData || !this.songData.header || !this.songData.header.meta) return;

        const vocalNotes = this.songData.tracks[0].notes;
        let noteIndex = 0; // Tracks which melody note matches which syllable
        let currentLine = { syllables: [], startTime: 0 };

        const metaEvents = this.songData.header.meta;
        for (let i = 0; i < metaEvents.length; i++) {
            const event = metaEvents[i];
            if (event.type === "lyrics") {
                // A \r acts as a line break in MIDI lyrics
                if (event.text === "\r" || event.text === "\n") {
                    if (currentLine.syllables.length > 0) {
                        this.lyricsLines.push(currentLine);
                        currentLine = { syllables: [], startTime: 0 };
                    }
                } else {
                    // Sync this syllable directly to the next vocal note
                    let matchingNote = vocalNotes[noteIndex];
                    if (matchingNote) {
                        if (currentLine.syllables.length === 0) currentLine.startTime = matchingNote.time;
                        
                        currentLine.syllables.push({ text: event.text, time: matchingNote.time });
                        noteIndex++; // Move to the next note for the next syllable
                    }
                }
            }
        }
        if (currentLine.syllables.length > 0) this.lyricsLines.push(currentLine);
    },

    getCurrentLyrics: function(currentSongTimeInSeconds) {
        if (!this.lyricsLines || this.lyricsLines.length === 0) return null;
        
        for (let i = 0; i < this.lyricsLines.length; i++) {
            const line = this.lyricsLines[i];
            const nextLineTime = (i + 1 < this.lyricsLines.length) ? this.lyricsLines[i + 1].startTime : Infinity;
            
            // Return the line if we are within 2 seconds before it starts, up until the next line begins
            if (currentSongTimeInSeconds >= line.startTime - 2 && currentSongTimeInSeconds < nextLineTime) {
                return line;
            }
        }
        return null;
    },

    getTargetPitchAtTime: function(currentSongTimeInSeconds) {
        if (!this.songData || !this.songData.tracks[0].notes) return -1;
        
        const vocalNotes = this.songData.tracks[0].notes;
        for (let i = 0; i < vocalNotes.length; i++) {
            const note = vocalNotes[i];
            const noteEndTime = note.time + note.duration;
            
            if (currentSongTimeInSeconds >= note.time && currentSongTimeInSeconds <= noteEndTime) {
                return 440 * Math.pow(2, (note.midi - 69) / 12);
            }
        }
        return -1; 
    },

    // --- PHASE 3: PITCH DETECTION ---

    getCurrentPitch: function() {
        if (!this.analyser) return -1;

        // 1. Snapshot the current sound wave into our audioBuffer
        this.analyser.getFloatTimeDomainData(this.audioBuffer);

        // 2. Run the math magic to find the frequency in Hertz (Hz)
        return this.autoCorrelate(this.audioBuffer, this.audioContext.sampleRate);
    },

    autoCorrelate: function(buffer, sampleRate) {
        // Step A: Calculate volume (Root Mean Square). If it's too quiet, ignore it.
        let rms = 0;
        for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / buffer.length);
        if (rms < 0.01) return -1; // -1 means "No pitch / Silence"

        // Step B: Find the repeating pattern in the sound wave
        let maxval = -1, maxpos = -1;
        for (let i = 0; i < buffer.length / 2; i++) {
            let sum = 0;
            for (let j = 0; j < buffer.length - i; j++) {
                sum += buffer[j] * buffer[j + i];
            }
            // i > 50 ignores super high-pitched background noise
            if (sum > maxval && i > 50) { 
                maxval = sum;
                maxpos = i;
            }
        }
        
        if (maxpos === -1) return -1;
        return sampleRate / maxpos; // Convert the pattern distance into Frequency (Hz)
    }
}
