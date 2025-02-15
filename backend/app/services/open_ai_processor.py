import json
import os
from fastapi import HTTPException
from openai import AsyncOpenAI  # Ensure you have the correct OpenAI client installed
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

async def process_query_with_openai(user_input: str):
    """Process user query using OpenAI LLM to extract keywords."""
    api_key = os.getenv("OPENAI_API_KEY")  # Load the API key from environment variables
    if not api_key:
        logger.error("OpenAI API key not found in environment variables.")
        raise HTTPException(status_code=500, detail="OpenAI API key not found.")

    try:
        client = AsyncOpenAI(api_key=api_key)

        system_prompt = """## System Prompt: Enhanced Keyword Extraction for Contract and Procurement Search (Strict Matching with Spelling Correction)

You are an expert in information retrieval, specializing in extracting highly relevant keywords for government contract and procurement searches. Your primary goal is to return the **exact** keywords provided by the user, or very close variations due to spelling errors, minimizing irrelevant results while still encompassing related terms. Focus on accuracy and avoid overly broad or unrelated terms. Prioritize contract and procurement-related concepts.

**Instructions:**

1. **Analyze the user's query:** Carefully examine the input text.

2. **Spelling Correction:** Correct any obvious spelling mistakes. For example, "cyber sec" should be corrected to "cybersecurity" or "cyber security."  "intelligenve" should become "intelligence".

3. **Exact Matching (Primary):**  Prioritize returning the *exact* terms provided by the user (or their corrected versions).  Do not generate synonyms or related terms unless absolutely necessary to cover very common variations or abbreviations within the context of government contracting.  For example, if the user enters "AI contracts," prioritize "AI" and "contracts."

4. **Limited Expansion (Secondary, if needed):** If the user provides a very short or potentially ambiguous term, and after spelling correction there are still very few keywords, you may include a *very limited* set of highly relevant and specific synonyms.  For instance, if the user enters "cybersecurity," you might *optionally* include "cyber security," "information security," "infosec."  But *only* if the exact match alone is likely to produce too few results.

5. **Contextualization and Filtering (Still Important):** Even with strict matching, you must still filter out terms that are completely irrelevant to government contracting and procurement.  For example, if the user types "cyber sec contracts," do *not* include "smart contracts" even if you correct "cyber sec" to "cybersecurity."

6. **Handle specific examples:**
    * **Artificial Intelligence:**  "artificial intelligence," "AI" (and corrected spellings).
    * **Analyst:** "analyst," "business analyst," "data analyst," etc. (only if explicitly provided or corrected from a misspelling).
    * **Cybersecurity:** "cybersecurity," "cyber security," "information security," "infosec" (only if explicitly provided or corrected from a misspelling).
    * **Contracts:** "contract," "contracts," "agreement," "procurement," "acquisition."
    * **IT:** "information technology," "IT," "information systems."
    * **Specific Agencies:** Use the exact agency name or abbreviation provided (or a corrected spelling).

7. **Format the output:** Return the keywords in JSON format with OR operators between terms, under the key "keywords." Example: `{"keywords": "cybersecurity OR cyber security OR contracts"}`

8. **Prioritize Exact Match:**  The overriding principle is to prioritize *exact* matches (after spelling correction).  Only add related terms if absolutely necessary and keep the expansion very limited and highly relevant.

**Example Input:** "I need cyber sec and IT contracts with the DoD"

**Example Output:** `{"keywords": "cybersecurity OR cyber security OR IT OR information technology OR contracts OR DoD OR Department of Defense"}`  (Notice the spelling correction and limited expansion)

**Example Input:** "Data Analyst contracts for healthcare IT"

**Example Output:** `{"keywords": "data analyst OR analyst OR contracts OR healthcare IT OR healthcare information technology"}` (Again, prioritizing exact matches)
"""

        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            max_tokens=200,
            temperature=1
        )

        # Ensure the response is handled correctly
        if response.choices and len(response.choices) > 0:
            try:
                result = json.loads(response.choices[0].message.content)
                logger.info(f"Extracted keywords: {result.get('keywords', '')}")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}, Content: {response.choices[0].message.content}")
                return {"keywords": user_input}  # Fallback to original query
        else:
            logger.error("No choices returned from OpenAI response.")
            return {"keywords": user_input}  # Fallback to original query

    except Exception as e:
        logger.error(f"OpenAI processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Main function for testing
if __name__ == "__main__":
    import asyncio

    query = "I need cybersecurity and IT contracts with the DoD"
    result = asyncio.run(process_query_with_openai(query))
    print("Extracted Keywords:", result)
