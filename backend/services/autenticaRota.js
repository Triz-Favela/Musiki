import jwt from 'jsonwebtoken';
import RefreshToken from '../models/refreshToken.js';

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

export function hashRefreshToken(token) {
  return crypto
    .createHmac('sha256', process.env.REFRESH_TOKEN_HASH_SECRET)
    .update(token)
    .digest('hex');
}

export {
    hashRefreshToken,
    autenticaRota
}
