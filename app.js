// Configuration: Change this to your Azure/Render URL later!
const API_BASE_URL = "http://localhost:5000/api"; 

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const statusDiv = document.getElementById("uploadStatus");

    // Handle Upload
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const trackName = document.getElementById("trackName").value;
        const fileInput = document.getElementById("audioFile");
        const submitBtn = document.getElementById("submitBtn");

        if (fileInput.files.length === 0) return;

        // Prepare data for the C# Backend
        const formData = new FormData();
        formData.append("trackTitle", trackName);
        formData.append("audioFile", fileInput.files[0]);

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = "Uploading...";
            statusDiv.innerText = "";

            // Send to C#
            const response = await fetch(`${API_BASE_URL}/music/upload`, {
                method: "POST",
                body: formData 
                // Note: Do NOT set 'Content-Type' manually when using FormData
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.style.color = "lightgreen";
                statusDiv.innerText = `Success! ${result.message}`;
                uploadForm.reset();
            } else {
                throw new Error(result.message || "Upload failed.");
            }
        } catch (error) {
            statusDiv.style.color = "red";
            statusDiv.innerText = `Error: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Upload to Secure Vault";
        }
    });
});