import { describe, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import Usuario from '../src/models/usuario.js';
import RefreshToken from '../src/models/refreshToken.js';
import app from '../src/app.js';

describe('Rota POST /usuarios/cadastrar', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test('deve retornar status 201', async () => {
    mock.method(Usuario, 'findOne', async () => null);
    mock.method(Usuario, 'create', async (data) => ({
      _id: '666',
      username: data.username,
      email: data.email,
    }));
    mock.method(RefreshToken, 'create', async () => ({ _id: '666' }));

    const res = await request(app)
      .post('/usuarios/cadastrar')
      .send({
        username: 'Beatriz',
        email: 'triz@gmail.com',
        senha: '123456',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.username, 'Beatriz');
    assert.equal(typeof res.body.accessToken, 'string');
    assert.equal(typeof res.body.refreshToken, 'string');
  });

  test('deve retornar status 400 por não enviar o payload', async () => {
    const res = await request(app)
      .post('/usuarios/cadastrar')

    assert.equal(res.status, 400);
  });

  test('deve retornar status 409 quando username ja existe', async () => {
    mock.method(Usuario, 'findOne', async (query) => {
      if (query?.username === 'Beatriz') {
        return { _id: '666', username: 'Beatriz' };
      }
      return null;
    });

    const res = await request(app)
      .post('/usuarios/cadastrar')
      .send({
        username: 'Beatriz',
        email: 'triz@gmail.com',
        senha: '123456',
      });

    assert.equal(res.status, 409);
  });

  test('deve retornar status 409 quando o email ja existe', async () => {
    mock.method(Usuario, 'findOne', async (query) => {
      if (query?.email === 'triz@gmail.com') {
        return { _id: '666', email: 'triz@gmail.com' };
      }
      return null;
    });

    const res = await request(app)
      .post('/usuarios/cadastrar')
      .send({
        username: 'Beatriz',
        email: 'triz@gmail.com',
        senha: '123456',
      });

    assert.equal(res.status, 409);
  });
});