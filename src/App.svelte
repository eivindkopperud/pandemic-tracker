
<script lang="ts">
 
  import type { Card, ColorValueHex, GameState } from "./types/Card";

  let piles: Card[][] = [];
  let drawnCards: Card[] = [];
  let prognosisUsages = 0;
  let burnedCards: Card[] = [];
  let burnActive = false;
  let prognosisActive = false;
  let gistId = "38d66e7e0ebabeed12db7f2642b61db4";

  const colorMap: Record<string, ColorValueHex> = {
    black: "#574747",
    red: "#fc5151",
    yellow: "#ffff6e",
    blue: "#6edbff",
  };

  async function createNewGame() {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "GET",
      headers: {
        Authorization: `token ${import.meta.env.VITE_GITHUB_PAT}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const content: Card[] = JSON.parse(data.files["deck.json"].content);
    piles = [content];
    drawnCards = [];
    burnedCards = [];
    prognosisUsages = 0;
    prognosisActive = false;
  }

  async function loadCurrentGame() {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "GET",
      headers: {
        Authorization: `token ${import.meta.env.VITE_GITHUB_PAT}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const content: GameState = JSON.parse(data.files["currentGame.json"].content);
    piles = content.piles;
    burnedCards = content.burnedCards;
    drawnCards = content.drawnCards;
    prognosisUsages = piles
      .flatMap((list) => [...list])
      .filter((card) => card.prognosed).length;
  }

  async function drawCard(name) {
    const pileIndex = piles[piles.length - 1].findIndex(
      (pileCard) => pileCard.name == name,
    );
    const pileRemoval = piles[piles.length - 1].splice(pileIndex, 1)[0];
    drawnCards = [...drawnCards, pileRemoval]; // Reassign to trigger reactivity
    if (piles[piles.length - 1].length === 0) piles.pop();
    piles = [...piles];

    saveToGist();
  }

  async function handleEpidemic(name) {
    const infectedIndex = piles[0].findIndex((card) => card.name === name);
    const infectedCard = piles[0].splice(infectedIndex, 1)[0];
    drawnCards.push(infectedCard);
    piles.push(drawnCards);

    drawnCards = [];
    piles = [...piles];

    saveToGist();
  }

  async function handlePrognosis(name) {
    prognosisUsages += 1;
    for (let pileIndex = piles.length - 1; pileIndex >= 0; pileIndex--) {
      const pile = piles[pileIndex];
      const cardIndex = pile.findIndex((card) => card.name == name);
      if (cardIndex == -1) {
        continue;
      }
      const prognosedCard = pile.splice(cardIndex, 1)[0];
      piles.splice(pileIndex + 1, 0, [{ ...prognosedCard, prognosed: true }]);
      if (piles[pileIndex].length === 0) {
        piles.splice(pileIndex, 1);
      }
      piles = [...piles];
      saveToGist();
      return;
    }
  }

  async function handleBurn(name) {
    let discardIndex = drawnCards.findIndex((card) => card.name == name);
    if (discardIndex >= 0) {
      const burnedCard = drawnCards.splice(discardIndex, 1)[0];
      burnedCards.push(burnedCard);
      drawnCards = [...drawnCards];
      burnedCards = [...burnedCards];
      saveToGist();
      return;
    }

    discardIndex = piles[piles.length - 1].findIndex(
      (card) => card.name == name,
    );
    const burnedCard = piles[piles.length - 1].splice(discardIndex, 1)[0];
    if (piles[piles.length - 1].length === 0) {
      piles.splice(piles.length - 1, 1);
    }
    burnedCards.push(burnedCard);
    piles = [...piles];
    burnedCards = [...burnedCards];

    saveToGist();
  }

  async function saveToGist() {
    const data = JSON.stringify({ piles, drawnCards, burnedCards });
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${import.meta.env.VITE_GITHUB_PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: { "currentGame.json": { content: data } },
      }),
    });

    const result = await response.json();
    if (!gistId) gistId = result.id;
  }
</script>

<main>
  <h1>Pandemic Infection Deck Tracker</h1>

  <button on:click={createNewGame}>Start new game</button>
  <button on:click={loadCurrentGame}>Load current game</button>

  <div class="card-rows">
    <div>
      <div class="card-rows">
        <div>
          <h3>Infection discard</h3>
          <div class="card-container">
            {#each drawnCards as card}
              <div
                class="card"
                style={`background-color: ${colorMap[card.color]}; color: ${card.color === "black" ? "white" : "black"}`}
              >
                {card.name}
                {#if burnActive && burnedCards.length < 2}
                  <span class="arrow" on:click={() => handleBurn(card.name)}
                    >🔥</span
                  >
                {/if}
              </div>
            {/each}
          </div>
        </div>
        {#each [...piles].reverse() as piledCards, pileIndex}
          <div>
            <h3>
              {`${
                [...piles]
                  .reverse()
                  .slice(0, pileIndex)
                  .flatMap((list) => [...list]).length + 1
              } - ${
                [...piles]
                  .reverse()
                  .slice(0, pileIndex)
                  .flatMap((list) => [...list]).length + piledCards.length
              }`}
            </h3>
            {#each piledCards as card}
              <div
                class="card"
                style={`background-color: ${colorMap[card.color]}; color: ${card.color === "black" ? "white" : "black"}`}
              >
                {card.name}
                {#if pileIndex === 0}
                  <span class="arrow" on:click={() => drawCard(card.name)}
                    >➡️</span
                  >
                {/if}
                {#if [...piles]
                  .reverse()
                  .slice(0, pileIndex)
                  .flatMap( (cardList) => [...cardList], ).length + 1 <= 8 && !card.prognosed && prognosisUsages < 8 && prognosisActive}
                  <span
                    class="arrow"
                    on:click={() => handlePrognosis(card.name)}>📈</span
                  >
                {/if}
                {#if pileIndex === piles.length - 1}
                  <span class="arrow" on:click={() => handleEpidemic(card.name)}
                    >☣️</span
                  >
                {/if}
                {#if pileIndex === 0 && burnActive && burnedCards.length < 2}
                  <span class="arrow" on:click={() => handleBurn(card.name)}
                    >🔥</span
                  >
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
      {#if burnedCards.length > 0}
        <div>
          <h3>Burned cards</h3>
          <div class="card-container">
            {#each burnedCards as card}
              <div
                class="card"
                style={`background-color: ${colorMap[card.color]}; color: ${card.color === "black" ? "white" : "black"}`}
              >
                {card.name}
                🔥BURNED🔥
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <button on:click={() => (prognosisActive = !prognosisActive)}
        >Toggle prognosis 📈</button
      >
      <button on:click={() => (burnActive = !burnActive)}
        >Toggle burning 🔥</button
      >
    </div>
  </div>
</main>

<style>
  main {
    margin: auto;
    font-family: Arial, sans-serif;
  }
  button {
    margin-right: 8px;
    margin-top: 10px;
    padding: 8px 16px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .card-container {
    display: flex;
    flex-direction: column-reverse;
    gap: 0 50px;
  }
  .card-rows {
    display: flex;
    flex-direction: row-reverse;
    gap: 0 50px;
  }
  .card {
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 5px;
  }
  .arrow {
    cursor: pointer;
  }
</style>
