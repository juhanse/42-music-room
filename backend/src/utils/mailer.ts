import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: false,
    ignoreTLS: true,
});

export const sendValidationEmail = async (to: string, token: string) => {
    const link = `http://localhost:3000/api/auth/validate?token=${token}`;
    
    await transporter.sendMail({
        from: '"Music Room" <no-reply@musicroom.42.fr>',
        to,
        subject: 'Validation de votre compte Music Room',
        text: `Veuillez valider votre compte en cliquant sur ce lien : ${link}`,
        html: `<p>Veuillez valider votre compte en cliquant sur ce lien : <a href="${link}">${link}</a></p>`,
    });
};
