from flask import Flask, request, jsonify, send_file, render_template, url_for
import demucs.separate
import yt_dlp
import os
import shlex
from werkzeug.utils import secure_filename

app = Flask(__name__)



SONGS_FOLDER = 'static/songs'

os.makedirs(SONGS_FOLDER, exist_ok=True)
os.makedirs('uploads', exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs')
def song_list():
    SONG_DIRS = [
        name for name in os.listdir(SONGS_FOLDER)
    ]
    return jsonify(SONG_DIRS)    

def download_youtube_audio(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'uploads/%(id)s.%(ext)s', 
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }]
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        base_filename = os.path.splitext(filename)[0]
        return {"soundfile": f"{base_filename}.mp3",
                "name": info.get('title', '')}

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    data = request.get_json()
    youtube_url = data.get('url')
    if not youtube_url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try: 
        info = download_youtube_audio(youtube_url)
        audio_path = info['soundfile']
        song_name = secure_filename(info['name'])
        base_name = os.path.splitext(os.path.basename(audio_path))[0]

        song_folder = os.path.join(SONGS_FOLDER, song_name)
        os.makedirs(song_folder, exist_ok=True)

        VOCALS_FOLDER = os.path.join(SONGS_FOLDER, song_name, 'vocals')
        ACCOMPANIMENT_FOLDER = os.path.join(SONGS_FOLDER, song_name, 'accompaniment')

        os.makedirs(VOCALS_FOLDER, exist_ok=True)
        os.makedirs(ACCOMPANIMENT_FOLDER, exist_ok=True)

        output_dir = 'static/separated'
        os.makedirs(output_dir, exist_ok=True)
        demucs.separate.main(shlex.split(f'--two-stems vocals -o {output_dir} "{audio_path}"'))

        model_folder = os.path.join(output_dir,'htdemucs', base_name)
        vocals_src = os.path.join(model_folder, 'vocals.wav')
        accomp_src = os.path.join(model_folder, 'no_vocals.wav')
        
        vocals = os.path.join(VOCALS_FOLDER, f'{song_name}_vocals.wav')
        accompaniment = os.path.join(ACCOMPANIMENT_FOLDER, f'{song_name}_accompaniment.wav')
        os.replace(vocals_src, vocals)
        os.replace(accomp_src, accompaniment)

        return jsonify({
            'vocals': url_for('static', filename=f'songs/{song_name}/vocals/{song_name}_vocals.wav'),
            'accompaniment': url_for('static', filename=f'songs/{song_name}/accompaniment/{song_name}_accompaniment.wav')           
        })
    except Exception as e:
        app.logger.exception("process_youtube failed")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)