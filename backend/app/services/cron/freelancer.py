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
            
            # Query to check for existing records
            existing_count_query = f"SELECT COUNT(*) FROM {FREELANCER_TABLE};"
            cursor.execute(existing_count_query)
            existing_records = cursor.fetchone()[0]
            logger.info(f"Existing records in database: {existing_records}")
            
            # Insert data into PostgreSQL
            insert_count = 0
            new_record_count = 0
            for _, row in df.iterrows():
                # Check if project title already exists
                check_query = f"SELECT COUNT(*) FROM {FREELANCER_TABLE} WHERE title = %s"
                cursor.execute(check_query, (row['Title'],))
                count = cursor.fetchone()[0]
                
                if count == 0:
                    # This is a new record
                    new_record_count += 1
                
                # Insert or update record
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
            logger.info(f"✅ {new_record_count} new records identified!")
            
            # Prepare the result dictionary
            result = {
                "source": "freelancer", 
                "status": "success", 
                "count": insert_count,
                "new_count": new_record_count
            }
            
            # Update ETL history
            update_etl_history(result)
            
            # Close the connection
            cursor.close()
            conn.close()
            logger.info("✅ PostgreSQL connection closed.")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Database error: {e}")
            result = {
                "source": "freelancer", 
                "status": "error", 
                "message": f"Database error: {str(e)}"
            }
            update_etl_history(result)
            return result
            
    except Exception as e:
        logger.error(f"❌ Scraping error: {e}")
        result = {
            "source": "freelancer", 
            "status": "error", 
            "message": f"Scraping error: {str(e)}"
        }
        update_etl_history(result)
        return result

def update_etl_history(results):
    """Update the most recent ETL history record with results from Freelancer scraping"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cursor = conn.cursor()
        
        # Find the most recent 'triggered' record
        query = """
        SELECT id FROM etl_history 
        WHERE status = 'triggered' 
        ORDER BY time_fetched DESC LIMIT 1
        """
        cursor.execute(query)
        result = cursor.fetchone()
        
        if not result:
            logger.warning("No triggered ETL history records found to update")
            return
            
        record_id = result[0]
        
        # Get current record values
        current_query = """
        SELECT sam_gov_count, sam_gov_new_count FROM etl_history
        WHERE id = %s
        """
        cursor.execute(current_query, (record_id,))
        current_values = cursor.fetchone()
        sam_gov_count = current_values[0] if current_values else 0
        sam_gov_new_count = current_values[1] if current_values else 0
        
        # Update with the results
        update_query = """
        UPDATE etl_history 
        SET 
            status = %s,
            freelancer_count = %s,
            freelancer_new_count = %s,
            total_records = %s
        WHERE id = %s
        """
        
        freelancer_count = results.get('count', 0)
        freelancer_new_count = results.get('new_count', 0)
        total_records = freelancer_count + sam_gov_count
        status = 'success' if results.get('status') == 'success' else 'failed'
        
        cursor.execute(update_query, (
            status,
            freelancer_count,
            freelancer_new_count,
            total_records,
            record_id
        ))
        
        conn.commit()
        logger.info(f"Successfully updated ETL history record {record_id}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"Error updating ETL history: {str(e)}")


# This allows the script to be run directly or imported as a module
if __name__ == "__main__":
    result = run_scraper()
    print(result)