# Controle de Automóveis — WebAPI

[![CI](https://github.com/Genezera/controle-automoveis/actions/workflows/ci.yml/badge.svg)](https://github.com/Genezera/controle-automoveis/actions/workflows/ci.yml)

API REST em **Node.js + Express** para controlar a utilização dos automóveis de uma empresa:
cadastro de automóveis, cadastro de motoristas e registro de utilização, com persistência **em memória**.

## Sumário

- [Como executar](#como-executar)
- [Como testar](#como-testar)
- [Requisitos atendidos](#requisitos-atendidos)
- [Endpoints](#endpoints)
- [Regras de negócio e decisões](#regras-de-negócio-e-decisões)
- [Arquitetura](#arquitetura)
- [Possíveis evoluções](#possíveis-evoluções)

## Como executar

Requisitos: **Node.js 20 ou superior**.

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000` (use a variável `PORT` para alterar a porta).

- **Swagger UI:** `http://localhost:3000/docs`. A raiz `/` redireciona para essa página, que permite testar
  todos os endpoints pelo navegador.
- **Especificação OpenAPI:** `http://localhost:3000/openapi.json`
- **Health check:** `http://localhost:3000/health`

Para recarregar automaticamente durante o desenvolvimento: `npm run dev`.

## Como testar

```bash
npm test                # executa todos os testes
npm run test:coverage   # executa os testes com relatório de cobertura
npm run lint            # ESLint + verificação de formatação (Prettier)
```

| Pasta                | O que cobre                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/`        | Regras de negócio de cada serviço e validações de entrada, com repositórios em memória e relógio injetado (determinístico). |
| `tests/integration/` | A API HTTP de ponta a ponta com [supertest](https://github.com/ladjs/supertest): status, cabeçalhos e corpo das respostas.  |

O pipeline de CI (GitHub Actions) executa lint e testes a cada push, em Node 20, 22 e 24.

## Requisitos atendidos

| Requisito do enunciado                                           | Endpoint                           |
| ---------------------------------------------------------------- | ---------------------------------- |
| Cadastrar automóvel                                              | `POST /automoveis`                 |
| Atualizar automóvel                                              | `PUT /automoveis/:id`              |
| Excluir automóvel                                                | `DELETE /automoveis/:id`           |
| Recuperar automóvel pelo identificador                           | `GET /automoveis/:id`              |
| Listar automóveis, filtrando por cor e marca                     | `GET /automoveis?cor=&marca=`      |
| Cadastrar motorista                                              | `POST /motoristas`                 |
| Atualizar motorista                                              | `PUT /motoristas/:id`              |
| Excluir motorista                                                | `DELETE /motoristas/:id`           |
| Recuperar motorista pelo identificador                           | `GET /motoristas/:id`              |
| Listar motoristas, filtrando por nome                            | `GET /motoristas?nome=`            |
| Registrar utilização (motorista, automóvel, data início, motivo) | `POST /utilizacoes`                |
| Finalizar utilização guardando a data de término                 | `PATCH /utilizacoes/:id/finalizar` |
| Listar utilizações com nome do motorista e dados do automóvel    | `GET /utilizacoes`                 |
| Automóvel usado por um motorista por vez                         | `409` em `POST /utilizacoes`       |
| Motorista usando um automóvel por vez                            | `409` em `POST /utilizacoes`       |

## Endpoints

A referência completa, com esquemas e exemplos, está no Swagger (`/docs`). Resumo:

### Automóveis — `/automoveis`

| Método | Rota              | Descrição                                      | Sucesso |
| ------ | ----------------- | ---------------------------------------------- | ------- |
| POST   | `/automoveis`     | Cadastra um automóvel                          | `201`   |
| GET    | `/automoveis`     | Lista automóveis. Filtros: `?cor=` e `?marca=` | `200`   |
| GET    | `/automoveis/:id` | Recupera um automóvel                          | `200`   |
| PUT    | `/automoveis/:id` | Atualiza um automóvel (corpo completo)         | `200`   |
| DELETE | `/automoveis/:id` | Exclui um automóvel                            | `204`   |

Corpo: `{ "placa": "ABC1D23", "cor": "Preto", "marca": "Fiat" }`

### Motoristas — `/motoristas`

| Método | Rota              | Descrição                          | Sucesso |
| ------ | ----------------- | ---------------------------------- | ------- |
| POST   | `/motoristas`     | Cadastra um motorista              | `201`   |
| GET    | `/motoristas`     | Lista motoristas. Filtro: `?nome=` | `200`   |
| GET    | `/motoristas/:id` | Recupera um motorista              | `200`   |
| PUT    | `/motoristas/:id` | Atualiza um motorista              | `200`   |
| DELETE | `/motoristas/:id` | Exclui um motorista                | `204`   |

Corpo: `{ "nome": "Ana Souza" }`

### Utilizações — `/utilizacoes`

| Método | Rota                         | Descrição                                                       | Sucesso |
| ------ | ---------------------------- | --------------------------------------------------------------- | ------- |
| POST   | `/utilizacoes`               | Inicia a utilização de um automóvel por um motorista            | `201`   |
| PATCH  | `/utilizacoes/:id/finalizar` | Finaliza a utilização, registrando a data de término            | `200`   |
| GET    | `/utilizacoes`               | Lista as utilizações com nome do motorista e dados do automóvel | `200`   |

Iniciar — corpo:

```json
{
  "motoristaId": "<id do motorista>",
  "automovelId": "<id do automóvel>",
  "motivo": "Visita ao cliente",
  "dataInicio": "2024-05-10T08:00:00-03:00"
}
```

`dataInicio` é opcional (padrão: momento da requisição). Finalizar aceita opcionalmente
`{ "dataFim": "2024-05-10T12:00:00-03:00" }` (padrão: momento da requisição).

Exemplo de item da listagem:

```json
{
  "id": "5b0c1c3e-…",
  "motivo": "Visita ao cliente",
  "dataInicio": "2024-05-10T11:00:00.000Z",
  "dataFim": null,
  "motorista": { "id": "…", "nome": "Ana Souza" },
  "automovel": { "id": "…", "placa": "ABC1D23", "cor": "Preto", "marca": "Fiat" }
}
```

### Erros

Todos os erros seguem o formato `{ "erro": "mensagem" }`:

| Status | Quando                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `400`  | Dados inválidos: campo ausente, placa ou data em formato inválido, JSON malformado                   |
| `404`  | Recurso ou rota inexistente                                                                          |
| `409`  | Violação de regra de negócio: placa duplicada, automóvel ou motorista em uso, exclusão com histórico |
| `500`  | Erro inesperado (detalhes apenas no log do servidor)                                                 |

### Exemplo rápido (curl)

```bash
curl -X POST localhost:3000/automoveis -H "Content-Type: application/json" \
  -d '{"placa":"ABC1D23","cor":"Preto","marca":"Fiat"}'
curl -X POST localhost:3000/motoristas -H "Content-Type: application/json" \
  -d '{"nome":"Ana Souza"}'
curl -X POST localhost:3000/utilizacoes -H "Content-Type: application/json" \
  -d '{"motoristaId":"<id>","automovelId":"<id>","motivo":"Visita ao cliente"}'
curl -X PATCH localhost:3000/utilizacoes/<id>/finalizar
curl "localhost:3000/automoveis?cor=preto&marca=fiat"
```

## Regras de negócio e decisões

- **Uso exclusivo.** Um automóvel só pode ser usado por um motorista por vez, e um motorista só usa um automóvel
  por vez. Uma utilização está em andamento enquanto `dataFim` é `null`.
- **Sem sobreposição de períodos.** Como as datas podem ser informadas, uma nova utilização também não pode
  começar antes do término de uma utilização anterior do mesmo automóvel ou motorista. Sem essa checagem,
  um registro retroativo poderia criar dois usos simultâneos no histórico.
- **Datas** em ISO 8601 **com fuso horário obrigatório** (`Z` ou `-03:00`) e devolvidas em UTC. Sem o fuso, o
  horário dependeria do fuso do servidor. Datas inexistentes (ex.: 30/02) são rejeitadas.
- **Placa** normalizada (maiúsculas, sem hífen/espaços), validada nos formatos `ABC1234` e `ABC1D23` (Mercosul)
  e **única**.
- **Filtros:** `cor` e `marca` comparam por igualdade e `nome` por "contém". Todos ignoram maiúsculas, minúsculas e
  acentos.
- **Exclusão com histórico.** Automóveis e motoristas com utilizações registradas não podem ser excluídos
  (`409`), como uma chave estrangeira com `ON DELETE RESTRICT`. Assim a listagem de utilizações nunca aponta para
  um registro inexistente.
- **`PUT`** substitui o recurso inteiro (todos os campos obrigatórios). **`PATCH /finalizar`** altera só a data de
  término.

## Arquitetura

```
src/
  app.js            composition root: monta repositórios, serviços e rotas
  server.js         inicia o servidor HTTP
  errors.js         erros de domínio (400/404/409)
  validators.js     validação e normalização de entradas
  routes/           camada HTTP (Express), sem regra de negócio
  services/         regras de negócio
  repositories/     persistência em memória
  middlewares/      tratamento de erros
  docs/             especificação OpenAPI
tests/
  unit/             testes dos serviços e validações
  integration/      testes da API via HTTP
```

- **Camadas.** As rotas só traduzem HTTP, os serviços concentram as regras e os repositórios cuidam da
  persistência.
- **Injeção de dependências.** Os serviços recebem os repositórios (e o relógio) pelo construtor, o que torna os
  testes determinísticos e isolados.
- **Repositórios assíncronos, com consultas nomeadas.** Os filtros ficam em métodos como `findByPlaca` e
  `findByCorEMarca`, que um banco implementaria com SQL. Assim, trocar a persistência em memória por um banco
  de dados não exige mudar serviços ou rotas.
- **Express 5.** Erros lançados em handlers `async` chegam ao middleware de erros sem `try/catch` em cada rota.
- **Convenção de nomes.** O vocabulário de domínio fica em português (automóvel, motorista, utilização), como no
  enunciado. Os termos técnicos (`create`, `findById`, `list`) ficam em inglês.

## Possíveis evoluções

- Banco de dados com índice único parcial (`automovel_id WHERE data_fim IS NULL`) para garantir a regra de uso
  exclusivo mesmo com várias instâncias da API.
- Paginação nas listagens.
