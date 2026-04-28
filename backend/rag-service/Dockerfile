FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système si nécessaire
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY app.py db_sync.py ./

# Créer les dossiers nécessaires
RUN mkdir -p pdfs faiss_index

# Copier les PDF (fallback si le volume n'est pas monté)
COPY pdfs/ pdfs/

# Exposer le port Gradio
EXPOSE 7860

# Commande de démarrage
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
