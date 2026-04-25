import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    jd_raw: Mapped[str] = mapped_column(Text, nullable=False)
    jd_parsed: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String, default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    candidates: Mapped[list["Candidate"]] = relationship(back_populates="job", cascade="all, delete")
    pipeline_events: Mapped[list["PipelineEvent"]] = relationship(back_populates="job", cascade="all, delete")


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("jobs.id", ondelete="CASCADE"))
    name: Mapped[str | None] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    source: Mapped[str | None] = mapped_column(String)
    profile_url: Mapped[str | None] = mapped_column(String)
    bio: Mapped[str | None] = mapped_column(Text)
    skills_raw: Mapped[list | None] = mapped_column(JSONB)
    match_score: Mapped[float | None] = mapped_column(Float)
    interest_score: Mapped[float | None] = mapped_column(Float)
    final_score: Mapped[float | None] = mapped_column(Float)
    match_explanation: Mapped[str | None] = mapped_column(Text)
    interest_explanation: Mapped[str | None] = mapped_column(Text)
    skills_matched: Mapped[list | None] = mapped_column(JSONB)
    skills_missing: Mapped[list | None] = mapped_column(JSONB)
    email_status: Mapped[str | None] = mapped_column(String, default="pending")
    resend_email_id: Mapped[str | None] = mapped_column(String)
    outreach_subject: Mapped[str | None] = mapped_column(String)
    outreach_body: Mapped[str | None] = mapped_column(Text)
    reply_text: Mapped[str | None] = mapped_column(Text)
    conversation_history: Mapped[list | None] = mapped_column(JSONB)
    conversation_turns: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    job: Mapped["Job"] = relationship(back_populates="candidates")


class PipelineEvent(Base):
    __tablename__ = "pipeline_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("jobs.id", ondelete="CASCADE"))
    stage: Mapped[str | None] = mapped_column(String)
    message: Mapped[str | None] = mapped_column(Text)
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    job: Mapped["Job"] = relationship(back_populates="pipeline_events")
