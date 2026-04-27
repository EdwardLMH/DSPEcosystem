"""
AEO Probe Service — daily LLM citation monitoring job.
Queries ChatGPT and Perplexity with banking queries and records whether HSBC is cited.
"""

import os
import json
import hashlib
import logging
from datetime import date
from dataclasses import dataclass, asdict
from typing import Optional

from openai import OpenAI
from google.cloud import bigquery

logger = logging.getLogger(__name__)

OPENAI_MODEL = "gpt-4o"
PERPLEXITY_MODEL = "sonar-pro"
BQ_TABLE = "hsbc-dap.dap.aeo_probe_results"
QUERY_BANK_TABLE = "hsbc-dap.dap.aeo_query_bank"


@dataclass
class ProbeResult:
    probe_date: str
    query_id: str
    query_text: str
    llm_engine: str
    hsbc_mentioned: bool
    hsbc_cited: bool
    citation_url: Optional[str]
    citation_position: Optional[int]
    competitor_cited: Optional[str]
    answer_text: str


class AEOProbeService:
    def __init__(self):
        self.openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.perplexity = OpenAI(
            api_key=os.environ["PERPLEXITY_API_KEY"],
            base_url="https://api.perplexity.ai",
        )
        self.bq = bigquery.Client(project="hsbc-dap")

    def run(self):
        queries = self._load_query_bank()
        results = []
        for q in queries:
            results.extend(self._probe_query(q["query_id"], q["query_text"]))
        self._store_results(results)
        self._check_alerts(results)
        logger.info("AEO probe complete. %d results stored.", len(results))

    def _load_query_bank(self) -> list[dict]:
        rows = self.bq.query(
            f"SELECT query_id, query_text FROM `{QUERY_BANK_TABLE}` WHERE active = TRUE"
        ).result()
        return [dict(row) for row in rows]

    def _probe_query(self, query_id: str, query_text: str) -> list[ProbeResult]:
        results = []
        for engine, client, model in [
            ("chatgpt", self.openai, OPENAI_MODEL),
            ("perplexity", self.perplexity, PERPLEXITY_MODEL),
        ]:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": query_text}],
                    max_tokens=800,
                )
                answer = response.choices[0].message.content or ""
                results.append(self._parse_response(query_id, query_text, engine, answer))
            except Exception as e:
                logger.error("Probe failed for engine=%s query=%s: %s", engine, query_id, e)
        return results

    def _parse_response(
        self, query_id: str, query_text: str, engine: str, answer: str
    ) -> ProbeResult:
        answer_lower = answer.lower()
        hsbc_mentioned = "hsbc" in answer_lower
        hsbc_cited = "hsbc.com" in answer_lower or "hsbc.com.hk" in answer_lower

        citation_url = None
        if hsbc_cited:
            import re
            urls = re.findall(r"https?://[^\s\)\"]+hsbc[^\s\)\"]*", answer, re.IGNORECASE)
            citation_url = urls[0] if urls else None

        competitors = ["hang seng", "standard chartered", "boc", "citibank", "dbs"]
        competitor_cited = next(
            (c for c in competitors if c in answer_lower), None
        )

        return ProbeResult(
            probe_date=date.today().isoformat(),
            query_id=query_id,
            query_text=query_text,
            llm_engine=engine,
            hsbc_mentioned=hsbc_mentioned,
            hsbc_cited=hsbc_cited,
            citation_url=citation_url,
            citation_position=1 if hsbc_cited else None,
            competitor_cited=competitor_cited,
            answer_text=answer[:2000],
        )

    def _store_results(self, results: list[ProbeResult]):
        rows = [asdict(r) for r in results]
        errors = self.bq.insert_rows_json(BQ_TABLE, rows)
        if errors:
            logger.error("BigQuery insert errors: %s", errors)

    def _check_alerts(self, results: list[ProbeResult]):
        cited = sum(1 for r in results if r.hsbc_cited)
        total = len(results)
        share = cited / total if total else 0
        logger.info("Citation share today: %.1f%% (%d/%d)", share * 100, cited, total)
        # Alert logic handled by Looker scheduled alert on BQ table


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    AEOProbeService().run()
