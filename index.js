import express from 'express';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';

const app = express();
const PORT = process.env.PORT; // <<--- CORRETO para o Render

app.get('/', async (req, res) => {
  try {
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

    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const items = [];

    const noticias = doc.querySelectorAll('div.list-item');
    for (let i = 0; i < Math.min(5, noticias.length); i++) {
      const el = noticias[i];

      const titulo = el.querySelector('.text-xl.font-bold')?.textContent.trim() || '';
      const href = el.querySelector('a')?.getAttribute('href') || '';
      const link = href.startsWith('http') ? href : `https://www.maringa.pr.gov.br${href}`;
      const resumo = el.querySelector('.line-clamp-2')?.textContent.trim() || '';
      const imgSrc = el.querySelector('img')?.getAttribute('src') || '';
      const imagem = imgSrc.startsWith('http') ? imgSrc : (imgSrc ? `https://www.maringa.pr.gov.br${imgSrc}` : '');
      const dataBr = el.querySelector('.p-tag-label')?.textContent.trim() || '';
      const pubDate = formatarDataRSS(dataBr);

      items.push({ titulo, link, resumo, imagem, pubDate });
    }

    const rss = gerarRSS(items);
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);

  } catch (err) {
    console.error('Erro:', err);
    res.status(500).send('Erro ao gerar RSS.');
  }
});

function formatarDataRSS(dataBr) {
  const partes = dataBr.split('/');
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    const data = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);
    if (!isNaN(data)) return data.toUTCString();
  }
  return new Date().toUTCString();
}

function gerarRSS(noticias) {
  const itemsXml = noticias.map(item => `
    <item>
      <title><![CDATA[${item.titulo}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.resumo}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid>${item.link}</guid>
      ${item.imagem ? `<enclosure url="${item.imagem}" type="image/jpeg" />` : ''}
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Notícias - Prefeitura de Maringá</title>
    <link>https://www.maringa.pr.gov.br/noticias/</link>
    <description>Últimas notícias da Prefeitura de Maringá</description>
    <language>pt-BR</language>
    <pubDate>${new Date().toUTCString()}</pubDate>
    ${itemsXml}
  </channel>
</rss>`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta: ${PORT}`);
});
