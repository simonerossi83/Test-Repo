const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Email Service with robust error handling, retry logic, and logging
 */
class EmailService {
    constructor(config = {}) {
        // Spread config first, then apply defaults for undefined values
        const mergedConfig = { ...config };
        
        this.config = {
            maxRetries: mergedConfig.maxRetries !== undefined ? mergedConfig.maxRetries : 3,
            retryDelay: mergedConfig.retryDelay !== undefined ? mergedConfig.retryDelay : 1000,
            retryBackoffMultiplier: mergedConfig.retryBackoffMultiplier !== undefined ? mergedConfig.retryBackoffMultiplier : 2,
            timeout: mergedConfig.timeout !== undefined ? mergedConfig.timeout : 10000,
            logErrors: mergedConfig.logErrors !== false,
            logFile: mergedConfig.logFile || path.join(__dirname, '../logs/email-errors.log'),
            from: mergedConfig.from,
            smtp: mergedConfig.smtp
        };

        // Create transporter
        this.transporter = this.createTransporter(config.smtp);
        
        // Ensure log directory exists
        if (this.config.logErrors) {
            this.ensureLogDirectory();
        }
    }

    /**
     * Create nodemailer transporter
     */
    createTransporter(smtpConfig) {
        if (!smtpConfig) {
            // Default to test account for development
            return null; // Will be created async
        }

        return nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure || false,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass
            },
            connectionTimeout: this.config.timeout,
            greetingTimeout: this.config.timeout,
            socketTimeout: this.config.timeout
        });
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        const logDir = path.dirname(this.config.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * Log error to file
     */
    logError(error, context = {}) {
        if (!this.config.logErrors) return;

        const timestamp = new Date().toISOString();
            const logEntry = {
            timestamp,
            error: {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
                // Omitting stack trace to avoid exposing sensitive system information
            },
            context
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        try {
            fs.appendFileSync(this.config.logFile, logLine);
        } catch (writeError) {
            console.error('Failed to write to log file:', writeError);
        }

        // Also log to console
        console.error(`[${timestamp}] Email Error:`, error.message, context);
    }

    /**
     * Escape string for safe replacement in template
     */
    escapeTemplateValue(value) {
        return String(value).replace(/\$/g, '$$$$');
    }

    /**
     * Load and populate email template
     */
    loadTemplate(templateName, variables = {}) {
        const templatePath = path.join(__dirname, '../templates', templateName);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }

        let template = fs.readFileSync(templatePath, 'utf8');

        // Replace template variables with escaped values
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const escapedValue = this.escapeTemplateValue(value);
            template = template.replace(regex, escapedValue);
        }

        return template;
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Send email with retry logic
     */
    async sendEmailWithRetry(mailOptions, attempt = 1) {
        try {
            // Create test account if transporter not configured
            if (!this.transporter) {
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
            }

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            // Log success
            console.log(`✓ Email sent successfully on attempt ${attempt}`);
            console.log('Message ID:', info.messageId);
            
            // For test accounts, log preview URL
            if (info.messageId && nodemailer.getTestMessageUrl(info)) {
                console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                response: info.response,
                attempt,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };

        } catch (error) {
            const isLastAttempt = attempt >= this.config.maxRetries;
            
            // Log the error
            this.logError(error, {
                attempt,
                maxRetries: this.config.maxRetries,
                to: mailOptions.to,
                subject: mailOptions.subject
            });

            // Check if error is retryable
            const isRetryable = this.isRetryableError(error);

            if (!isLastAttempt && isRetryable) {
                // Calculate delay with exponential backoff
                const delay = this.config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, attempt - 1);
                
                console.log(`✗ Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                console.log(`  Error: ${error.message}`);

                await this.sleep(delay);
                return this.sendEmailWithRetry(mailOptions, attempt + 1);
            }

            // All retries exhausted or non-retryable error
            console.error(`✗ Email sending failed after ${attempt} attempt(s)`);
            
            return {
                success: false,
                error: {
                    message: error.message,
                    code: error.code,
                    command: error.command
                },
                attempt
            };
        }
    }

    /**
     * Determine if error is retryable
     */
    isRetryableError(error) {
        // Network errors - retryable
        if (error.code === 'ETIMEDOUT' || 
            error.code === 'ECONNRESET' || 
            error.code === 'ECONNREFUSED' ||
            error.code === 'ENOTFOUND') {
            return true;
        }

        // SMTP temporary errors (4xx) - retryable
        if (error.responseCode && error.responseCode >= 400 && error.responseCode < 500) {
            return true;
        }

        // SMTP permanent errors (5xx) - not retryable
        if (error.responseCode && error.responseCode >= 500) {
            return false;
        }

        // Authentication errors - not retryable
        if (error.code === 'EAUTH') {
            return false;
        }

        // Unknown errors - be conservative, don't retry
        return false;
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL
     */
    validateUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Send confirmation email
     */
    async sendConfirmationEmail(to, username, confirmationUrl) {
        // Validate inputs
        if (!this.validateEmail(to)) {
            const error = new Error(`Invalid email address: ${to}`);
            this.logError(error, { operation: 'sendConfirmationEmail', to });
            return {
                success: false,
                error: { message: error.message }
            };
        }

        if (!this.validateUrl(confirmationUrl)) {
            const error = new Error(`Invalid confirmation URL: ${confirmationUrl}`);
            this.logError(error, { operation: 'sendConfirmationEmail', confirmationUrl });
            return {
                success: false,
                error: { message: error.message }
            };
        }

        try {
            // Load and populate template
            const htmlContent = this.loadTemplate('confirmationEmail.html', {
                username,
                confirmationUrl
            });

            // Prepare mail options
            const mailOptions = {
                from: this.config.from || '"Il Tuo Servizio" <noreply@example.com>',
                to,
                subject: 'Conferma la tua email',
                html: htmlContent,
                // Plain text fallback with escaped values
                text: `Ciao ${this.escapeTemplateValue(username)},\n\nGrazie per esserti registrato! Per confermare il tuo indirizzo email, visita questo link:\n\n${this.escapeTemplateValue(confirmationUrl)}\n\nQuesto link scadrà tra 24 ore.\n\nSe non hai richiesto questa registrazione, ignora questa email.`
            };

            // Send with retry logic
            const result = await this.sendEmailWithRetry(mailOptions);

            // Log final result
            if (result.success) {
                console.log('\n✓ Email confirmation sent successfully!');
            } else {
                console.error('\n✗ Failed to send email confirmation after all retries');
                this.handleFallback(to, username, confirmationUrl);
            }

            return result;

        } catch (error) {
            this.logError(error, {
                operation: 'sendConfirmationEmail',
                to,
                username
            });

            console.error('✗ Critical error in sendConfirmationEmail:', error.message);
            
            // Fallback mechanism
            this.handleFallback(to, username, confirmationUrl);

            return {
                success: false,
                error: {
                    message: error.message,
                    stack: error.stack
                }
            };
        }
    }

    /**
     * Fallback mechanism when email sending fails
     */
    handleFallback(to, username, confirmationUrl) {
        console.log('\n⚠️  FALLBACK MECHANISM ACTIVATED');
        console.log('Since email delivery failed, you should:');
        console.log('1. Queue this email for retry later (implement job queue)');
        console.log('2. Send notification to admin/monitoring system');
        console.log('3. Show user an alternative confirmation method');
        console.log('\nFailed email details:');
        console.log(`  To: ${to}`);
        console.log(`  Username: ${username}`);
        console.log(`  Confirmation URL: ${confirmationUrl}`);
        
        // In a production system, you would:
        // - Add to a job queue (e.g., Bull, BeeQueue)
        // - Send alert to monitoring system (e.g., Sentry, DataDog)
        // - Update user record with pending email status
        // - Provide user with manual verification option
        
        const fallbackEntry = {
            timestamp: new Date().toISOString(),
            to,
            username,
            confirmationUrl,
            reason: 'email_delivery_failed'
        };
        
        // Log to fallback file
        const fallbackFile = path.join(path.dirname(this.config.logFile), 'email-fallback.log');
        try {
            fs.appendFileSync(fallbackFile, JSON.stringify(fallbackEntry) + '\n');
        } catch (writeError) {
            console.error('Failed to write fallback log:', writeError);
        }
    }

    /**
     * Verify transporter configuration
     */
    async verifyConnection() {
        try {
            if (!this.transporter) {
                // Create test transporter
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
            }

            await this.transporter.verify();
            console.log('✓ Email transporter is ready to send messages');
            return true;
        } catch (error) {
            console.error('✗ Email transporter verification failed:', error.message);
            this.logError(error, { operation: 'verifyConnection' });
            return false;
        }
    }
}

module.exports = EmailService;
