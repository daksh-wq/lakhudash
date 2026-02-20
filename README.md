# Lakhu Teleservices - Voice Bot System

Production voice bot with AI-powered call handling, call recording, analytics dashboard, and script management.

## Architecture

```
test.py                 # Main entry point - WebSocket voice bot + FastAPI server
api_routes.py           # REST API endpoints (calls, analytics, scripts, settings)
database.py             # SQLAlchemy models + DB initialization
logging_utils.py        # Call tracking + conversation transcript builder
config.py               # Central configuration (AWS, DB, paths, API)
config_manager.py       # Runtime settings manager (VAD, voice, credentials)
script_manager.py       # S3-backed bot script CRUD operations
audio_gating.py         # Multi-layer audio processing pipeline
sound_classifier.py     # YAMNet-based sound event classification
silero_vad_filter.py    # Silero VAD for voice activity detection
semantic_filter.py      # Filler word + noise filtering
recording_manager.py    # WAV file recording to disk
```

## Dashboard

Web-based dashboard at `/dashboard/` with:
- Real-time call analytics and charts
- Call recordings playback and download
- Conversation transcript viewer
- Script management (create, edit, activate)
- Bot settings configuration (VAD, voice, API keys)

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python test.py
# Or with PM2:
pm2 start test.py --name callex-AI-AMD --interpreter python3

# Access
# WebSocket: ws://host:8085/
# Dashboard: http://host:8085/dashboard/
# API:       http://host:8085/api/
# Health:    http://host:8085/health
```

## Configuration

All configuration is centralized in `config.py`. AWS credentials can be set via environment variables:

```bash
export AWS_ACCESS_KEY="your-key"
export AWS_SECRET_KEY="your-secret"
export AWS_REGION="ap-south-1"
export AWS_BUCKET_NAME="your-bucket"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls` | List calls with pagination/filters |
| GET | `/api/calls/{id}` | Get call details + transcript |
| GET | `/api/calls/{id}/recording` | Download call recording |
| GET | `/api/analytics/summary` | Aggregate analytics |
| GET | `/api/analytics/today` | Today's stats |
| GET | `/api/analytics/daily` | Daily call volume chart data |
| GET | `/api/scripts` | List all bot scripts |
| POST | `/api/scripts` | Create/update a script |
| POST | `/api/scripts/{id}/activate` | Activate a script (restarts server) |
| DELETE | `/api/scripts/{id}` | Delete a script |
| GET | `/api/settings` | Get bot settings |
| POST | `/api/settings` | Update bot settings |
| GET | `/api/calls/export/csv` | Export calls as CSV |
