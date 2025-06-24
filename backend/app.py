from flask import Flask, request, jsonify, send_file, render_template
from spleeter.separator import Separator
import os

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
OUTPUT_FOLDER = os.path.join(os.path.dirname(__file__), 'separated')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma'}

@app.route('/')
def index():
    return render_template('index.html')


def allowed_file(filename):
    return '.' in filename and filename.rsplit(".",1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return 'No file part'
    
    file = request.files['audio']
    if file.filename == '':
        return 'No selected file'
    
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    return f"File saved to {file.filename} uploaded successfully"


