"""
Email service module for sending automatic confirmation emails.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)


def send_confirmation_email(recipient_email, recipient_name, message_content):
    """
    Send an automatic confirmation email to the user who submitted a message.
    
    Args:
        recipient_email (str): Email address of the recipient
        recipient_name (str): Name of the recipient
        message_content (str): The message content they submitted
        
    Raises:
        Exception: If email sending fails
    """
    # Email configuration from environment variables
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    sender_email = os.getenv('SENDER_EMAIL', 'noreply@example.com')
    sender_password = os.getenv('SENDER_PASSWORD', '')
    
    # In development/test mode, just log instead of actually sending
    if os.getenv('EMAIL_MODE', 'test') == 'test':
        logger.info(f"[TEST MODE] Email di conferma per {recipient_email}")
        logger.info(f"Destinatario: {recipient_name}")
        logger.info(f"Contenuto: {message_content}")
        return True
    
    # Create the email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Conferma Ricezione Richiesta'
    msg['From'] = sender_email
    msg['To'] = recipient_email
    
    # Create email body (HTML version)
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Conferma Ricezione Richiesta</h2>
        <p>Gentile {recipient_name},</p>
        <p>Abbiamo ricevuto la tua richiesta e ti confermiamo che <strong>non è finita nel buco nero digitale</strong>! 🎯</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3>Dettagli della tua richiesta:</h3>
            <p><strong>Messaggio:</strong></p>
            <p style="white-space: pre-wrap;">{message_content}</p>
        </div>
        <p>Il nostro team esaminerà la tua richiesta e ti risponderà al più presto.</p>
        <p>Grazie per averci contattato!</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Questa è una conferma automatica. Si prega di non rispondere a questa email.</p>
    </body>
    </html>
    """
    
    # Create plain text version
    text_body = f"""
    Conferma Ricezione Richiesta
    
    Gentile {recipient_name},
    
    Abbiamo ricevuto la tua richiesta e ti confermiamo che non è finita nel buco nero digitale!
    
    Dettagli della tua richiesta:
    Messaggio: {message_content}
    
    Il nostro team esaminerà la tua richiesta e ti risponderà al più presto.
    
    Grazie per averci contattato!
    
    ---
    Questa è una conferma automatica. Si prega di non rispondere a questa email.
    """
    
    # Attach both versions
    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    try:
        # Connect to SMTP server and send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            if sender_password:
                server.login(sender_email, sender_password)
            server.send_message(msg)
        
        logger.info(f"Email di conferma inviata con successo a {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Errore nell'invio dell'email a {recipient_email}: {e}")
        raise
