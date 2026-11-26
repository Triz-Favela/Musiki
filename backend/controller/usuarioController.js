import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.js';
import RefreshToken from '../models/refreshToken.js';
import { hashRefreshToken, hashSenha } from '../services/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /usuarios
async function cadastrar(req, res) {
  const { username, senha, email } = req.body ?? {};

  // sem o segredo não dá para assinar o token: melhor falhar antes de salvar o usuário
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET não configurado no servidor' });
  }

  // username: obrigatório e não pode ser vazio
  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ error: 'O campo "username" é obrigatório e não pode ser vazio' });
  }

  

  // email: opcional, mas, se vier, não pode ser vazio e precisa ter formato válido
  let emailLimpo;
  if (email !== undefined && email !== null) {
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'O campo "email" não pode ser vazio (ou deixe de enviá-lo)' });
    }
    emailLimpo = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailLimpo)) {
      return res.status(400).json({ error: 'O email informado não é válido' });
    }
  }

  const usernameLimpo = username.trim();

  try {
    // username ou email já usados?
    if (await Usuario.findOne({ username: usernameLimpo })) {
      return res.status(409).json({ error: 'Esse username já está em uso' });
    }
    if (emailLimpo && (await Usuario.findOne({ email: emailLimpo }))) {
      return res.status(409).json({ error: 'Esse email já está em uso' });
    }

    const senhaHash = await hashSenha(senha)

    if(senhaHash.error){
      return res.status(500).json({error: senhaHash.error})
    }

    const dados = { username: usernameLimpo, senha: senhaHash };
    if (emailLimpo) dados.email = emailLimpo;

    const novoUsuario = await Usuario.create(dados);


    const refreshToken = crypto.randomBytes(32).toString('base64url')
    
    const refreshTokenHash = hashRefreshToken(refreshToken)
    await RefreshToken.create({
      userId: novoUsuario._id,
      tokenHash: refreshTokenHash,
    })

    const accessToken = jwt.sign(
      { id: novoUsuario._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.status(201).json({ refreshToken, accessToken, username: novoUsuario.username });
  } catch (err) {
    console.log(err)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username ou email já está em uso' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
}

async function logar(req, res) {
  const { usernameOuEmail, senha } = req.body ?? {};

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET não configurado no servidor' });
  }

  if (typeof usernameOuEmail !== 'string' || !usernameOuEmail.trim()) {
    return res.status(400).json({ error: 'O campo "username ou email" é obrigatório e não pode ser vazio' });
  }

  if (typeof senha !== 'string' || !senha.trim()) {
    return res.status(400).json({ error: 'O campo "senha" é obrigatório e não pode ser vazio' });
  }

  try {
    const usuarioEncontrado = await Usuario.findOne({
      $or: [
        { email: usernameOuEmail.toLowerCase() },
        { username: usernameOuEmail }
      ]
    })

    if(!usuarioEncontrado){
      return res.status(400).json({ error: 'Senha ou usuário incorreto'})
    }

    const senhaCerta = await bcrypt.compare(senha, usuarioEncontrado.senha)
    if(!senhaCerta){
      return res.status(400).json({ error: 'Senha ou usuário incorreto'})
    }

    const refreshToken = crypto.randomBytes(32).toString('base64url')
    
    const refreshTokenHash = hashRefreshToken(refreshToken)
    await RefreshToken.create({
      userID: usuarioEncontrado._id,
      tokenHash: refreshTokenHash,
    })

    const accessToken = jwt.sign(
      { id: usuarioEncontrado._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.status(201).json({ refreshToken, accessToken, username: usuarioEncontrado.username });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username ou email já está em uso' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
}


export { 
  cadastrar,
  logar
};

