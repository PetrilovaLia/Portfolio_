CREATE TABLE IF NOT EXISTS job_postings (
    id           TEXT PRIMARY KEY,
    title        TEXT        NOT NULL,
    company      TEXT        NOT NULL,
    location     TEXT        NOT NULL,
    salary_min   INTEGER,
    salary_max   INTEGER,
    salary_mid   NUMERIC(10, 2),
    description  TEXT,
    source       TEXT,
    posted_at    TIMESTAMPTZ,
    posted_date  DATE,
    ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_skills (
    id          SERIAL PRIMARY KEY,
    job_id      TEXT    NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    skill       TEXT    NOT NULL,
    posted_date DATE,
    UNIQUE (job_id, skill)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_postings_date     ON job_postings (posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_postings_location ON job_postings (location);
CREATE INDEX IF NOT EXISTS idx_skills_skill      ON job_skills (skill);
CREATE INDEX IF NOT EXISTS idx_skills_date       ON job_skills (posted_date DESC);


-- ── Analytical views ────────────────────────────────────────────────────────

-- Top skills by number of job postings
CREATE OR REPLACE VIEW vw_top_skills AS
SELECT
    skill,
    COUNT(DISTINCT job_id)                          AS job_count,
    COUNT(DISTINCT job_id) * 100.0
        / NULLIF((SELECT COUNT(*) FROM job_postings), 0) AS pct_of_jobs
FROM job_skills
GROUP BY skill
ORDER BY job_count DESC;


-- Average salary by location
CREATE OR REPLACE VIEW vw_salary_by_location AS
SELECT
    location,
    COUNT(*)                  AS job_count,
    ROUND(AVG(salary_min))    AS avg_salary_min,
    ROUND(AVG(salary_max))    AS avg_salary_max,
    ROUND(AVG(salary_mid))    AS avg_salary_mid
FROM job_postings
WHERE salary_mid IS NOT NULL
GROUP BY location
ORDER BY avg_salary_mid DESC;


-- Monthly posting volume
CREATE OR REPLACE VIEW vw_monthly_volume AS
SELECT
    DATE_TRUNC('month', posted_date) AS month,
    COUNT(*)                         AS posting_count
FROM job_postings
GROUP BY 1
ORDER BY 1 DESC;
