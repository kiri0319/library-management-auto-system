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

const sendRegistrationOtpEmail = async (email, name, otp) =>
  sendMail({
    to: email,
    subject: "Library email verification OTP",
    html: `<p>Hello ${name},</p><p>Your library registration OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

const sendEmailChangeOtpEmail = async (email, name, otp) =>
  sendMail({
    to: email,
    subject: "Library email change OTP",
    html: `<p>Hello ${name},</p><p>Your library email change OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });

const sendDeleteAccountOtpEmail = async (email, name, otp) =>
  sendMail({
    to: email,
    subject: "Library account deletion OTP",
    html: `<p>Hello ${name},</p><p>Your library account deletion OTP is <strong>${otp}</strong>. It expires in 10 minutes. This action cannot be undone.</p>`,
  });

const sendAdminUserActionOtpEmail = async (email, name, otp, action, targetEmail) =>
  sendMail({
    to: email,
    subject: "Library account change verification OTP",
    html: `<p>Hello ${name},</p><p>An admin requested to ${action} account details for <strong>${targetEmail}</strong>.</p><p>Your verification OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
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
  sendRegistrationOtpEmail,
  sendEmailChangeOtpEmail,
  sendDeleteAccountOtpEmail,
  sendAdminUserActionOtpEmail,
  sendDueReminderEmail,
};

