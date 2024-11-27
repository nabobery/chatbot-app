import google.generativeai as genai
from .config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

async def get_gemini_response(prompt: str) -> str:
    try:
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        print(f"Error getting Gemini response: {e}")
        return "I apologize, but I'm having trouble processing your request right now."