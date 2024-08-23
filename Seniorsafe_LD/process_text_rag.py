import os
import fitz  # PyMuPDF
from langchain_community.embeddings import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

# Initialize the text splitter
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

# Initialize embeddings
embeddings = OllamaEmbeddings(model="mistral")

# Path to your PDFs
pdf_folder_path = "./pdf_training"
pdf_texts = []

# Iterate through PDFs and extract text
for pdf_file in os.listdir(pdf_folder_path):
    if pdf_file.endswith(".pdf"):
        # Open the PDF file with PyMuPDF
        pdf_path = os.path.join(pdf_folder_path, pdf_file)
        pdf_document = fitz.open(pdf_path)
        
        pdf_text = ""
        for page in pdf_document:
            pdf_text += page.get_text()
        
        pdf_texts.append(pdf_text)
        pdf_document.close()  # Close the document after extracting the text

# Split texts into chunks and generate metadata
all_chunks = []
metadatas = []
for i, text in enumerate(pdf_texts):
    chunks = text_splitter.split_text(text)
    all_chunks.extend(chunks)
    metadatas.extend([{"source": f"{i}-pl"} for _ in range(len(chunks))])

# Create a Chroma vector store and persist it to disk
vector_store = Chroma.from_texts(
    all_chunks, embeddings, metadatas=metadatas, persist_directory="./pdf_training"
)
vector_store.persist()
