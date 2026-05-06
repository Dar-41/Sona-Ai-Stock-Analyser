from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sona AI - Stock Analyser",
    description="Institutional grade stock analysis with AI",
    version="1.0.0"
)

# CORS Configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Verify all required files and directories exist"""
    logger.info("Starting Sona AI Stock Analyser...")
    
    # Check if static directory exists
    static_dir = "app/static"
    if not os.path.exists(static_dir):
        logger.error(f"Static directory not found: {static_dir}")
    else:
        logger.info(f"✓ Static directory found: {static_dir}")
        
    # Check if required HTML files exist
    required_files = ["landing.html", "index.html"]
    for file in required_files:
        file_path = os.path.join(static_dir, file)
        if os.path.exists(file_path):
            logger.info(f"✓ Found: {file}")
        else:
            logger.error(f"✗ Missing: {file}")
    
    logger.info("Startup complete!")

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    logger.info("✓ Static files mounted successfully")
except Exception as e:
    logger.error(f"Failed to mount static files: {e}")

templates = Jinja2Templates(directory="app/static")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    try:
        return templates.TemplateResponse(request, "landing.html")
    except Exception as e:
        logger.error(f"Error serving landing page: {e}")
        return HTMLResponse(
            content=f"<h1>Error loading page</h1><p>{str(e)}</p>",
            status_code=500
        )

@app.get("/dashboard", response_class=HTMLResponse)
async def read_dashboard(request: Request):
    try:
        return templates.TemplateResponse(request, "index.html")
    except Exception as e:
        logger.error(f"Error serving dashboard: {e}")
        return HTMLResponse(
            content=f"<h1>Error loading dashboard</h1><p>{str(e)}</p>",
            status_code=500
        )

@app.get("/about", response_class=HTMLResponse)
async def read_about(request: Request):
    try:
        return templates.TemplateResponse(request, "about.html")
    except Exception as e:
        logger.error(f"Error serving about page: {e}")
        return HTMLResponse(
            content=f"<h1>Error loading about page</h1><p>{str(e)}</p>",
            status_code=500
        )

@app.get("/screener", response_class=HTMLResponse)
async def read_screener(request: Request):
    try:
        return templates.TemplateResponse(request, "index.html")
    except Exception as e:
        logger.error(f"Error serving screener: {e}")
        return HTMLResponse(
            content=f"<h1>Error loading screener</h1><p>{str(e)}</p>",
            status_code=500
        )


# SEO Routes
@app.get("/robots.txt")
async def robots():
    """Serve robots.txt for search engine crawlers"""
    from fastapi.responses import FileResponse
    return FileResponse("app/static/robots.txt", media_type="text/plain")

@app.get("/sitemap.xml")
async def sitemap():
    """Serve sitemap.xml for search engines"""
    from fastapi.responses import FileResponse
    return FileResponse("app/static/sitemap.xml", media_type="application/xml")

@app.get("/google1e9c8c59e6a3e781.html")
async def google_verification():
    """Serve Google Search Console verification file"""
    from fastapi.responses import FileResponse
    return FileResponse("app/static/google1e9c8c59e6a3e781.html", media_type="text/html")

from app.api import routes

app.include_router(routes.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok", 
        "message": "Sona AI Stock Analysis API is running",
        "version": "1.0.0",
        "python_version": os.sys.version
    }

