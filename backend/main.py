from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import market, listing, margin, campaign

load_dotenv()

app = FastAPI(title="ML Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router, prefix="/api/market", tags=["Módulo 1 - Análise de Mercado"])
app.include_router(listing.router, prefix="/api/listing", tags=["Módulo 2 - Estrutura do Anúncio"])
app.include_router(margin.router, prefix="/api/margin", tags=["Módulo 3 - Calculadora de Margem"])
app.include_router(campaign.router, prefix="/api/campaign", tags=["Módulo 4 - Estratégia de Campanha"])

@app.get("/")
def root():
    return {"status": "ok", "message": "ML Intelligence API rodando"}
