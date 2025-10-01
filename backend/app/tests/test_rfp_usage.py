import requests
import json
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEST_USER_ID = os.getenv("TEST_USER_ID", "your-test-user-id")  # Replace with a real user ID for testing

# Test endpoints
def test_get_usage_status():
    """Test getting the RFP usage status for a user"""
    url = f"{API_BASE_URL}/api/rfp-usage/status?user_id={TEST_USER_ID}"
    print(f"Testing GET {url}")
    
    response = requests.get(url)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print(f"Monthly limit: {data.get('monthly_limit')}")
        print(f"Current usage: {data.get('current_usage')}")
        print(f"Remaining: {data.get('remaining')}")
        print(f"Limit reached: {data.get('limit_reached')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def test_check_opportunity(opportunity_id):
    """Test checking if a user can generate a report for a specific opportunity"""
    url = f"{API_BASE_URL}/api/rfp-usage/check-opportunity/{opportunity_id}?user_id={TEST_USER_ID}"
    print(f"Testing GET {url}")
    
    response = requests.get(url)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print(f"Can generate: {data.get('can_generate')}")
        print(f"Reason: {data.get('reason')}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def test_record_usage(opportunity_id):
    """Test recording usage for a specific opportunity"""
    url = f"{API_BASE_URL}/api/rfp-usage/record/{opportunity_id}?user_id={TEST_USER_ID}"
    print(f"Testing POST {url}")
    
    response = requests.post(url)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        print(f"Success: {data.get('success')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200

def run_full_test_flow():
    """Run a full test flow to verify all endpoints"""
    print("\n=== Testing RFP Usage API Endpoints ===\n")
    
    # Step 1: Get initial usage status
    print("\n--- Step 1: Get initial usage status ---")
    if not test_get_usage_status():
        print("❌ Failed to get usage status")
        return False
    
    # Step 2: Check opportunity status for a new opportunity
    opportunity_id = 12345  # Replace with a real opportunity ID for testing
    print(f"\n--- Step 2: Check opportunity status for opportunity {opportunity_id} ---")
    if not test_check_opportunity(opportunity_id):
        print("❌ Failed to check opportunity status")
        return False
    
    # Step 3: Record usage for the opportunity
    print(f"\n--- Step 3: Record usage for opportunity {opportunity_id} ---")
    if not test_record_usage(opportunity_id):
        print("❌ Failed to record usage")
        return False
    
    # Step 4: Check updated usage status
    print("\n--- Step 4: Check updated usage status ---")
    time.sleep(1)  # Give the database a moment to update
    if not test_get_usage_status():
        print("❌ Failed to get updated usage status")
        return False
    
    # Step 5: Check opportunity status again (should be existing_report)
    print(f"\n--- Step 5: Check opportunity status again for opportunity {opportunity_id} ---")
    if not test_check_opportunity(opportunity_id):
        print("❌ Failed to check opportunity status again")
        return False
    
    print("\n✅ All tests completed successfully!")
    return True

if __name__ == "__main__":
    run_full_test_flow()
