import DOMPurify from "dompurify";

/**
 * Generate HTML for verification email
 */
export function generateVerificationEmailHTML(options: {
  username: string;
  otp: string;
  verificationUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
        }
        .code-box {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          word-break: break-all;
          letter-spacing: 4px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .divider {
          text-align: center;
          color: #9ca3af;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Job Portal!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${DOMPurify.sanitize(options.username)},</p>
          
          <p>Thank you for signing up. Please verify your email address to complete your registration and get started.</p>
          
          <p><strong>Your verification code is:</strong></p>
          
          <div class="code-box">${DOMPurify.sanitize(options.otp)}</div>
          
          <div class="divider">or</div>
          
          <div style="text-align: center;">
            <a href="${DOMPurify.sanitize(options.verificationUrl)}" class="button">Verify Email Address</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            This 6-digit verification code will expire in 5 minutes. If you didn't create this account, please ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JobSearch. All rights reserved.</p>
          <p>If you have any questions, please contact us at support@jobportal.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for password reset email
 */
export function generatePasswordResetEmailHTML(options: { username: string; resetUrl: string }): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #92400e;
        }
        .footer {
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
          <p>Hi ${DOMPurify.sanitize(options.username)},</p>
          
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${DOMPurify.sanitize(options.resetUrl)}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          
          <p style="font-size: 14px;">
            If the button above doesn't work, copy and paste this link into your browser:
            <br>
            <code style="background: white; padding: 5px; border-radius: 3px; font-size: 12px; word-break: break-all;">
              ${DOMPurify.sanitize(options.resetUrl)}
            </code>
          </p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} JobSearch. All rights reserved.</p>
          <p>If you have any questions, please contact us at support@jobportal.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
