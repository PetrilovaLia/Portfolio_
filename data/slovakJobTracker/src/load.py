import json
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import execute_batch

from src.logger import get_logger

load_dotenv()
log = get_logger("load")


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "jobtracker"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )


def load_jobs(conn, job_postings):
    sql = """
        INSERT INTO job_postings
            (id, title, company, location,
             salary_min, salary_max, salary_mid,
             source, posted_at, posted_date)
        VALUES
            (%(id)s, %(title)s, %(company)s, %(location)s,
             %(salary_min)s, %(salary_max)s, %(salary_mid)s,
             %(source)s, %(posted_at)s, %(posted_date)s)
        ON CONFLICT (id) DO NOTHING;
    """
    with conn.cursor() as cur:
        execute_batch(cur, sql, job_postings, page_size=200)
    conn.commit()
    log.info(f"Vložených {len(job_postings)} job_postings")


def load_skills(conn, job_skills):
    sql = """
        INSERT INTO job_skills (job_id, skill, posted_date)
        VALUES (%(job_id)s, %(skill)s, %(posted_date)s)
        ON CONFLICT (job_id, skill) DO NOTHING;
    """
    with conn.cursor() as cur:
        execute_batch(cur, sql, job_skills, page_size=500)
    conn.commit()
    log.info(f"Vložených {len(job_skills)} job_skills")


def run(data_dir="data"):
    with open(Path(data_dir) / "clean_jobs.json", encoding="utf-8") as f:
        jobs = json.load(f)
    with open(Path(data_dir) / "clean_skills.json", encoding="utf-8") as f:
        skills = json.load(f)

    try:
        conn = get_connection()
        log.info("Pripojenie na PostgreSQL úspešné")
    except Exception as e:
        log.error(f"Nepodarilo sa pripojiť na databázu: {e}")
        raise

    try:
        load_jobs(conn, jobs)
        load_skills(conn, skills)
    except Exception as e:
        log.error(f"Chyba pri nahrávaní dát: {e}")
        raise
    finally:
        conn.close()

    log.info("Hotovo")