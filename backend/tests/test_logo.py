from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

def test_logo_display():
    output_path = 'test_logo.pdf'
    logo_path = '../../frontend/public/logo.jpg'
    page_width, page_height = A4  # A4 dimensions are 595 x 842 points

    c = canvas.Canvas(output_path, pagesize=A4)
    try:
        logo = ImageReader(logo_path)
        logo_width, logo_height = logo.getSize()
        aspect_ratio = logo_width / logo_height
        logo_height = 50  # Set the logo height to 50 points
        logo_width = logo_height * aspect_ratio  # Maintain aspect ratio

        # Center the logo horizontally and adjust vertical position
        logo_x = (page_width - logo_width) / 2  # Center horizontally
        logo_y = page_height - logo_height - 30  # Adjust vertical position from top, 30 points down

        c.drawImage(logo, logo_x, logo_y, width=logo_width, height=logo_height)
        c.drawString((page_width - 180) / 2, logo_y - 20, 'Logo should appear above this text.')  # Center this text too

        c.save()
        # print("Test PDF generated with logo.")
    except Exception as e:
        print(f"Failed to load or draw the logo: {e}")

if __name__ == "__main__":
    test_logo_display()
