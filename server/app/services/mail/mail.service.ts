import nodemailer from 'nodemailer';
import { Service } from 'typedi';

@Service()
export class MailService {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465, // true si SSL, false si TLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    async sendMail(to: string, subject: string, html: string): Promise<void> {
        const mailOptions = {
            from: `"Fondation François Méyé" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
