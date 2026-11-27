import express from "express";
import musicaRoutes from "./routes/musicaRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import authRoutes from "./routes/authRoutes.js"

const app = express();

app.use(express.json());

app.use('/musicas', musicaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/auth', authRoutes)

// 404 primeiro
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// erro por último
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

export default app