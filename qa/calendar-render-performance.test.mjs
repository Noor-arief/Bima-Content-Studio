import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("all inline scripts remain syntactically valid",()=>{
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length>=2);
  for(const [,code] of scripts) new vm.Script(code);
});
test("calendar render batches date lookup and retains day dedup",()=>{
  assert.match(html,/const calendarItemsByDate=new Map\(\)/);
  assert.match(html,/for\(const item of items\(\)\)/);
  assert.match(html,/calendarItemsByDate\.set\(date,deduplicateDayItems\(day\)\)/);
  assert.match(html,/const list=calendarItemsByDate\.get\(date\)\|\|\[\]/);
  assert.match(html,/function displayItemsOn\(date\)\{return deduplicateDayItems\(items\(\)\.filter/);
});
