import os
import logging
import json
from typing import List, Dict, Any
from openai import OpenAI

logger = logging.getLogger(__name__)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy"))


def build_prompt(company_url: str, company_description: str, full_markdown: str, opportunity: Dict[str, Any], include_reason: bool = True) -> List[Dict[str, str]]:
    system_prompt = """
    You are an expert in business opportunity evaluation. Your job is to assess how well a company matches a specific opportunity based on its full profile and the opportunity's requirements.

    Respond ONLY in JSON format with the following keys:
    - matchScore (30-95)
    - title (short summary of the match)
    - description (3-4 sentence rationale for the score)
    - matchReason (1-line reason, optional if include_reason is false)
    - keyInsights: array of 3 specific points showing why this opportunity matches (or doesn't)
    - matchCriteria: array of {criterion, relevance (Strong/Partial/No match), notes}

    Focus on reasoning. Avoid vague or generic phrases.
    """

    user_content = f"""
    ### Company
    - URL: {company_url}
    - Description: {company_description}

    ### Company Profile Markdown
    {full_markdown}

    ### Opportunity
    - Title: {opportunity.get('title')}
    - Description: {opportunity.get('description')}
    - Skills Required: {opportunity.get('skills_required', 'N/A')}
    - Budget/Price: {opportunity.get('price_budget', 'N/A')}
    - Bids: {opportunity.get('bids_so_far', 'N/A')}
    - Additional: {opportunity.get('additional_details', '')}
    - Published: {opportunity.get('published_date')}
    """

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content.strip()}
    ]


def parse_response(response) -> Dict[str, Any]:
    try:
        # Check if response is empty or None
        if not response or not response.choices or not response.choices[0].message.content:
            logger.warning("Empty response received from OpenAI")
            return {
                "matchScore": 50,
                "title": "Partial Match",
                "description": "Could not generate full analysis due to empty response.",
                "matchReason": "Partial fit based on limited analysis",
                "keyInsights": ["Empty response", "Check opportunity manually", "Some match expected"],
                "matchCriteria": [
                    {"criterion": "Relevance", "relevance": "Partial match", "notes": "Empty response"}
                ]
            }

        # Try to parse the content
        content = response.choices[0].message.content.strip()
        if not content:
            logger.warning("Empty content in OpenAI response")
            return {
                "matchScore": 50,
                "title": "Partial Match",
                "description": "Could not generate full analysis due to empty content.",
                "matchReason": "Partial fit based on limited analysis",
                "keyInsights": ["Empty content", "Check opportunity manually", "Some match expected"],
                "matchCriteria": [
                    {"criterion": "Relevance", "relevance": "Partial match", "notes": "Empty content"}
                ]
            }

        # Try to parse JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")
            # Try to extract JSON-like content if the response is wrapped in markdown
            if content.startswith("```json"):
                content = content[7:]  # Remove ```json
            if content.endswith("```"):
                content = content[:-3]  # Remove ```
            try:
                return json.loads(content.strip())
            except json.JSONDecodeError:
                # If all parsing attempts fail, return a fallback response
                return {
                    "matchScore": 50,
                    "title": "Partial Match",
                    "description": "Could not parse AI response. Manual review recommended.",
                    "matchReason": "Partial fit based on limited analysis",
                    "keyInsights": ["Parsing failed", "Check opportunity manually", "Some match expected"],
                    "matchCriteria": [
                        {"criterion": "Relevance", "relevance": "Partial match", "notes": "Parsing fallback"}
                    ]
                }

    except Exception as e:
        logger.warning(f"Response parsing failed: {e}")
        return {
            "matchScore": 50,
            "title": "Partial Match",
            "description": "Could not parse full response. Some relevance exists.",
            "matchReason": "Partial fit based on limited analysis",
            "keyInsights": ["Parsing failed", "Check opportunity manually", "Some match expected"],
            "matchCriteria": [
                {"criterion": "Relevance", "relevance": "Partial match", "notes": "Parsing fallback"}
            ]
        }


async def generate_recommendations(company_url: str, company_description: str, opportunities: List[Dict[str, Any]], include_match_reason: bool = True):
    recommendations = []
    full_markdown = ""
    try:
        path = f"cache/company_{company_url.replace('https://', '').replace('http://', '').replace('/', '_')}.md"
        if os.path.exists(path):
            with open(path, "r") as f:
                full_markdown = f.read()
    except Exception as e:
        logger.warning(f"Markdown loading failed: {e}")

    for i, opportunity in enumerate(opportunities):
        messages = build_prompt(company_url, company_description, full_markdown, opportunity, include_match_reason)
        try:
            res = openai_client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.4,
                max_tokens=1000
            )
                    
            if not res or not res.choices:
                logger.warning(f"No response received for opportunity {i}")
                recommendations.append({
                    "id": f"rec-{i}",
                    "opportunityIndex": i,
                    "matchScore": 50,
                    "title": "Fallback Result",
                    "description": "Could not generate AI-based match.",
                    "matchReason": "System fallback",
                    "keyInsights": ["No analysis", "Fallback used", "Review manually"],
                    "matchCriteria": [{"criterion": "System", "relevance": "No match", "notes": "System error"}]
                })
                continue

            result = parse_response(res)
            recommendations.append({
                "id": f"rec-{i}",
                "opportunityIndex": i,
                "matchScore": result.get("matchScore", 50),
                "title": result.get("title", "Match Analysis"),
                "description": result.get("description", ""),
                "matchReason": result.get("matchReason", ""),
                "keyInsights": result.get("keyInsights", []),
                "matchCriteria": result.get("matchCriteria", [])
            })
        except Exception as e:
            logger.warning(f"OpenAI API failed for opportunity {i}: {e}")
            recommendations.append({
                "id": f"rec-{i}",
                "opportunityIndex": i,
                "matchScore": 50,
                "title": "Fallback Result",
                "description": "Could not generate AI-based match.",
                "matchReason": "System fallback",
                "keyInsights": ["No analysis", "Fallback used", "Review manually"],
                "matchCriteria": [{"criterion": "System", "relevance": "No match", "notes": "System error"}]
            })

    return {"recommendations": recommendations}