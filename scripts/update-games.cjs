const fs=require("fs");
const URL="https://www.freetogame.com/api/games?sort-by=popularity";
const LIMIT=60;

async function main(){
  const r=await fetch(URL,{headers:{"Accept":"application/json","User-Agent":"HypeClock-GitHub-Pages"}});
  if(!r.ok) throw new Error("FreeToGame HTTP "+r.status);
  const data=await r.json();
  if(!Array.isArray(data)) throw new Error("Unexpected FreeToGame response");

  const games=data.slice(0,LIMIT).map(g=>({
    id:g.id,
    title:g.title,
    thumbnail:g.thumbnail,
    short_description:g.short_description,
    game_url:g.game_url,
    genre:g.genre,
    platform:g.platform,
    publisher:g.publisher,
    developer:g.developer,
    release_date:g.release_date,
    freetogame_profile_url:g.freetogame_profile_url
  }));

  fs.writeFileSync("games.json",JSON.stringify({generated_at:new Date().toISOString(),games},null,2));
  console.log("Saved",games.length,"FreeToGame entries");
}
main().catch(err=>{console.error(err);process.exit(1)});