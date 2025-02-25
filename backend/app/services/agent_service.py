import os
import logging
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

logger = logging.getLogger(__name__)

# we define an agent supervior who manage 3 different agents and returns the relevnt results
def handle_ai_agents(query: str, selection_type: str, platform: str):
      """
    Supervisor function that orchestrates the AI agent workflow:
    1. Generate a perfect prompt based on the received query, selection type, and platform.
    2. Create vector embeddings from that prompt.
    3. Query PostgreSQL (using pgvector for similarity search) with the embedding.
    4. Process and return the results.
    """
    # Delegate prompt generation to the "prompt generation agent"
    prompt=generate_prompt(query, selection_type, platform)
    logger.info(f"Perfect prompt generated: {prompt}")

    # use the generated prompt to create vector embeddings
    embedding=create_vector_embeddings(prompt)
    logger.info(f"Vector embeddings created: {embedding}")

    # query the database with the embeddings ( match and return the most similar results from PostgreSQL)
    results=query_postgres(embedding)
    logger.info(f"Results retrieved: {results}")

    # Optionally process the results further with a "results processing agent"
    processed_results = process_postgres_results(results)
    logger.info(f"Processed results: {processed_results}")

    return processed_results

def generate_perfect_prompt(query: str, selection_type: str, platform: str) -> str:
    """
    Uses OpenAI's API to generate a refined and detailed prompt from the given query,
    selection type, and platform.
    """
    prompt_instructions = (
        f"Please generate a detailed and refined prompt from the following user query: '{query}'. "
        f"The context is that the query comes from a '{selection_type}' search on the '{platform}' platform. "
        "The refined prompt should capture the core intent, key search terms, and context in a way that can be "
        "used to create vector embeddings for precise database retrieval."
    )
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert prompt generator."},
                {"role": "user", "content": prompt_instructions}
            ],
            max_tokens=100,
            temperature=0.7,
        )
        refined_prompt = response['choices'][0]['message']['content'].strip()
        return refined_prompt
    except Exception as e:
        logger.error(f"Error generating prompt with OpenAI: {e}")
        # Fallback to a manual prompt if OpenAI fails
        return (
            f"Extract intent and context from: '{query}' for a '{selection_type}' search on '{platform}'."
        )
    
