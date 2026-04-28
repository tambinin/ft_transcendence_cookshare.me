"""
Synchronise les recettes publiées de la base PostgreSQL vers des documents LangChain
pour enrichir l'index FAISS du RAG.
"""

import os
import psycopg2
import psycopg2.extras
from langchain_core.documents import Document

def _clean_db_url(raw_url: str) -> tuple[str, str]:
    """Strip Prisma-specific params (schema) and return (clean_url, schema)."""
    if not raw_url:
        return "", "public"
    raw_url = raw_url.strip().strip("'\"")
    from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query)
    schema = params.pop("schema", ["public"])[0]
    clean_query = urlencode({k: v[0] for k, v in params.items()})
    clean_url = urlunparse(parsed._replace(query=clean_query))
    return clean_url, schema

_raw_url = os.getenv("RECIPE_DATABASE_URL", "")
RECIPE_DATABASE_URL, RECIPE_SCHEMA = _clean_db_url(_raw_url)

RECIPES_QUERY = """
SELECT
    r.id,
    r.title,
    r.description,
    r."prepTime",
    r."cookTime",
    r.servings,
    r.difficulty,
    r."averageScore",
    r."ratingCount",
    r."createdAt",
    c.name AS category_name
FROM recipe_service."Recipe" r
LEFT JOIN recipe_service."Category" c ON r."categoryId" = c.id
WHERE r."isPublished" = true
ORDER BY r."createdAt" DESC
"""

INGREDIENTS_QUERY = """
SELECT name, "quantityText", "isOptional"
FROM recipe_service."RecipeIngredient"
WHERE "recipeId" = %s
ORDER BY "sortOrder"
"""

INSTRUCTIONS_QUERY = """
SELECT "stepNumber", description
FROM recipe_service."Instruction"
WHERE "recipeId" = %s
ORDER BY "stepNumber"
"""

TAGS_QUERY = """
SELECT dt.name
FROM recipe_service."RecipeDietaryTag" rdt
JOIN recipe_service."DietaryTag" dt ON rdt."dietaryTagId" = dt.id
WHERE rdt."recipeId" = %s
"""


def _difficulty_fr(d: str) -> str:
    return {"EASY": "Facile", "MEDIUM": "Moyen", "HARD": "Difficile"}.get(d, d)


def fetch_recipes_as_documents() -> list[Document]:
    """Fetch all published recipes from PostgreSQL and return as LangChain Documents."""
    if not RECIPE_DATABASE_URL:
        print("RECIPE_DATABASE_URL non configurée — pas de sync DB")
        return []

    try:
        conn = psycopg2.connect(RECIPE_DATABASE_URL, connect_timeout=10)
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(f"SET search_path TO {RECIPE_SCHEMA}, public")
    except Exception as e:
        print(f"❌ Connexion DB échouée: {e}")
        return []

    documents = []
    try:
        cur.execute(RECIPES_QUERY)
        recipes = cur.fetchall()
        print(f"📊 {len(recipes)} recette(s) publiée(s) trouvée(s) en base")

        for recipe in recipes:
            recipe_id = recipe["id"]

            # Ingredients
            cur.execute(INGREDIENTS_QUERY, (recipe_id,))
            ingredients = cur.fetchall()

            # Instructions
            cur.execute(INSTRUCTIONS_QUERY, (recipe_id,))
            instructions = cur.fetchall()

            # Dietary tags
            cur.execute(TAGS_QUERY, (recipe_id,))
            tags = [row["name"] for row in cur.fetchall()]

            # Build document text
            text = _format_recipe(recipe, ingredients, instructions, tags)

            doc = Document(
                page_content=text,
                metadata={
                    "source": "cookshare_db",
                    "recipe_id": recipe_id,
                    "title": recipe["title"],
                    "category": recipe["category_name"] or "Non catégorisée",
                    "filename": f"db_{recipe['title'][:40]}",
                },
            )
            documents.append(doc)

    except Exception as e:
        print(f"❌ Erreur lors de l'extraction des recettes: {e}")
    finally:
        cur.close()
        conn.close()

    print(f"✅ {len(documents)} document(s) générés depuis la base de données")
    return documents


def _format_recipe(recipe, ingredients, instructions, tags) -> str:
    """Format a recipe into a rich text document for RAG indexing."""
    lines = []

    lines.append(f"# {recipe['title']}")
    lines.append(f"Recette publiée sur CookShare")
    lines.append("")

    if recipe["category_name"]:
        lines.append(f"Catégorie : {recipe['category_name']}")
    lines.append(f"Difficulté : {_difficulty_fr(recipe['difficulty'])}")
    lines.append(f"Temps de préparation : {recipe['prepTime']} minutes")
    lines.append(f"Temps de cuisson : {recipe['cookTime']} minutes")
    lines.append(f"Temps total : {recipe['prepTime'] + recipe['cookTime']} minutes")
    lines.append(f"Pour {recipe['servings']} personne(s)")

    if recipe["ratingCount"] > 0:
        lines.append(f"Note moyenne : {recipe['averageScore']:.1f}/5 ({recipe['ratingCount']} avis)")

    if tags:
        lines.append(f"Tags : {', '.join(tags)}")

    lines.append("")

    # Ingredients
    if ingredients:
        lines.append("## Ingrédients")
        for ing in ingredients:
            optional = " (optionnel)" if ing["isOptional"] else ""
            lines.append(f"- {ing['quantityText']} {ing['name']}{optional}")
        lines.append("")

    # Instructions
    if instructions:
        lines.append("## Préparation")
        for step in instructions:
            lines.append(f"{step['stepNumber']}. {step['description']}")
        lines.append("")

    if recipe["description"]:
        lines.append("## Description")
        lines.append(recipe["description"])

    return "\n".join(lines)
