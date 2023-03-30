import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import fs from "fs";

async function getLinksAndCopy(tournament, rank) {
  const url = "https://play.limitlesstcg.com" + tournament;
  const selector = ".pkmn";

  fetch(url)
    .then((response) => response.text())
    .then((htmlContent) => {
      const dom = new JSDOM(htmlContent);
      const pkmnElems = dom.window.document.querySelectorAll(selector);

      const pokemonData = [];

      for (let i = 0; i < pkmnElems.length; i++) {
        const nameElem = pkmnElems[i].querySelector(".name");
        const itemElem = pkmnElems[i].querySelector(".item");
        const abilityElem = pkmnElems[i].querySelector(".ability");
        const teraElem = pkmnElems[i].querySelector(".tera");
        const movesElems = pkmnElems[i].querySelectorAll(".attacks li");

        const name = nameElem.querySelector("span").textContent.trim();
        const item = itemElem.textContent.trim();
        const ability = abilityElem.textContent.trim().replace("Ability: ", "");
        const tera = teraElem.textContent.trim().replace("Tera Type: ", "");
        const moves = Array.from(movesElems).map((moveElem) =>
          moveElem.textContent.trim()
        );

        pokemonData.push({
          id: i + 1,
          name: name,
          item: item,
          ability: ability,
          tera: tera,
          moves: moves,
        });
      }

      // console.log(pokemonData);
      const results = {
        rank: rank,
        pokemon: pokemonData,
      };
      let data = [];
      if (fs.existsSync("./pokeData.js")) {
        // ファイルが存在する場合、既存の内容を読み込んで配列に追加
        import("./pokeData.js")
          .then((existingData) => {
            data = existingData.default || existingData; // 読み込んだデータを配列に代入
            data.push(results); // 取得したデータを既存データに追加
            fs.writeFileSync(
              "./pokeData.js",
              `const pokeData = ${JSON.stringify(
                data
              )}; export default pokeData;`
            ); // jsファイルに書き込み
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        fs.writeFileSync(
          "./pokeData.js",
          `const pokeData = ${JSON.stringify([
            results,
          ])}; export default pokeData;`
        ); // jsファイルに書き込み
      }
    });
}

async function getLinks(url, id) {
  const response = await fetch(url);
  const html = await response.text();
  const dom = new JSDOM(html);
  const links = dom.window.document.querySelectorAll(
    `a[href^="/${id}/player/"][href$="/teamlist"]`
  );

  for (let i = 0; i < links.length; i++) {
    await getLinksAndCopy(links[i].href, i + 1);
  }
}

getLinks(
  "https://play.limitlesstcg.com/tournament/641770e525171155a799b7da/standings",
  "tournament/641770e525171155a799b7da"
);
