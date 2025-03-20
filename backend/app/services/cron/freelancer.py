"""
Freelancer.com scraper module for scheduled data collection
"""
import os
import requests
from bs4 import BeautifulSoup
import re
import pandas as pd
import psycopg2
import logging
import sys
from .constants import (
    FREELANCER_URL, 
    DEFAULT_HEADERS, 
    FREELANCER_SELECTORS, 
    FREELANCER_TABLE
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('freelancer_scraper')

def run_scraper():
    """Main function to scrape Freelancer.com and store data in the database"""
    
    # Get configuration from constants
    url = FREELANCER_URL
    headers = DEFAULT_HEADERS
    selectors = FREELANCER_SELECTORS
    
    # Send a request
    try:
        logger.info(f"Sending request to {url}")
        response = requests.get(url, headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            logger.info("✅ Request was successful!")
        else:
            logger.error(f"❌ Request failed with status code: {response.status_code}")
            return {"source": "freelancer", "status": "error", "message": f"HTTP {response.status_code}"}
            
        # Parse the HTML content
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find all project listings
        projects = soup.find_all(selectors["project_item"])
        logger.info(f"🔍 Total Projects Found: {len(projects)}")
        
        # Initialize an empty list to store extracted project details
        projects_data_cleaned = []
        
        # Loop through each project listing and extract details
        for project in projects:
            try:
                # Extract title
                title_element = project.find(selectors["title"], class_=selectors["title_class"])
                title = title_element.text.strip() if title_element else "No Title"
                
                # Extract price and clean unnecessary text
                price_element = project.find(selectors["price"])
                price = re.sub(r"\s+Avg Bid\s*", "", price_element.text.strip().split("\n")[0]) if price_element else "No Price"
                
                # Extract number of bids and clean text
                bids_element = project.find(selectors["bids"])
                bids = re.sub(r"\s+Bids\s*", "", bids_element.text.strip().split("\n")[0]) if bids_element else "No Bids"
                
                # Extract skills
                skills_elements = project.find_all(selectors["skills"])
                skills = ", ".join([skill.text.strip() for skill in skills_elements]) if skills_elements else "No Skills Listed"
                
                # Extract and clean additional details
                additional_details_element = project.find(selectors["details"])
                additional_details = re.sub(r"\s+", " ", additional_details_element.text.strip()) if additional_details_element else "No Additional Details"
                
                # Append cleaned details to the list
                projects_data_cleaned.append({
                    "Title": title,
                    "Price": price,
                    "Bids": bids,
                    "Skills Required": skills,
                    "Additional Details": additional_details
                })
                
            except Exception as e:
                logger.warning(f"⚠️ Error extracting project details: {e}")
                
        # Convert extracted data to DataFrame
        df = pd.DataFrame(projects_data_cleaned)
        
        # Database connection
        try:
            # Get database connection from environment variables
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                database=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD")
            )
            cursor = conn.cursor()
            logger.info("✅ Connection to PostgreSQL successful!")
            
            # SQL query to create a table
            create_table_query = f'''
            CREATE TABLE IF NOT EXISTS {FREELANCER_TABLE} (
                id SERIAL PRIMARY KEY,
                title TEXT,
                price TEXT,
                bids TEXT,
                skills_required TEXT,
                additional_details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            '''
            cursor.execute(create_table_query)
            conn.commit()
            logger.info("✅ Table verified successfully!")
            
            # Insert data into PostgreSQL
            insert_count = 0
            for _, row in df.iterrows():
                insert_query = f'''
                INSERT INTO {FREELANCER_TABLE} (title, price, bids, skills_required, additional_details)
                VALUES (%s, %s, %s, %s, %s)
                '''
                cursor.execute(insert_query, (
                    row['Title'],
                    row['Price'],
                    row['Bids'],
                    row['Skills Required'],
                    row['Additional Details']
                ))
                insert_count += 1
                
            conn.commit()
            logger.info(f"✅ {insert_count} records successfully inserted into the database!")
            
            # Close the connection
            cursor.close()
            conn.close()
            logger.info("✅ PostgreSQL connection closed.")
            
            return {
                "source": "freelancer", 
                "status": "success", 
                "count": insert_count
            }
            
        except Exception as e:
            logger.error(f"❌ Database error: {e}")
            return {
                "source": "freelancer", 
                "status": "error", 
                "message": f"Database error: {str(e)}"
            }
            
    except Exception as e:
        logger.error(f"❌ Scraping error: {e}")
        return {
            "source": "freelancer", 
            "status": "error", 
            "message": f"Scraping error: {str(e)}"
        }


# This allows the script to be run directly or imported as a module
if __name__ == "__main__":
    result = run_scraper()
    print(result)