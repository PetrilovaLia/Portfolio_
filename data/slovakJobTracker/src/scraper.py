"""
scraper.py — Generuje mock pracovné ponuky pre slovenský IT trh.

V reálnom projekte by tento modul sťahoval dáta z profesia.sk
pomocou requests + BeautifulSoup. Tu používame náhodný generátor,
aby pipeline fungovala bez API kľúčov.
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from src.logger import get_logger

log = get_logger("scraper")

COMPANIES = [
    "Softec", "Atos IT Solutions", "Accenture Slovakia", "IBM Slovakia",
    "Datamolino", "Exponea", "Sygic", "ESET", "Asseco Central Europe",
    "GoodRequest", "Vacuumlabs", "T-Systems Slovakia",
]

TITLES = [
    "Junior Data Engineer", "Data Engineer", "ETL Developer",
    "Junior BI Developer", "Data Analyst", "Junior Data Analyst",
    "SQL Developer", "Junior Python Developer",
]

LOCATIONS = [
    "Bratislava", "Košice", "Žilina",
    "Banská Bystrica", "Remote", "Hybrid – Bratislava",
]

SKILLS_POOL = [
    "Python", "SQL", "PostgreSQL", "Docker", "Apache Airflow",
    "Apache Spark", "dbt", "Kafka", "Pandas", "Git",
    "Linux", "AWS", "Azure", "Snowflake", "Power BI",
]

SKILL_WEIGHTS = [
    0.85, 0.80, 0.55, 0.45, 0.40,
    0.30, 0.25, 0.20, 0.60, 0.70,
    0.50, 0.30, 0.25, 0.20, 0.25,
]


def generate_posting(date: datetime) -> dict:
    """Vygeneruje jednu pracovnú ponuku."""
    skills = [
        skill for skill, weight in zip(SKILLS_POOL, SKILL_WEIGHTS)
        if random.random() < weight
    ]
    if len(skills) < 3:
        skills = random.sample(SKILLS_POOL, 3)

    salary_min = random.choice([1800, 2000, 2200, 2400, 2600, 2800, 3000])
    salary_max = salary_min + random.choice([400, 600, 800, 1000])

    return {
        "id":         str(uuid.uuid4()),
        "title":      random.choice(TITLES),
        "company":    random.choice(COMPANIES),
        "location":   random.choice(LOCATIONS),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "skills":     skills,
        "posted_at":  date.isoformat(),
        "source":     "profesia.sk",
    }


def scrape(days_back: int = 30) -> list[dict]:
    """Simuluje scraping za posledných N dní."""
    today = datetime.now()
    postings = []

    for day_offset in range(days_back):
        date = today - timedelta(days=day_offset)
        is_weekend = date.weekday() >= 5
        n = random.randint(0, 3) if is_weekend else random.randint(3, 8)
        for _ in range(n):
            postings.append(generate_posting(date))

    log.info(f"Vygenerovaných {len(postings)} ponúk ({days_back} dní)")
    return postings


def save_raw(postings: list[dict], path: str = "data/raw_jobs.json") -> None:
    """Uloží surové dáta do JSON (landing zone)."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(postings, f, ensure_ascii=False, indent=2)
    log.info(f"Uložené → {path}")


if __name__ == "__main__":
    raw = scrape(days_back=30)
    save_raw(raw)