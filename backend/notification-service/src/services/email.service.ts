import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import nodemailer from 'nodemailer';
import pino from 'pino';

const logger = pino({ name: 'email-service' });

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY;
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
const APP_DOMAIN = process.env.DOMAIN || 'cookshare.me';
const APP_URL = `https://${APP_DOMAIN}`;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || `no-reply@${APP_DOMAIN}`;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'CookShare';

if (!BREVO_API_KEY) {
    logger.error("BREVO_API_KEY is not defined");
    throw new Error("BREVO_API_KEY is required");
}

// Initialize Brevo API client
let apiInstance: SibApiV3Sdk.TransactionalEmailsApi;
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = BREVO_API_KEY;
apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Initialize SMTP transporter as fallback only
let transporter: nodemailer.Transporter;
if (BREVO_SMTP_KEY) {
    transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: BREVO_API_KEY!, // Brevo SMTP login = API key
            pass: BREVO_SMTP_KEY
        }
    });
}

const BRAND_COLOR = "#ff6b6b";
const TEXT_COLOR = "#2d3436";
const BG_COLOR = "#f9f9f9";

function wrapInBaseTemplate(title: string, content: string, ctaText?: string, ctaUrl?: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: ${TEXT_COLOR}; background-color: ${BG_COLOR}; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: ${BRAND_COLOR}; padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 40px; }
        .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }
        .button { display: inline-block; padding: 14px 30px; background-color: ${BRAND_COLOR}; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 25px; }
        .warning { color: #d63031; font-weight: bold; }
        p { margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CookShare</h1>
        </div>
        <div class="content">
            <h2>${title}</h2>
            ${content}
            ${ctaText && ctaUrl ? `<center><a href="${ctaUrl}" class="button">${ctaText}</a></center>` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CookShare. All rights reserved.</p>
            <p>You received this email because of your account activity on CookShare.</p>
        </div>
    </div>
</body>
</html>
    `;
}

export async function sendResetPasswordEmail(to: string, resetToken: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
    const html = wrapInBaseTemplate(
        "Reset Your Password",
        `<p>Hello,</p>
         <p>We received a request to reset your password for your CookShare account. If you didn't make this request, you can safely ignore this email.</p>
         <p>Otherwise, click the button below to choose a new password. This link will expire in 1 hour.</p>`,
        "Reset Password",
        resetUrl
    );

    try {
        // Use Brevo API as primary method
        if (apiInstance) {
            logger.info({ to }, 'Sending reset password email via Brevo API');
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = 'Reset Your Password - CookShare';
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.sender = { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS };
            sendSmtpEmail.to = [{ email: to }];

            const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
            return result;
        }

        // Fallback to SMTP
        if (transporter) {
            logger.info({ to }, 'Sending reset password email via SMTP');
            const mailOptions = {
                from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
                to: to,
                subject: 'Reset Your Password - CookShare',
                html: html
            };
            const result = await transporter.sendMail(mailOptions);
            logger.info({ messageId: result.messageId }, 'Reset password SMTP send successful');
            return { messageId: result.messageId, success: true };
        }

        throw new Error('No email transport available');
    } catch (error) {
        logger.error({ err: error, to }, 'Error sending reset password email');
        throw error;
    }
}

export async function sendVerificationEmail(to: string, verificationToken: string) {
    logger.info({ to }, 'Sending verification email');
    const verifyUrl = `${APP_URL}/api/v1/auth/verify-email?token=${verificationToken}`;
    const html = wrapInBaseTemplate(
        "Welcome to CookShare!",
        `<p>Hello and welcome!</p>
         <p>Thank you for joining our community of food lovers. Click the button below to verify your email address and start exploring thousands of recipes.</p>`,
        "Verify Email",
        verifyUrl
    );

    try {
        // Use Brevo API as primary method
        if (apiInstance) {
            logger.info({ to }, 'Using Brevo API (primary)');
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = 'Verify Your Email - CookShare';
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.sender = { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS };
            sendSmtpEmail.to = [{ email: to }];

            const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
            logger.info({ to }, 'Brevo API verification email sent');
            return result;
        }

        // Fallback to SMTP
        if (transporter) {
            logger.info({ to }, 'Falling back to SMTP');
            const mailOptions = {
                from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
                to: to,
                subject: 'Verify Your Email - CookShare',
                html: html
            };
            const result = await transporter.sendMail(mailOptions);
            logger.info({ messageId: result.messageId }, 'SMTP verification send successful');
            return { messageId: result.messageId, success: true };
        }

        throw new Error('No email transport available');
    } catch (error) {
        logger.error({ err: error, to }, 'Error sending verification email');
        throw error;
    }
}

export async function sendDeletionConfirmationEmail(to: string, deletionToken: string, username: string) {
    const confirmUrl = `${APP_URL}/gdpr/confirm-deletion?token=${deletionToken}`;
    const html = wrapInBaseTemplate(
        "Account Deletion Request",
        `<p>Hello <strong>${username}</strong>,</p>
         <p>We received a request to permanently delete your CookShare account.</p>
         <p class="warning">This action is IRREVERSIBLE. All your recipes, comments, ratings, and collections will be permanently removed.</p>
         <p>If you want to proceed with the deletion, click the button below. This link will expire in 24 hours.</p>`,
        "Confirm Permanent Deletion",
        confirmUrl
    );

    try {
        // Use Brevo API as primary method
        if (apiInstance) {
            logger.info({ to }, 'Sending deletion confirmation email via Brevo API');
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = 'Confirm Account Deletion - CookShare';
            sendSmtpEmail.htmlContent = html;
            sendSmtpEmail.sender = { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS };
            sendSmtpEmail.to = [{ email: to }];

            const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
            return result;
        }

        // Fallback to SMTP
        if (transporter) {
            logger.info({ to }, 'Sending deletion confirmation email via SMTP');
            const mailOptions = {
                from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
                to: to,
                subject: 'Confirm Account Deletion - CookShare',
                html: html
            };
            const result = await transporter.sendMail(mailOptions);
            logger.info({ messageId: result.messageId }, 'Deletion confirmation SMTP send successful');
            return { messageId: result.messageId, success: true };
        }

        throw new Error('No email transport available');
    } catch (error) {
        logger.error({ err: error, to }, 'Error sending deletion confirmation email');
        throw error;
    }
}