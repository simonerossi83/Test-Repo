/**
 * Email Service Configuration
 * 
 * This file contains the configuration for the email service.
 * You can customize these settings based on your SMTP provider.
 */

module.exports = {
    // SMTP Configuration
    // For production, use your actual SMTP provider (e.g., SendGrid, AWS SES, Gmail)
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        user: process.env.SMTP_USER || 'your-email@example.com',
        pass: process.env.SMTP_PASS || 'your-password'
    },

    // Email sender
    from: process.env.EMAIL_FROM || '"Il Tuo Servizio" <noreply@example.com>',

    // Retry configuration
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY, 10) || 1000, // milliseconds
    retryBackoffMultiplier: parseFloat(process.env.RETRY_BACKOFF) || 2,

    // Timeout configuration
    timeout: parseInt(process.env.EMAIL_TIMEOUT) || 10000, // 10 seconds

    // Logging configuration
    logErrors: process.env.LOG_ERRORS !== 'false', // default true
    logFile: process.env.LOG_FILE || './logs/email-errors.log'
};

/**
 * Example configurations for popular SMTP providers:
 * 
 * Gmail:
 * {
 *   host: 'smtp.gmail.com',
 *   port: 587,
 *   secure: false,
 *   user: 'your-email@gmail.com',
 *   pass: 'your-app-password' // Use app password, not regular password
 * }
 * 
 * SendGrid:
 * {
 *   host: 'smtp.sendgrid.net',
 *   port: 587,
 *   secure: false,
 *   user: 'apikey',
 *   pass: 'your-sendgrid-api-key'
 * }
 * 
 * AWS SES:
 * {
 *   host: 'email-smtp.us-east-1.amazonaws.com',
 *   port: 587,
 *   secure: false,
 *   user: 'your-aws-access-key',
 *   pass: 'your-aws-secret-key'
 * }
 * 
 * Mailgun:
 * {
 *   host: 'smtp.mailgun.org',
 *   port: 587,
 *   secure: false,
 *   user: 'postmaster@your-domain.mailgun.org',
 *   pass: 'your-mailgun-password'
 * }
 */
