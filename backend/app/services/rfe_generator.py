import os
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from dotenv import load_dotenv
import openai

# Load environment variables from .env file
load_dotenv()

# Retrieve OpenAI API key from .env
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in .env file")
openai.api_key = OPENAI_API_KEY

# Business context
BUSINESS_CONTEXT = """
Bizradar is a leading technology solutions provider specializing in customer relationship management (CRM) systems, cloud computing, and API integrations. We serve enterprise clients globally, focusing on innovative, scalable solutions to enhance business efficiency and customer engagement. Our mission is to deliver cutting-edge CRM implementations that drive growth for our clients.
"""

# Dummy RFP content for the PDF
CONTENT = [
    "Agency/Client: TechSolutions Inc",
    "Date: " + datetime.now().strftime('%Y-%m-%d'),
    "PROJECT DETAILS",
    "Project Title: Enterprise CRM Implementation",
    "Description: CRM system for 500+ users, integrate with ERP.",
    "KEY REQUIREMENTS",
    "Experience with Salesforce, 6-month timeline.",
    "SUBMISSION DETAILS",
    "Bid/Proposal Guidelines: Detailed proposal, experience-based evaluation.",
    "Evaluation Criteria: Cost, technical suitability, and timeline.",
    "METADATA",
    "Budget: $150,000 - $200,000",
    "Submission Deadline: March 15, 2025",
    "Required Skills: Salesforce, Cloud Computing, API Integration",
    "Signature: ______________________"
]

def create_pdf_with_content(output_path, logo_path):
    """Create a PDF file with specified content and a logo as the header."""
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setFont("Helvetica", 12)

    # Add logo as header if it exists
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            logo_width, logo_height = logo.getSize()
            aspect_ratio = logo_width / logo_height
            logo_height = 50  # Set the logo height to 50 points
            logo_width = logo_height * aspect_ratio  # Maintain aspect ratio
            # Calculate horizontal centering for the logo
            center_x = (A4[0] - logo_width) / 2
            c.drawImage(logo, center_x, 780 - logo_height, width=logo_width, height=logo_height)
        except Exception as e:
            print(f"Failed to load or draw the logo: {e}")
    else:
        print(f"Logo path not found: {logo_path}")

    # Add content below the logo
    y_position = 700  # Adjust this based on your logo's actual height
    c.setFont("Helvetica-Bold", 14)
    for line in CONTENT:
        if line in ["PROJECT DETAILS", "KEY REQUIREMENTS", "SUBMISSION DETAILS", "METADATA"]:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y_position, line)
            y_position -= 20
            c.setFont("Helvetica", 12)
        else:
            c.drawString(50, y_position, line)
            y_position -= 15

    c.save()

def main():
    logo_path = '../../../frontend/public/logo.jpg'  # Corrected path
    output_path = 'filled_rfp.pdf'
    create_pdf_with_content(output_path, logo_path)
    print(f"Generated filled RFP with logo at: {output_path}")

if __name__ == "__main__":
    main()
