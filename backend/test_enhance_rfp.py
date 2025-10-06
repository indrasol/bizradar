#!/usr/bin/env python3
"""
Test script for the enhance-rfp-with-ai endpoint
"""

import requests
import json

def test_enhance_rfp_endpoint():
    """Test the enhance-rfp-with-ai endpoint"""
    
    # Test data in the new format
    test_data = {
        "company_context": {
            "company_logo": "C:\\Users\\rdine\\Downloads\\bizradar_modules\\Indrasol company logo_.png",
            "company_website": "https://www.indrasol.com",
            "company_ceo": "Brahma Gupta",
            "company_name": "Indrasol",
            "company_street": "6101 Bollinger Canyon Rd, Suite 335 C",
            "company_city": "San Ramon",
            "company_state": "CA",
            "company_zip": "94583",
            "company_phone": "(510) 754-2001",
            "company_email": "bgupta@indrasol.com",
            "company_esign": "image8.gif"
        },
        "proposal_context": {
            "proposal_class": "Cybersecurity Assessment",
            "proposal_bid": "105-25",
            "proposal_org": "KENAI PENINSULA BOROUGH SCHOOL DISTRICT",
            "proposal_address": "Purchasing Department\n139 East Park Avenue\nSoldotna, Alaska 99669-7553",
            "proposal_phone": "(907) 714-8876",
            "proposal_due_date": "4:00 P.M., Alaska Time, February 7, 2025",
            "proposal_description": "The Kenai Peninsula Borough School District (KPBSD) is seeking a comprehensive cybersecurity assessment to evaluate its current cybersecurity posture, develop an improvement plan, and provide technical recommendations tailored to a public-sector K-12 school district.",
            "proposal_title": "Cybersecurity Assessment and Improvement Plan"
        },
        "pursuitId": "test-pursuit-123",
        "userId": "test-user-456"
    }
    
    # API endpoint URL
    url = "http://localhost:8000/enhance-rfp-with-ai"
    
    try:
        print("Testing enhance-rfp-with-ai endpoint...")
        print(f"URL: {url}")
        print(f"Request data: {json.dumps(test_data, indent=2)}")
        
        # Make the request
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=test_data,
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Response:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Error! Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the backend server is running on localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ Timeout error: Request took too long")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_enhance_rfp_endpoint() 