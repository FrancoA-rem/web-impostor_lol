const createGameButton = document.getElementById("create-game");
const playersInput = document.getElementById("players");
const playersContainer = document.getElementById("players-container");

const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");

createGameButton.addEventListener("click", () => {
  const totalPlayers = Number(playersInput.value);
  const totalImpostors = Number(document.getElementById("impostors").value);

  if (totalImpostors >= totalPlayers / 2) {
    alert("Los impostores no pueden ser la mitad o más de los jugadores.");
    return;
  }

  playersContainer.innerHTML = "";

  for (let i = 1; i <= totalPlayers; i++) {
    playersContainer.innerHTML += `
            <div class="form-group">
                <label>Jugador ${i}</label>
                <input
                    type="text"
                    placeholder="Nombre del jugador"
                    class="player-name"
                >
            </div>
        `;
  }

  playersContainer.innerHTML += `
        <button id="start-game">
            Comenzar partida
        </button>
    `;

  const startGameButton = document.getElementById("start-game");

  startGameButton.addEventListener("click", () => {
    const playerInputs = document.querySelectorAll(".player-name");

    const players = [];

    for (const input of playerInputs) {
      const name = input.value.trim();

      if (name === "") {
        alert("Todos los jugadores deben tener nombre.");
        return;
      }

      players.push(name);
    }

    const selectedChampion =
      champions[Math.floor(Math.random() * champions.length)];

    const impostorIndexes = new Set();

    while (impostorIndexes.size < totalImpostors) {
      impostorIndexes.add(Math.floor(Math.random() * players.length));
    }

    const roles = players.map((player, index) => ({
      name: player,
      isImpostor: impostorIndexes.has(index),
    }));

    let currentPlayerIndex = 0;

    setupScreen.style.display = "none";

    function showPlayerScreen() {
      if (currentPlayerIndex >= roles.length) {
        gameScreen.innerHTML = `
        <h2>
            Todos los jugadores ya vieron su rol
        </h2>

        <button id="finish-game">
            Finalizar ronda
        </button>
    `;

        const finishGameButton = document.getElementById("finish-game");

        finishGameButton.addEventListener("click", () => {
          gameScreen.innerHTML = "";

          setupScreen.style.display = "block";

          playersContainer.innerHTML = "";
        });

        return;
      }

      gameScreen.innerHTML = `
                <h2>
                    Pasale el celular a
                    ${roles[currentPlayerIndex].name}
                </h2>

                <button id="show-role">
                    Ver rol
                </button>

                <button id="back-button">
                    Volver
                </button>
            `;

      const showRoleButton = document.getElementById("show-role");

      const backButton = document.getElementById("back-button");

      backButton.addEventListener("click", () => {
        gameScreen.innerHTML = "";

        setupScreen.style.display = "block";
      });

      showRoleButton.addEventListener("click", () => {
        const currentPlayer = roles[currentPlayerIndex];

        gameScreen.innerHTML = `
                    <h2>${currentPlayer.name}</h2>

                    ${
                      currentPlayer.isImpostor
                        ? `
                                <h1>
                                    SOS EL IMPOSTOR
                                </h1>
                            `
                        : `
                                <h3>
                                    Tu campeón es:
                                </h3>

                                <h1>
                                    ${selectedChampion}
                                </h1>
                            `
                    }

                    <button id="hide-role">
                        Ocultar
                    </button>
                `;

        const hideRoleButton = document.getElementById("hide-role");

        hideRoleButton.addEventListener("click", () => {
          currentPlayerIndex++;

          showPlayerScreen();
        });
      });
    }

    showPlayerScreen();
  });
});
