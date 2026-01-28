const nodemailer = require('nodemailer');

/**
 * Validates required environment variables
 * @throws {Error} If required env vars are missing
 */
function validateConfig() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables must be set');
  }
}

/**
 * Creates and configures the email transporter
 * @returns {nodemailer.Transporter} Configured transporter
 */
function createTransporter() {
  validateConfig();
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Formats field name for display
 * @param {string} key - Field key
 * @returns {string} Formatted label
 */
function formatFieldLabel(key) {
  const labels = {
    nome: 'Nome',
    email: 'Email',
    telefono: 'Telefono',
    messaggio: 'Messaggio'
  };
  return labels[key] || key;
}

/**
 * Sends a confirmation email to the user
 * @param {string} toEmail - Recipient email address
 * @param {Object} formData - Form data submitted by the user
 * @returns {Promise<Object>} Email sending result
 */
async function sendConfirmationEmail(toEmail, formData) {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Form Submission" <noreply@example.com>',
    to: toEmail,
    subject: 'Conferma Ricezione Form - Grazie per la tua richiesta',
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 10px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 20px;
              margin-top: 10px;
              border-radius: 0 0 5px 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #888;
            }
            .data-label {
              font-weight: bold;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Conferma Ricezione</h2>
            </div>
            <div class="content">
              <p>Gentile utente,</p>
              <p>Abbiamo ricevuto correttamente il tuo form. Grazie per averci contattato!</p>
              <p>Ecco un riepilogo dei dati che ci hai inviato:</p>
              <ul>
                ${Object.entries(formData)
                  .map(([key, value]) => `<li><span class="data-label">${formatFieldLabel(key)}:</span> ${escapeHtml(value)}</li>`)
                  .join('')}
              </ul>
              <p>Ti risponderemo il prima possibile.</p>
              <p>Cordiali saluti,<br>Il Team</p>
            </div>
            <div class="footer">
              <p>Questa è una email automatica, si prega di non rispondere.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Gentile utente,

Abbiamo ricevuto correttamente il tuo form. Grazie per averci contattato!

Ecco un riepilogo dei dati che ci hai inviato:
${Object.entries(formData)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Ti risponderemo il prima possibile.

Cordiali saluti,
Il Team

---
Questa è una email automatica, si prega di non rispondere.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email inviata con successo:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error.message);
    throw new Error('Impossibile inviare l\'email');
  }
}

module.exports = {
  sendConfirmationEmail
};
