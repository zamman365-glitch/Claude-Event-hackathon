"""
api/index.py
Vercel Serverless Function entry point for Bhumi Vikas Sahayak FastAPI backend.
"""
from __future__ import annotations
import sys
from pathlib import Path

# Add project root to sys.path so backend modules can be imported seamlessly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app import app
