# ML Intelligence

Plataforma completa de inteligência para vendedores do **Mercado Livre** — da análise de mercado à estratégia de campanha, alimentada por GPT-4o e DALL-E 3.

---

## Módulos

### Módulo 1 — Análise de Mercado
Coleta inteligência de mercado antes de qualquer ação:
- **3 formas de entrada:** link de anúncio ML, busca por palavra-chave ou dados manuais
- Preço médio, mínimo, máximo e mediano dos concorrentes
- Top 20 keywords ranqueadas por frequência
- Top 5 vendedores por volume de vendas
- % de frete grátis e Fulfillment no nicho
- Insights de IA: público-alvo, logística ideal, reclamações comuns, oportunidade de diferenciação
- Recomendação de canal: orgânico vs. Ads (com justificativa)

### Módulo 2 — Estrutura do Anúncio
Gera o anúncio completo com base nos dados do Módulo 1:
- Título otimizado (até 60 caracteres, com keyword principal)
- Descrição persuasiva em HTML (mínimo 500 palavras, benefícios > features)
- Ficha técnica no padrão ML
- 20 keywords ranqueadas por relevância
- Sugestão de preço com justificativa
- Geração de imagem profissional via **DALL-E 3**

### Módulo 3 — Calculadora de Margem
Calculadora interativa com atualização em tempo real:
- Sliders para preço de venda, custo, comissão ML, impostos, frete e embalagem
- Margem bruta e líquida
- Lucro por unidade e ROI
- Ponto de equilíbrio (break-even em unidades)
- Breakdown visual de todos os custos

### Módulo 4 — Estratégia de Campanha
Usa os dados dos 3 módulos anteriores para recomendar:
- Investir ou não em Ads (com justificativa baseada em dados)
- Orçamento inicial sugerido e ROAS esperado
- Plano de escalonamento em fases (objetivos, ações, orçamento diário)
- KPIs para monitorar
- Alertas e riscos

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + React 18 + Tailwind CSS |
| Backend | Python 3.12 + FastAPI + Uvicorn |
| IA (texto) | OpenAI GPT-4o |
| IA (imagens) | OpenAI DALL-E 3 |
| Dados de mercado | API pública do Mercado Livre |

---

## Pré-requisitos

- [Python 3.12+](https://python.org/downloads)
- [Node.js 18+](https://nodejs.org)
- Conta com créditos na [OpenAI](https://platform.openai.com)

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ml-intelligence.git
cd ml-intelligence
```

### 2. Configure a chave da OpenAI

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e adicione sua chave:

```
OPENAI_API_KEY=sk-...
```

### 3. Instale as dependências do backend

```bash
cd backend
pip install -r requirements.txt
```

### 4. Instale as dependências do frontend

```bash
cd frontend
npm install
```

---

## Executando

### Backend (porta 8000)

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend (porta 3000)

```bash
cd frontend
npm run dev
```

Ou execute tudo de uma vez no Windows:

```bash
start.bat
```

Acesse em: **http://localhost:3000**  
Documentação da API: **http://localhost:8000/docs**

---

## Estrutura do Projeto

```
ml-intelligence/
├── start.bat                    # Inicia backend + frontend
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── market.py            # Módulo 1 — Análise de Mercado
│   │   ├── listing.py           # Módulo 2 — Estrutura do Anúncio
│   │   ├── margin.py            # Módulo 3 — Calculadora de Margem
│   │   └── campaign.py          # Módulo 4 — Estratégia de Campanha
│   └── services/
│       ├── ml_api.py            # Integração com API do Mercado Livre
│       └── openai_svc.py        # GPT-4o + DALL-E 3
└── frontend/
    ├── app/
    │   ├── page.tsx             # Dashboard
    │   ├── module1/page.tsx     # Análise de Mercado
    │   ├── module2/page.tsx     # Estrutura do Anúncio
    │   ├── module3/page.tsx     # Calculadora de Margem
    │   └── module4/page.tsx     # Estratégia de Campanha
    ├── components/
    │   └── Sidebar.tsx
    └── lib/
        └── api.ts               # Cliente HTTP + persistência localStorage
```

---

## Fluxo de dados entre módulos

```
Módulo 1 → salva dados de mercado no localStorage
    ↓
Módulo 2 → carrega dados do Módulo 1, gera anúncio completo
    ↓
Módulo 3 → carrega preço sugerido do Módulo 2, calcula margens
    ↓
Módulo 4 → carrega dados dos Módulos 1, 2 e 3 para gerar estratégia
```

Cada módulo pode ser usado de forma independente — os dados dos módulos anteriores são carregados automaticamente quando disponíveis.

---

## Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `OPENAI_API_KEY` | Chave da API OpenAI | Sim (Módulos 1, 2 e 4) |

---

## Custo estimado por análise completa

| Operação | Modelo | Custo aprox. |
|---|---|---|
| Análise de mercado (Módulo 1) | GPT-4o | ~$0.02 |
| Geração do anúncio (Módulo 2) | GPT-4o | ~$0.05 |
| Geração de imagem (Módulo 2) | DALL-E 3 | ~$0.04 |
| Estratégia de campanha (Módulo 4) | GPT-4o | ~$0.02 |
| **Total** | | **~$0.13** |

---

## Licença

MIT
