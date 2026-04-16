const nodemailer = require("nodemailer");

const canSendEmail = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendMail = async ({ to, subject, html }) => {
  if (!canSendEmail()) {
    console.log(`Email skipped. Configure SMTP to send "${subject}" to ${to}.`);
    return { preview: true };
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendOtpEmail = async (email, name, otp) =>
  sendMail({
    to: email,
    subject: "Library password reset OTP",
    html: `<p>Hello ${name},</p><p>Your library reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

const sendDueReminderEmail = async (email, name, bookTitle, dueDate) =>
  sendMail({
    to: email,
    subject: "Library due date reminder",
    html: `<p>Hello ${name},</p><p>Your borrowed book <strong>${bookTitle}</strong> is due on ${new Date(
      dueDate
    ).toDateString()}.</p>`,
  });

module.exports = {
  sendOtpEmail,
  sendDueReminderEmail,
};

