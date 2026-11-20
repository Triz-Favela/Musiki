import express from "express";
const router = express.Router();

import { atualizaAccessToken } from "../services/auth";
import { enviarEmail, checarOTP, mudarSenha } from "../controller/usuarioController";

router.post('/refresh', atualizaAccessToken)
router.post('/enviar-email', enviarEmail);
router.post('/checar-otp', checarOTP);
router.post('/mudar-senha', mudarSenha);


export default router