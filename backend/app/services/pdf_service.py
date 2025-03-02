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

def generate_rfp_pdf(contract_id, title, agency, platform, value, due_date, status, naics_code, output_path, logo_path):
    """
    Generate a PDF for a Request for Proposal (RFP) based on provided contract details.
    """
    # Create PDF with the provided output path
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setFont("Helvetica", 12)

    # Add logo as header if it exists
    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            logo_width, logo_height = logo.getSize()
            aspect_ratio = logo_width / logo_height
            logo_height = 100  # Increased from 50 to 100 points
            logo_width = logo_height * aspect_ratio  # Maintain aspect ratio
            center_x = (A4[0] - logo_width) / 2
            # Moved up slightly to give more space at the top
            c.drawImage(logo, center_x, 740 - logo_height, width=logo_width, height=logo_height)
        except Exception as e:
            print(f"Failed to load or draw the logo: {e}")
    else:
        print(f"Logo path not found: {logo_path}")

    # Prepare dynamic RFP content
    content = [
        f"Agency/Client: {agency}",
        f"Date: {datetime.now().strftime('%Y-%m-%d')}",
        "PROJECT DETAILS",
        f"Project Title: {title}",
        f"Description: Proposal for the {title}, which is required by the {agency}.",
        "KEY REQUIREMENTS",
        f"Experience with systems relevant to {naics_code}, timeline of 6 months.",
        "SUBMISSION DETAILS",
        "Bid/Proposal Guidelines: Detailed proposal including all technical and financial aspects.",
        "Evaluation Criteria: Cost, technical suitability, timeline, and past performance.",
        "METADATA",
        f"Budget: ${value:,}",
        f"Submission Deadline: {due_date.strftime('%B %d, %Y')}",
        "Required Skills: As per the requirements specified in the project details.",
        "Signature: ______________________"
    ]

    # Write content to the PDF
    y_position = 700  # Start below the logo
    c.setFont("Helvetica-Bold", 14)
    for line in content:
        if line in ["PROJECT DETAILS", "KEY REQUIREMENTS", "SUBMISSION DETAILS", "METADATA"]:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y_position, line)
            y_position -= 20
            c.setFont("Helvetica", 12)
        else:
            c.drawString(50, y_position, line)
            y_position -= 15

    c.save()
    return output_path

# Example usage
if __name__ == "__main__":
    generate_rfp_pdf(
        contract_id="gov-1",
        title="Cybersecurity Infrastructure Upgrade",
        agency="Department of Defense",
        platform="SAM.gov",
        value=2500000,
        due_date=datetime.strptime("2024-04-15", "%Y-%m-%d"),
        status="Open",
        naics_code="541512",
        output_path="gov-1_rfp.pdf",
        logo_path="path/to/logo.jpg"
    )
