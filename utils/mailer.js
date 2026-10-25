// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || '',
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
  secure: false,
  auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined
});

async function sendMail(to, subject, html) {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER) {
    console.log('Mailer not configured - skipping email to', to);
    return;
  }
  await transporter.sendMail({ from: process.env.MAIL_USER, to, subject, html });
}

module.exports = { sendMail };
