import { configDotenv } from "dotenv";
configDotenv()

import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const enviarEmail = async (destinatarioID, assunto, conteudoHTML, conteudoTexto ) => {
    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: '"Musiki" <suporte.musiki@gmail.com>', // sender address
            to: destinatarioID,
            subject: assunto, // subject line
            text: conteudoTexto, // plain text body
            html: conteudoHTML, // HTML body
        });

        console.log("Message sent: %s", info.messageId);
    }catch(err) {
        console.error("Error while sending mail:", err);
        return {error: 'Erro ao enviar email'}
    }
}


export { 
    enviarEmail
}