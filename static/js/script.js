const urlInput = document.getElementById('yt-url');
const btn = document.getElementById('go');
const select = document.getElementById('song_select');
const playerBox = document.getElementById('player');
const vocalsPlayer = document.getElementById('vocals');
const accompanimentPlayer = document.getElementById('accompaniment');

async function loadSongList() {
    const res = await fetch('/api/songs');
    const songDirs = await res.json();
    select.innerHTML = '<option value="" disabled selected>— Select a song —</option>';
    songDirs.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

select.addEventListener('change', () => {
    const song = select.value;
    
    vocalsPlayer.src = '/static/songs/'+song+'/vocals/'+song+'_vocals.wav';
    accompanimentPlayer.src = '/static/songs/'+song+'/accompaniment/'+song+'_accompaniment.wav';
    
    playerBox.style.display = 'block';
});

window.addEventListener('DOMContentLoaded', loadSongList);

document.getElementById('go').onclick = async () => {
    youtubeUrl = urlInput.value.trim();
    if (!youtubeUrl) {
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
        await loadSongList();
        } catch (err) {
            alert('Error: ' + err)
        } finally {
            btn.disabled = false;
            btn.textContent = 'Separate';
        }
};

btn.addEventListener('clock', async () => {
    await loadSongList();
});

