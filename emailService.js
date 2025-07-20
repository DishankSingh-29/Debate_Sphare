const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Email templates
 */
const emailTemplates = {
  emailVerification: {
    subject: 'Verify Your Email - DebateSphere',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - DebateSphere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to DebateSphere!</h1>
            <p>Verify your email address to get started</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Thank you for signing up for DebateSphere! To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${data.verificationURL}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.verificationURL}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with DebateSphere, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 DebateSphere. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  passwordReset: {
    subject: 'Reset Your Password - DebateSphere',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - DebateSphere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>Reset your DebateSphere password</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>We received a request to reset your password for your DebateSphere account. Click the button below to create a new password:</p>
            <a href="${data.resetURL}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.resetURL}</p>
            <p>This link will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 DebateSphere. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  welcomeEmail: {
    subject: 'Welcome to DebateSphere!',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DebateSphere!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to DebateSphere!</h1>
            <p>Your account is now active</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Welcome to DebateSphere! Your email has been verified and your account is now active.</p>
            <p>Here's what you can do to get started:</p>
            <ul>
              <li>Explore debate topics in various categories</li>
              <li>Start your first AI-powered debate</li>
              <li>Track your progress and improve your skills</li>
              <li>Connect with other debaters</li>
            </ul>
            <a href="${data.dashboardURL}" class="button">Start Your First Debate</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 DebateSphere. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  debateReminder: {
    subject: 'Continue Your Debate - DebateSphere',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Continue Your Debate - DebateSphere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Continue Your Debate</h1>
            <p>Don't let your progress go to waste</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>We noticed you have an active debate session that you haven't completed yet.</p>
            <p><strong>Topic:</strong> ${data.topicTitle}</p>
            <p><strong>Your Side:</strong> ${data.chosenSide}</p>
            <p>Continue your debate to improve your skills and get detailed feedback!</p>
            <a href="${data.debateURL}" class="button">Continue Debate</a>
            <p>Your session will remain active for 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 DebateSphere. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  weeklyReport: {
    subject: 'Your Weekly Debate Report - DebateSphere',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Report - DebateSphere</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat { background: white; padding: 20px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Weekly Report</h1>
            <p>Here's how you performed this week</p>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Here's a summary of your debate activity this week:</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">${data.debatesCompleted}</div>
                <div>Debates Completed</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.averageScore}%</div>
                <div>Average Score</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.totalTime}</div>
                <div>Minutes Debating</div>
              </div>
              <div class="stat">
                <div class="stat-value">${data.skillLevel}</div>
                <div>Current Level</div>
              </div>
            </div>
            <p>Keep up the great work! Continue practicing to improve your debate skills.</p>
            <a href="${data.dashboardURL}" class="button">View Full Report</a>
          </div>
          <div class="footer">
            <p>&copy; 2025 DebateSphere. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Email template name
 * @param {Object} options.data - Template data
 * @param {string} options.html - Custom HTML content (optional)
 * @param {string} options.text - Plain text content (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let html, text;
    
    // Use template if provided
    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template];
      html = template.html(options.data);
      text = generatePlainText(html);
    } else {
      html = options.html;
      text = options.text || generatePlainText(html);
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      html: html,
      text: text
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully:', {
      messageId: info.messageId,
      to: options.email,
      subject: options.subject
    });

    return info;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Generate plain text from HTML
 */
const generatePlainText = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Send bulk emails
 */
const sendBulkEmails = async (emails, options) => {
  const transporter = createTransporter();
  const results = [];

  for (const email of emails) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await transporter.sendMail(mailOptions);
      results.push({ email, success: true, messageId: info.messageId });
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
      results.push({ email, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const dashboardURL = `${process.env.FRONTEND_URL}/dashboard`;
  
  await sendEmail({
    email: user.email,
    subject: 'Welcome to DebateSphere!',
    template: 'welcomeEmail',
    data: {
      name: user.name,
      dashboardURL
    }
  });
};

/**
 * Send debate reminder
 */
const sendDebateReminder = async (user, session) => {
  const debateURL = `${process.env.FRONTEND_URL}/debate/${session._id}`;
  
  await sendEmail({
    email: user.email,
    subject: 'Continue Your Debate - DebateSphere',
    template: 'debateReminder',
    data: {
      name: user.name,
      topicTitle: session.topicTitle,
      chosenSide: session.chosenSide,
      debateURL
    }
  });
};

/**
 * Send weekly report
 */
const sendWeeklyReport = async (user, stats) => {
  const dashboardURL = `${process.env.FRONTEND_URL}/dashboard`;
  
  await sendEmail({
    email: user.email,
    subject: 'Your Weekly Debate Report - DebateSphere',
    template: 'weeklyReport',
    data: {
      name: user.name,
      debatesCompleted: stats.debatesCompleted,
      averageScore: stats.averageScore,
      totalTime: stats.totalTime,
      skillLevel: stats.skillLevel,
      dashboardURL
    }
  });
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendDebateReminder,
  sendWeeklyReport,
  emailTemplates
}; 