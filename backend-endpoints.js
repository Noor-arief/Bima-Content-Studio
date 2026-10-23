/* Provider-independent, strict owner API endpoint selection.
   APPROVED_STANDBYS is empty until a standby domain is provisioned, ownership-verified,
   restored, and security-reviewed. Never wildcard *.onrender.com or accept arbitrary URLs:
   the browser sends a bearer session token to the selected backend. */
(function (root) {
  'use strict';
  const PRIMARY='https://content-studio-api-production-3fe2.up.railway.app';
  const APPROVED_STANDBYS=Object.freeze([]);
  const STORAGE_KEY='bima_content_server_url';
  const SESSION_KEY='bima_content_server_session';
  const allowed=Object.freeze([PRIMARY,...APPROVED_STANDBYS]);

  function validate(candidate) {
    if (typeof candidate!=='string' || !candidate.trim()) throw Error('invalid_backend');
    const value=candidate.trim().replace(/\/+$/, '');
    let url;
    try { url=new URL(value); } catch { throw Error('invalid_backend'); }
    if (url.protocol!=='https:' || url.username || url.password || url.port ||
        url.pathname!=='/' || url.search || url.hash || value!==url.origin ||
        !allowed.includes(url.origin)) throw Error('backend_not_approved');
    return url.origin;
  }
  function current() {
    const saved=root.localStorage?.getItem(STORAGE_KEY);
    return validate(saved || PRIMARY);
  }
  function select(candidate) {
    const next=validate(candidate);
    const previous=root.localStorage?.getItem(STORAGE_KEY) || PRIMARY;
    if(previous!==next) {
      // An authorization session belongs to one server; never forward it across providers.
      root.sessionStorage?.removeItem(SESSION_KEY);
    }
    root.localStorage?.setItem(STORAGE_KEY,next);
    return next;
  }
  const api=Object.freeze({primary:PRIMARY,approvedOrigins:allowed,validate,current,select});
  Object.defineProperty(root,'BIMA_BACKEND_ENDPOINTS',{value:api,configurable:false,writable:false});
})(typeof window!=='undefined'?window:globalThis);
