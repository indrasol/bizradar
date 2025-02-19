from flask import Blueprint, request, jsonify
from services.scraper import scrape_all_platforms, scrape_freelancer, fetch_fpds_opportunities
from services.fetcher import fetch_data, fetch_opportunities
from services.open_ai_processor import process_query_with_openai
import logging
from datetime import datetime

# Initialize the logger
logger = logging.getLogger(__name__)

search_bp = Blueprint('search', __name__)

# Government Contracts Endpoints
@search_bp.route('/government-contracts/sam-gov', methods=['POST'])
async def government_contracts_sam_gov():
    data = request.json
    user_input = data.get('query')
    if not user_input:
        return jsonify({"message": "User input is required."}), 400

    keywords_result = await process_query_with_openai(user_input)
    keywords = keywords_result.get('keywords')
    if not keywords:
        return jsonify({"message": "No keywords generated."}), 400

    result = await fetch_opportunities('sam.gov', {'keywords': keywords})

    # Log the result to check its structure
    logging.info(f"Result from fetch_opportunities: {result}")

    if result['count'] == 0:
        return jsonify({"message": "No opportunities found."}), 404

    # Extract the required fields from the jobs
    jobs = result.get('jobs', [])
    formatted_jobs = [
        {
            "title": job.get("title"),
            "department": " ".join(job.get("fullParentPathName", "").split()[:3]),  # Get the first 3 words
            "platform": "sam.gov",
            "responseDeadline": format_date(job.get("responseDeadLine")),  # Format the date
            "naicsCode": job.get("naicsCode"),
        }
        for job in jobs
    ]

    return jsonify({"message": "Search completed for SAM.gov", "results": formatted_jobs}), 200

def format_date(date_str):
    """Convert date string to 'DD Month YYYY' format."""
    try:
        # Parse the date string
        date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S%z")  # Adjust format as needed
        return date_obj.strftime("%d %B %Y")  # Format to 'DD Month YYYY'
    except Exception as e:
        logging.error(f"Error formatting date: {str(e)}")
        return date_str  # Return original if there's an error

@search_bp.route('/government-contracts/fpds', methods=['POST'])
async def government_contracts_fpds():
    data = request.json
    user_input = data.get('query')
    
    # Generate keywords using the OpenAI processor
    keywords_result = await process_query_with_openai(user_input)
    query = keywords_result.get('keywords')  # Get the single string query

    if not query:
        return jsonify({"message": "No keywords generated."}), 400

    # Call the scraper with the exact query
    fpds_result = await fetch_fpds_opportunities(query)

    return jsonify({"message": "Search completed for FPDS.gov", "results": fpds_result}), 200

@search_bp.route('/government-contracts/all-platforms', methods=['POST'])
def government_contracts_all_platforms():
    data = request.json
    query = data.get('query')
    results = scrape_all_platforms(query)  # Use scraping logic
    # print(f"Results from all platforms for query '{query}': {results}")  # Log results to console
    return jsonify({"message": "Search completed for all platforms", "results": results}), 200

# Freelance Jobs Endpoints
@search_bp.route('/freelance-jobs/freelancer', methods=['POST'])
async def freelance_jobs():
    data = request.json
    user_input = data.get('query')
    
    # Generate keywords using the OpenAI processor
    keywords_result = await process_query_with_openai(user_input)
    query = keywords_result.get('keywords')  # Get the single string query

    if not query:
        return jsonify({"message": "No keywords generated."}), 400

    # Call the scraper with the exact query
    scrape_result = await scrape_freelancer(query)

    if scrape_result['count'] == 0:
        return jsonify({
            "message": "No opportunities found.",
            "results": {
                "count": 0,
                "opportunities": []
            }
        }), 200  # Return 200 OK even if no opportunities are found

    response = {
        "message": "Search completed for Freelancer.com",
        "results": {
            "count": scrape_result['count'],
            "opportunities": scrape_result['opportunities']
        }
    }
    logger.info(f"Response to frontend: {response}")  # Log the response
    return jsonify(response), 200

@search_bp.route('/freelance-jobs/all-platforms', methods=['POST'])
def freelance_jobs_all_platforms():
    data = request.json
    query = data.get('query')
    results = scrape_all_platforms(query)  # Use scraping logic
    # print(f"Results from all platforms for query '{query}': {results}")  # Log results to console
    return jsonify({"message": "Search completed for all platforms", "results": results}), 200 