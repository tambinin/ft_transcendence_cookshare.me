import os
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from db_sync import fetch_recipes_as_documents

# Configuration
PDF_FOLDER = os.getenv("PDF_FOLDER", "./pdfs")
DB_PATH = os.getenv("DB_PATH", "./faiss_index")
DB_SYNC_INTERVAL = int(os.getenv("DB_SYNC_INTERVAL", "3600"))  # seconds

# ── Multi-Provider API Key Rotation ──
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-2.5-flash"

def _parse_keys(env_var: str) -> list[str]:
    raw = os.getenv(env_var, "")
    return [k.strip() for k in raw.split(",") if k.strip()]

def _build_llm_pool() -> list:
    """Build a pool of LLM instances from all available Groq + Gemini keys."""
    pool = []
    groq_keys = _parse_keys("GROQ_API_KEYS") or _parse_keys("GROQ_API_KEY")
    for k in groq_keys:
        pool.append(("groq", ChatGroq(api_key=k, model=GROQ_MODEL, temperature=0)))

    gemini_keys = _parse_keys("GEMINI_API_KEYS") or _parse_keys("GOOGLE_API_KEY")
    for k in gemini_keys:
        pool.append(("gemini", ChatGoogleGenerativeAI(google_api_key=k, model=GEMINI_MODEL, temperature=0)))

    print(f" Pool LLM : {sum(1 for p, _ in pool if p == 'groq')} Groq + {sum(1 for p, _ in pool if p == 'gemini')} Gemini = {len(pool)} total")
    return pool

LLM_POOL = _build_llm_pool()

class RotatingLLM:
    """Rotates across multiple LLM providers/keys on rate-limit errors."""

    def __init__(self, pool: list):
        self._pool = pool
        self._index = 0
        self._lock = threading.Lock()

    def _rotate(self):
        with self._lock:
            self._index = (self._index + 1) % len(self._pool)
            provider, _ = self._pool[self._index]
            print(f" Rotation → {provider} #{self._index + 1}/{len(self._pool)}")

    def invoke(self, *args, **kwargs):
        if not self._pool:
            raise RuntimeError("Aucune clé API configurée")
        last_error = None
        for _ in range(len(self._pool)):
            provider, llm = self._pool[self._index]
            try:
                return llm.invoke(*args, **kwargs)
            except Exception as e:
                err_str = str(e).lower()
                if any(t in err_str for t in ["rate_limit", "429", "quota", "resource_exhausted", "too many requests"]):
                    print(f" {provider} #{self._index + 1} limitée: {e}")
                    last_error = e
                    self._rotate()
                else:
                    raise
        raise last_error

# ── Globals set during lifespan ──
rag_chain = None
_vectorstore = None
_embeddings = None
_sync_task = None


def build_pdf_chunks():
    """Load and chunk PDF documents."""
    loader = DirectoryLoader(
        PDF_FOLDER,
        glob="**/*.pdf",
        loader_cls=PyPDFLoader,
        loader_kwargs={"extract_images": False}
    )
    docs = loader.load()
    print(f" {len(docs)} page(s) chargée(s) depuis les PDF")
    if not docs:
        print(" Aucun document PDF trouvé dans:", PDF_FOLDER)
        return []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=400
    )
    chunks = text_splitter.split_documents(docs)
    chunks = [c for c in chunks if c.page_content.strip()]
    print(f" {len(chunks)} chunk(s) PDF générés")
    for i, chunk in enumerate(chunks):
        filename = os.path.basename(chunk.metadata.get("source", "inconnu.pdf"))
        chunk.metadata["filename"] = filename
        chunk.metadata["chunk_id"] = i
    return chunks


def build_db_chunks():
    """Fetch recipes from DB and chunk them."""
    db_docs = fetch_recipes_as_documents()
    if not db_docs:
        return []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=400
    )
    chunks = text_splitter.split_documents(db_docs)
    chunks = [c for c in chunks if c.page_content.strip()]
    print(f" {len(chunks)} chunk(s) DB générés depuis {len(db_docs)} recette(s)")
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = f"db_{i}"
    return chunks


def build_chunks():
    """Build all chunks from PDFs + Database."""
    pdf_chunks = build_pdf_chunks()
    db_chunks = build_db_chunks()
    all_chunks = pdf_chunks + db_chunks
    print(f" Total: {len(all_chunks)} chunks ({len(pdf_chunks)} PDF + {len(db_chunks)} DB)")
    return all_chunks


def format_docs(docs):
    return "\n\n".join(
        f"Source: {doc.metadata.get('filename', 'Inconnu')}\n{doc.page_content}"
        for doc in docs
    )


def rebuild_index(force: bool = False):
    """Build or rebuild the FAISS index from PDFs + DB recipes."""
    global _vectorstore, _embeddings

    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-small")

    index_file = os.path.join(DB_PATH, "index.faiss")
    if os.path.exists(index_file) and not force:
        print(" Chargement de l'index FAISS existant")
        _vectorstore = FAISS.load_local(DB_PATH, _embeddings, allow_dangerous_deserialization=True)
        # Still try to add fresh DB recipes on top
        db_chunks = build_db_chunks()
        if db_chunks:
            print(f"Ajout de {len(db_chunks)} chunks DB à l'index existant")
            _vectorstore.add_documents(db_chunks)
            _vectorstore.save_local(DB_PATH)
    else:
        reason = "force rebuild" if force else "index non trouvé"
        print(f"{reason} → création de l'index")
        chunks = build_chunks()
        if not chunks:
            print("Aucun chunk disponible. RAG démarrera sans index.")
            return None
        _vectorstore = FAISS.from_documents(chunks, _embeddings)
        _vectorstore.save_local(DB_PATH)
        print("Index FAISS créé et sauvegardé")

    return _vectorstore


def init_rag_chain():
    """Build and return the RAG chain."""
    vectorstore = rebuild_index()
    if vectorstore is None:
        return None

    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})

    template = """Vous êtes un assistant culinaire expert parlant français.

INSTRUCTIONS IMPORTANTES :
1. Utilisez uniquement les informations des recettes fournies dans le contexte ci-dessous.
2. Ne mentionnez JAMAIS les numéros de page, les sources, ni d'où provient l'information. Répondez directement.
3. **CALCUL DES PROPORTIONS** :
   - Si l'utilisateur demande pour un nombre de personnes différent de la recette originale, ajustez les quantités automatiquement.
   - Ne montrez PAS le calcul (pas de "recette originale pour X, adaptée pour Y", pas de "multiplié par...", pas de facteur de conversion).
   - Donnez directement les quantités finales ajustées pour le nombre de personnes demandé.
   - Arrondissez intelligemment les quantités (ex: 2.5 → 2½, 0.75 → ¾).
4. Soyez précis, clair et donnez les quantités, temps et étapes de manière bien structurée.
5. Si vous ne trouvez pas l'information, dites "Je n'ai pas trouvé cette recette dans mes documents."
6. Si la recette provient de CookShare (publiée par un utilisateur de la communauté), mentionnez que c'est une recette partagée par la communauté CookShare.

Contexte des recettes :
{context}

Question : {question}

Réponse claire et bien structurée :"""

    prompt = ChatPromptTemplate.from_template(template)

    rag_llm = RunnableLambda(RotatingLLM(LLM_POOL).invoke) if LLM_POOL else ChatGroq(model=GROQ_MODEL, temperature=0)

    return (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | rag_llm
        | StrOutputParser()
    )


async def _periodic_db_sync():
    """Background task: re-sync DB recipes into FAISS every DB_SYNC_INTERVAL seconds."""
    import asyncio
    while True:
        await asyncio.sleep(DB_SYNC_INTERVAL)
        try:
            print(f"Sync périodique DB → FAISS...")
            _do_sync()
            print("Sync périodique terminée")
        except Exception as e:
            print(f"Erreur sync périodique: {e}")


def _do_sync():
    """Re-index DB recipes into the existing FAISS vectorstore."""
    global rag_chain, _vectorstore
    if _vectorstore is None or _embeddings is None:
        print("Vectorstore non initialisé, rebuild complet")
        vs = rebuild_index(force=True)
    else:
        db_chunks = build_db_chunks()
        if not db_chunks:
            print("Aucune recette en base, rien à synchroniser")
            return
        # Rebuild from scratch (PDF + DB) to avoid duplicates
        vs = rebuild_index(force=True)

    if vs is None:
        return

    retriever = vs.as_retriever(search_kwargs={"k": 6})
    template = """Vous êtes un assistant culinaire expert parlant français.

INSTRUCTIONS IMPORTANTES :
1. Utilisez uniquement les informations des recettes fournies dans le contexte ci-dessous.
2. Ne mentionnez JAMAIS les numéros de page, les sources, ni d'où provient l'information. Répondez directement.
3. **CALCUL DES PROPORTIONS** :
   - Si l'utilisateur demande pour un nombre de personnes différent de la recette originale, ajustez les quantités automatiquement.
   - Ne montrez PAS le calcul (pas de "recette originale pour X, adaptée pour Y", pas de "multiplié par...", pas de facteur de conversion).
   - Donnez directement les quantités finales ajustées pour le nombre de personnes demandé.
   - Arrondissez intelligemment les quantités (ex: 2.5 → 2½, 0.75 → ¾).
4. Soyez précis, clair et donnez les quantités, temps et étapes de manière bien structurée.
5. Si vous ne trouvez pas l'information, dites "Je n'ai pas trouvé cette recette dans mes documents."
6. Si la recette provient de CookShare (publiée par un utilisateur), mentionnez que c'est une recette de la communauté CookShare.

Contexte des recettes :
{context}

Question : {question}

Answer claire et bien structurée :"""

    prompt = ChatPromptTemplate.from_template(template)
    rag_llm = RunnableLambda(RotatingLLM(LLM_POOL).invoke) if LLM_POOL else ChatGroq(model=GROQ_MODEL, temperature=0)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | rag_llm
        | StrOutputParser()
    )


# ── FastAPI lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    global rag_chain, _sync_task
    print("Initialisation du service RAG...")
    rag_chain = init_rag_chain()
    if rag_chain is None:
        print("Service RAG démarré sans index (aucun PDF disponible)")
    else:
        print("Service RAG prêt")
    # Start periodic DB sync
    _sync_task = asyncio.create_task(_periodic_db_sync())
    yield
    if _sync_task:
        _sync_task.cancel()


app = FastAPI(
    title="CookShare RAG Service",
    description="Assistant culinaire intelligent basé sur les recettes PDF",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Authentication ──
# The RAG service is called via Nginx proxy (/rag/...) which strips the path
# prefix. The INTERNAL_API_KEY is loaded from Vault secrets (rag.env).
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

async def verify_internal_api_key(request: Request):
    """Verify x-internal-api-key header on protected routes."""
    if not INTERNAL_API_KEY:
        # If no key is configured, skip auth (should never happen in prod)
        return
    provided = request.headers.get("x-internal-api-key", "")
    if provided != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid or missing API key")

# CORS — restrict to known origins only (Nginx proxies from same origin,
# so the browser Origin header will be the app domain, not "*")
DOMAIN = os.getenv("DOMAIN", "cookshare.me")
cors_origins = [
    f"https://{DOMAIN}",
    f"http://{DOMAIN}",
    "https://localhost",
    "http://localhost:5173",
    "https://cookshare.me",
    "https://www.cookshare.me",
]
# In dev mode, also allow local IPs
if DOMAIN not in ("cookshare.me", "localhost"):
    cors_origins.extend([
        f"https://{DOMAIN}:5173",
        f"http://{DOMAIN}:5173",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "x-internal-api-key"],
)


# ── Request / Response models ──
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str


# ── LLM instance (reused for classification & free chat) ──
llm = RotatingLLM(LLM_POOL) if LLM_POOL else ChatGroq(model=GROQ_MODEL, temperature=0)


def needs_rag(message: str) -> bool:
    """Ask the LLM whether the message is about recipes/cooking."""
    response = llm.invoke(
        "Le message suivant concerne-t-il une recette, un ingrédient, ou une question culinaire ? "
        "Répondre uniquement OUI ou NON.\n\n"
        f"Message : {message}"
    )
    return "OUI" in response.content.upper()


def format_history(history: list[ChatMessage], limit: int = 10) -> str:
    """Format recent history for inclusion in prompts."""
    recent = history[-limit:]
    return "\n".join(
        f"{'Utilisateur' if m.role == 'user' else 'Assistant'} : {m.content}"
        for m in recent
    )


# ── Routes ──
@app.get("/health")
async def health():
    return {"status": "ok", "service": "rag"}


@app.post("/sync", dependencies=[Depends(verify_internal_api_key)])
async def sync_db():
    """Manually trigger a DB → FAISS re-sync."""
    try:
        _do_sync()
        return {"status": "ok", "message": "Sync DB terminée"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_internal_api_key)])
async def chat(request: ChatRequest):
    """Send a question and get an answer — routes to RAG or free chat."""
    message = request.message
    history = request.history

    # Classify: does this need RAG?
    use_rag = rag_chain is not None and needs_rag(message)

    if use_rag:
        try:
            # Build a contextualised query including recent history
            history_text = format_history(history)
            query = f"{history_text}\nUtilisateur : {message}" if history_text else message
            answer = rag_chain.invoke(query)
        except Exception as e:
            print(f"Erreur lors de l'invocation du RAG chain: {e}")
            return ChatResponse(answer="Désolé, une erreur est survenue lors du traitement de votre question. Veuillez réessayer.")
    else:
        # Free conversation (no RAG retrieval)
        history_text = format_history(history)
        system_prompt = (
            "Tu es l'assistant culinaire CookShare, sympathique et expert en cuisine. "
            "Tu parles français. Tu peux discuter librement, mais ton domaine d'expertise est la cuisine. "
            "Sois concis et amical."
        )
        messages = [
            ("system", system_prompt),
        ]
        if history_text:
            messages.append(("system", f"Historique de la conversation :\n{history_text}"))
        messages.append(("human", message))
        try:
            response = llm.invoke(messages)
            answer = response.content
        except Exception as e:
            print(f"Erreur lors du chat libre: {e}")
            return ChatResponse(answer="Désolé, une erreur est survenue. Veuillez réessayer.")

    return ChatResponse(answer=answer)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ["PORT"]), reload=False)
