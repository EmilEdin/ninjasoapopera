# Ninja Soap Opera 🥷🎤

Welcome to the **Ninja Soap Opera** project! This repository contains a full-stack web application featuring a real-time karaoke/pitch-matching engine and a secure music upload portal.

## 🏗️ Project Architecture Overview

This project is split into two main parts: a **Client-Side (Frontend)** built with vanilla JavaScript, HTML, and CSS, and a **Server-Side (Backend)** built with C# and ASP.NET Core.

### 1. The Frontend (Client-Side)

The frontend handles everything the user sees, hears, and interacts with directly in the browser.

**The Singing/Karaoke Engine:**
Uses the browser's Web Audio API to process microphone input and an HTML5 Canvas to draw visuals.

- **`js/sing.js` (The Orchestrator):** The entry point. Handles UI interaction (Start button), requests microphone permissions, fetches song JSON data, and kicks off the Engine and UI loops.
- **`js/singEngine.js` (The Brain):** Handles audio and data processing. Sets up the `AudioContext` and `AnalyserNode`. Uses an Autocorrelation algorithm to calculate pitch (Hz) in real-time. Parses song data (JSON) to match notes and lyrics to timestamps.
- **`js/singUI.js` (The View):** Renders the HTML `<canvas>`. Runs at ~60 frames per second using `requestAnimationFrame`, pulling data from `SingEngine` to draw the scrolling pitch graph, frequency guide lines, target melody line, and highlighted karaoke lyrics.

**The Upload Portal:**

- **`js/app.js` (The Uploader):** Intercepts form submissions, packages track data and audio files into a `FormData` object, and sends an HTTP `POST` request to the backend.
- **`css/styles.css`:** Clean, modern, component-based stylesheet.

### 2. The Backend (Server-Side)

An ASP.NET Core Web API named **NinjaBackend** that securely receives data from the frontend.

- **`NinjaBackend/Program.cs` (The Bootstrapper):** Starts the server and configures CORS (Cross-Origin Resource Sharing) so the frontend and backend can communicate securely.
- **`Controllers/MusicController.cs` (The API Endpoint):** Listens at `/api/music/upload`. Validates incoming audio files, reads them into a `MemoryStream`, and prepares them for further processing (e.g., Google Drive/Sheets integration).

## 🔄 How Data Flows

**When Singing:**

1. User sings into the Microphone.
2. `singEngine.js` captures the sound wave and calculates the pitch.
3. `singUI.js` smooths the pitch and plots it as a green line on the canvas.
4. Concurrently, `singUI.js` checks the elapsed time and draws the target blue line and karaoke lyrics based on pre-loaded data.

**When Uploading:**

1. User selects an MP3/WAV and types a track name.
2. `app.js` packages this and sends an HTTP POST request.
3. `MusicController.cs` receives, validates, and processes the file in memory.
