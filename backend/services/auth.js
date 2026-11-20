import jwt from 'jsonwebtoken';
import RefreshToken from '../models/refreshToken.js';
import Usuario from '../models/usuario.js';

const autenticaRota = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Access token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Token malformado' });
    }
    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ 
                error: 'Token inválido ou expirado',
                message: err
            });
        }
        req.usuario = decoded;

        return next();
    });
};

const atualizaAccessToken = async (req, res) => {
    try{
        const { refreshToken } = req.body
        if(!refreshToken){
            return res.status(401).json({ error: 'Refresh token não fornecido' });
        }
        const refreshTokenValido = await RefreshToken.findOne({
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: { $gt: new Date() },
            revokedAt: null
        })

        if(!refreshTokenValido){
            return res.status(500).json({ error: 'Erro ao atualizar token, refresh token inválido'})
        }

        const accessToken = jwt.sign(
          { id: usuarioEncontrado._id.toString() },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        )
        
        res.status(200).json({ accessToken })
        
    }catch(err){
        console.log(err)
        res.status(500).json({error: 'Erro ao atualizar o token'})
    }
}

/// Essa parte aqui pra baixo é sobre a recuperação de senha
// TODO: Separar essa parte toda pra um arquivo separado na pasta service 


// TODO: Mudar essa estrutura pra um Redis
var OTPEmailList = new Map()
var ChangePassTokens = new Map()

async function enviarOTP(req, res) {
  try {
    const { email } = req.body
    const usuarioEncontrado = await Usuario.findOne({ email: email })
    if(!usuarioEncontrado){
      return res.sendStatus(200)
    }
    const OTP = gerarOTP();
    OTPEmailList.set(destinatarioID, OTP)
    setTimeout(() => {
        OTPEmailList.delete(destinatarioID)
    }, 1000 * 60 * 15)

    await enviarEmail(email, 'Recuperação de senha', 
        `
            <h3>Oii esse email é pra recuperar sua senha, não compartilha esse código com ninguém</h3>
            <h1>${OTP}</h1>
        `,
        `
            Oii esse email é pra recuperar sua senha, não compartilha esse código com ninguém: ${OTP}, 
        `
    )
    res.sendStatus(200)
  } catch(err) {
    res.status(500).json({ error: 'Erro ao enviar o email' })
  } 
}

function checarOTP(req, res) {
  try{
    const { email, OTP } = req.body
    
    if(OTPEmailList.get(email) == OTP){
        OTPEmailList.delete(email)
        const changePassToken = crypto.randomBytes(32).toString('base64url')
        ChangePassTokens.set(email, changePassToken)
        setTimeout(() => {
            ChangePassTokens.delete(email)
        }, 1000 * 60 * 5)
        return res.status(200).json({ token: changePassToken })
    }

    res.status(500).json({ error: 'Código enviado incorreto' })
    
  }catch(err){
    res.status(500).json({
      error: 'Erro ao verificar código'
    })
  }
}

async function mudarSenha(req, res) {
  try{
    const { email, token, novaSenha } = req.body
    if(ChangePassTokens.get(email) == token){
        ChangePassTokens.delete(email)
        const senhaHash = await hashSenha(novaSenha)
        if(senhaHash.error){
            return res.status(500).json({error: senhaHash.error})
        }
        await Usuario.findOneAndUpdate({ email: email }, { senha: senhaHash })
        return res.sendStatus(200)
    }
    return res.status(500).json({ error: 'Acesso a mudança de senha negado'})
  }catch(err) {
    // TODO: Corrigir erro q por enquanto nn sei qual é, dps eu vejo :P
    // NOTE: Não posso fazer mais isso, já não lembro qual o erro e nem se ja arrumei, aff
    console.log(err)
    res.status(500).json({
      error: 'Erro durante mudança de senha'
    })
  }
}

const gerarOTP = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var code = ''
    for(var i = 0; i <= 6; i++){
        code += characters.charAt(Math.random() * characters.length)
    }
    return code
}

export function hashRefreshToken(token) {
  return crypto
    .createHmac('sha256', process.env.REFRESH_TOKEN_HASH_SECRET)
    .update(token)
    .digest('hex');
}


async function hashSenha(senha) {
  // senha: obrigatória, não vazia e com tamanho válido
  if (typeof senha !== 'string' || !senha.trim()) {
    return { error: 'O campo "senha" é obrigatório e não pode ser vazio' }
  }
  if (senha.length < SENHA_MINIMA || senha.length > SENHA_MAXIMA) {
    return { error: `A senha deve ter entre ${SENHA_MINIMA} e ${SENHA_MAXIMA} caracteres`,}
  }
  return await bcrypt.hash(senha, 10);
}



export {
    hashRefreshToken,
    hashSenha,
    autenticaRota,
    atualizaAccessToken,
    enviarOTP,


    
}
