from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import os

app = FastAPI(title="Stock Analysis App")

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/static")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

from app.api import routes

app.include_router(routes.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Stock Analysis App API is running"}
