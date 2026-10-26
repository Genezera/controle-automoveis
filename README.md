# Controle de Automóveis — WebAPI

API REST em **Node.js + Express** para controlar a utilização dos automóveis de uma empresa:
cadastro de automóveis, cadastro de motoristas e registro de utilização, com persistência **em memória**.

## Como executar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npm start
```

A API sobe em `http://localhost:3000` (use a variável `PORT` para alterar a porta).
Para recarregar automaticamente durante o desenvolvimento: `npm run dev`.

## Como testar

```bash
npm test                # executa todos os testes
npm run test:coverage   # executa os testes com relatório de cobertura
```

- `tests/unit/` — testes unitários das regras de negócio de cada serviço (repositórios em memória, relógio injetado).
- `tests/integration/` — testes ponta a ponta da API HTTP com [supertest](https://github.com/ladjs/supertest).

## Endpoints

### Automóveis — `/automoveis`

| Método | Rota               | Descrição                                          |
|--------|--------------------|----------------------------------------------------|
| POST   | `/automoveis`      | Cadastra um automóvel                              |
| GET    | `/automoveis`      | Lista automóveis. Filtros: `?cor=` e `?marca=`     |
| GET    | `/automoveis/:id`  | Recupera um automóvel                              |
| PUT    | `/automoveis/:id`  | Atualiza um automóvel (corpo completo)             |
| DELETE | `/automoveis/:id`  | Exclui um automóvel                                |

Corpo: `{ "placa": "ABC1D23", "cor": "Preto", "marca": "Fiat" }`

### Motoristas — `/motoristas`

| Método | Rota               | Descrição                                          |
|--------|--------------------|----------------------------------------------------|
| POST   | `/motoristas`      | Cadastra um motorista                              |
| GET    | `/motoristas`      | Lista motoristas. Filtro: `?nome=`                 |
| GET    | `/motoristas/:id`  | Recupera um motorista                              |
| PUT    | `/motoristas/:id`  | Atualiza um motorista                              |
| DELETE | `/motoristas/:id`  | Exclui um motorista                                |

Corpo: `{ "nome": "Ana Souza" }`

### Utilizações — `/utilizacoes`

| Método | Rota                          | Descrição                                                       |
|--------|-------------------------------|-----------------------------------------------------------------|
| POST   | `/utilizacoes`                | Inicia a utilização de um automóvel por um motorista            |
| PATCH  | `/utilizacoes/:id/finalizar`  | Finaliza a utilização, registrando a data de término            |
| GET    | `/utilizacoes`                | Lista as utilizações com nome do motorista e dados do automóvel |

Iniciar — corpo:

```json
{
  "motoristaId": "<id do motorista>",
  "automovelId": "<id do automóvel>",
  "motivo": "Visita ao cliente",
  "dataInicio": "2024-05-10T08:00:00Z"
}
```

`dataInicio` é opcional (padrão: momento da requisição). Finalizar aceita opcionalmente `{ "dataFim": "..." }`
(padrão: momento da requisição).

Exemplo de item da listagem:

```json
{
  "id": "…",
  "motivo": "Visita ao cliente",
  "dataInicio": "2024-05-10T08:00:00.000Z",
  "dataFim": null,
  "motorista": { "id": "…", "nome": "Ana Souza" },
  "automovel": { "id": "…", "placa": "ABC1D23", "cor": "Preto", "marca": "Fiat" }
}
```

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

- **Um automóvel só pode ser usado por um motorista por vez** e **um motorista só pode usar um automóvel por vez**.
  Uma utilização está "em andamento" enquanto `dataFim` é `null`; tentar iniciar outra que viole a regra retorna `409`.
- Finalizar uma utilização já finalizada retorna `409`; data de término anterior ao início retorna `400`.
- A **placa** é normalizada (maiúsculas, sem hífen/espaços), validada nos formatos `ABC1234` e `ABC1D23` (Mercosul) e é **única**.
- Filtros: `cor` e `marca` usam igualdade; `nome` usa "contém". Todos ignoram maiúsculas/minúsculas e acentos.
- Para preservar o histórico, **automóveis e motoristas com utilizações registradas não podem ser excluídos** (`409`).
- Erros seguem o formato `{ "erro": "mensagem" }` com os status `400` (validação), `404` (não encontrado) e `409` (conflito).

## Estrutura

```
src/
  app.js                  composition root (monta repositórios, serviços e rotas)
  server.js               inicia o servidor HTTP
  errors.js               erros de domínio (400/404/409)
  validators.js           validação e normalização de entradas
  routes/                 camada HTTP (Express), sem regra de negócio
  services/               regras de negócio
  repositories/           persistência em memória
  middlewares/            tratamento de erros
tests/
  unit/                   testes dos serviços
  integration/            testes da API via HTTP
```

A separação em camadas (rotas → serviços → repositórios) permite trocar a persistência em memória por um banco de dados
implementando a mesma interface dos repositórios, sem alterar serviços ou rotas.
