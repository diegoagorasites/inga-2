import express from 'express';

const app = express();
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.send('Hello from Render!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});