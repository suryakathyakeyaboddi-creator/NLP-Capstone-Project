import io
from fastapi import APIRouter, UploadFile, File, HTTPException
import pypdf
from ..services.preprocessing import TextPreprocessor

router = APIRouter(prefix="/upload", tags=["Document Upload"])

@router.post("")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_document"
    contents = await file.read()
    
    extracted_text = ""
    
    if filename.lower().endswith(".pdf"):
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
            pages_text = []
            for page_num, page in enumerate(pdf_reader.pages):
                txt = page.extract_text()
                if txt:
                    pages_text.append(txt)
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    elif filename.lower().endswith((".txt", ".md", ".json", ".csv")):
        try:
            extracted_text = contents.decode("utf-8", errors="replace")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode text: {str(e)}")
    else:
        # Attempt text decode
        try:
            extracted_text = contents.decode("utf-8", errors="replace")
        except Exception:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .txt or .pdf")

    cleaned_text = TextPreprocessor.clean_text(extracted_text)
    if len(cleaned_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Uploaded document contains no readable text.")

    analysis = TextPreprocessor.analyze_document(cleaned_text)
    
    return {
        "filename": filename,
        "text": cleaned_text,
        "word_count": analysis["word_count"],
        "sentence_count": analysis["sentence_count"],
        "character_count": analysis["character_count"],
        "vocabulary_richness": analysis["vocabulary_richness"]
    }
