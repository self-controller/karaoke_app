from flask import Flask, request, jsonify, send_file, render_template, url_for
import demucs.separate
import yt_dlp
import os
import shlex
from werkzeug.utils import secure_filename
import whisper
import json

app = Flask(__name__)
transcribe_model = whisper.load_model("base")

SONGS_FOLDER = 'static/songs'

os.makedirs(SONGS_FOLDER, exist_ok=True)
os.makedirs('uploads', exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'}

@app.route('/')
def index():
    return render_template('title_screen.html')

@app.route('/karaoke_room/<song>')
def karaoke_room(song):
    return render_template('karaoke_room.html', track=song)

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

        return jsonify(song_name)
    except Exception as e:
        app.logger.exception("process_youtube failed")
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe/<song>')
def transcribe(song):
    os.makedirs(os.path.join('static', 'trans_dir'), exist_ok=True)
    audio_path = os.path.join('static','songs', song ,'vocals',f"{song}_vocals.wav")
    if not os.path.exists(audio_path):
        return jsonify(error="No audio_path provided"), 400
    result = transcribe_model.transcribe(audio_path)
    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()} for seg in result["segments"]
    ]
    
    trans_path = os.path.join('static', 'trans_dir', f"{song}_trans.json")
    with open(trans_path, 'w', encoding='utf-8') as f:
        json.dump(segments, f, ensure_ascii=False, indent=2)

    return jsonify(segments)

if __name__ == '__main__':
    app.run(debug=True)