const EmailService = require('./emailService');
const config = require('../config/email.config');

/**
 * Example usage of the Email Service
 * 
 * This demonstrates how to send a confirmation email with
 * automatic retry, error handling, and logging.
 */

async function main() {
    console.log('='.repeat(60));
    console.log('Email Service Example');
    console.log('='.repeat(60));
    console.log();

    // Initialize email service
    // Note: Without SMTP config, it will use a test account (Ethereal)
    const emailService = new EmailService({
        // smtp: config.smtp, // Uncomment to use your SMTP config
        maxRetries: 3,
        retryDelay: 2000,
        retryBackoffMultiplier: 2,
        logErrors: true
    });

    console.log('Step 1: Verifying email transporter...');
    const isReady = await emailService.verifyConnection();
    
    if (!isReady) {
        console.error('Email service is not ready. Check your configuration.');
        process.exit(1);
    }

    console.log();
    console.log('Step 2: Sending confirmation email...');
    console.log();

    // Send confirmation email
    const result = await emailService.sendConfirmationEmail(
        'user@example.com',
        'Mario Rossi',
        'https://example.com/confirm?token=abc123xyz789'
    );

    console.log();
    console.log('='.repeat(60));
    console.log('Result Summary:');
    console.log('='.repeat(60));
    
    if (result.success) {
        console.log('✓ Status: SUCCESS');
        console.log(`✓ Message ID: ${result.messageId}`);
        console.log(`✓ Attempts: ${result.attempt}`);
        if (result.previewUrl) {
            console.log(`✓ Preview URL: ${result.previewUrl}`);
            console.log('\n📧 You can view the email in your browser using the preview URL above!');
        }
    } else {
        console.log('✗ Status: FAILED');
        console.log(`✗ Error: ${result.error.message}`);
        console.log(`✗ Attempts made: ${result.attempt}`);
        console.log('\n⚠️  Check logs/email-errors.log for detailed error information');
        console.log('⚠️  Check logs/email-fallback.log for fallback actions');
    }

    console.log();
    console.log('='.repeat(60));
}

// Run example
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
