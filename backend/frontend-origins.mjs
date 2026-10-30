const frontends = new Map([
  ['https://noor-arief.github.io', 'https://noor-arief.github.io/Bima-Content-Studio/'],
  ['https://mycontentstudio.site', 'https://mycontentstudio.site/']
]);
export const allowedFrontendOrigin = origin => frontends.has(origin);
export const frontendReturnURL = origin => frontends.get(origin) || frontends.get('https://noor-arief.github.io');
