require('dotenv').config();
const express = require('express');
const { sendConfirmationEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Form di Contatto</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .form-container {
          background-color: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          text-align: center;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-weight: bold;
        }
        input, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 14px;
        }
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }
        button:hover {
          background-color: #45a049;
        }
        .message {
          padding: 15px;
          margin-top: 20px;
          border-radius: 4px;
          display: none;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .required {
          color: red;
        }
      </style>
    </head>
    <body>
      <div class="form-container">
        <h1>Form di Contatto</h1>
        <form id="contactForm">
          <div class="form-group">
            <label for="nome">Nome <span class="required">*</span></label>
            <input type="text" id="nome" name="nome" required>
          </div>
          <div class="form-group">
            <label for="email">Email <span class="required">*</span></label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="telefono">Telefono</label>
            <input type="tel" id="telefono" name="telefono">
          </div>
          <div class="form-group">
            <label for="messaggio">Messaggio <span class="required">*</span></label>
            <textarea id="messaggio" name="messaggio" required></textarea>
          </div>
          <button type="submit">Invia</button>
        </form>
        <div id="message" class="message"></div>
      </div>

      <script>
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            messaggio: document.getElementById('messaggio').value
          };

          const messageDiv = document.getElementById('message');
          messageDiv.style.display = 'none';

          try {
            const response = await fetch('/submit-form', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
              messageDiv.className = 'message success';
              messageDiv.textContent = result.message;
              messageDiv.style.display = 'block';
              document.getElementById('contactForm').reset();
            } else {
              messageDiv.className = 'message error';
              messageDiv.textContent = result.message || 'Si è verificato un errore. Riprova più tardi.';
              messageDiv.style.display = 'block';
            }
          } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Errore di connessione. Riprova più tardi.';
            messageDiv.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * Form validation function
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateForm(formData) {
  const errors = [];

  if (!formData.nome || formData.nome.trim() === '') {
    errors.push('Il campo Nome è obbligatorio');
  }

  if (!formData.email || formData.email.trim() === '') {
    errors.push('Il campo Email è obbligatorio');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('Formato email non valido');
    }
  }

  if (!formData.messaggio || formData.messaggio.trim() === '') {
    errors.push('Il campo Messaggio è obbligatorio');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Form submission endpoint
app.post('/submit-form', async (req, res) => {
  try {
    const formData = req.body;

    // Validate form data
    const validation = validateForm(formData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Dati del form non validi',
        errors: validation.errors
      });
    }

    // Send confirmation email
    await sendConfirmationEmail(formData.email, formData);

    res.status(200).json({
      success: true,
      message: 'Form ricevuto con successo! Ti abbiamo inviato una email di conferma.'
    });
  } catch (error) {
    console.error('Errore durante l\'elaborazione del form:', error);
    res.status(500).json({
      success: false,
      message: 'Si è verificato un errore durante l\'invio dell\'email. Riprova più tardi.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  console.log(`Apri http://localhost:${PORT} per vedere il form`);
});

module.exports = app;
