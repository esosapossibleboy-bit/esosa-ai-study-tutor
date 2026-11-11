import os
import json
import time
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
MODELS_TO_TRY = ["gemini-3.5-flash-lite", "gemini-3.8-flash"]

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "Online", "has_api_key": bool(GEMINI_API_KEY)})

@app.route("/teach", methods=["POST"])
def teach_topic():
    if not GEMINI_API_KEY:
        return jsonify({"status": "Error", "message": "Missing GEMINI_API_KEY on Render!"}), 500

    user_message = request.form.get("message", "").strip()
    level = request.form.get("level", "Beginner")
    history_raw = request.form.get("history", "[]")
    try:
        history = json.loads(history_raw)
    except Exception:
        history = []

    uploaded_file = request.files.get("file")

    if not user_message and not uploaded_file:
        return jsonify({"status": "Error", "message": "Please type a question or attach a file!"}), 400

    client = genai.Client(api_key=GEMINI_API_KEY)

    conversation_text = ""
    for msg in history[-6:]:
        role_label = "Student" if msg.get("role") == "user" else "AI Tutor"
        conversation_text += f"{role_label}: {msg.get('text', '')}\n"

    prompt = (
        f"You are a clear, encouraging personal AI tutor teaching a {level} student. "
        "Explain concepts using simple everyday language, clear headings, and bullet points. "
        "If a file, image, or video is attached, analyze its contents thoroughly and explain what is happening or taught in it. "
        "End with 1 quick practice question to check understanding.\n\n"
        f"Conversation so far:\n{conversation_text}"
        f"Student: {user_message or 'Please explain this uploaded file.'}\n"
        "AI Tutor:"
    )

    temp_path = None
    gemini_file = None

    try:
        if uploaded_file and uploaded_file.filename:
            _, ext = os.path.splitext(uploaded_file.filename)
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                uploaded_file.save(tmp.name)
                temp_path = tmp.name

            gemini_file = client.files.upload(file=temp_path)

            while getattr(gemini_file.state, "name", "") == "PROCESSING":
                time.sleep(2)
                gemini_file = client.files.get(name=gemini_file.name)

        contents = [gemini_file, prompt] if gemini_file else [prompt]

        last_error = ""
        for model_name in MODELS_TO_TRY:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                )
                return jsonify({"status": "Success", "reply": response.text})
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ {model_name} unavailable, trying fallback...")

        return jsonify({"status": "Error", "message": f"AI models busy: {last_error}"}), 503

    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        if gemini_file:
            try:
                client.files.delete(name=gemini_file.name)
            except Exception:
                pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    app.run(host="0.0.0.0", port=port)
