export function groupCookiesByDomain(cookies){
  const map = {};
  for (const c of cookies){
    const d = (c.domain && c.domain.startsWith('.')) ? c.domain.slice(1) : c.domain || 'unknown';
    if (!map[d]) map[d]=[];
    map[d].push(c);
  }
  return map;
}
