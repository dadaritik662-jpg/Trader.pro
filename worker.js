
const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'};
function J(o,s,x){return new Response(JSON.stringify(o),{status:s||200,headers:Object.assign({},H,x||{})})}
async function chart(u){
  const s=(u.searchParams.get('s')||'').toUpperCase().replace(/[^A-Z0-9&-]/g,'').slice(0,20);
  if(!s)return J({error:'symbol'},400);
  const cache=caches.default,key=new Request('https://cache.local/chart/'+s);
  const hit=await cache.match(key);if(hit)return hit;
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(s)+'.NS?range=6mo&interval=1d';
  const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok)return J({error:'upstream'},502);
  const d=await r.json();
  const res=d.chart&&d.chart.result&&d.chart.result[0];
  if(!res)return J({error:'nodata'},404);
  const q=res.indicators.quote[0],ts=res.timestamp||[],c=[];
  for(let i=0;i<ts.length;i++){if(q.close[i]!=null&&q.open[i]!=null)c.push({t:ts[i],o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i]})}
  const out=J({c:c},200,{'cache-control':'public, max-age=60'});
  await cache.put(key,out.clone());
  return out;
}
export default{async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/api/chart')return chart(u);
  return env.ASSETS.fetch(request);
}};
