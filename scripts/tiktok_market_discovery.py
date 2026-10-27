#!/usr/bin/env python3
"""Public news references for TikTok ideas; not TikTok Shop analytics or sales."""
import datetime
import json
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

QUERIES = [
    ("TikTok Indonesia", "TikTok Indonesia"),
    ("Affiliate fashion", "TikTok Shop affiliate fashion pria Indonesia"),
    ("Affiliate home", "TikTok Shop produk rumah tangga Indonesia"),
    ("Beauty", "TikTok skincare beauty Indonesia"),
    ("Gadget", "TikTok gadget Indonesia"),
]
SOURCES = (
    ("Google News RSS", lambda q: "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "id", "gl": "ID", "ceid": "ID:id"})),
    ("Bing News RSS", lambda q: "https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "setlang": "id-ID"})),
)

def collect():
    items, failures = [], []
    for category, term in QUERIES:
        for source, build_url in SOURCES:
            try:
                request = urllib.request.Request(build_url(term), headers={"User-Agent": "Mozilla/5.0 (compatible; BimaContentResearch/1.0)"})
                with urllib.request.urlopen(request, timeout=10) as response:
                    feed = ET.fromstring(response.read(3_000_000))
                entries = feed.findall("./channel/item")[:10]
                if not entries:
                    raise ValueError("feed returned no articles")
                found = 0
                for entry in entries:
                    title = (entry.findtext("title") or "").strip()
                    link = (entry.findtext("link") or "").strip()
                    if not title or not link or not link.startswith(("https://", "http://")):
                        continue
                    try:
                        published = parsedate_to_datetime(entry.findtext("pubDate") or "").astimezone(datetime.timezone.utc).isoformat()
                    except (ValueError, TypeError, OverflowError):
                        published = ""
                    items.append({"category": category, "title": title[:300], "url": link, "publishedAt": published, "source": source})
                    found += 1
                if found:
                    print(f"{category}: {found} references from {source}")
                    break
                raise ValueError("feed contains no usable articles")
            except Exception as exc:
                message = f"{type(exc).__name__}: {str(exc)[:160]}"
                failures.append({"category": category, "source": source, "error": message})
                print(f"WARNING {category} / {source}: {message}", file=sys.stderr)
    unique = {item["title"].casefold(): item for item in items}
    return {"generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "method": "Publicly indexed news articles mentioning TikTok; not TikTok Creative Center trends, view counts, Shop GMV, commissions or verified affiliate rankings.",
            "items": sorted(unique.values(), key=lambda item: item["publishedAt"], reverse=True)[:45],
            "errors": failures}

def main():
    data = collect()
    if not data["items"]:
        print("ERROR: all sources returned no references; preserving existing signals.", file=sys.stderr)
        return 1
    Path("tiktok-market-signals.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Collected", len(data["items"]), "public article signals")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
