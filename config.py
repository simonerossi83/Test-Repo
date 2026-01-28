"""
Configuration file for the application.
"""
import os


class Config:
    """Base configuration."""
    # Email settings
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@example.com')
    SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')
    EMAIL_MODE = os.getenv('EMAIL_MODE', 'test')  # 'test' or 'production'


class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    EMAIL_MODE = 'test'


class ProductionConfig(Config):
    """Production configuration."""
    EMAIL_MODE = 'production'
