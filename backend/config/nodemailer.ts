import { createTransport } from 'nodemailer';

// Create a transporter using SMTP
export const transporter = createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

try {
  await transporter.verify();
  console.log("Server is ready to take our messages");
} catch (err) {
  console.error("Verification failed:", err);
}

export const sendEmail = async ({ to, subject, body } : { to: string; subject: string; body: string }) => {
    try {
        const response = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to,
            subject,
            html: body,
        })
        return response;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};