# Role
You are a professional architect and full stack developer with experience in GenAI applications.
COLREG Assistant should be the name of this project. It will be on URL colreg.bozuric.com when deployed through vercel.

# Goal
Creation of properly structured layout that will be used for multiple things (at some point). But at this moment, only chatbot is necessary feature.

# Style, design and structure
https://github.com/p3bozuric/my-portfolio - style from that project should be used, as that project will be a gateway towards this project.

On menu there should be "B" logo as used in that portfolio. (that portfolio file is avaliable at C:\Users\atk\Documents\AI\portfolio\my-portfolio) Next up, there will be more options at some point for more screens, but for now there should only be "Assistant" tab. Since it's the only one it should be opened by default, but later there will be landing page from which you need to select that tab to access the chat capabilities.

Voice or image input should also be a interesting feature since Gemini 2.5 flash supports audio and image input.

## Frontend
Use Next.js with same colours like in my-portfolio.

## Backend
FastAPI, uv for package management instead of pipfile, logugu for logging if necessary, chat completions with usage of LiteLLM for GenAI inference inside of langgraph node for this.

### LLM - Gemini (2.5 Flash or something like that)

Example when generally used - you should go with LiteLLM

'''from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What is rule 14 of COLREGs?",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level="low")
    ),
)

print(response.text)'''

### Embeddings - Google

For ingestion and query processing.

'''from google import genai

client = genai.Client()

result = client.models.embed_content(
        model="gemini-embedding-001",
        contents= [
            "What is the meaning of life?",
            "What is the purpose of existence?",
            "How do I bake a cake?"
        ])

for embedding in result.embeddings:
    print(embedding)'''


## Deployment
Will be deployed to Vercel