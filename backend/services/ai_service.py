import google.generativeai as genai
import os
import json
import re

# 1. API Key Load
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERROR: GEMINI_API_KEY is missing.")
else:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.0-flash')

def get_chat_response(message, context="General Studies"):
    try:
        prompt = f"""
        ROLE: AI Academic Tutor.
        USER QUESTION: "{message}"
        INSTRUCTIONS: Answer strictly related to education. Be concise and encouraging.
        """
        response = model.generate_content(prompt)
        return response.text.strip() if response.text else "I am thinking..."
    except Exception as e:
        return "I am currently offline."

def generate_quiz_json(topic, difficulty):
    print(f"📡 Generating Quiz for: {topic}")
    prompt = f"""
    Create a JSON quiz on '{topic}', Difficulty: {difficulty}. Return exactly 3 questions.
    JSON Format: [ {{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}} ]
    Return ONLY raw JSON. Do not use Markdown.
    """
    try:
        response = model.generate_content(prompt)
        # Clean response
        text = re.sub(r'```json|```', '', response.text).strip()
        start, end = text.find('['), text.rfind(']')
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
        return []
    except Exception:
        return []

# --- NEW FUNCTION FOR RECOMMENDATIONS ---
def generate_study_plan(weak_topics):
    print(f"📡 Generating Plan for: {weak_topics}")
    prompt = f"""
    The student scored low in these topics: {weak_topics}.
    Provide a personalized 3-step study plan to improve.
    Keep it short, bulleted, and actionable.
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return "Review your course materials and try again."