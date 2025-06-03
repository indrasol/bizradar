"""
Freelancer.com scraper module for scheduled data collection
"""
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np
import re
from utils.db_utils import get_db_connection

# Retry strategy for network resilience
retry_strategy = Retry(
    total=3,
    backoff_factor=2,
    status_forcelist=[429, 500, 502, 503, 504],
    raise_on_status=False
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session = requests.Session()
session.mount("https://", adapter)
session.mount("http://", adapter)

# Step 1: Scrape multiple pages
headers = {"User-Agent": "Mozilla/5.0"}
base_url = "https://www.freelancer.com/search/projects?projectLanguages=en&projectSkills=305&page="
all_projects = []
page = 1
max_pages = 10

while page <= max_pages:
    url = base_url + str(page)
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ Page {page} failed:", e)
        page += 1
        continue

    soup = BeautifulSoup(response.text, "html.parser")
    projects = soup.find_all("div", class_="JobSearchCard-item")

    if not projects:
        break

    all_projects.extend(projects)
    page += 1

print(f"\n🎯 Total projects scraped from {page-1} pages: {len(all_projects)}")

# Step 2: Extract project details
projects_data_cleaned = []

for project in all_projects:
    try:
        title_element = project.find("a", class_="JobSearchCard-primary-heading-link")
        title = title_element.text.strip() if title_element else "No Title"
        job_url = "https://www.freelancer.com" + title_element["href"] if title_element and title_element.has_attr("href") else None

        published_element = project.find("span", class_="JobSearchCard-primary-heading-days")
        published_date = published_element.text.strip() if published_element else "No Published Date"

        price_element = project.find("div", class_="JobSearchCard-secondary-price")
        price = re.sub(r"\s+Avg Bid\s*", "", price_element.text.strip()) if price_element else "No Price"

        bids_element = project.find("div", class_="JobSearchCard-secondary-entry")
        bids = re.sub(r"\s+Bids\s*", "", bids_element.text.strip()) if bids_element else "No Bids"

        skills_elements = project.find_all("a", class_="JobSearchCard-primary-tagsLink")
        skills = ", ".join([skill.text.strip() for skill in skills_elements]) if skills_elements else "No Skills Listed"

        details_element = project.find("p", class_="JobSearchCard-primary-description")
        additional_details = re.sub(r"\s+", " ", details_element.text.strip()) if details_element else "No Additional Details"

        projects_data_cleaned.append({
            "Job URL": job_url,
            "Title": title,
            "Published Date": published_date,
            "Skills Required": skills,
            "Price/Budget": price,
            "Bids so Far": bids,
            "Additional Details": additional_details
        })

    except Exception as e:
        print(f"⚠️ Error extracting project: {e}")

df = pd.DataFrame(projects_data_cleaned)

# Step 3: Clean and preprocess
df_cleaned = df.copy()

# Clean null characters
df_cleaned = df_cleaned.applymap(lambda x: x.replace('\x00', '') if isinstance(x, str) else x)

# Strip whitespace and normalize
text_cols = ['Title', 'Published Date', 'Skills Required', 'Bids so Far', 'Additional Details']
for col in text_cols:
    df_cleaned[col] = df_cleaned[col].astype(str).str.strip()
df_cleaned['Title'] = df_cleaned['Title'].str.title()

# Clean price
def clean_price(price):
    if pd.isnull(price):
        return np.nan
    cleaned = re.sub(r'[^\d.]', '', str(price))
    try:
        return float(cleaned)
    except:
        return np.nan

df_cleaned['Price/Budget'] = df_cleaned['Price/Budget'].apply(clean_price)
df_cleaned['Bids so Far'] = df_cleaned['Bids so Far'].str.extract(r'(\d+)').astype(float)

# Convert Published Date to hours
def convert_to_hours(text):
    if 'hour' in text.lower():
        match = re.search(r'(\d+)', text)
        return int(match.group(1)) if match else np.nan
    elif 'day' in text.lower():
        match = re.search(r'(\d+)', text)
        return int(match.group(1)) * 24 if match else np.nan
    else:
        return np.nan

df_cleaned['Hours Left'] = df_cleaned['Published Date'].apply(convert_to_hours)
df_cleaned.drop_duplicates(subset=['Job URL'], keep='first', inplace=True)

# Step 4: Upload to Supabase PostgreSQL
try:
    conn = get_db_connection()
    cursor = conn.cursor()
    print("✅ Connected to PostgreSQL successfully!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    raise

# Create table


cursor.execute('''
CREATE TABLE freelancer_data_table (
    id SERIAL PRIMARY KEY,
    job_url TEXT UNIQUE,
    title TEXT,
    published_date TEXT,
    skills_required TEXT,
    price_budget TEXT,
    bids_so_far TEXT,
    additional_details TEXT
);
''')
conn.commit()
print("✅ Table created: freelancer_data_table")

# Insert data
def clean_nul(value):
    if isinstance(value, str):
        return value.replace('\x00', '')
    return value

for _, row in df_cleaned.iterrows():
    insert_query = '''
    INSERT INTO freelancer_data_table (
        job_url, title, published_date, skills_required,
        price_budget, bids_so_far, additional_details
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (job_url) DO NOTHING;
    '''
    cursor.execute(insert_query, (
        clean_nul(row['Job URL']),
        clean_nul(row['Title']),
        clean_nul(row['Published Date']),
        clean_nul(row['Skills Required']),
        clean_nul(str(row['Price/Budget'])),
        clean_nul(str(row['Bids so Far'])),
        clean_nul(row['Additional Details'])
    ))

conn.commit()
print("✅ Data successfully inserted into Supabase!")

# Preview inserted data
cursor.execute("SELECT * FROM freelancer_data_table LIMIT 5;")
rows = cursor.fetchall()
for row in rows:
    print(row)
