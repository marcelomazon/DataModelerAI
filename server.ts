import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/feedback", async (req, res) => {
    const { name, email, message, reaction } = req.body;

    try {
      // Configuração do Nodemailer
      // O usuário precisará configurar as variáveis de ambiente no AI Studio
      const isGmail = !process.env.SMTP_HOST || process.env.SMTP_HOST.includes('gmail');
      
      const transporter = nodemailer.createTransport(
        isGmail 
          ? {
              service: 'gmail',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            }
          : {
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
      );

      // Se não houver credenciais configuradas, simula o envio no console para testes
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("⚠️ Credenciais SMTP não configuradas. Simulando envio de e-mail:");
        console.log(`De: ${name} <${email}>`);
        console.log(`Para: marcelomazon@gmail.com`);
        console.log(`Mensagem: ${message}`);
        console.log(`Reação: ${reaction || 'Nenhuma'}`);
        
        // Retorna sucesso simulado
        return res.status(200).json({ success: true, simulated: true, message: "Feedback registrado no console (configure o SMTP para envio real)." });
      }

      const mailOptions = {
        from: `"${name}" <${process.env.SMTP_USER}>`, // O remetente real deve ser o usuário autenticado
        replyTo: email,
        to: "marcelomazon@gmail.com",
        subject: "Feedback ModelerAI",
        text: `Nome: ${name}\nEmail: ${email}\n\nFeedback:\n${message}\n\nReação: ${reaction || 'Nenhuma'}`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao enviar e-mail" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Em produção, servir arquivos estáticos
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
