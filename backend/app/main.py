import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, content, events, expeditions, guide, health, user, user_ships
from app.services.content_loader import ContentLoader
from app.services.notifier import run_notifier
from bot.webhook import delete_webhook, set_webhook, router as bot_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.content_loader = ContentLoader()
        app.state.content_loader.load_all()
        logger.info("content loaded: %d ships", len(app.state.content_loader.ships))
    except Exception as e:
        logger.warning("content load failed: %s", e)

    try:
        await set_webhook()
    except Exception as e:
        logger.warning("webhook setup skipped: %s", e)

    notifier_task = asyncio.create_task(run_notifier(app.state.content_loader))

    yield

    notifier_task.cancel()
    try:
        await notifier_task
    except asyncio.CancelledError:
        pass

    try:
        await delete_webhook()
    except Exception:
        pass


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    lifespan=lifespan,
)

origins = [
    settings.frontend_url,
    "https://exo-genesis.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(user_ships.router)
app.include_router(expeditions.router)
app.include_router(content.router)
app.include_router(guide.router)
app.include_router(events.router)

app.include_router(bot_router)
