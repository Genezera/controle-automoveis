const createApp = require('./app');

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`API de controle de automóveis rodando em http://localhost:${PORT}`);
  console.log(`Documentação (Swagger): http://localhost:${PORT}/docs`);
});
