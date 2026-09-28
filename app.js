(()=>{const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const releases=(window.HYPE_RELEASES||[]).slice().sort((a,b)=>date(a.date)-date(b.date));
const state={filter:"all",releaseLimit:12,popularLimit:12,q:"",platform:"all",genre:"",games:[]};

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function date(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function pretty(s){return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"long",day:"numeric"}).format(date(s))}
function short(s){return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(date(s))}
function left(d){let n=d-Date.now();if(n<=0)return{out:1,d:0,h:0,m:0,s:0};let days=Math.floor(n/86400000);n%=86400000;let h=Math.floor(n/3600000);n%=3600000;let m=Math.floor(n/60000);n%=60000;return{out:0,d:days,h,m,s:Math.floor(n/1000)}}
const pad=n=>String(n).padStart(2,"0");
function timer(p,small=false){if(p.out)return small?'<div class="mini" style="grid-column:1/-1"><b>OUT NOW</b><span>Released</span></div>':'<div class="time"><b>OUT NOW</b><span>Released</span></div>';const x=[["Days",p.d],["Hours",p.h],["Min",p.m],["Sec",p.s]];return x.map(([l,v])=>small?`<div class="mini"><b>${l==="Days"?v:pad(v)}</b><span>${l}</span></div>`:`<div class="time"><b>${l==="Days"?v:pad(v)}</b><span>${l}</span></div>`).join("")}
function yt(title){return"https://www.youtube.com/results?search_query="+encodeURIComponent(title+" official trailer")}

function featured(){const g=releases.find(x=>x.id==="gta6")||releases[0];if(!g)return;$("#featuredTitle").textContent=g.title;$("#featuredPlatforms").textContent=g.platforms.join(" • ");$("#featuredDate").textContent="Current sources say this game will release "+pretty(g.date);$("#featuredTimer").innerHTML=timer(left(date(g.date)));$("#featuredSource").href=g.source;$("#featuredTrailer").onclick=()=>trailer(g)}
function currentReleases(){const q=state.q.toLowerCase();return releases.filter(g=>(state.filter==="all"||g.platforms.includes(state.filter))&&(!q||(`${g.title} ${g.platforms.join(" ")}`).toLowerCase().includes(q)))}
function renderReleases(){const all=currentReleases(),shown=all.slice(0,state.releaseLimit),grid=$("#releaseGrid");grid.innerHTML=shown.length?shown.map(g=>`<article class="release-card" data-id="${esc(g.id)}"><div class="cover" style="--a:${g.a};--b:${g.b}"><h4>${esc(g.title)}</h4></div><div class="card-body"><div class="card-top"><span class="tag">GAME</span><span>${short(g.date)}</span></div><div class="platforms">${esc(g.platforms.join(" • "))}</div><div class="mini-timer">${timer(left(date(g.date)),true)}</div><div class="card-actions"><button data-trailer="${esc(g.id)}">▶ TRAILER</button><a href="${esc(g.source)}" target="_blank" rel="noopener">${esc(g.sourceName)} ↗</a></div></div></article>`).join(""):'<p class="note" style="grid-column:1/-1">No upcoming releases match.</p>';$$("[data-trailer]").forEach(b=>b.onclick=()=>trailer(releases.find(g=>g.id===b.dataset.trailer)));$("#releaseMore").style.display=all.length>state.releaseLimit?"inline-block":"none"}
function trailer(g){if(!g)return;$("#trailerTitle").textContent=g.title;$("#trailerBody").innerHTML=g.trailerId?`<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(g.trailerId)}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(g.title)} trailer"></iframe></div>`:`<div class="fallback">A verified trailer is not saved yet.<br><a class="primary" style="display:inline-block;margin-top:12px" href="${yt(g.title)}" target="_blank" rel="noopener">SEARCH YOUTUBE ↗</a></div>`;open("trailerModal")}
function open(id){$("#"+id).classList.add("show");document.body.style.overflow="hidden"}
function close(m){m.classList.remove("show");document.body.style.overflow="";if(m.id==="trailerModal")$("#trailerBody").innerHTML=""}

function hash(str){let h=0;for(let i=0;i<str.length;i++)h=((h<<5)-h+str.charCodeAt(i))|0;return Math.abs(h)}
function artStyle(title){const h=hash(title||"Game"),a=h%360,b=(h+58)%360,c=(h+144)%360;return`--ga:hsl(${a} 68% 42%);--gb:hsl(${b} 62% 24%);--gc:hsl(${c} 75% 48%)`}
function gameImage(g){if(g.thumbnail&&/^https?:\/\//i.test(g.thumbnail))return g.thumbnail;if(!g.catalog&&/^\d+$/.test(String(g.id||"")))return`https://www.freetogame.com/g/${encodeURIComponent(g.id)}/thumbnail.jpg`;return""}
function gameVisual(g){const src=gameImage(g);return src?`<img loading="lazy" src="${esc(src)}" alt="${esc(g.title)}">`:`<div class="catalog-art" style="${artStyle(g.title)}"><b>${esc(g.title)}</b></div>`}
function detailVisual(g){const src=gameImage(g);return src?`<img src="${esc(src)}" alt="${esc(g.title)}">`:`<div class="detail-art" style="${artStyle(g.title)}"><b>${esc(g.title)}</b></div>`}

function filteredGames(){const q=state.q.toLowerCase(),genre=state.genre.toLowerCase();return state.games.filter(g=>{const p=String(g.platform||"").toLowerCase(),hay=`${g.title||""} ${g.genre||""} ${g.publisher||""} ${g.developer||""} ${g.short_description||""} ${g.platform||""}`.toLowerCase();const platform=state.platform==="all"||(state.platform==="windows"&&(p.includes("windows")||p.includes("pc")))||(state.platform==="browser"&&p.includes("browser"))||(state.platform==="console"&&(p.includes("playstation")||p.includes("xbox")||p.includes("switch")))||(state.platform==="mobile"&&(p.includes("mobile")||p.includes("android")||p.includes("ios")));return platform&&(!genre||String(g.genre||"").toLowerCase().includes(genre))&&(!q||hay.includes(q))})}

function renderGames(){const all=filteredGames(),shown=all.slice(0,state.popularLimit),grid=$("#popularGrid");grid.innerHTML=shown.length?shown.map(g=>`<article class="game-card"><div class="thumb">${gameVisual(g)}<span class="genre">${esc(g.genre||"Game")}</span></div><div class="game-body"><h4>${esc(g.title)}</h4><p>${esc(g.short_description||"Game in the HypeClock catalog.")}</p><div class="game-meta">${esc(g.platform||"")}${g.release_date?" • "+esc(g.release_date):""}</div><div class="game-actions"><button data-detail="${esc(g.id)}">DETAILS</button><a href="${yt(g.title)}" target="_blank" rel="noopener">TRAILER ↗</a></div></div></article>`).join(""):'<p class="note" style="grid-column:1/-1">No games match this search.</p>';$$("[data-detail]").forEach(b=>b.onclick=()=>details(state.games.find(g=>String(g.id)===String(b.dataset.detail))));$("#popularMore").style.display=all.length>state.popularLimit?"inline-block":"none"}

function details(g){if(!g)return;$("#detailsTitle").textContent=g.title;$("#detailsBody").innerHTML=`<div class="detail-grid">${detailVisual(g)}<div class="detail-copy"><p><b>${esc(g.genre||"Game")}</b> • ${esc(g.platform||"")}</p><p>${esc(g.short_description||"No description available.")}</p>${g.publisher?`<p><b>Publisher:</b> ${esc(g.publisher)}</p>`:""}${g.developer?`<p><b>Developer:</b> ${esc(g.developer)}</p>`:""}${g.game_url?`<a href="${esc(g.game_url)}" target="_blank" rel="noopener">OPEN GAME PAGE ↗</a>`:""}</div></div>`;open("detailsModal")}

function dedupeGames(list){const seen=new Set();return list.filter(g=>{const key=String(g.title||"").trim().toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true})}
async function json(url){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(url+" "+r.status);return r.json()}
async function loadGames(){
  const [catalogResult,freeResult]=await Promise.allSettled([json("./game-catalog.json?v=2"),json("./games.json?v=2")]);
  const catalog=catalogResult.status==="fulfilled"?(Array.isArray(catalogResult.value)?catalogResult.value:(catalogResult.value.games||[])).map(g=>({...g,catalog:true})):[];
  const free=freeResult.status==="fulfilled"?(Array.isArray(freeResult.value)?freeResult.value:(freeResult.value.games||[])):[];
  state.games=dedupeGames([...catalog,...free]);
  if(state.games.length){
    $("#apiDot").classList.add("ok");
    $("#apiStatus").textContent="GAME LIST • UPDATED";
    $("#apiNote").hidden=true;
  }else{
    state.games=[{id:"fallback-minecraft",catalog:true,title:"Minecraft",genre:"Sandbox / Survival",platform:"PC • PlayStation • Xbox • Nintendo Switch • Mobile",publisher:"Xbox Game Studios",developer:"Mojang Studios",release_date:"2011-11-18",short_description:"Build, explore, survive, and create in an open-ended block world.",game_url:"https://www.minecraft.net/"}];
    $("#apiStatus").textContent="GAME LIST • LIMITED";
    $("#apiNote").hidden=false;
    $("#apiNote").textContent="The full game list is refreshing. Showing a small fallback for now.";
  }
  renderGames();hint();
}

function hint(){if(!state.q)return $("#searchHint").textContent="Search upcoming releases and the broader game catalog.";$("#searchHint").textContent=`${currentReleases().length} upcoming • ${filteredGames().length} game results for “${state.q}”`}
$$("[data-go]").forEach(b=>b.onclick=()=>$(b.dataset.go)?.scrollIntoView({behavior:"smooth"}));
$$("#releaseFilters button").forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;state.releaseLimit=12;$$("#releaseFilters button").forEach(x=>x.classList.toggle("active",x===b));renderReleases();hint()});
$("#releaseMore").onclick=()=>{state.releaseLimit+=12;renderReleases()};
$("#popularMore").onclick=()=>{state.popularLimit=Math.min(state.games.length,state.popularLimit+12);renderGames()};
$("#platform").onchange=e=>{state.platform=e.target.value;state.popularLimit=12;renderGames();hint()};
$("#genre").onchange=e=>{state.genre=e.target.value;state.popularLimit=12;renderGames();hint()};
let st;$("#q").oninput=e=>{state.q=e.target.value;clearTimeout(st);st=setTimeout(()=>{state.releaseLimit=12;state.popularLimit=12;renderReleases();renderGames();hint()},80)};
$$("[data-close]").forEach(b=>b.onclick=()=>close(b.closest(".modal")));$$(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)close(m)});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#q").focus()}if(e.key==="Escape")$$(".modal.show").forEach(close)});
$("#tz").textContent=Intl.DateTimeFormat().resolvedOptions().timeZone||"Local time";
featured();renderReleases();loadGames();setInterval(()=>{featured();$$(".release-card").forEach(c=>{const g=releases.find(x=>x.id===c.dataset.id),t=c.querySelector(".mini-timer");if(g&&t)t.innerHTML=timer(left(date(g.date)),true)})},1000);
})();