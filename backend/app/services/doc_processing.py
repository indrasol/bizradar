import os
import base64
import tempfile
from utils.logger import get_logger
from typing import List, Dict, Any, Optional
import traceback

# Configure logging
logger = get_logger(__name__)

# Try to import document processing libraries
try:
    import PyPDF2
except ImportError:
    logger.warning("PyPDF2 not installed. PDF processing will be unavailable.")

try:
    import docx
except ImportError:
    logger.warning("python-docx not installed. DOCX processing will be unavailable.")


def extract_text_from_file(file_content: bytes, file_type: str, file_name: str) -> Optional[str]:
    """
    Extract text from different file types
    
    Args:
        file_content: Binary content of the file
        file_type: MIME type of the file
        file_name: Name of the file
        
    Returns:
        Extracted text or None if extraction fails
    """
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
        
        text = ""
        
        # Extract text based on file type
        if file_type == "application/pdf" or file_name.lower().endswith(".pdf"):
            # Check if PyPDF2 is available
            if 'PyPDF2' not in globals():
                logger.error("PyPDF2 not installed. Cannot process PDF.")
                return None
                
            # Process PDF
            with open(temp_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page_num in range(len(pdf_reader.pages)):
                    page_text = pdf_reader.pages[page_num].extract_text()
                    if page_text:
                        text += page_text + "\n\n"
        
        elif file_type == "text/plain" or file_name.lower().endswith(".txt"):
            # Process TXT
            with open(temp_path, 'r', encoding='utf-8', errors='ignore') as txt_file:
                text = txt_file.read()
        
        elif file_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] or \
             file_name.lower().endswith((".doc", ".docx")):
            # Check if python-docx is available
            if 'docx' not in globals():
                logger.error("python-docx not installed. Cannot process DOCX.")
                return None
                
            # Process DOC/DOCX
            try:
                doc = docx.Document(temp_path)
                text = "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])
            except Exception as e:
                logger.error(f"Error extracting text from Word document: {str(e)}")
                return None
        else:
            logger.warning(f"Unsupported file type: {file_type}")
            return None
        
        # Clean up the temporary file
        os.unlink(temp_path)
        
        return text.strip()
    
    except Exception as e:
        logger.error(f"Error in extract_text_from_file: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Clean up temp file if it exists
        if 'temp_path' in locals():
            try:
                os.unlink(temp_path)
            except:
                pass
        
        return None

def process_file_upload(file_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Process an uploaded file and extract its text
    
    Args:
        file_data: Dictionary containing file information
            - name: File name
            - type: MIME type
            - content: Base64 encoded content
            
    Returns:
        Dictionary with file info and extracted text, or None if processing fails
    """
    try:
        file_name = file_data.get("name", "unknown")
        file_type = file_data.get("type", "")
        file_content_base64 = file_data.get("content", "")
        
        logger.info(f"Processing file: {file_name}, type: {file_type}")
        
        # Remove the base64 prefix and decode
        if "," in file_content_base64:
            file_content_base64 = file_content_base64.split(",", 1)[1]
        
        try:
            file_content = base64.b64decode(file_content_base64)
        except Exception as e:
            logger.error(f"Error decoding base64 content: {str(e)}")
            return None
        
        # Get file extension
        file_ext = os.path.splitext(file_name)[1].lower()
        
        # Extract text based on file type
        extracted_text = extract_text_from_file(file_content, file_type, file_name)
        
        if extracted_text:
            logger.info(f"Successfully extracted text from {file_name} ({len(extracted_text)} characters)")
            return {
                "file_name": file_name,
                "file_type": file_type,
                "file_extension": file_ext,
                "text": extracted_text
            }
        else:
            logger.warning(f"Could not extract text from {file_name}")
            return None
            
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def process_multiple_files(files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process multiple files and extract text from each
    
    Args:
        files: List of file data dictionaries
        
    Returns:
        List of processed file information with extracted text
    """
    processed_files = []
    
    for file_data in files:
        processed_file = process_file_upload(file_data)
        if processed_file:
            processed_files.append(processed_file)
    
    logger.info(f"Processed {len(processed_files)} of {len(files)} files successfully")
    return processed_files

def get_file_icon(file_extension: str) -> str:
    """
    Get an appropriate icon name for a file based on its extension
    
    Args:
        file_extension: The file extension including the period (e.g., '.pdf')
        
    Returns:
        Icon name suitable for frontend use
    """
    file_extension = file_extension.lower()
    
    if file_extension == '.pdf':
        return 'pdf'
    elif file_extension in ['.doc', '.docx']:
        return 'word'
    elif file_extension == '.txt':
        return 'text'
    else:
        return 'file'

def format_document_context(doc_context: List[Dict[str, str]]) -> str:
    """
    Format document context into a string for the AI
    
    Args:
        doc_context: List of documents with their extracted text
        
    Returns:
        Formatted string containing document content for AI context
    """
    if not doc_context:
        return ""
    
    context_parts = ["DOCUMENT CONTEXT:"]
    
    for doc in doc_context:
        file_name = doc.get("file_name", "Unknown document")
        text = doc.get("text", "")
        
        if text:
            # Add document title and the entire content
            context_parts.append(f"\n--- {file_name} ---")
            context_parts.append(text)  # Include the entire text without truncation
    
    return "\n".join(context_parts)