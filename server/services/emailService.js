const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;

        // Initialize immediately but don't verify connection
        this.createTransporter();

        // Verify connection in background (don't wait for it)
        setTimeout(() => {
            this.verifyConnection();
        }, 100);
    }

    createTransporter() {
        try {
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                // Create reusable transporter object using SMTP transport
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 10000
                });
                this.initialized = true;
                console.log('📧 Email service created (verification in progress...)');
            } else {
                console.log('⚠️  Email credentials not configured - emails will be logged instead');
                this.initialized = true;
            }
        } catch (error) {
            console.error('❌ Email service creation failed:', error.message);
            this.transporter = null;
            this.initialized = true;
        }
    }

    async verifyConnection() {
        if (!this.transporter) return;

        try {
            await this.transporter.verify();
            console.log('✅ Email service verified successfully');
        } catch (error) {
            console.log('⚠️  Email verification failed:', error.message);
            console.log('📧 Emails will still be attempted (verification issues are common with Gmail)');
        }
    }

    async sendPasswordResetEmail(to, resetToken, userFirstName = '') {
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: {
                name: 'GPAConnect',
                address: process.env.SMTP_FROM || process.env.SMTP_USER
            },
            to: to,
            subject: 'Reset Your GPAConnect Password',
            html: this.getPasswordResetTemplate(resetUrl, userFirstName, to)
        };

        return this.sendEmail(mailOptions);
    }

    async sendEmail(mailOptions) {
        try {
            if (!this.transporter) {
                // Fallback: Log email instead of sending
                console.log('\n📧 EMAIL WOULD BE SENT:');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                console.log('HTML:', mailOptions.html);
                console.log('---\n');
                return { success: true, message: 'Email logged (no SMTP configured)' };
            }

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            throw new Error('Failed to send email: ' + error.message);
        }
    }

    getPasswordResetTemplate(resetUrl, firstName, email) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .container {
                    background: #ffffff;
                    border: 1px solid #e1e1e1;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .content {
                    padding: 40px 30px;
                }
                .content h2 {
                    color: #333;
                    margin-top: 0;
                    font-size: 22px;
                }
                .reset-button {
                    display: inline-block;
                    background: #000000;
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    margin: 20px 0;
                    transition: background-color 0.3s;
                }
                .reset-button:hover {
                    background: #333333;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                .link-text {
                    word-break: break-all;
                    color: #666;
                    font-size: 12px;
                    margin-top: 15px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>GPAConnect</h1>
                </div>
                
                <div class="content">
                    <h2>Reset Your Password</h2>
                    
                    <p>Hi${firstName ? ' ' + firstName : ''},</p>
                    
                    <p>We received a request to reset the password for your GPAConnect account associated with <strong>${email}</strong>.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <center>
                        <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                    </center>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> This link will expire in <strong>15 minutes</strong> for security reasons. If you didn't request this password reset, you can safely ignore this email.
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <div class="link-text">${resetUrl}</div>
                    
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    
                    <p>Best regards,<br>The GPAConnect Team</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© ${new Date().getFullYear()} GPAConnect. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Send welcome email (for future use)
    async sendWelcomeEmail(to, firstName) {
        const mailOptions = {
            from: {
                name: 'GPAConnect',
                address: process.env.SMTP_FROM || process.env.SMTP_USER
            },
            to: to,
            subject: 'Welcome to GPAConnect!',
            html: `
                <h2>Welcome to GPAConnect, ${firstName}!</h2>
                <p>Your account has been created successfully. Start tracking your GPA today!</p>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The GPAConnect Team</p>
            `
        };

        return this.sendEmail(mailOptions);
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
