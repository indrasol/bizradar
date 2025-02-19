import asyncio
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import logging
import json
import os
from fastapi import HTTPException
from openai import AsyncOpenAI
from dotenv import load_dotenv
import urllib.parse
import aiohttp
from bs4 import BeautifulSoup
import bs4

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def scrape_freelancer(query: str):
    loop = asyncio.get_event_loop()
    
    def sync_scrape_freelancer(query: str):
        try:
            # Use the exact query for the URL
            url = f"https://www.freelancer.com/jobs/?keyword={query}"  # Directly use the query
            logger.info(f"Searching Freelancer with URL: {url}")

            chrome_options = Options()
            chrome_options.add_argument("--headless")
            driver = webdriver.Chrome(options=chrome_options)

            driver.get(url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "JobSearchCard-item"))
            )

            opportunities = []
            job_cards = driver.find_elements(By.CLASS_NAME, "JobSearchCard-item")[:2]

            for job_card in job_cards:
                try:
                    title = job_card.find_element(By.CLASS_NAME, "JobSearchCard-primary-heading-link").text.strip()
                    days_left = job_card.find_element(By.CLASS_NAME, "JobSearchCard-primary-heading-days").text.strip()
                    avg_bid = job_card.find_element(By.CLASS_NAME, "JobSearchCard-primary-price").text.strip()

                    opportunities.append({
                        "title": title,
                        "days_left": days_left,
                        "avg_bid": avg_bid
                    })

                except Exception as e:
                    logger.error(f"Error extracting job card: {e}")
                    continue

            driver.quit()
            return {"count": len(opportunities), "opportunities": opportunities}

        except Exception as e:
            logger.error(f"Error fetching from Freelancer: {str(e)}")
            return {"count": 0, "opportunities": []}

    result = await loop.run_in_executor(None, sync_scrape_freelancer, query)
    return result

async def scrape_all_platforms(query):
    # Call both scraping functions asynchronously
    results = await asyncio.gather(
        # scrape_sam_gov(query),
        scrape_freelancer(query)
    )
    return results 

async def fetch_fpds_opportunities(query: str):
    """
    Fetch contract opportunities from FPDS (Federal Procurement Data System).
    
    Args:
        query (str): Search query string with keywords separated by 'OR'
    
    Returns:
        dict: Dictionary containing the count of opportunities and a list of up to 2 sample opportunities
    """
    try:
        # Format the query for FPDS search URL
        formatted_query = " OR ".join(f'"{term.strip()}"' if " " in term else term for term in query.split(" OR "))
        logger.info(f"Formatted FPDS query: {formatted_query}")

        # FPDS search URL and parameters
        url = "https://www.fpds.gov/ezsearch/search.do"
        params = {
            'indexName': 'awardfull',
            'templateName': '1.5.3',
            's': 'FPDS.GOV',
            'q': formatted_query
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }

        # Fetch data from FPDS
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    html_content = await response.text()
                    soup = BeautifulSoup(html_content, 'html.parser')

                    # Extract opportunities
                    opportunities = []
                    for opp in soup.find_all('table', class_=['resultbox1', 'resultbox2'])[:2]:  # Limit to 2 opportunities
                        try:
                            opportunity = {}

                            # Extract required fields
                            fields = [
                                ('Legal Business Name', 'legal_business_name'),
                                ('Date Signed', 'date_signed'),
                                ('Entity City', 'entity_city'),
                                ('Entity State', 'entity_state'),
                                ('Unique Entity ID', 'unique_entity_id'),
                                ('Contracting Office Name', 'contracting_office'),
                                ('Award Type', 'award_type')
                            ]

                            for field_label, field_key in fields:
                                label = opp.find('span', class_='results_title_text', text=f"{field_label}:")
                                if label:
                                    value = label.find_parent('td').find_next_sibling('td').text.strip()
                                    opportunity[field_key] = value

                            opportunities.append(opportunity)

                        except Exception as e:
                            logger.error(f"Error extracting opportunity: {e}")
                            continue

                    return {"count": len(opportunities), "opportunities": opportunities}

                else:
                    logger.error(f"FPDS request failed with status code: {response.status}")
                    return {"count": 0, "opportunities": []}

    except Exception as e:
        logger.error(f"Error fetching from FPDS: {str(e)}")
        return {"count": 0, "opportunities": []}

# Main function for testing
if __name__ == "__main__":
    query = "graphic design OR web development"
    result = asyncio.run(scrape_freelancer(query))
    print("Scraped Results:", result)
