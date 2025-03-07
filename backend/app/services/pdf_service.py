import os
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

def generate_rfp_pdf(contract_id, title, agency, platform, value, due_date, status, naics_code, output_path, logo_path=None):
    """
    Generate a PDF for a Request for Proposal based on provided contract details.
    """
    try:
        # Create directory for output file if it doesn't exist
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Create PDF canvas with A4 page size
        c = canvas.Canvas(output_path, pagesize=A4)
        
        # Check for logo in multiple locations if not provided or not found
        logo_found = False
        
        if not logo_path or not os.path.exists(logo_path):
            # List of possible logo locations
            possible_logo_paths = [
                os.path.join(os.path.dirname(__file__), "static", "logo.jpg"),
                os.path.join(os.path.dirname(__file__), "..", "static", "logo.jpg"),
                os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.jpg"),
                os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo.png"),
                os.path.join(os.path.dirname(__file__), "..", "public", "logo.jpg"),
                "/app/frontend/public/logo.jpg",  # Docker container path
                os.path.abspath("frontend/public/logo.jpg"),
                os.path.abspath("public/logo.jpg"),
            ]
            
            for path in possible_logo_paths:
                if os.path.exists(path):
                    logo_path = path
                    logo_found = True
                    print(f"Found logo at: {logo_path}")
                    break
        else:
            logo_found = True
        
        # Draw logo if found
        if logo_found and logo_path and os.path.exists(logo_path):
            try:
                logo = ImageReader(logo_path)
                logo_width, logo_height = logo.getSize()
                aspect_ratio = logo_width / logo_height
                logo_width = 100 * aspect_ratio  # Scale width based on height of 100
                c.drawImage(logo, (A4[0] - logo_width) / 2, 750, width=logo_width, height=100)
                print(f"Logo added successfully from {logo_path}")
            except Exception as e:
                print(f"Error adding logo: {str(e)}")
        else:
            print(f"Logo not found or could not be loaded. Tried: {logo_path}")
        
        # Set title and document heading - using only standard fonts
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(A4[0]/2, 720, "REQUEST FOR PROPOSAL")
        c.drawCentredString(A4[0]/2, 700, title)
        
        # Add content with better formatting
        c.setFont("Helvetica-Bold", 12)
        labels = ["Contract ID:", "Agency:", "Platform:", "Value:", "Due Date:", "Status:", "NAICS Code:"]
        values = [
            contract_id,
            agency,
            platform,
            f"${value:,}",
            due_date.strftime('%Y-%m-%d'),
            status,
            naics_code
        ]
        
        y_position = 650
        for label, value in zip(labels, values):
            # Draw label in bold
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y_position, label)
            
            # Draw value in regular font
            c.setFont("Helvetica", 12)
            c.drawString(150, y_position, str(value))
            
            y_position -= 25
        
        # Add footer - using standard Helvetica instead of Helvetica-Italic
        c.setFont("Helvetica", 8)
        c.drawCentredString(A4[0]/2, 30, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Save the PDF
        c.save()
        print(f"PDF successfully generated at {output_path}")
        
        return output_path
    except Exception as e:
        import traceback
        print(f"Error generating PDF: {str(e)}")
        traceback.print_exc()
        raise e