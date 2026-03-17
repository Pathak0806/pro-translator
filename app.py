from flask import Flask, render_template, request, jsonify
import os
from deep_translator import GoogleTranslator
from langdetect import detect as detect_lang, LangDetectException

app = Flask(__name__)

LANGUAGES = {
    "English": "en", "Hindi": "hi", "Japanese": "ja", "French": "fr",
    "German": "de", "Spanish": "es", "Chinese": "zh-CN", "Korean": "ko",
    "Russian": "ru", "Italian": "it", "Portuguese": "pt", "Arabic": "ar",
    "Bengali": "bn", "Turkish": "tr", "Vietnamese": "vi", "Thai": "th",
    "Urdu": "ur", "Dutch": "nl", "Polish": "pl", "Romanian": "ro"
}

LANG_CODE_TO_NAME = {v: k for k, v in LANGUAGES.items()}

@app.route("/")
def index():
    languages = list(LANGUAGES.keys())
    return render_template("index.html", languages=languages)

@app.route("/api/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text = data.get("text", "").strip()
    source_lang = data.get("source_lang", "English")
    target_lang = data.get("target_lang", "Hindi")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    if source_lang == target_lang:
        return jsonify({"translation": text})

    src_code = LANGUAGES.get(source_lang, "en")
    tgt_code = LANGUAGES.get(target_lang, "hi")

    try:
        translated = GoogleTranslator(source=src_code, target=tgt_code).translate(text)
        return jsonify({"translation": translated})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/detect", methods=["POST"])
def detect():
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"language": "Unknown"})
    try:
        code = detect_lang(text)
        # fix zh-cn
        if code == "zh-cn" or code == "zh":
            code = "zh-CN"
        name = LANG_CODE_TO_NAME.get(code, code.upper())
        return jsonify({"language": name})
    except LangDetectException:
        return jsonify({"language": "Unknown"})

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
