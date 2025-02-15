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

# Main function for testing
if __name__ == "__main__":
    query = "graphic design OR web development"
    result = asyncio.run(scrape_freelancer(query))
    print("Scraped Results:", result)
