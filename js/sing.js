document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startBtn");
    const statusText = document.getElementById("status");
    const canvas = document.getElementById("pitchGraph");

    // Prepare the Canvas UI
    SingUI.init();

    startBtn.addEventListener("click", async () => {
        try {
            statusText.innerText = "Requesting microphone access...";
            
            // 1. Ask the browser for the audio stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // 2. Fetch the song JSON data
            statusText.innerText = "Loading song data...";
            const response = await fetch("assets/data/youre_only_lonely.json");
            const songData = await response.json();
            SingEngine.loadSongData(songData);
            
            // 3. Pass the stream to our Audio Engine!
            SingEngine.init(stream);
            
            // 4. Start drawing the graph!
            SingUI.start();
            
            statusText.innerText = "Microphone connected! Sing to see your pitch.";
            statusText.style.color = "#28a745"; // A nice, readable green
            startBtn.disabled = true; // Prevent clicking it again
            
        } catch (err) {
            console.error("Microphone access denied or failed:", err);
            statusText.innerText = "Error: Could not access microphone. Please allow permissions.";
            statusText.style.color = "red";
        }
    });
});