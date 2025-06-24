document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('audio');
    const file = fileInput.files[0];

    if (!file){
        document.getElementById('message').textContent = "Please select a file.";
        return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        document.getElementById('message').textContent = result;
    } catch (error) {
        document.getElementById('message').textContent = "Upload failed: " + error.message;
    }
});