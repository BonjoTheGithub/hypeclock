(()=> {
  const lastEl=document.getElementById("lastRefresh");
  const nextEl=document.getElementById("nextRefresh");
  if(!lastEl||!nextEl)return;

  let generatedAt=null;
  const intervalMs=6*60*60*1000;

  function compact(ms){
    if(ms<=0)return "due now";
    const total=Math.floor(ms/1000);
    const d=Math.floor(total/86400);
    const h=Math.floor((total%86400)/3600);
    const m=Math.floor((total%3600)/60);
    const s=total%60;
    if(d>0)return `${d}d ${h}h`;
    if(h>0)return `${h}h ${m}m`;
    if(m>0)return `${m}m ${s}s`;
    return `${s}s`;
  }

  function ago(ms){
    if(ms<60000)return "less than a minute ago";
    const m=Math.floor(ms/60000);
    if(m<60)return `${m}m ago`;
    const h=Math.floor(m/60);
    if(h<24)return `${h}h ${m%60}m ago`;
    const d=Math.floor(h/24);
    return `${d}d ${h%24}h ago`;
  }

  function render(){
    if(!generatedAt)return;
    const now=Date.now();
    lastEl.textContent=ago(Math.max(0,now-generatedAt));
    const next=generatedAt+intervalMs;
    nextEl.textContent=next<=now?"awaiting scheduled run":compact(next-now);
  }

  fetch("./games.json",{cache:"no-store"})
    .then(r=>r.ok?r.json():Promise.reject())
    .then(data=>{
      const t=Date.parse(data.generated_at||"");
      if(Number.isFinite(t)){generatedAt=t;render();setInterval(render,1000)}
      else{lastEl.textContent="unknown";nextEl.textContent="unknown"}
    })
    .catch(()=>{lastEl.textContent="unavailable";nextEl.textContent="unavailable"});
})();