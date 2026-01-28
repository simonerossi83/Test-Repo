"""
Tests for the message submission and email confirmation functionality.
"""
import pytest
import json
from app import app, messages
from email_service import send_confirmation_email
import os


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    os.environ['EMAIL_MODE'] = 'test'
    
    with app.test_client() as client:
        yield client
    
    # Clean up messages after each test
    messages.clear()


def test_index_page(client):
    """Test that the index page loads successfully."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Invia la tua Richiesta' in response.data


def test_submit_message_success(client):
    """Test successful message submission."""
    test_data = {
        'name': 'Mario Rossi',
        'email': 'mario.rossi@example.com',
        'message': 'Questa è una richiesta di test.'
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'Grazie Mario Rossi' in data['message']
    assert 'mario.rossi@example.com' in data['message']
    
    # Verify message was stored
    assert len(messages) == 1
    assert messages[0]['name'] == 'Mario Rossi'
    assert messages[0]['email'] == 'mario.rossi@example.com'


def test_submit_message_missing_fields(client):
    """Test message submission with missing required fields."""
    test_data = {
        'name': 'Mario Rossi'
        # Missing email and message
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Campi mancanti' in data['error']


def test_submit_message_empty_body(client):
    """Test message submission with empty request body."""
    response = client.post(
        '/api/submit-message',
        data=json.dumps({}),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data


def test_get_messages(client):
    """Test retrieving submitted messages."""
    # Submit some messages first
    test_messages = [
        {
            'name': 'Mario Rossi',
            'email': 'mario@example.com',
            'message': 'Test message 1'
        },
        {
            'name': 'Luigi Verdi',
            'email': 'luigi@example.com',
            'message': 'Test message 2'
        }
    ]
    
    for msg in test_messages:
        client.post(
            '/api/submit-message',
            data=json.dumps(msg),
            content_type='application/json'
        )
    
    # Retrieve messages
    response = client.get('/api/messages')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'messages' in data
    assert len(data['messages']) == 2


def test_email_confirmation_test_mode():
    """Test that email confirmation works in test mode."""
    os.environ['EMAIL_MODE'] = 'test'
    
    # This should not raise an exception
    result = send_confirmation_email(
        recipient_email='test@example.com',
        recipient_name='Test User',
        message_content='This is a test message.'
    )
    
    assert result is True


def test_multiple_message_submissions(client):
    """Test submitting multiple messages."""
    for i in range(3):
        test_data = {
            'name': f'User {i}',
            'email': f'user{i}@example.com',
            'message': f'Message number {i}'
        }
        
        response = client.post(
            '/api/submit-message',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
    
    # Verify all messages were stored
    assert len(messages) == 3


def test_invalid_email_format(client):
    """Test message submission with invalid email format."""
    test_data = {
        'name': 'Mario Rossi',
        'email': 'invalid-email',
        'message': 'Test message'
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Formato email non valido' in data['error']


def test_name_too_long(client):
    """Test message submission with name exceeding max length."""
    test_data = {
        'name': 'a' * 101,  # Exceeds MAX_NAME_LENGTH (100)
        'email': 'test@example.com',
        'message': 'Test message'
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'nome' in data['error'].lower()


def test_message_too_long(client):
    """Test message submission with message exceeding max length."""
    test_data = {
        'name': 'Mario Rossi',
        'email': 'test@example.com',
        'message': 'a' * 5001  # Exceeds MAX_MESSAGE_LENGTH (5000)
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'messaggio' in data['error'].lower()


def test_empty_fields_after_strip(client):
    """Test message submission with whitespace-only fields."""
    test_data = {
        'name': '   ',
        'email': 'test@example.com',
        'message': '   '
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
    assert 'vuoti' in data['error'].lower()


def test_xss_prevention_in_email(client):
    """Test that XSS attempts in message content are handled safely."""
    test_data = {
        'name': '<script>alert("XSS")</script>',
        'email': 'test@example.com',
        'message': '<img src=x onerror=alert("XSS")>'
    }
    
    response = client.post(
        '/api/submit-message',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    # Should succeed but content should be escaped
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
