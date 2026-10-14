/* Per-content publishing settings. Does not change any remote video. */
(()=>{
 'use strict';
 const audience=document.getElementById('apiMadeForKids'),synthetic=document.getElementById('apiSynthetic');
 const protectedStatuses=['published','scheduled','private_uploaded','uploading','needs_review'];
 function sync(){
  const item=getSelected(),remote=remoteFor(item?.id);
  audience.value=String(remote?.madeForKids??item?.madeForKids??false);
  synthetic.checked=remote?.containsSyntheticMedia??item?.containsSyntheticMedia??false;
  audience.disabled=synthetic.disabled=!item||protectedStatuses.includes(remote?.status);
  const status=document.getElementById('draftStatus');
  if(status)status.textContent=itemStatus(item);
  const approval=document.getElementById('approvalState');
  if(approval&&protectedStatuses.includes(remote?.status))approval.textContent=itemStatus(item)+' · YouTube';
 }
 function save(){
  const item=getSelected();if(!item||protectedStatuses.includes(remoteFor(item.id)?.status))return;
  item.madeForKids=audience.value==='true';item.containsSyntheticMedia=synthetic.checked;
  if(item.approved){item.approved=false;item.status='QA Pass';}
  persist();
 }
 audience.addEventListener('change',save);synthetic.addEventListener('change',save);
 document.addEventListener('bima:episode-selected',sync);
 document.addEventListener('bima:render-status',sync);
 sync();
})();
