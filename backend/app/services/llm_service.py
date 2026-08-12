import os
import time

from google import genai

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not set")

client = genai.Client(api_key=api_key)


def generate_answer(
    question: str,
    context: str,
) -> str:

    prompt = f"""
You are Reponix, an AI software-engineering assistant.

Answer the user's question using the repository context provided below.

Rules:
- Use the repository context as your primary source.
- Do not invent files, functions, or behavior.
- If the context does not contain enough information, say that clearly.
- Explain the answer in a concise, developer-friendly way.
- Mention relevant file names when they are available.

User question:
{question}

Repository context:
{context}
"""

    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
            )

            return response.text

        except Exception as error:
            print(
                f"Gemini request failed "
                f"(attempt {attempt + 1}/{max_retries}): {error}"
            )

            if attempt == max_retries - 1:
                return (
                    "Reponix AI is temporarily unavailable. "
                    "Gemini is experiencing high demand. "
                    "Please try again in a few seconds."
                )

            time.sleep(2 ** attempt)