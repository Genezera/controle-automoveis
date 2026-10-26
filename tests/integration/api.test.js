const request = require('supertest');
const createApp = require('../../src/app');

describe('API', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  const criarAutomovel = async (dados = {}) =>
    (
      await request(app)
        .post('/automoveis')
        .send({ placa: 'ABC1D23', cor: 'Preto', marca: 'Fiat', ...dados })
    ).body;

  const criarMotorista = async (nome = 'Ana') =>
    (await request(app).post('/motoristas').send({ nome })).body;

  const iniciarUtilizacao = (motorista, automovel, extra = {}) =>
    request(app)
      .post('/utilizacoes')
      .send({ motoristaId: motorista.id, automovelId: automovel.id, motivo: 'Entrega', ...extra });

  describe('/automoveis', () => {
    it('executa o ciclo completo de cadastro', async () => {
      const criado = await request(app)
        .post('/automoveis')
        .send({ placa: 'ABC1D23', cor: 'Preto', marca: 'Fiat' });
      expect(criado.status).toBe(201);

      const { id } = criado.body;
      expect(criado.headers.location).toBe(`/automoveis/${id}`);
      expect((await request(app).get(`/automoveis/${id}`)).body).toEqual(criado.body);

      const atualizado = await request(app)
        .put(`/automoveis/${id}`)
        .send({ placa: 'ABC1D23', cor: 'Azul', marca: 'Fiat' });
      expect(atualizado.status).toBe(200);
      expect(atualizado.body.cor).toBe('Azul');

      expect((await request(app).delete(`/automoveis/${id}`)).status).toBe(204);
      expect((await request(app).get(`/automoveis/${id}`)).status).toBe(404);
    });

    it('filtra a listagem por cor e marca', async () => {
      await criarAutomovel({ placa: 'AAA1A11', cor: 'Preto', marca: 'Fiat' });
      await criarAutomovel({ placa: 'BBB2B22', cor: 'Branco', marca: 'Fiat' });
      await criarAutomovel({ placa: 'CCC3C33', cor: 'Preto', marca: 'Ford' });

      const porCor = await request(app).get('/automoveis').query({ cor: 'preto' });
      const porMarca = await request(app).get('/automoveis').query({ marca: 'fiat' });
      const ambos = await request(app).get('/automoveis').query({ cor: 'preto', marca: 'fiat' });

      expect(porCor.body).toHaveLength(2);
      expect(porMarca.body).toHaveLength(2);
      expect(ambos.body.map((a) => a.placa)).toEqual(['AAA1A11']);
    });

    it('responde 400 com dados inválidos e 409 para placa duplicada', async () => {
      const invalido = await request(app).post('/automoveis').send({ cor: 'Preto' });
      expect(invalido.status).toBe(400);
      expect(invalido.body.erro).toMatch(/placa/);

      await criarAutomovel();
      const duplicado = await request(app)
        .post('/automoveis')
        .send({ placa: 'ABC1D23', cor: 'Azul', marca: 'Ford' });
      expect(duplicado.status).toBe(409);
    });
  });

  describe('/motoristas', () => {
    it('executa o ciclo completo de cadastro', async () => {
      const criado = await request(app).post('/motoristas').send({ nome: 'Ana' });
      expect(criado.status).toBe(201);

      const { id } = criado.body;
      expect(criado.headers.location).toBe(`/motoristas/${id}`);
      expect((await request(app).get(`/motoristas/${id}`)).body).toEqual({ id, nome: 'Ana' });

      const atualizado = await request(app).put(`/motoristas/${id}`).send({ nome: 'Ana Maria' });
      expect(atualizado.body.nome).toBe('Ana Maria');

      expect((await request(app).delete(`/motoristas/${id}`)).status).toBe(204);
      expect((await request(app).get(`/motoristas/${id}`)).status).toBe(404);
    });

    it('filtra a listagem por nome', async () => {
      await criarMotorista('João Silva');
      await criarMotorista('Maria Souza');

      const resposta = await request(app).get('/motoristas').query({ nome: 'maria' });

      expect(resposta.body.map((m) => m.nome)).toEqual(['Maria Souza']);
    });

    it('responde 400 quando a requisição não tem corpo', async () => {
      expect((await request(app).post('/motoristas')).status).toBe(400);
    });
  });

  describe('/utilizacoes', () => {
    it('inicia, lista e finaliza uma utilização', async () => {
      const automovel = await criarAutomovel();
      const motorista = await criarMotorista('Ana');

      const iniciada = await iniciarUtilizacao(motorista, automovel);
      expect(iniciada.status).toBe(201);
      expect(iniciada.body.dataFim).toBeNull();

      const lista = await request(app).get('/utilizacoes');
      expect(lista.body).toHaveLength(1);
      expect(lista.body[0]).toMatchObject({
        motivo: 'Entrega',
        motorista: { nome: 'Ana' },
        automovel: { placa: 'ABC1D23', cor: 'Preto', marca: 'Fiat' },
      });

      const finalizada = await request(app).patch(`/utilizacoes/${iniciada.body.id}/finalizar`);
      expect(finalizada.status).toBe(200);
      expect(finalizada.body.dataFim).not.toBeNull();
    });

    it('aplica as regras de uso exclusivo (409)', async () => {
      const carro1 = await criarAutomovel({ placa: 'AAA1A11' });
      const carro2 = await criarAutomovel({ placa: 'BBB2B22' });
      const ana = await criarMotorista('Ana');
      const bruno = await criarMotorista('Bruno');

      expect((await iniciarUtilizacao(ana, carro1)).status).toBe(201);
      expect((await iniciarUtilizacao(bruno, carro1)).status).toBe(409);
      expect((await iniciarUtilizacao(ana, carro2)).status).toBe(409);
    });

    it('impede utilização retroativa que se sobrepõe a uma já finalizada (409)', async () => {
      const automovel = await criarAutomovel();
      const ana = await criarMotorista('Ana');
      const bruno = await criarMotorista('Bruno');

      const anterior = await iniciarUtilizacao(ana, automovel, {
        dataInicio: '2024-05-10T08:00:00Z',
      });
      await request(app)
        .patch(`/utilizacoes/${anterior.body.id}/finalizar`)
        .send({ dataFim: '2024-05-10T10:00:00Z' });

      const sobreposta = await iniciarUtilizacao(bruno, automovel, {
        dataInicio: '2024-05-10T09:00:00Z',
      });
      expect(sobreposta.status).toBe(409);
    });

    it('não exclui automóvel nem motorista com utilizações registradas', async () => {
      const automovel = await criarAutomovel();
      const motorista = await criarMotorista();
      await iniciarUtilizacao(motorista, automovel);

      expect((await request(app).delete(`/automoveis/${automovel.id}`)).status).toBe(409);
      expect((await request(app).delete(`/motoristas/${motorista.id}`)).status).toBe(409);
    });
  });

  describe('infraestrutura', () => {
    it('expõe um health check', async () => {
      const resposta = await request(app).get('/health');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ status: 'ok' });
    });

    it('serve a especificação OpenAPI e o Swagger UI', async () => {
      const spec = await request(app).get('/openapi.json');
      expect(spec.status).toBe(200);
      expect(Object.keys(spec.body.paths)).toEqual(
        expect.arrayContaining(['/automoveis', '/motoristas', '/utilizacoes']),
      );

      expect((await request(app).get('/docs/')).status).toBe(200);
      expect((await request(app).get('/')).headers.location).toBe('/docs');
    });

    it('não expõe o cabeçalho X-Powered-By', async () => {
      expect((await request(app).get('/health')).headers['x-powered-by']).toBeUndefined();
    });

    it('responde 404 para rotas desconhecidas', async () => {
      expect((await request(app).get('/nada')).status).toBe(404);
    });

    it('responde 400 para JSON malformado', async () => {
      const resposta = await request(app)
        .post('/motoristas')
        .set('Content-Type', 'application/json')
        .send('{ invalido');

      expect(resposta.status).toBe(400);
    });
  });
});
