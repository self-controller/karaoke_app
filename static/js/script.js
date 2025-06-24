const urlInput = document.getElementById('yt-url');
const btn = document.getElementById('go');

document.getElementById('go').onclick = async () => {
    youtubeUrl = urlInput.value.trim();
    if (!youtubeUrl) {
        statusDiv.textContent = "Please enter a Youtube URL";
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const response = await fetch('/process_youtube', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: youtubeUrl})
        });
        
        const {vocals, accompaniment} = await response.json();
        
        document.getElementById('vocals').src = vocals;
        document.getElementById('accompaniment').src = accompaniment;
        } catch (err) {
            alert('Error: ' + err)
        } finally {
            btn.disabled = false;
            btn.textContent = 'Separate';
        }
};