const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeBrief}=require('../tiktok-ads-brief.js');
test('preserves creative constraints and edits without mutating production or claiming connection',()=>{
 const item={id:'neo',title:'NEO',date:'2026-11-01',prompt:'No music, no VO; exact face.',caption:'Original',scenes:['front','side','full'],sceneImages:['assets/scene1.jpg'],videoReady:true,publishedManually:true};
 const snapshot=JSON.stringify(item);const b=makeBrief(item,'https://example.com/Bima-Content-Studio/',{caption:'Unsaved caption'});
 assert.equal(b.creative.prompt,item.prompt);assert.equal(b.creative.caption,'Unsaved caption');assert.equal(b.schedule.timezone,'Asia/Jakarta');assert.equal(b.creative.references[0].url,'https://example.com/Bima-Content-Studio/assets/scene1.jpg');assert.equal(b.campaign.budget,null);assert.equal(b.integration.apiConnected,false);assert.equal(b.integration.published,false);assert.equal(JSON.stringify(item),snapshot);
});
test('does not invent images or treat empty/unsafe references as ready',()=>{
 const b=makeBrief({id:'empty',sceneImages:['','javascript:alert(1)','file:///private.jpg','data:image/png;base64,xx']},'https://example.com/');
 assert.deepEqual(b.creative.references,[]);assert.equal(b.campaign.landingPage,null);assert.equal(b.product,null);
});
