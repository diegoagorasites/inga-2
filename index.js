import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 10000;
const CACHE_FILE = './rss-cache.xml';
const CACHE_TIME = 1000 * 60 * 5; // 5 minutos

async function gerarRSS() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://www.maringa.pr.gov.br/noticias/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  const html = await page.content();
  await browser.close();

  // Aqui seu código de parse e gerar XML
  // Para simplificar, retorno só o HTML por enquanto
  return html; 
}

app.get('/', async (req, res) => {
  try {
    const stat = await fs.stat(CACHE_FILE).catch(() => null);
    if (stat && (Date.now() - stat.mtimeMs) < CACHE_TIME) {
      // Usa cache
      const cached = await fs.readFile(CACHE_FILE, 'utf8');
      res.set('Content-Type', 'application/rss+xml');
      return res.send(cached);
    }
    // Gera RSS novo
    const rss = await gerarRSS();
    await fs.writeFile(CACHE_FILE, rss, 'utf8');
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao gerar RSS.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta: ${PORT}`);
});