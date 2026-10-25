#!/usr/bin/env python3
"""Public news discovery for TikTok content ideas. NOT TikTok video/Shop analytics."""
import datetime, json, urllib.parse, urllib.request, xml.etree.ElementTree as ET, re
from email.utils import parsedate_to_datetime
from pathlib import Path
queries=[
 ("TikTok Indonesia","TikTok viral trends Indonesia when:7d"),
 ("Affiliate fashion","TikTok Shop affiliate fashion pria Indonesia when:7d"),
 ("Affiliate home","TikTok Shop produk rumah tangga viral when:7d"),
 ("Beauty","TikTok skincare beauty trend Indonesia when:7d"),
 ("Gadget","TikTok gadget viral Indonesia when:7d"),
]
items=[]; failures=[]
for category,term in queries:
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":term,"hl":"id","gl":"ID","ceid":"ID:id"})
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; BimaContentResearch/1.0)"})
  with urllib.request.urlopen(req,timeout=20) as res: feed=ET.fromstring(res.read(3_000_000))
  for item in feed.findall("./channel/item")[:10]:
   title=(item.findtext("title") or "").strip()
   link=(item.findtext("link") or "").strip()
   date=(item.findtext("pubDate") or "").strip()
   if not title or not link: continue
   try: iso=parsedate_to_datetime(date).astimezone(datetime.timezone.utc).isoformat()
   except: iso=""
   items.append({"category":category,"title":title[:300],"url":link,"publishedAt":iso,"source":"Google News RSS"})
 except Exception as exc: failures.append({"category":category,"error":str(exc)[:120]})
dedup={}
for item in items: dedup[item["title"].casefold()]=item
data={"generatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),"method":"Publicly indexed news articles mentioning TikTok; not TikTok Creative Center trends, view counts, Shop GMV, commissions or verified affiliate rankings.","items":sorted(dedup.values(),key=lambda x:x["publishedAt"],reverse=True)[:45],"errors":failures}
if not data["items"]: raise SystemExit("No live public signals retrieved; preserving existing signals.")
Path("tiktok-market-signals.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Collected",len(data["items"]),"public article signals")
