import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    PASSWORD_RESET_EMAIL_TEMPLATE,
    PASSWORD_CHANGED_EMAIL_TEMPLATE
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"StockPulse" <stockpulse@jsmastery.pro>`,
        to: email,
        subject: `Welcome to StockPulse - your stock market toolkit is ready!`,
        text: 'Thanks for joining StockPulse',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"StockPulse News" <stockpulse@jsmastery.pro>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from StockPulse`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async ({
    email,
    name,
    otpCode,
    expirySeconds,
}: {
    email: string;
    name: string;
    otpCode: string;
    expirySeconds: number;
}): Promise<void> => {
    const htmlTemplate = PASSWORD_RESET_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{otpCode}}', otpCode)
        .replace('{{expirySeconds}}', String(expirySeconds));

    await transporter.sendMail({
        from: `"StockPulse Security" <stockpulse@jsmastery.pro>`,
        to: email,
        subject: 'Your StockPulse password reset OTP',
        text: `Your password reset OTP is ${otpCode}. It expires in ${expirySeconds} seconds.`,
        html: htmlTemplate,
    });
};

export const sendPasswordChangedEmail = async ({
    email,
    name,
}: {
    email: string;
    name: string;
}): Promise<void> => {
    const htmlTemplate = PASSWORD_CHANGED_EMAIL_TEMPLATE.replace('{{name}}', name);

    await transporter.sendMail({
        from: `"StockPulse Security" <stockpulse@jsmastery.pro>`,
        to: email,
        subject: 'Your StockPulse password was changed',
        text: 'Your password was changed successfully. If this was not you, reset your password immediately.',
        html: htmlTemplate,
    });
};
