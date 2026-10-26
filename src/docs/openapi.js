/**
 * Especificação OpenAPI 3 da API, servida em /openapi.json e exibida pelo Swagger UI em /docs.
 */

const ref = (schema) => ({ $ref: `#/components/schemas/${schema}` });
const json = (schema, example) => ({ content: { 'application/json': { schema, example } } });
const resposta = (description, schema) => ({ description, ...(schema && json(schema)) });

const erro = (description) => resposta(description, ref('Erro'));
const idParam = (descricao) => ({
  name: 'id',
  in: 'path',
  required: true,
  description: descricao,
  schema: { type: 'string', format: 'uuid' },
});

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Controle de Automóveis',
    version: '1.0.0',
    description:
      'WebAPI para controlar a utilização dos automóveis de uma empresa. ' +
      'Um automóvel só pode ser utilizado por um motorista por vez, e um motorista ' +
      'só pode utilizar um automóvel por vez.',
  },
  tags: [{ name: 'Automóveis' }, { name: 'Motoristas' }, { name: 'Utilizações' }],
  paths: {
    '/automoveis': {
      get: {
        tags: ['Automóveis'],
        summary: 'Lista os automóveis',
        parameters: [
          { name: 'cor', in: 'query', schema: { type: 'string' }, description: 'Filtra pela cor' },
          {
            name: 'marca',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra pela marca',
          },
        ],
        responses: {
          200: resposta('Automóveis encontrados', { type: 'array', items: ref('Automovel') }),
        },
      },
      post: {
        tags: ['Automóveis'],
        summary: 'Cadastra um automóvel',
        requestBody: { required: true, ...json(ref('AutomovelInput')) },
        responses: {
          201: resposta('Automóvel cadastrado', ref('Automovel')),
          400: erro('Dados inválidos'),
          409: erro('Placa já cadastrada'),
        },
      },
    },
    '/automoveis/{id}': {
      parameters: [idParam('Identificador do automóvel')],
      get: {
        tags: ['Automóveis'],
        summary: 'Recupera um automóvel',
        responses: { 200: resposta('Automóvel', ref('Automovel')), 404: erro('Não encontrado') },
      },
      put: {
        tags: ['Automóveis'],
        summary: 'Atualiza um automóvel',
        requestBody: { required: true, ...json(ref('AutomovelInput')) },
        responses: {
          200: resposta('Automóvel atualizado', ref('Automovel')),
          400: erro('Dados inválidos'),
          404: erro('Não encontrado'),
          409: erro('Placa já cadastrada em outro automóvel'),
        },
      },
      delete: {
        tags: ['Automóveis'],
        summary: 'Exclui um automóvel',
        responses: {
          204: resposta('Excluído'),
          404: erro('Não encontrado'),
          409: erro('Automóvel possui utilizações registradas'),
        },
      },
    },
    '/motoristas': {
      get: {
        tags: ['Motoristas'],
        summary: 'Lista os motoristas',
        parameters: [
          {
            name: 'nome',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtra pelos motoristas cujo nome contém o texto',
          },
        ],
        responses: {
          200: resposta('Motoristas encontrados', { type: 'array', items: ref('Motorista') }),
        },
      },
      post: {
        tags: ['Motoristas'],
        summary: 'Cadastra um motorista',
        requestBody: { required: true, ...json(ref('MotoristaInput')) },
        responses: {
          201: resposta('Motorista cadastrado', ref('Motorista')),
          400: erro('Dados inválidos'),
        },
      },
    },
    '/motoristas/{id}': {
      parameters: [idParam('Identificador do motorista')],
      get: {
        tags: ['Motoristas'],
        summary: 'Recupera um motorista',
        responses: { 200: resposta('Motorista', ref('Motorista')), 404: erro('Não encontrado') },
      },
      put: {
        tags: ['Motoristas'],
        summary: 'Atualiza um motorista',
        requestBody: { required: true, ...json(ref('MotoristaInput')) },
        responses: {
          200: resposta('Motorista atualizado', ref('Motorista')),
          400: erro('Dados inválidos'),
          404: erro('Não encontrado'),
        },
      },
      delete: {
        tags: ['Motoristas'],
        summary: 'Exclui um motorista',
        responses: {
          204: resposta('Excluído'),
          404: erro('Não encontrado'),
          409: erro('Motorista possui utilizações registradas'),
        },
      },
    },
    '/utilizacoes': {
      get: {
        tags: ['Utilizações'],
        summary: 'Lista as utilizações com o motorista e o automóvel',
        responses: { 200: resposta('Utilizações', { type: 'array', items: ref('Utilizacao') }) },
      },
      post: {
        tags: ['Utilizações'],
        summary: 'Inicia a utilização de um automóvel por um motorista',
        // Exemplo sem dataInicio: assim o "Try it out" usa o horário atual, e iniciar,
        // finalizar e iniciar de novo com os exemplos não gera sobreposição de períodos.
        requestBody: {
          required: true,
          ...json(ref('UtilizacaoInput'), {
            motoristaId: 'cole-aqui-o-id-do-motorista',
            automovelId: 'cole-aqui-o-id-do-automovel',
            motivo: 'Visita ao cliente',
          }),
        },
        responses: {
          201: resposta('Utilização iniciada', ref('Utilizacao')),
          400: erro('Dados inválidos'),
          404: erro('Motorista ou automóvel não encontrado'),
          409: erro('Automóvel ou motorista já em uso no período'),
        },
      },
    },
    '/utilizacoes/{id}/finalizar': {
      parameters: [idParam('Identificador da utilização')],
      patch: {
        tags: ['Utilizações'],
        summary: 'Finaliza uma utilização em andamento',
        requestBody: { required: false, ...json(ref('FinalizacaoInput'), {}) },
        responses: {
          200: resposta('Utilização finalizada', ref('Utilizacao')),
          400: erro('Data de término inválida ou anterior ao início'),
          404: erro('Utilização não encontrada'),
          409: erro('Utilização já finalizada'),
        },
      },
    },
  },
  components: {
    schemas: {
      AutomovelInput: {
        type: 'object',
        required: ['placa', 'cor', 'marca'],
        properties: {
          placa: { type: 'string', example: 'ABC1D23', description: 'Formato ABC1234 ou ABC1D23' },
          cor: { type: 'string', example: 'Preto' },
          marca: { type: 'string', example: 'Fiat' },
        },
      },
      Automovel: {
        allOf: [
          { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
          ref('AutomovelInput'),
        ],
      },
      MotoristaInput: {
        type: 'object',
        required: ['nome'],
        properties: { nome: { type: 'string', example: 'Ana Souza' } },
      },
      Motorista: {
        allOf: [
          { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
          ref('MotoristaInput'),
        ],
      },
      UtilizacaoInput: {
        type: 'object',
        required: ['motoristaId', 'automovelId', 'motivo'],
        properties: {
          motoristaId: { type: 'string', format: 'uuid' },
          automovelId: { type: 'string', format: 'uuid' },
          motivo: { type: 'string', example: 'Visita ao cliente' },
          dataInicio: {
            type: 'string',
            format: 'date-time',
            example: '2024-05-10T08:00:00-03:00',
            description: 'Opcional. ISO 8601 com fuso horário; padrão: momento da requisição',
          },
        },
      },
      FinalizacaoInput: {
        type: 'object',
        properties: {
          dataFim: {
            type: 'string',
            format: 'date-time',
            example: '2024-05-10T12:00:00-03:00',
            description: 'Opcional. ISO 8601 com fuso horário; padrão: momento da requisição',
          },
        },
      },
      Utilizacao: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          motivo: { type: 'string' },
          dataInicio: { type: 'string', format: 'date-time' },
          dataFim: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'null enquanto em andamento',
          },
          motorista: {
            type: 'object',
            properties: { id: { type: 'string', format: 'uuid' }, nome: { type: 'string' } },
          },
          automovel: ref('Automovel'),
        },
      },
      Erro: {
        type: 'object',
        properties: { erro: { type: 'string', example: 'Automóvel não encontrado' } },
      },
    },
  },
};
