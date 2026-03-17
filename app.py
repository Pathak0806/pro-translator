from flask import Flask, render_template, request, jsonify
import os
import anthropic

app = Flask(__name__)
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

LANGUAGES = {
    "English": "en", "Hindi": "hi", "Japanese": "ja", "French": "fr",
    "German": "de", "Spanish": "es", "Chinese": "zh", "Korean": "ko",
    "Russian": "ru", "Italian": "it", "Portuguese": "pt", "Arabic": "ar",
    "Bengali": "bn", "Turkish": "tr", "Vietnamese": "vi", "Thai": "th",
    "Urdu": "ur", "Dutch": "nl", "Polish": "pl", "Romanian": "ro"
}

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

    prompt = f"""Translate the following text from {source_lang} to {target_lang}.
Return ONLY the translated text — no explanations, no notes, no alternatives.

Text: {text}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    translation = message.content[0].text.strip()
    return jsonify({"translation": translation})

@app.route("/api/detect", methods=["POST"])
def detect():
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"language": "Unknown"})

    prompt = f"""What language is this text written in? Reply with ONLY the language name (e.g. English, Hindi, French).
Text: {text}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=20,
        messages=[{"role": "user", "content": prompt}]
    )
    lang = message.content[0].text.strip()
    return jsonify({"language": lang})

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
