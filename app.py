from flask import Flask, request, jsonify, send_file, render_template
import yt_dlp
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
VOCALS_FOLDER = 'static/vocals'
ACCOMPANIMENT_FOLDER = 'static/accompaniment'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VOCALS_FOLDER, exist_ok=True)
os.makedirs(ACCOMPANIMENT_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'}

separator = Separator('spleeter:2stems')

def allowed_file(filename):
    return '.' in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/separate', methods=['POST'])
def separate_audio():
    if 'audio' not in request.files:
        return jsonfiy({'error': 'No file uploaded'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': ' File type not allowed'}), 400

    filename = secure_filename(file.filename)
    base_name = os.path.splitext(filename)[0]
    upload_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(upload_path)

    output_folder = os.path.join('separated', base_name)
    vocals_path = os.path.join(VOCALS_FOLDER, f"{base_name}_vocals.wav")
    accompaniment_path = os.path.join(ACCOMPANIMENT_FOLDER, f"{base_name}_accompaniment.wav")

    separator.separate_to_file(upload_path, 'separated')

    os.rename(os.path.join(output_folder, 'vocals.wav'), vocals_path)
    os.rename(os.path.join(output_folder, 'accompaniment.wav'), accompaniment_path)

    os.rmdir(output_folder)

    return jsonify({
        'status': 'success',
        'vocals_path': vocals_path,
        'accompaniment_path': accompaniment_path
    })

if __name__ == '__main__':
    app.run(debug=True)

def download_youtube_audio(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'uploads/%(id)s.%(ext)s', 
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'prefferredquality': '192'
        }]
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        base_filename = os.path.splitext(filename)[0]
        return f"{base_filename}.mp3"

@app.route('/process_youtube', methods=['POST'])
def process_youtube():
    data = request.get_json()
    youtube_url = data.get('url')

    if not youtube_url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try: 
        audio_path = download_youtube_audio(youtube_url)
        output_dir = 'static/separated'
        os.mkdir(output_dir, exist_ok=True)
        separator.separate_to_file(audio_path, output_dir)

        base_name = os.path.basename(audio_path).replace('.mp3', '')

        return jsonify({
            'vocals': f"{output_dir}/{base_name}/vocals.wav",
            'accompaniment': f"{output_dir}/{base_name}/accompaniment.wav"            
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


