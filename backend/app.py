from flask import Flask, Request, jsonify, send_file
from spleeter.separator import Separator
import os

app = Flask(__name__)


