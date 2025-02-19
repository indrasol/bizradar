# tests/scrape_freelancer.py

import requests
from bs4 import BeautifulSoup
import json

def scrape_freelancer_job_card(job_card_url):
    print(f"Fetching data from: {job_card_url}")

    # Send a GET request to the job card URL
    response = requests.get(job_card_url)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find the job card container
        job_card = soup.find('div', class_='Card-body PageProjectViewLogout-projectDetails-card')
        
        if job_card:
            # Create a dictionary to hold all job data
            job_data = {}

            # Extract title
            job_data['title'] = job_card.find('h1', class_='PageProjectViewLogout-projectInfo-title').text.strip().replace('\n', '')

            # Extract delivery info
            delivery_info = job_card.find('div', class_='PageProjectViewLogout-projectInfo-label-deliveryInfo')
            if delivery_info:
                job_data['status'] = delivery_info.find('span', class_='promotion-tag').text.strip().replace('\n', '')
                job_data['posted'] = delivery_info.find('span', class_='PageProjectViewLogout-projectInfo-label-deliveryInfo-relativeTime').text.strip().replace('\n', '')
                job_data['payment_info'] = delivery_info.find('span', class_='PageProjectViewLogout-projectInfo-label-deliveryInfo-payment').text.strip().replace('\n', '')
                job_data['ends_in'] = delivery_info.find('span', class_='PageProjectViewLogout-projectInfo-label-deliveryInfo-remainingDays').text.strip().replace('\n', '')

            # Extract price range
            price_range = job_card.find('p', class_='PageProjectViewLogout-projectInfo-byLine')
            if price_range:
                job_data['price_range'] = price_range.text.strip().replace('\n', '')

            # Extract project description
            description = job_card.find('div', class_='PageProjectViewLogout-detail')
            if description:
                job_data['description'] = description.find_all('p')[1].text.strip().replace('\n', '')  # Assuming the second <p> contains the description

            # Extract tags
            tags = job_card.find('p', class_='PageProjectViewLogout-detail-tags')
            if tags:
                job_data['tags'] = [tag.text.strip().replace('\n', '') for tag in tags.find_all('a', class_='PageProjectViewLogout-detail-tags-link--highlight')]

            # Extract project ID
            project_id = job_card.find('p', class_='PageProjectViewLogout-detail-projectId')
            if project_id:
                job_data['project_id'] = project_id.text.strip().replace('\n', '')

            # Extract additional project details
            about_project = job_card.find('h3', class_='PageProjectViewLogout-detail-summary-heading')
            if about_project:
                job_data['about_project'] = about_project.find_next('div').text.strip().replace('\n', '')

            # Print all extracted data in JSON format
            print("Job Data:", json.dumps(job_data, indent=4))
        else:
            print("No job card found.")
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")

if __name__ == "__main__":
    job_card_url = "https://www.freelancer.com/projects/graphic-design/modern-peacock-logo-for-insurance-39112513"
    scrape_freelancer_job_card(job_card_url)