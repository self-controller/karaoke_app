var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

function resize() {
    var box = c.getBoundingClientRect();
    c.width = box.width;
    c.height = box.height;
}

var light = {
    x: 160,
    y: 200
}

var colors = ["#00caeb", "#df3f8b", "#060885"];

function drawLight() {
    const maxRadius = c.width * c.width + c.height * c.height;

    ctx.beginPath();
    ctx.arc(light.x, light.y, maxRadius, 0, 2 * Math.PI);
    var gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 1000);
    gradient.addColorStop(0, "#222");
    gradient.addColorStop(1, "#000");
    ctx.fillStyle = "#000";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(light.x, light.y, 20, 0, 2 * Math.PI);
    gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 5);
    gradient.addColorStop(0, "#000");
    gradient.addColorStop(1, "#000");
    ctx.fillStyle = gradient;
    ctx.fill();
}

function Box() {
    this.half_size = Math.floor((Math.random() * 50) + 1);
    this.x = Math.floor((Math.random() * c.width) + 1);
    this.y = Math.floor((Math.random() * c.height) + 1);
    this.r = Math.random() * Math.PI;
    this.shadow_length = 2000;
    this.color = colors[Math.floor((Math.random() * colors.length))];
  
    this.getDots = function() {

        var full = (Math.PI * 2) / 4;


        var p1 = {
            x: this.x + this.half_size * Math.sin(this.r),
            y: this.y + this.half_size * Math.cos(this.r)
        };
        var p2 = {
            x: this.x + this.half_size * Math.sin(this.r + full),
            y: this.y + this.half_size * Math.cos(this.r + full)
        };
        var p3 = {
            x: this.x + this.half_size * Math.sin(this.r + full * 2),
            y: this.y + this.half_size * Math.cos(this.r + full * 2)
        };
        var p4 = {
            x: this.x + this.half_size * Math.sin(this.r + full * 3),
            y: this.y + this.half_size * Math.cos(this.r + full * 3)
        };

        return {
            p1: p1,
            p2: p2,
            p3: p3,
            p4: p4
        };
    }
    this.rotate = function() {
        var speed = (60 - this.half_size) / 40;
        this.r += speed * 0.002;
        this.x += speed;
        this.y += speed;
    }
    this.draw = function() {
        var dots = this.getDots();
        ctx.beginPath();
        ctx.moveTo(dots.p1.x, dots.p1.y);
        ctx.lineTo(dots.p2.x, dots.p2.y);
        ctx.lineTo(dots.p3.x, dots.p3.y);
        ctx.lineTo(dots.p4.x, dots.p4.y);
        ctx.fillStyle = this.color;
        ctx.fill();


        if (this.y - this.half_size > c.height) {
            this.y -= c.height + 100;
        }
        if (this.x - this.half_size > c.width) {
            this.x -= c.width + 100;
        }
    }
    this.drawShadow = function() {
        var dots = this.getDots();
        var angles = [];
        var points = [];

        for (dot in dots) {
            var angle = Math.atan2(light.y - dots[dot].y, light.x - dots[dot].x);
            var endX = dots[dot].x + this.shadow_length * Math.sin(-angle - Math.PI / 2);
            var endY = dots[dot].y + this.shadow_length * Math.cos(-angle - Math.PI / 2);
            angles.push(angle);
            points.push({
                endX: endX,
                endY: endY,
                startX: dots[dot].x,
                startY: dots[dot].y
            });
        };

        for (var i = points.length - 1; i >= 0; i--) {
            var n = i == 3 ? 0 : i + 1;
            ctx.beginPath();
            ctx.moveTo(points[i].startX, points[i].startY);
            ctx.lineTo(points[n].startX, points[n].startY);
            ctx.lineTo(points[n].endX, points[n].endY);
            ctx.lineTo(points[i].endX, points[i].endY);
            ctx.fillStyle = "rgba(157, 0, 255, 0.15)";
            ctx.fill();
        };
    }
}

var boxes = [];

function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    drawLight();

    for (var i = 0; i < boxes.length; i++) {
        boxes[i].rotate();
        boxes[i].drawShadow();
    };
    for (var i = 0; i < boxes.length; i++) {
        collisionDetection(i)
        boxes[i].draw();
    };
    requestAnimationFrame(draw);
}

resize();
draw();

while (boxes.length < 14) {
    boxes.push(new Box());
}

window.onresize = resize;
document.addEventListener('mousemove', function(e) {
  const rect = c.getBoundingClientRect();
  light.x = e.clientX - rect.left;
  light.y = e.clientY - rect.top;
});


function collisionDetection(b){
	for (var i = boxes.length - 1; i >= 0; i--) {
		if(i != b){	
			var dx = (boxes[b].x + boxes[b].half_size) - (boxes[i].x + boxes[i].half_size);
			var dy = (boxes[b].y + boxes[b].half_size) - (boxes[i].y + boxes[i].half_size);
			var d = Math.sqrt(dx * dx + dy * dy);
			if (d < boxes[b].half_size + boxes[i].half_size) {
			    boxes[b].half_size = boxes[b].half_size > 1 ? boxes[b].half_size-=1 : 1;
			    boxes[i].half_size = boxes[i].half_size > 1 ? boxes[i].half_size-=1 : 1;
			}
		}
	}
}
    
    
if (window.location.pathname === '/'){   
    const urlInput = document.getElementById('yt-url');
    const btn = document.getElementById('go');
    const select = document.getElementById('song_select');
    const start_btn = document.getElementById('start');

    async function loadSongList() {
        const res = await fetch('/api/songs');
        const songDirs = await res.json();
        select.innerHTML = '<option value="" disabled selected>— Select a song —</option>';
        songDirs.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name.replaceAll("_", " ");
            select.appendChild(opt);
        });
    }

    select.addEventListener('change', () => {
            const song = select.value;
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

            const songName = await response.json();

            const trans = await fetch(`/transcribe/${songName}`)
            await loadSongList();
            } catch (err) {
                alert('Error: ' + err)
            }  finally {
            btn.disabled = false;
            btn.textContent = 'Separate';
        }
    };

    btn.addEventListener('click', async () => {
        await loadSongList();
    });

    start_btn.addEventListener('click', () => {
        const song = select.value;
        window.location.href = `/karaoke_room/${encodeURIComponent(song)}`;
    });


}


if (window.location.pathname.startsWith("/karaoke_room/")){
    let hideTimeout;
    const elementsToHide = document.querySelectorAll('.hide_on_idle');
    const idleDelay = 3000;

    function hideElements() {
        elementsToHide.forEach(el => el.style.opacity = '0');
        document.body.classList.add('hide_cursor');
    }
    
    function showElements() {
        elementsToHide.forEach(el => el.style.opacity = '1');
        document.body.classList.remove('hide_cursor');
    }
    
    function resetIdleTimer() {
        showElements();
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(hideElements, idleDelay);
    }

    document.addEventListener('mousemove', resetIdleTimer);

    resetIdleTimer();

    const audio = document.getElementById('player-audio');
    const playBtn = document.getElementById('play-btn');
    const seek = document.getElementById('seek');
    const time = document.getElementById('time');
    const lyricsContainer = document.getElementById('lyrics');
    let start_time = Number.MAX_VALUE;
    const song_title = document.getElementById('song_title');

    console.log(audio, playBtn, seek, time);

    var song_name = audio.src.split('/').pop().split('_accompaniment.wav')[0];

    async function loadLyrics(song_name) {
        const res = await fetch(`/static/trans_dir/${song_name}_trans.json`);
        lyrics = await res.json();

        lyricsContainer.innerHTML = '';
        for (const segment of lyrics) {
            if (start_time > parseFloat(segment.start)){
                start_time = segment.start;
            }
            const p = document.createElement('p');
            p.textContent = segment.text;
            p.dataset.start = segment.start;
            p.dataset.end = segment.end;
            lyricsContainer.appendChild(p);
        }
    }

    function togglePlay(){
        if (audio.paused) {
            audio.play();
            playBtn.textContent = '🪩';
        } else {
            audio.pause();
            playBtn.textContent = '🎤';
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.code == 'Space' && e.target.tagName !== 'INPUT'){
            e.preventDefault();
            togglePlay();
        }
    })
    playBtn.addEventListener('click', togglePlay);
    playBtn.addEventListener('keydown', (e) => {
        if (e.code == 'Space' && e.target.tagName !== 'INPUT'){
            e.preventDefault();
            togglePlay();
        }
    })

    audio.addEventListener('timeupdate', () => {
        const lines = lyricsContainer.querySelectorAll('p');
        seek.value = (audio.currentTime / audio.duration) *100;
        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60).toString().padStart(2,'0');
        time.textContent = `${mins}:${secs}`;
        for (const line of lines){
            const start = parseFloat(line.dataset.start);
            const end = parseFloat(line.dataset.end);
            if (audio.currentTime >= start && audio.currentTime < end){
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        }
        if (audio.currentTime > start_time){
            song_title.style.visibility = 'hidden';
        } else{
            song_title.style.visibility = 'visible';
        }

    });

    seek.addEventListener('input', () => {
        audio.currentTime = (seek.value / 100) * audio.duration;
    });
    window.addEventListener('DOMContentLoaded', async () => {
        await loadLyrics(song_name);
    });

}