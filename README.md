# ✨ Esosa AI Study Tutor — Multimodal Full-Stack Learning Assistant

An interactive, full-stack AI tutoring application engineered with **React**, **TypeScript**, **Python (Flask)**, and the **Google Gemini API**. Students can ask questions across selectable difficulty levels (**Beginner**, **Intermediate**, **Advanced**) or upload images, videos, PDFs, and text documents for step-by-step AI explanations.

🌐 **Live Production App:** [https://esosapossibleboy-bit.github.io/esosa-ai-study-tutor/](https://esosapossibleboy-bit.github.io/esosa-ai-study-tutor/)  
⚙️ **REST API Endpoint:** [https://onrender.com](https://onrender.com)

---

## 🚀 Key Engineering Features

* **Multimodal File, Image & Video Analysis:** Handles `multipart/form-data` uploads on the Flask backend, integrates with Google's Gemini Files API, polls video processing states automatically, and cleans up temporary storage after inference.
* **Resilient Multi-Model Fallback Engine:** Automatically fails over across multiple Gemini models (`gemini-3.5-flash-lite` to `gemini-3.8-flash`) if upstream API endpoints experience temporary traffic spikes (`503`).
* **Conversational Context & Persistent State:** Maintains multi-turn tutoring context across follow-up questions and persists chat history and learning levels in `localStorage`.
* **Clean Light-Mode React + TypeScript UI:** Built with strict TypeScript interfaces (`ChatMessage`), file attachment preview chips, and responsive centered typography.

---

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, CSS3
* **Backend:** Python 3, Flask, Flask-CORS, Gunicorn, Google GenAI SDK
* **Deployment:** GitHub Pages (`gh-pages`), Render Cloud
