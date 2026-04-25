import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.session import engine, Base
from app.routers import pipeline, conversation
from app.mail_listener import poll_loop

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(poll_loop())
    print("[startup] mail_listener task created")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Sizuka Pipeline", lifespan=lifespan)
app.include_router(pipeline.router)
app.include_router(conversation.router)
