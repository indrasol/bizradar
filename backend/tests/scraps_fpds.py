# tests/scrape_fpds.py

import requests
from bs4 import BeautifulSoup
import json

def scrape_fpds_award(award_id):
    # Construct the URL for the specific FPDS award
    url = f"https://www.fpds.gov/ezsearch/search.do?q=graphic+design+PIID%3A%22{award_id}%22"
    print(f"Fetching data from: {url}")

    # Send a GET request to the award URL
    response = requests.get(url)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the award details table
        award_details = soup.find('table', class_='resultbox1')
        
        if award_details:
            # Create a dictionary to hold all award data
            award_data = {}

            # Extract relevant information from the table rows
            rows = award_details.find_all('tr')
            for row in rows:
                columns = row.find_all('td')
                if len(columns) >= 2:
                    title = columns[0].get_text(strip=True).replace('\n', '')
                    value = columns[1].get_text(strip=True).replace('\n', '')
                    award_data[title] = value

            # Print all extracted data in JSON format
            print("Award Data:", json.dumps(award_data, indent=4))
        else:
            print("No award details found.")
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")

if __name__ == "__main__":
    award_id = "00654199206BV654P2916"  # Replace with the actual award ID you want to scrape
    scrape_fpds_award(award_id)