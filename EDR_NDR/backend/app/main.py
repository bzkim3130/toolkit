import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, alerts, dashboard, events, rules, settings as settings_routes, virustotal
from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.seed.seed_data import seed_if_empty

logging.basicConfig(level=logging.INFO)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_if_empty(db)
        finally:
            db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(alerts.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(rules.router, prefix="/api")
app.include_router(virustotal.router, prefix="/api")
app.include_router(settings_routes.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
