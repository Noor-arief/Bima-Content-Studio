/* Isolated TikTok Showcase API contract. Offline QA only; not a TikTok API connection. */
export function normalizeShowcaseProduct(raw, source='fixture') {
  if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id.trim()) throw Error('showcase_product_id_required');
  if(!raw.name||typeof raw.name!=='string')throw Error('showcase_product_name_required');
  const id=raw.id.trim();
  const gmv=raw.gmv;
  const validGmv=typeof gmv==='number'&&Number.isFinite(gmv)&&gmv>=0&&raw.gmvVerified===true&&raw.gmvCurrency==='IDR'&&typeof raw.gmvSource==='string'&&raw.gmvSource.length>4;
  return Object.freeze({id,name:raw.name.trim(),origin:source,gmv:validGmv?gmv:null,gmvCurrency:validGmv?'IDR':null,gmvVerified:validGmv,evidence:validGmv?raw.gmvSource:null});
}
export function selectHighestVerifiedGmv(products){
  if(!Array.isArray(products))throw Error('showcase_products_array_required');
  const verified=products.filter(p=>p.gmvVerified===true&&p.gmv!==null&&p.gmv!==undefined);
  if(!verified.length)return {status:'blocked_no_verified_gmv',product:null};
  const chosen=[...verified].sort((a,b)=>b.gmv-a.gmv||a.id.localeCompare(b.id))[0];
  return {status:'candidate_requires_eligibility_and_rights_check',product:chosen};
}
export async function collectShowcasePages(fetchPage,{limit=20}={}){
  if(typeof fetchPage!=='function')throw Error('fetch_page_required');
  const seen=new Set(),products=[],ids=new Set();let cursor=null;
  for(let n=0;n<limit;n++){
    const result=await fetchPage(cursor);
    if(!result||!Array.isArray(result.products))throw Error('showcase_invalid_response');
    for(const raw of result.products){const product=normalizeShowcaseProduct(raw,'fixture');if(!ids.has(product.id)){ids.add(product.id);products.push(product);}}
    const next=result.nextPageToken||null;
    if(!next)return products;
    if(typeof next!=='string'||seen.has(next))throw Error('showcase_pagination_cycle');
    seen.add(next);cursor=next;
  }
  throw Error('showcase_page_limit');
}
