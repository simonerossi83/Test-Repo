"""
Simple Flask application for message submission with automatic email confirmation.
"""
from flask import Flask, request, jsonify
from email_service import send_confirmation_email
import logging
import re

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for demo purposes
messages = []

# Constants for validation
MAX_NAME_LENGTH = 100
MAX_EMAIL_LENGTH = 254  # RFC 5321
MAX_MESSAGE_LENGTH = 5000
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Richiesta Messaggio</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, textarea { width: 100%; padding: 8px; box-sizing: border-box; }
            button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; }
            button:hover { background-color: #45a049; }
            .message { padding: 10px; margin-top: 20px; border-radius: 5px; }
            .success { background-color: #d4edda; color: #155724; }
            .error { background-color: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <h1>Invia la tua Richiesta</h1>
        <form id="messageForm">
            <div class="form-group">
                <label for="name">Nome:</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="message">Messaggio:</label>
                <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            <button type="submit">Invia Richiesta</button>
        </form>
        <div id="result"></div>
        
        <script>
            document.getElementById('messageForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    message: document.getElementById('message').value
                };
                
                try {
                    const response = await fetch('/api/submit-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    const data = await response.json();
                    
                    const resultDiv = document.getElementById('result');
                    if (response.ok) {
                        resultDiv.innerHTML = '<div class="message success">' + data.message + '</div>';
                        document.getElementById('messageForm').reset();
                    } else {
                        resultDiv.innerHTML = '<div class="message error">' + data.error + '</div>';
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<div class="message error">Errore di connessione</div>';
                }
            });
        </script>
    </body>
    </html>
    '''


@app.route('/api/submit-message', methods=['POST'])
def submit_message():
    """
    Endpoint to submit a message and send automatic email confirmation.
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(key in data for key in ['name', 'email', 'message']):
            return jsonify({'error': 'Campi mancanti. Nome, email e messaggio sono richiesti.'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip()
        message_content = data['message'].strip()
        
        # Validate field lengths
        if len(name) > MAX_NAME_LENGTH:
            return jsonify({'error': f'Il nome non può superare {MAX_NAME_LENGTH} caratteri.'}), 400
        
        if len(email) > MAX_EMAIL_LENGTH:
            return jsonify({'error': f'L\'email non può superare {MAX_EMAIL_LENGTH} caratteri.'}), 400
        
        if len(message_content) > MAX_MESSAGE_LENGTH:
            return jsonify({'error': f'Il messaggio non può superare {MAX_MESSAGE_LENGTH} caratteri.'}), 400
        
        # Validate that fields are not empty after stripping
        if not name or not email or not message_content:
            return jsonify({'error': 'I campi non possono essere vuoti.'}), 400
        
        # Validate email format
        if not EMAIL_REGEX.match(email):
            return jsonify({'error': 'Formato email non valido.'}), 400
        
        # Store message
        message_entry = {
            'name': name,
            'email': email,
            'message': message_content
        }
        messages.append(message_entry)
        
        logger.info(f"Ricevuto messaggio da {name} ({email})")
        
        # Send automatic confirmation email
        try:
            send_confirmation_email(email, name, message_content)
            logger.info(f"Email di conferma inviata a {email}")
        except Exception as email_error:
            logger.error(f"Errore nell'invio dell'email: {email_error}")
            # Don't fail the request if email fails, just log it
        
        return jsonify({
            'message': f'Grazie {name}! La tua richiesta è stata ricevuta. Riceverai una conferma via email a {email}.',
            'success': True
        }), 200
        
    except Exception as e:
        logger.error(f"Errore nel processare la richiesta: {e}")
        return jsonify({'error': 'Errore nel processare la richiesta'}), 500


@app.route('/api/messages', methods=['GET'])
def get_messages():
    """
    Endpoint to retrieve all submitted messages (for demo purposes).
    """
    return jsonify({'messages': messages}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
