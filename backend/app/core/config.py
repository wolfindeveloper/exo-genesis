from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "EXO-GENESIS"
    version: str = "0.1.0"
    debug: bool = True

    supabase_url: str = ""
    supabase_key: str = ""
    bot_token: str = ""
    webhook_url: str = ""
    frontend_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
