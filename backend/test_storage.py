#!/usr/bin/env python3
"""
Simple test to verify the local file storage system works
"""
import json
import uuid
from datetime import datetime
from pathlib import Path

# Test the local storage functionality
ROOT_DIR = Path(__file__).parent
analyses_file = ROOT_DIR / "analyses.json"

# Create a test analysis record
test_analysis = {
    "id": str(uuid.uuid4()),
    "user_id": "test-user-123",
    "symbol": "AAPL",
    "timeframe": "1D",
    "analysis": {
        "movement": "Bullish",
        "summary": "Test analysis for storage verification"
    },
    "plan_used": "free",
    "timestamp": datetime.utcnow().isoformat()
}

try:
    # Load existing analyses or create empty list
    if analyses_file.exists():
        with open(analyses_file, 'r') as f:
            analyses = json.load(f)
    else:
        analyses = []
    
    # Add new analysis
    analyses.append(test_analysis)
    
    # Save to file
    with open(analyses_file, 'w') as f:
        json.dump(analyses, f, indent=2)
    
    print("✅ Local file storage test successful!")
    print(f"📁 Analysis saved to: {analyses_file}")
    print(f"📊 Total analyses: {len(analyses)}")
    
    # Test reading back
    with open(analyses_file, 'r') as f:
        loaded_analyses = json.load(f)
    
    user_analyses = [a for a in loaded_analyses if a["user_id"] == "test-user-123"]
    print(f"🔍 Found {len(user_analyses)} analyses for test user")
    
except Exception as e:
    print(f"❌ Local file storage test failed: {str(e)}")