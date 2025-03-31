# Import what's needed
import os
import logging
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI

# Set up logging
logger = logging.getLogger(__name__)

# Initialize the OpenAI client with proper error handling
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY environment variable not found. Using dummy key for testing.")
        api_key = "dummy-key-for-testing"
    
    openai_client = OpenAI(api_key=api_key)
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")
    # Create a dummy client for fallback
    class DummyClient:
        class Chat:
            class Completions:
                def create(self, **kwargs):
                    class DummyResponse:
                        class Choice:
                            class Message:
                                content = '{"matchScore": 50, "title": "Fallback Match", "description": "This is a fallback response due to OpenAI client initialization failure."}'
                            
                            def __init__(self):
                                self.message = self.Message()
                        
                        def __init__(self):
                            self.choices = [self.Choice()]
                    
                    return DummyResponse()
            
            def __init__(self):
                self.completions = self.Completions()
        
        def __init__(self):
            self.chat = self.Chat()
    
    openai_client = DummyClient()

# Track whether we've already processed specific opportunities to avoid duplicate calculations
processed_opportunities_cache = {}

# Match score generation function with improved error handling
async def generate_match_scores(company_url: str, company_description: str, opportunities: List[Dict[str, Any]], include_match_reason: bool = False) -> List[Dict[str, Any]]:
    """Generate match scores and recommendations for company opportunities."""
    
    recommendations = []
    
    # Create a cache key based on the first opportunity's ID to prevent duplicate processing
    cache_key = ""
    if opportunities and len(opportunities) > 0:
        cache_key = str(opportunities[0].get('id', '')) + str(len(opportunities))
        
        # Check if we've already processed this batch of opportunities
        if cache_key in processed_opportunities_cache:
            logger.info(f"Using cached recommendations for {cache_key}")
            return processed_opportunities_cache[cache_key]
    
    try:
        # Process each opportunity
        for i, opportunity in enumerate(opportunities):
            try:
                # Prepare the prompt with updated logic
                system_message = """
                You are an expert in opportunity matching, specializing in government contracts and freelance projects. Your task is to provide precise, logical, and actionable recommendations by analyzing the match potential between a company and an opportunity. Return a JSON response with:
                - matchScore (integer 0-100)
                - title (short, sharp summary of the match)
                - description (detailed, astute reasoning explaining the match quality)
                - matchReason (concise, value-driven reason, if requested)
                Focus on clarity and relevance—highlight the recommendation as a unique selling point (USP) for the company.
                """
                
                user_message = f"""
                Analyze the match between this company and the opportunity, using sharp reasoning to craft a recommendation that stands out as a USP. Return the response in JSON format.

                ### Company Details:
                - Website: {company_url} (use this as context for the company's expertise and services)
                - Description: {company_description}

                ### Opportunity Details:
                - Title: {opportunity.get('title', 'Untitled')}
                - Type: {'Freelance Project' if 'skills_required' in opportunity else 'Government Contract'}
                {'- Skills Required: ' + opportunity.get('skills_required', 'N/A') if 'skills_required' in opportunity else '- Description: ' + opportunity.get('description', 'No description available')}
                {'- Price/Budget: ' + str(opportunity.get('price_budget', 'N/A')) if 'price_budget' in opportunity else '- Department/Agency: ' + opportunity.get('department', opportunity.get('agency', 'Unknown agency'))}
                {'- Bids So Far: ' + str(opportunity.get('bids_so_far', 'N/A')) if 'bids_so_far' in opportunity else ''}
                {'- Additional Details: ' + opportunity.get('additional_details', 'N/A') if 'additional_details' in opportunity else '- NAICS Code: ' + opportunity.get('naicsCode', 'No NAICS code')}
                - Published Date: {opportunity.get('published_date', 'N/A')}

                ### Instructions:
                1. Use the company website URL ({company_url}) as context for their expertise and services, combined with the description to pinpoint their strongest capabilities.
                2. Match these against the opportunity:
                   - For freelance projects: Evaluate skills_required, price_budget, bids_so_far, and additional_details for precise fit.
                   - For government contracts: Assess description, department/agency, and NAICS code for alignment.
                3. Craft a recommendation that’s a USP—highlight what makes this opportunity uniquely suited (or not) for the company.
                4. Return a JSON response with:
                   - matchScore (0-100): Precise fit score based on logical analysis.
                   - title: A concise, impactful summary (e.g., "Perfect Skill Fit" or "Budget Overreach").
                   - description: Detailed reasoning—why this match works or doesn’t, with specific references to company strengths and opportunity needs.
                   {"- matchReason: A short, value-driven reason (e.g., 'Leverages your cybersecurity edge' or 'Budget exceeds capacity')." if include_match_reason else ""}
                """
                
                # Make the API call with updated temperature
                try:
                    response = openai_client.chat.completions.create(
                        model="gpt-3.5-turbo-1106",  # or whatever model you're using
                        messages=[
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": user_message}
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.5,  # Changed to 0.5 for sharper reasoning
                        max_tokens=1000
                    )
                    
                    # Parse the response
                    result = json.loads(response.choices[0].message.content)
                except Exception as api_error:
                    logger.warning(f"API call failed for opportunity {i}: {str(api_error)}")
                    # Provide a fallback result
                    result = {
                        "matchScore": 50,
                        "title": "Match Analysis Unavailable",
                        "description": "We couldn't analyze this opportunity at this time due to a technical issue."
                    }
                    
                    # Add match reason if requested
                    if include_match_reason:
                        result["matchReason"] = "This is a fallback match reason due to an API error."
                
                # Generate a match reason if one wasn't provided but was requested
                if include_match_reason and "matchReason" not in result:
                    # Custom match reason based on score
                    match_score = result.get("matchScore", 0)
                    title = opportunity.get('title', '').lower()
                    
                    if match_score >= 80:
                        reason = f"Strong alignment with your expertise in {('cybersecurity' if 'security' in title or 'cyber' in title else 'data management')} and government contracts."
                    elif match_score >= 70:
                        reason = f"Good fit for your capabilities in {('security services' if 'security' in title or 'cyber' in title else 'data analytics')} for government agencies."
                    elif match_score >= 50:
                        reason = f"Moderate alignment with your {'security' if 'security' in title or 'cyber' in title else 'analytics'} solutions. Consider strategic partners."
                    else:
                        reason = "Limited alignment with core offerings, but may provide opportunity for business expansion."
                    
                    result["matchReason"] = reason
                
                # Add to recommendations
                recommendations.append({
                    "id": f"rec-{i}",
                    "opportunityIndex": i,
                    "matchScore": result.get("matchScore", 0),
                    "title": result.get("title", "Potential match found"),
                    "description": result.get("description", ""),
                    "matchReason": result.get("matchReason", "") if include_match_reason else ""
                })
                
                logger.info(f"Successfully calculated match score for opportunity {i}")
                
            except Exception as e:
                logger.warning(f"Match score calculation failed: {str(e)}")
                # Add a fallback recommendation
                recommendations.append({
                    "id": f"rec-{i}",
                    "opportunityIndex": i,
                    "matchScore": 50,  # Default score
                    "title": "Match analysis unavailable",
                    "description": "We couldn't analyze this opportunity at this time.",
                    "matchReason": "Fallback recommendation due to processing error." if include_match_reason else ""
                })
    
    except Exception as e:
        logger.error(f"Failed to generate recommendations: {str(e)}")
        # Return at least one fallback recommendation if the whole process fails
        if len(recommendations) == 0 and len(opportunities) > 0:
            recommendations.append({
                "id": "rec-fallback",
                "opportunityIndex": 0,
                "matchScore": 50,
                "title": "AI Analysis Temporarily Unavailable",
                "description": "Our matching system is currently unable to process recommendations.",
                "matchReason": "Fallback recommendation due to system error." if include_match_reason else ""
            })
    
    # Sort recommendations by matchScore in descending order
    recommendations.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
    
    # Cache the recommendations to avoid duplicate processing
    if cache_key:
        processed_opportunities_cache[cache_key] = recommendations
        
        # Limit cache size
        if len(processed_opportunities_cache) > 10:
            # Remove oldest entry
            oldest_key = next(iter(processed_opportunities_cache))
            del processed_opportunities_cache[oldest_key]
    
    return recommendations

# This is the function that your routes are looking for
async def generate_recommendations(company_url: str, company_description: str, opportunities: List[Dict[str, Any]], include_match_reason: bool = False) -> Dict[str, Any]:
    """Generate AI recommendations for the opportunities."""
    
    try:
        logger.info(f"Generating recommendations for company with {len(opportunities)} opportunities")
        
        # Check if client requested match reasons
        include_reasons = include_match_reason or any(req_param == "includeMatchReason" for req_param in opportunities[0] if isinstance(req_param, str))
        
        # Generate match scores for each opportunity
        recommendations = await generate_match_scores(company_url, company_description, opportunities, include_reasons)
        
        # Validate that we have recommendations
        if not recommendations:
            logger.warning("No recommendations were generated")
            recommendations = [{
                "id": "fallback-rec",
                "opportunityIndex": 0,
                "matchScore": 50,
                "title": "No recommendations available",
                "description": "Our system couldn't generate recommendations at this time.",
                "matchReason": "System generated fallback recommendation." if include_reasons else ""
            }]
            
        return {
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error in generate_recommendations: {str(e)}")
        # Return a valid structure even in case of error
        return {
            "recommendations": [{
                "id": "error-rec",
                "opportunityIndex": 0,
                "matchScore": 50,
                "title": "Error Generating Recommendations",
                "description": "An error occurred while generating recommendations.",
                "matchReason": "Error in recommendation generation process." if include_match_reason else ""
            }]
        }