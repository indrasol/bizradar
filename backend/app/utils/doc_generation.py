import json
import os
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Cm
import logging
import os
from docxcompose.composer import Composer
from docx import Document as Document_compose
from docx2pdf import convert as docx2pdf_convert

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

import tempfile
import shutil

def generate_merge_and_convert_report(enhanced_data, templates_dir):
    """
    Renders all templates with enhanced_data, merges them into a single DOCX file,
    and converts the merged DOCX to PDF.
    Returns the paths to the merged DOCX and PDF files.
    """
    temp_output_dir = tempfile.mkdtemp(prefix="rfp_rendered_")
    try:
        # Render all templates
        render_proposal(enhanced_data, templates_dir, temp_output_dir)
        
        # Create a temporary file for the merged DOCX
        temp_merged_file = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        temp_merged_file.close()
        
        # Merge all rendered documents
        merge_documents(temp_output_dir, temp_merged_file.name)
        
        # Convert merged DOCX to PDF
        temp_pdf_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_pdf_file.close()
        docx2pdf_convert(temp_merged_file.name, temp_pdf_file.name)
        
        return temp_merged_file.name, temp_pdf_file.name
    finally:
        shutil.rmtree(temp_output_dir)
        

def _prepare_image_context_for_template(tpl, base_context):
    """
    Prepares a copy of the context for a specific DocxTemplate instance.
    Image handling is currently disabled; only text will be inserted.
    """
    render_context = base_context.copy()

    # Normalize 'proposal_calss_image' to 'proposal_class_image' if present
    if "proposal_calss_image" in render_context and "proposal_class_image" not in render_context:
        render_context["proposal_class_image"] = render_context.pop("proposal_calss_image")

    # --- Image handling is disabled ---
    # image_configs = {
    #     # Key in context: width in Cm
    #     "company_logo": Cm(10),
    #     "company_logo_header": Cm(2.5),
    #     "company_esign": Cm(5),
    #     "cert_elig": Cm(15),
    #     "proposal_class_image": Cm(15),
    # }
    #
    # for key, size_cm in image_configs.items():
    #     if key in render_context and isinstance(render_context[key], str):
    #         image_path_value = render_context[key]
    #         cleaned_path = image_path_value.replace("alaska-kpbsd-psl.docx_", "")
    #         base_name, ext = os.path.splitext(cleaned_path)
    #         if not ext:
    #             final_image_path = cleaned_path + ".png"
    #         else:
    #             final_image_path = cleaned_path
    #         if os.path.exists(final_image_path):
    #             try:
    #                 render_context[key] = InlineImage(tpl, final_image_path, width=size_cm)
    #             except Exception as e:
    #                 logging.warning(f"Could not create InlineImage for '{key}' with path '{final_image_path}': {e}. Omitting image.")
    #                 if key in render_context:
    #                     del render_context[key]
    #         else:
    #             logging.warning(f"Image file not found for '{key}' at '{final_image_path}'. Placeholder '{key}' will not be an image. Omitting image.")
    #             if key in render_context:
    #                 del render_context[key]
    #     elif key in render_context and not isinstance(render_context[key], (str, InlineImage)):
    #         logging.warning(f"Context key '{key}' is not a string path or InlineImage. Type: {type(render_context[key])}. Skipping image processing for this key.")

    return render_context

def render_proposal(base_context, templates_dir, output_dir):
    """
    Renders multiple DOCX templates individually using the provided context.
    Each template is rendered into its own file in the 'output' directory.
    """
    # List of templates to merge in order
    # Cover page is now first, followed by table of contents, then others.
    template_filenames_ordered = [
        "cover_page_template.docx",
        "table_of_content_template.docx",
        "request_for_proposal_template.docx",
        "letter_of_transmittal_template.docx",
        "company_overview_template.docx",
        "qualifications_experience_template.docx",
        "technical_approach_template.docx",
        "schedule_template.docx",
        "pricing_structure_template.docx",
        "sar_template.docx",
        "executive_summary_template.docx"
    ]

    for template_filename in template_filenames_ordered:
        # Construct path to template in the 'templates' subfolder
        template_path = os.path.join(templates_dir, template_filename)

        if not os.path.exists(template_path):
            # Try looking in the current directory as a fallback, though primary location is 'templates'
            logging.warning(f"Template file not found: {template_path}. Skipping.")
            continue

        output_doc_name = f"rendered_{template_filename}"
        output_path = os.path.join(output_dir, output_doc_name)

        logging.info(f"Rendering {template_path} to {output_path}...")
        
        tpl = DocxTemplate(template_path)
        render_context = _prepare_image_context_for_template(tpl, base_context)
        
        tpl.render(render_context)
        tpl.save(output_path)
        logging.info(f"Successfully saved {output_path}")

    logging.info("All specified templates rendered individually into the 'output' directory.")
    logging.info("For a single merged document, consider using a master template with 'include' directives (if supported for all content types by docxtpl) or a separate DOCX merging step/library after individual rendering.")


def merge_documents(output_folder, merged_docx_path):
    output_filenames_ordered = [
    "rendered_cover_page_template.docx",
    "rendered_table_of_content_template.docx",
    "rendered_request_for_proposal_template.docx",
    "rendered_letter_of_transmittal_template.docx",
    "rendered_company_overview_template.docx",
    "rendered_qualifications_experience_template.docx",
    "rendered_technical_approach_template.docx",
    "rendered_schedule_template.docx",
    "rendered_pricing_structure_template.docx",
    "rendered_sar_template.docx",
    "rendered_executive_summary_template.docx"
    ]

    # Check if there are files to merge
    if not output_filenames_ordered:
        print("No files to merge.")
    else:
        # Initialize the master document with the first file
        first_doc_path = os.path.join(output_folder, output_filenames_ordered[0])
        if not os.path.exists(first_doc_path):
            print(f"Error: File {first_doc_path} not found.")
        else:
            master = Document_compose(first_doc_path)
            composer = Composer(master)

            # Append the rest of the documents
            for i in range(1, len(output_filenames_ordered)):
                doc_path = os.path.join(output_folder, output_filenames_ordered[i])
                if not os.path.exists(doc_path):
                    print(f"Warning: File {doc_path} not found. Skipping.")
                    continue
                
                # Add a page break before appending, except for the very first document part
                # (which is handled by the structure of the first document itself)
                # or if you want to ensure content flows continuously.
                # For distinct sections, a page break is often desired.
                # master.add_page_break() # Optional: uncomment if you want page breaks between each merged doc
                
                docx_to_append = Document_compose(doc_path)
                composer.append(docx_to_append)

            # Save the merged document
            composer.save(merged_docx_path)
            print(f"Successfully merged documents into: {merged_docx_path}")

