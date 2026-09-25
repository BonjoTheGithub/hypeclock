(()=> {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const state={upcoming:[],popular:[],kids:[],query:"",genre:"all",limit:8,generatedAt:null};
  const REFRESH_MS=24*60*60*1000;

  function esc(v=""){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
  function localDate(iso){
    if(!iso)return null;
    const p=String(iso).slice(0,10).split("-").map(Number);
    if(p.length!==3||p.some(n=>!Number.isFinite(n)))return null;
    return new Date(p[0],p[1]-1,p[2]);
  }
  function niceDate(iso){const d=localDate(iso);return d?new Intl.DateTimeFormat(undefined,{year:"numeric",month:"long",day:"numeric"}).format(d):"Date TBA"}
  function shortDate(iso){const d=localDate(iso);return d?new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(d):"TBA"}
  function pad(n){return String(n).padStart(2,"0")}
  function timeLeft(d){
    if(!d)return null;
    let ms=d.getTime()-Date.now();
    if(ms<=0)return{out:true,d:0,h:0,m:0,s:0};
    const days=Math.floor(ms/86400000);ms%=86400000;
    const h=Math.floor(ms/3600000);ms%=3600000;
    const m=Math.floor(ms/60000);ms%=60000;
    return{out:false,d:days,h,m,s:Math.floor(ms/1000)};
  }
  function timerHTML(p,small=false){
    if(!p)return small?'<div class="mini" style="grid-column:1/-1"><b>TBA</b><span>Release</span></div>':'<div class="time"><b>TBA</b><span>Release</span></div>';
    if(p.out)return small?'<div class="mini" style="grid-column:1/-1"><b>OUT NOW</b><span>Released</span></div>':'<div class="time"><b>OUT NOW</b><span>Released</span></div>';
    return [["Days",p.d],["Hours",p.h],["Min",p.m],["Sec",p.s]].map(([l,v])=>small
      ?`<div class="mini"><b>${l==="Days"?v:pad(v)}</b><span>${l}</span></div>`
      :`<div class="time"><b>${l==="Days"?v:pad(v)}</b><span>${l}</span></div>`
    ).join("");
  }
  function hash(str){
    let h=0;
    for(let i=0;i<str.length;i++)h=((h<<5)-h+str.charCodeAt(i))|0;
    return Math.abs(h);
  }
  function artStyle(title){
    const h=hash(title||"Movie");
    const a=h%360,b=(h+62)%360,c=(h+142)%360;
    return `--poster-a:hsl(${a} 64% 34%);--poster-b:hsl(${b} 58% 22%);--poster-c:hsl(${c} 68% 48%)`;
  }
  function trailerUrl(m){
    if(m.trailer&&/^https?:\/\//i.test(m.trailer))return m.trailer;
    return "https://www.youtube.com/results?search_query="+encodeURIComponent((m.title||"movie")+" official trailer");
  }
  function imdbUrl(m){return m.imdb_id?`https://www.imdb.com/title/${encodeURIComponent(m.imdb_id)}/`:""}
  function allMovies(){
    const map=new Map();
    [...state.upcoming,...state.popular,...state.kids].forEach(m=>map.set(String(m.id),m));
    return [...map.values()];
  }
  function byId(id){return allMovies().find(m=>String(m.id)===String(id))}
  function genres(m){return Array.isArray(m.genres)?m.genres:[]}
  function matches(m){
    const q=state.query.trim().toLowerCase();
    const g=genres(m).join(" ").toLowerCase();
    const genreOK=state.genre==="all"||g.includes(state.genre.toLowerCase());
    const hay=`${m.title||""} ${g} ${m.plot||""} ${m.year||""}`.toLowerCase();
    return genreOK&&(!q||hay.includes(q));
  }

  function renderFeature(){
    const now=new Date();now.setHours(0,0,0,0);
    const m=state.upcoming.find(x=>{const d=localDate(x.release_date);return d&&d>=now})||state.popular[0]||state.upcoming[0];
    if(!m){
      $("#featuredMovieTitle").textContent="Movie lineup is updating";
      $("#featuredMovieDate").textContent="Check back shortly for the latest movie lineup.";
      $("#featuredMovieTimer").innerHTML='<div class="time"><b>SOON</b><span>Update</span></div>';
      $("#featuredMovieMeta").textContent="";
      $("#featuredMovieTrailer").style.display="none";
      $("#featuredMovieDetails").style.display="none";
      $("#featuredPosterFallback").textContent="HYPE";
      $("#featuredArt").style.cssText=artStyle("HypeClock Movies");
      return;
    }
    $("#featuredMovieTitle").textContent=m.title;
    $("#featuredMovieGenre").textContent=(genres(m)[0]||"Movie").toUpperCase();
    $("#featuredMovieDate").textContent=m.release_date?"Current release date: "+niceDate(m.release_date):"Release date TBA";
    $("#featuredMovieTimer").innerHTML=timerHTML(timeLeft(localDate(m.release_date)));
    $("#featuredMovieMeta").textContent=[
      m.year||"",
      m.runtime_minutes?`${m.runtime_minutes} min`:"",
      Number.isFinite(m.user_rating)?`User ${m.user_rating}/10`:"",
      Number.isFinite(m.critic_score)?`Critic ${m.critic_score}`:""
    ].filter(Boolean).join(" • ");
    $("#featuredMovieTrailer").href=trailerUrl(m);
    $("#featuredMovieTrailer").style.display="inline-flex";
    $("#featuredMovieDetails").style.display="inline-block";
    $("#featuredMovieDetails").onclick=()=>openDetails(m);
    $("#featuredPosterFallback").textContent=m.title;
    $("#featuredArt").style.cssText=artStyle(m.title);
  }

  function renderUpcoming(){
    const list=state.upcoming.filter(matches);
    const shown=list.slice(0,state.limit);
    const grid=$("#movieReleaseGrid");
    grid.innerHTML=shown.length?shown.map(m=>`
      <article class="movie-card">
        <div class="movie-poster" style="${artStyle(m.title)}">
          <div class="movie-poster-placeholder">${esc(m.title)}</div>
          <span class="movie-genre-tag">${esc(genres(m)[0]||"Movie")}</span>
        </div>
        <div class="movie-card-body">
          <h4 title="${esc(m.title)}">${esc(m.title)}</h4>
          <div class="movie-card-date">${esc(shortDate(m.release_date))}</div>
          <div class="mini-timer">${timerHTML(timeLeft(localDate(m.release_date)),true)}</div>
          <div class="movie-card-actions">
            <button data-movie-detail="${esc(m.id)}">DETAILS</button>
            <a href="${esc(trailerUrl(m))}" target="_blank" rel="noopener">TRAILER ↗</a>
          </div>
        </div>
      </article>`).join(""):'<p class="movie-note" style="grid-column:1/-1">No upcoming movies match this search or filter.</p>';
    $$("[data-movie-detail]").forEach(b=>b.onclick=()=>openDetails(byId(b.dataset.movieDetail)));
    $("#movieMore").style.display=list.length>state.limit?"inline-block":"none";
  }

  function renderPopular(){
    const q=state.query.trim().toLowerCase();
    const list=state.popular.filter(m=>{
      const hay=`${m.title||""} ${genres(m).join(" ")} ${m.year||""}`.toLowerCase();
      return !q||hay.includes(q);
    });
    const grid=$("#moviePopularGrid");
    grid.innerHTML=list.length?list.map((m,i)=>`
      <article class="movie-popular-card" data-popular-detail="${esc(m.id)}" tabindex="0">
        <div class="movie-poster" style="${artStyle(m.title)}">
          <div class="movie-poster-placeholder">${esc(m.title)}</div>
          <span class="movie-genre-tag">#${i+1}</span>
        </div>
        <div class="movie-popular-copy">
          <b title="${esc(m.title)}">${esc(m.title)}</b>
          <span>${esc(m.year||"")}${Number.isFinite(m.user_rating)?` • ${m.user_rating}/10`:""}</span>
        </div>
      </article>`).join(""):'<p class="movie-note" style="grid-column:1/-1">No popular movies match this search.</p>';
    $$("[data-popular-detail]").forEach(c=>{
      c.onclick=()=>openDetails(byId(c.dataset.popularDetail));
      c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetails(byId(c.dataset.popularDetail))}}
    });
  }

  function renderKids(){
    const q=state.query.trim().toLowerCase();
    const list=state.kids.filter(m=>{
      const hay=`${m.title||""} ${genres(m).join(" ")} ${m.year||""}`.toLowerCase();
      return !q||hay.includes(q);
    });
    const grid=$("#kidsMovieGrid");
    if(!grid)return;
    grid.innerHTML=list.length?list.map(m=>`
      <article class="kid-card" data-kid-detail="${esc(m.id)}" tabindex="0">
        <div class="movie-poster" style="${artStyle(m.title)}">
          <div class="movie-poster-placeholder">${esc(m.title)}</div>
          <span class="movie-genre-tag">${esc(genres(m)[0]||"Family")}</span>
          <span class="kid-rating">${esc(m.us_rating||"Family")}</span>
        </div>
        <div class="kid-card-copy">
          <b title="${esc(m.title)}">${esc(m.title)}</b>
          <span>${esc(m.year||"")}${Number.isFinite(m.user_rating)?` • ${m.user_rating}/10`:""}</span>
        </div>
      </article>`).join(""):'<p class="movie-note" style="grid-column:1/-1">More kids & family picks will appear after the next movie-list update.</p>';
    $("[data-kid-detail]").forEach(c=>{
      c.onclick=()=>openDetails(byId(c.dataset.kidDetail));
      c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetails(byId(c.dataset.kidDetail))}}
    });
  }

  function openDetails(m){
    if(!m)return;
    $("#movieDetailsTitle").textContent=m.title;
    const chips=[
      ...(genres(m).slice(0,3)),
      m.year?String(m.year):"",
      m.runtime_minutes?`${m.runtime_minutes} min`:"",
      Number.isFinite(m.user_rating)?`User ${m.user_rating}/10`:"",
      Number.isFinite(m.critic_score)?`Critic ${m.critic_score}`:""
    ].filter(Boolean);
    const imdb=imdbUrl(m);
    $("#movieDetailsBody").innerHTML=`
      <div class="movie-details-grid">
        <div class="movie-details-art" style="${artStyle(m.title)}"><span>${esc(m.title)}</span></div>
        <div class="movie-details-copy">
          <div class="detail-chip-row">${chips.map(x=>`<span class="detail-chip">${esc(x)}</span>`).join("")}</div>
          <p>${esc(m.plot||"No synopsis is available yet.")}</p>
          ${m.release_date?`<p><b>Release:</b> ${esc(niceDate(m.release_date))}</p>`:""}
          <div class="movie-detail-links">
            <a href="${esc(trailerUrl(m))}" target="_blank" rel="noopener">TRAILER ↗</a>
            ${imdb?`<a href="${esc(imdb)}" target="_blank" rel="noopener">IMDb ↗</a>`:""}
            <a href="https://www.watchmode.com/" target="_blank" rel="noopener">WATCHMODE ↗</a>
          </div>
        </div>
      </div>`;
    $("#movieDetailsModal").classList.add("show");
    document.body.style.overflow="hidden";
  }
  function closeModal(){
    $("#movieDetailsModal").classList.remove("show");
    document.body.style.overflow="";
  }

  function compact(ms){
    if(ms<=0)return"updating soon";
    const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    if(h>0)return`${h}h ${m}m`;
    if(m>0)return`${m}m ${s}s`;
    return`${s}s`;
  }
  function ago(ms){
    if(ms<60000)return"less than a minute ago";
    const m=Math.floor(ms/60000);
    if(m<60)return`${m}m ago`;
    const h=Math.floor(m/60);
    if(h<24)return`${h}h ${m%60}m ago`;
    const d=Math.floor(h/24);
    return`${d}d ${h%24}h ago`;
  }
  function renderRefresh(){
    if(!state.generatedAt){
      $("#movieLastRefresh").textContent="waiting for first update";
      $("#movieNextRefresh").textContent="soon";
      return;
    }
    const now=Date.now();
    $("#movieLastRefresh").textContent=ago(Math.max(0,now-state.generatedAt));
    $("#movieNextRefresh").textContent=compact(state.generatedAt+REFRESH_MS-now);
  }

  function renderAll(){
    renderFeature();renderUpcoming();renderPopular();renderKids();renderRefresh();
    const count=state.upcoming.filter(matches).length;
    $("#movieSearchHint").textContent=state.query?`${count} upcoming matches for “${state.query}”`:"Search titles, genres, and years.";
  }

  function applyData(data){
    state.upcoming=Array.isArray(data?.upcoming)?data.upcoming:[];
    state.popular=Array.isArray(data?.popular)?data.popular:[];
    state.kids=Array.isArray(data?.kids)?data.kids:[];
    const parsed=Date.parse(data?.generated_at||"");
    state.generatedAt=Number.isFinite(parsed)?parsed:null;

    if(state.upcoming.length||state.popular.length){
      $("#movieApiDot").classList.add("ok");
      $("#movieApiStatus").textContent="MOVIE LIST • UPDATED";
    }else{
      $("#movieApiStatus").textContent="MOVIE LIST • UPDATING";
    }
    renderAll();
  }

  async function load(){
    if(window.HYPE_MOVIES&&(Array.isArray(window.HYPE_MOVIES.upcoming)||Array.isArray(window.HYPE_MOVIES.popular))){
      applyData(window.HYPE_MOVIES);
      return;
    }

    try{
      const r=await fetch("./movies.json?v=3",{cache:"no-store"});
      if(!r.ok)throw new Error("cache unavailable");
      applyData(await r.json());
    }catch(err){
      $("#movieApiStatus").textContent="MOVIE LIST • TEMPORARILY UNAVAILABLE";
      state.upcoming=[];state.popular=[];state.kids=[];
      renderAll();
    }
  }

  $$("[data-go]").forEach(b=>b.onclick=()=>$(b.dataset.go)?.scrollIntoView({behavior:"smooth"}));
  $$("#movieFilters button").forEach(b=>b.onclick=()=>{
    state.genre=b.dataset.genre;state.limit=8;
    $$("#movieFilters button").forEach(x=>x.classList.toggle("active",x===b));
    renderUpcoming();
  });
  $("#movieMore").onclick=()=>{state.limit+=8;renderUpcoming()};
  let wait;
  $("#movieQ").oninput=e=>{
    state.query=e.target.value;clearTimeout(wait);
    wait=setTimeout(()=>{state.limit=8;renderUpcoming();renderPopular();renderAll()},70);
  };
  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#movieQ").focus()}
    if(e.key==="Escape"&&$("#movieDetailsModal").classList.contains("show"))closeModal();
  });
  $$("[data-movie-close]").forEach(b=>b.onclick=closeModal);
  $("#movieDetailsModal").onclick=e=>{if(e.target===$("#movieDetailsModal"))closeModal()};

  load();
  setInterval(()=>{
    if(state.upcoming.length){
      renderFeature();
      $$(".movie-card").forEach((card,i)=>{
        const m=state.upcoming.filter(matches)[i],t=card.querySelector(".mini-timer");
        if(m&&t)t.innerHTML=timerHTML(timeLeft(localDate(m.release_date)),true);
      });
    }
    renderRefresh();
  },1000);
})();