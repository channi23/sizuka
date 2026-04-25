from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    nestjs_internal_url: str = "http://localhost:3000"
    internal_api_secret: str = ""
    groq_api_key: str
    resend_api_key: str
    github_token: str = ""
    sender_email: str = "talent@resend.dev"
    port: int = 8000
    gmail_user: str = ""
    gmail_app_password: str = ""
    # Demo mode: all outreach is rerouted to this address (Resend free-tier limitation)
    demo_recipient: str = "hariharansharma588@gmail.com"
    # Maximum candidates to contact per job run in demo mode
    outreach_top_n: int = 2


settings = Settings()
