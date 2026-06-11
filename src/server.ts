import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use((_, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

// ── Multer (PDF upload) ───────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    cb(null, ok);
  },
});

// ── Notion integration ────────────────────────────────────────
// Variáveis de ambiente necessárias:
//   NOTION_TOKEN       → token da integração (notion.so/my-integrations)
//   NOTION_DATABASE_ID → ID do banco de dados de pedidos
//
// Propriedades esperadas no banco Notion:
//   Nome           → Title
//   Tipo           → Select   (PF | PJ)
//   Documento      → Text
//   Telefone       → Phone number
//   Email          → Email
//   Data           → Date
//   Total          → Number (BRL)
//   Status         → Select   (Novo | Em Produção | Entregue | Cancelado)
//   Itens          → Text
//   Endereço       → Text
//   Observações    → Text
//   Entrada (%)    → Number
//   Orçamento PDF  → URL

app.post('/api/notion/order', upload.single('orcamento'), async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    res
      .status(503)
      .json({ error: 'Notion não configurado. Defina NOTION_TOKEN e NOTION_DATABASE_ID.' });
    return;
  }

  type Addr = {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  const fmtAddr = (a: Addr) =>
    [a.logradouro, a.numero, a.complemento, a.bairro, `${a.cidade}/${a.uf}`, a.cep]
      .filter(Boolean)
      .join(', ');

  const order = JSON.parse(req.body.data) as {
    clientName: string;
    clientType: 'pf' | 'pj';
    document: string;
    phone: string;
    email: string;
    notes: string;
    itemsSummary: string;
    totalAmount: number;
    paidPercentage: number;
    billingAddress?: Addr;
    deliveryAddress?: Addr;
  };

  const fileUrl = req.file
    ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    : null;

  const addressText = [
    order.billingAddress ? `Faturamento: ${fmtAddr(order.billingAddress)}` : '',
    order.deliveryAddress ? `Entrega: ${fmtAddr(order.deliveryAddress)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const properties: Record<string, unknown> = {
    Nome: { title: [{ text: { content: order.clientName } }] },
    Tipo: { select: { name: order.clientType === 'pj' ? 'PJ' : 'PF' } },
    Documento: { rich_text: [{ text: { content: order.document || '' } }] },
    Telefone: { phone_number: order.phone || null },
    Email: { email: order.email || null },
    Data: { date: { start: new Date().toISOString().split('T')[0] } },
    Total: { number: order.totalAmount },
    Status: { select: { name: 'Novo' } },
    Itens: { rich_text: [{ text: { content: order.itemsSummary.slice(0, 2000) } }] },
    Endereço: { rich_text: [{ text: { content: addressText } }] },
    Observações: { rich_text: [{ text: { content: order.notes || '' } }] },
  };

  if (order.paidPercentage > 0) {
    properties['Entrada (%)'] = { number: order.paidPercentage };
  }

  if (fileUrl) {
    properties['Orçamento PDF'] = { url: fileUrl };
  }

  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ parent: { database_id: dbId }, properties }),
    });

    if (!notionRes.ok) {
      const detail = await notionRes.text();
      res.status(502).json({ error: 'Erro ao salvar no Notion', detail });
      return;
    }

    const page = (await notionRes.json()) as { id: string };
    res.json({ ok: true, pageId: page.id, fileUrl });
  } catch {
    res.status(500).json({ error: 'Erro interno ao chamar a API do Notion' });
  }
});

app.listen(PORT, () => {
  console.log(`Umbrella Budget rodando na porta ${PORT}`);
});
