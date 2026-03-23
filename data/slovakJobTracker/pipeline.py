import argparse
import time

from src.logger import get_logger
from src.scraper import scrape, save_raw
from src.transform import transform, save_clean

log = get_logger("pipeline")


def run(days=30, skip_load=False):
    start = time.perf_counter()
    log.info("=" * 40)
    log.info("Slovak Job Market Tracker — ETL Pipeline")
    log.info("=" * 40)

    t0 = time.perf_counter()
    log.info("Krok 1/3 — Extract")
    raw = scrape(days_back=days)
    save_raw(raw)
    log.info(f"Extract dokončený za {time.perf_counter() - t0:.2f}s")

    t0 = time.perf_counter()
    log.info("Krok 2/3 — Transform")
    jobs, skills = transform(raw)
    save_clean(jobs, skills)
    log.info(f"Transform dokončený za {time.perf_counter() - t0:.2f}s")

    if not skip_load:
        from src.load import run as load_run
        t0 = time.perf_counter()
        log.info("Krok 3/3 — Load")
        load_run()
        log.info(f"Load dokončený za {time.perf_counter() - t0:.2f}s")
    else:
        log.info("Krok 3/3 — Load preskočený (--skip-load)")

    log.info(f"Pipeline dokončená za {time.perf_counter() - start:.2f}s")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--skip-load", action="store_true")
    args = parser.parse_args()
    run(days=args.days, skip_load=args.skip_load)