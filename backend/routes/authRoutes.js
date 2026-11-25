import express from "express";
const router = express.Router();

import { atualizaAccessToken, enviarOTP, checarOTP, mudarSenha } from "../services/auth.js";

router.post('/refresh', atualizaAccessToken)
router.post('/enviar-email', enviarOTP);
router.post('/checar-otp', checarOTP);
router.post('/mudar-senha', mudarSenha);


export default router