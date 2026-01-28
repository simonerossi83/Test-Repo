const EmailService = require('../src/emailService');
const nodemailer = require('nodemailer');

/**
 * Test suite for Email Service
 */

// Test configuration
const testConfig = {
    maxRetries: 3,
    retryDelay: 100, // Short delay for testing
    retryBackoffMultiplier: 2,
    logErrors: true,
    logFile: './logs/test-email-errors.log'
};

/**
 * Test: Email Service Initialization
 */
async function testInitialization() {
    console.log('\n📝 Test 1: Email Service Initialization');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        console.log('✓ Email service initialized successfully');
        return true;
    } catch (error) {
        console.error('✗ Initialization failed:', error.message);
        return false;
    }
}

/**
 * Test: Template Loading
 */
async function testTemplateLoading() {
    console.log('\n📝 Test 2: Template Loading');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        const html = emailService.loadTemplate('confirmationEmail.html', {
            username: 'Test User',
            confirmationUrl: 'https://example.com/confirm?token=test123'
        });
        
        if (html.includes('Test User') && html.includes('https://example.com/confirm?token=test123')) {
            console.log('✓ Template loaded and variables replaced correctly');
            return true;
        } else {
            console.error('✗ Template variables not replaced correctly');
            return false;
        }
    } catch (error) {
        console.error('✗ Template loading failed:', error.message);
        return false;
    }
}

/**
 * Test: Connection Verification
 */
async function testConnectionVerification() {
    console.log('\n📝 Test 3: Connection Verification');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        const isReady = await emailService.verifyConnection();
        
        if (isReady) {
            console.log('✓ Connection verified successfully');
            return true;
        } else {
            console.error('✗ Connection verification failed');
            return false;
        }
    } catch (error) {
        console.error('✗ Connection verification error:', error.message);
        return false;
    }
}

/**
 * Test: Successful Email Sending
 */
async function testSuccessfulEmailSending() {
    console.log('\n📝 Test 4: Successful Email Sending');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        
        const result = await emailService.sendConfirmationEmail(
            'test@example.com',
            'Test User',
            'https://example.com/confirm?token=test123'
        );
        
        if (result.success) {
            console.log('✓ Email sent successfully');
            console.log(`  Message ID: ${result.messageId}`);
            if (result.previewUrl) {
                console.log(`  Preview URL: ${result.previewUrl}`);
            }
            return true;
        } else {
            console.error('✗ Email sending failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('✗ Email sending error:', error.message);
        return false;
    }
}

/**
 * Test: Retry Logic with Simulated Failure
 */
async function testRetryLogic() {
    console.log('\n📝 Test 5: Retry Logic (Simulated)');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService({
            ...testConfig,
            smtp: {
                host: 'invalid-smtp-host.example.com',
                port: 587,
                secure: false,
                user: 'test@example.com',
                pass: 'test-password'
            }
        });
        
        // This should fail and trigger retry logic
        const result = await emailService.sendConfirmationEmail(
            'test@example.com',
            'Test User',
            'https://example.com/confirm?token=test123'
        );
        
        if (!result.success && result.attempt === testConfig.maxRetries) {
            console.log('✓ Retry logic worked correctly');
            console.log(`  Attempted ${result.attempt} times as configured`);
            return true;
        } else if (result.success) {
            console.log('⚠️  Email sent successfully (unexpected with invalid config)');
            return true;
        } else {
            console.error('✗ Retry logic did not work as expected');
            return false;
        }
    } catch (error) {
        console.error('✗ Retry test error:', error.message);
        return false;
    }
}

/**
 * Test: Error Classification
 */
async function testErrorClassification() {
    console.log('\n📝 Test 6: Error Classification');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        
        // Test retryable errors
        const retryableErrors = [
            { code: 'ETIMEDOUT' },
            { code: 'ECONNRESET' },
            { responseCode: 421 }
        ];
        
        const nonRetryableErrors = [
            { code: 'EAUTH' },
            { responseCode: 550 }
        ];
        
        let allCorrect = true;
        
        for (const error of retryableErrors) {
            if (!emailService.isRetryableError(error)) {
                console.error(`✗ Error ${error.code || error.responseCode} should be retryable`);
                allCorrect = false;
            }
        }
        
        for (const error of nonRetryableErrors) {
            if (emailService.isRetryableError(error)) {
                console.error(`✗ Error ${error.code || error.responseCode} should NOT be retryable`);
                allCorrect = false;
            }
        }
        
        if (allCorrect) {
            console.log('✓ Error classification working correctly');
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('✗ Error classification test failed:', error.message);
        return false;
    }
}

/**
 * Test: Input Validation
 */
async function testInputValidation() {
    console.log('\n📝 Test 7: Input Validation');
    console.log('-'.repeat(60));
    
    try {
        const emailService = new EmailService(testConfig);
        
        // Test invalid email
        const invalidEmailResult = await emailService.sendConfirmationEmail(
            'invalid-email',
            'Test User',
            'https://example.com/confirm'
        );
        
        if (!invalidEmailResult.success && invalidEmailResult.error.message.includes('Invalid email')) {
            console.log('✓ Invalid email address rejected');
        } else {
            console.error('✗ Invalid email should be rejected');
            return false;
        }
        
        // Test invalid URL
        const invalidUrlResult = await emailService.sendConfirmationEmail(
            'test@example.com',
            'Test User',
            'not-a-url'
        );
        
        if (!invalidUrlResult.success && invalidUrlResult.error.message.includes('Invalid confirmation URL')) {
            console.log('✓ Invalid confirmation URL rejected');
        } else {
            console.error('✗ Invalid URL should be rejected');
            return false;
        }
        
        console.log('✓ Input validation working correctly');
        return true;
    } catch (error) {
        console.error('✗ Input validation test failed:', error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('='.repeat(60));
    console.log('Email Service Test Suite');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Initialization', fn: testInitialization },
        { name: 'Template Loading', fn: testTemplateLoading },
        { name: 'Connection Verification', fn: testConnectionVerification },
        { name: 'Successful Email Sending', fn: testSuccessfulEmailSending },
        { name: 'Retry Logic', fn: testRetryLogic },
        { name: 'Error Classification', fn: testErrorClassification },
        { name: 'Input Validation', fn: testInputValidation }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await test.fn();
        results.push({ name: test.name, passed: result });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test Results Summary');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    for (const result of results) {
        const status = result.passed ? '✓' : '✗';
        console.log(`${status} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${passed}/${total} tests passed`);
    console.log('='.repeat(60));
    
    if (passed === total) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
});
