import os
import pytest
import asyncio
from dotenv import load_dotenv
from app.services.open_ai_processor import process_query_with_openai

# Load environment variables from .env file
load_dotenv()

@pytest.mark.asyncio
async def test_process_query_with_openai():
    # Ensure the OpenAI API key is set
    api_key = os.getenv("OPENAI_API_KEY")
    assert api_key is not None, "OpenAI API key must be set in the .env file"

    # Define a sample query
    query = "I need cybersecurity and IT contracts with the DoD"
    
    # Call the function to process the query
    result = await process_query_with_openai(query)

    # Check if the result contains the expected structure
    assert "keywords" in result, "The result should contain 'keywords'"
    assert isinstance(result["keywords"], str), "The 'keywords' should be a string"

    # Optionally, you can print the result for manual verification
    print("Extracted Keywords:", result["keywords"])