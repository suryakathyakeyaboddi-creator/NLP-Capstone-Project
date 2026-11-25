import os
import sys
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database.db import init_db
from .routes.summarize import router as summarize_router
from .routes.extractive import router as extractive_router
from .routes.abstractive import router as abstractive_router
from .routes.verification import router as verification_router
from .routes.evaluation import router as evaluation_router
from .routes.history import router as history_router
from .routes.models_config import router as config_router
from .routes.upload import router as upload_router
from .routes.dataset import router as dataset_router
from .routes.benchmark import router as benchmark_router
from .routes.experiments import router as experiments_router
from .routes.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("Initializing NeuroSum AI Database & Tables...")
    init_db()
    print("NeuroSum AI Research Platform Engine ready.")
    yield
    # Shutdown actions
    print("Shutting down NeuroSum AI Engine.")

app = FastAPI(
    title="NEUROSUM AI API",
    description="A Hybrid Extractive-Abstractive Text Summarization Framework Using Reinforcement Learning and Large Language Models with Factual Consistency Optimization",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(summarize_router, prefix="/api")
app.include_router(extractive_router, prefix="/api")
app.include_router(abstractive_router, prefix="/api")
app.include_router(verification_router, prefix="/api")
app.include_router(evaluation_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(config_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(dataset_router, prefix="/api")
app.include_router(benchmark_router, prefix="/api")
app.include_router(experiments_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "product": "NEUROSUM AI",
        "description": "Intelligent Hybrid Text Summarization & Factual Verification Research Platform",
        "version": "2.0.0",
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "NEUROSUM-AI-BACKEND",
        "python_version": sys.version
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
