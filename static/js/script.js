document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('audio');
    const statusDiv = document.getElementById('statusMessage');
    const file = fileInput.files[0];

    formData.append('audio', fileInput.files[0])
    
    statusDiv.textContent = "Processing your song...";
    statusDiv.className = "status";

    try {
        const response = await fetch('/separate', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            statusDiv.textContent = "Success! Tracks are ready for karaoke >:))";
            statusDiv.className = "status success";

            console.log("Vocals path: ", result.vocals_path);
            console.log("Instrumental path: ", result.instrumental_path);
        } else {
            statusDiv.textContent = 'Error: ${result.error}';
            statusDiv.className = "status error";
        }
    } catch (error) {
        statusDiv.textContent = 'Network error: ${error.message}';
        statusDiv.className= "status error";
    }
});

document.getElementById('youtubeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const urlInput = document.getElementById('youtubeUrl')
    const statusDiv = document.getElementById('status')
    const youtubeUrl = urlInput.value.trim();

    if (!youtubeUrl) {
        statusDiv.textContent = "Please enter a Youtube URL";
        return;
    }

    statusDiv.textContent = "Processing..."

    try {
        const response = await fetch('/process_youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: youtubeUrl})
        });
        
        const result = await response.json();

        if (response.ok){
            statusDiv.textContent = "Separation complete!";
            console.log("Vocals: ", result.vocals);
            console.log("Accompaniment: ", result.accompaniment)
        } else {
            statusDiv.textContent = 'Error: ${result.error}';
        }
    } catch (error) {
        statusDiv.textContent = 'Network error: ${error.message}'
    }
})