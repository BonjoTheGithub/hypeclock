const fs=require("fs");
const path=require("path");

const API_KEY=(process.env.WATCHMODE_API_KEY||"").trim();
const BASE="https://api.watchmode.com/v1";
const OUT=path.join(process.cwd(),"movies","movies.json");
const MAX_POPULAR=10;
const MAX_UPCOMING=10;
const MAX_DETAILS=20;
let credits=0;

function ymd(d){
  return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function listFrom(data){
  if(Array.isArray(data))return data;
  if(Array.isArray(data?.titles))return data.titles;
  if(Array.isArray(data?.results))return data.results;
  if(Array.isArray(data?.title_results))return data.title_results;
  return [];
}
async function api(endpoint,params={}){
  const url=new URL(BASE+endpoint);
  for(const [k,v] of Object.entries(params)){
    if(v!==undefined&&v!==null&&v!=="")url.searchParams.set(k,String(v));
  }
  const res=await fetch(url,{
    headers:{
      "Accept":"application/json",
      "User-Agent":"HypeClock-Movies/1.0 (+https://bonjothegithub.github.io/hypeclock/)",
      "X-API-Key":API_KEY
    }
  });
  credits++;
  if(!res.ok){
    const body=await res.text().catch(()=>"");
    throw new Error(`Watchmode ${res.status} for ${endpoint}: ${body.slice(0,180)}`);
  }
  return res.json();
}
function normalize(base,detail={}){
  const id=detail.id??base.id??base.watchmode_id;
  const release=detail.release_date??base.release_date??base.releaseDate??null;
  const genres=Array.isArray(detail.genre_names)?detail.genre_names:
    Array.isArray(detail.genres)?detail.genres.map(g=>typeof g==="string"?g:(g.name||"")).filter(Boolean):
    Array.isArray(base.genre_names)?base.genre_names:[];
  return{
    id,
    title:detail.title??base.title??base.name??"Untitled",
    year:detail.year??base.year??null,
    release_date:release,
    genres,
    runtime_minutes:detail.runtime_minutes??detail.runtime??null,
    user_rating:Number.isFinite(detail.user_rating)?detail.user_rating:null,
    critic_score:Number.isFinite(detail.critic_score)?detail.critic_score:null,
    us_rating:detail.us_rating??null,
    plot:detail.plot_overview??detail.plot??detail.description??"",
    trailer:detail.trailer??detail.trailer_url??null,
    imdb_id:detail.imdb_id??base.imdb_id??null,
    tmdb_id:detail.tmdb_id??base.tmdb_id??null,
    watchmode_url:id?`https://www.watchmode.com/title/${id}/`:null
  };
}

async function main(){
  if(!API_KEY){
    console.log("WATCHMODE_API_KEY is not set; leaving the current movie cache unchanged.");
    return;
  }

  const existing=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,"utf8")):null;
  const last=Date.parse(existing?.generated_at||"");
  const force=process.env.FORCE_MOVIE_REFRESH==="1";
  if(!force&&Number.isFinite(last)&&Date.now()-last<6*60*60*1000){
    console.log("Movie cache is less than 6 hours old; skipping refresh.");
    return;
  }

  const now=new Date();
  const end=new Date(now.getTime()+120*24*60*60*1000);

  const popularRaw=await api("/list-titles/",{
    types:"movie",
    sort_by:"popularity_desc",
    page:1,
    limit:MAX_POPULAR
  });

  let upcomingRaw;
  try{
    upcomingRaw=await api("/list-titles/",{
      types:"movie",
      release_date_start:ymd(now),
      release_date_end:ymd(end),
      sort_by:"release_date_asc",
      page:1,
      limit:MAX_UPCOMING
    });
  }catch(err){
    console.warn("release_date_asc was not accepted; retrying with documented release_date_desc and sorting locally.");
    upcomingRaw=await api("/list-titles/",{
      types:"movie",
      release_date_start:ymd(now),
      release_date_end:ymd(end),
      sort_by:"release_date_desc",
      page:1,
      limit:MAX_UPCOMING
    });
  }

  const popularBase=listFrom(popularRaw).slice(0,MAX_POPULAR);
  const upcomingBase=listFrom(upcomingRaw).slice(0,MAX_UPCOMING);

  const unique=new Map();
  for(const item of [...popularBase,...upcomingBase]){
    const id=item.id??item.watchmode_id;
    if(id!=null&&!unique.has(String(id)))unique.set(String(id),item);
  }

  const details=new Map();
  for(const [id,base] of [...unique.entries()].slice(0,MAX_DETAILS)){
    try{
      const d=await api(`/title/${encodeURIComponent(id)}/details/`);
      details.set(id,normalize(base,d));
    }catch(err){
      console.warn("Detail lookup failed for",id,err.message);
      details.set(id,normalize(base,{}));
    }
    await sleep(120);
  }

  const from=(baseList)=>baseList.map(base=>{
    const id=String(base.id??base.watchmode_id);
    return details.get(id)||normalize(base,{});
  });

  const popular=from(popularBase);
  const upcoming=from(upcomingBase)
    .filter(m=>m.release_date)
    .sort((a,b)=>String(a.release_date).localeCompare(String(b.release_date)));

  const output={
    provider:"Watchmode",
    generated_at:new Date().toISOString(),
    refresh_hours:24,
    estimated_credits_this_refresh:credits,
    quota_note:"Designed for one refresh per day and well under the 2,500-credit monthly Developer quota.",
    popular,
    upcoming
  };

  fs.writeFileSync(OUT,JSON.stringify(output,null,2)+"\n");
  console.log(`Saved ${upcoming.length} upcoming and ${popular.length} popular movies using about ${credits} Watchmode credits.`);
}

main().catch(err=>{console.error(err);process.exit(1)});