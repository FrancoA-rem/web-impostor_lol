const createGameButton = document.getElementById("create-game");
const playersInput = document.getElementById("players");
const playersContainer = document.getElementById("players-container");
const backHomeButton = document.getElementById("back-home");
const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const homeScreen = document.getElementById("home-screen");
const playLocalButton = document.getElementById("play-local");

const savedPlayersKey = "impostorLolPlayers";

function getSavedPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(savedPlayersKey));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

playLocalButton.addEventListener("click", () => {
  homeScreen.style.display = "none";
  setupScreen.style.display = "block";
});

backHomeButton.addEventListener("click", () => {
  setupScreen.style.display = "none";
  homeScreen.style.display = "block";

  playersContainer.innerHTML = "";
});

createGameButton.addEventListener("click", () => {
  const totalPlayers = Number(playersInput.value);
  const totalImpostors = Number(document.getElementById("impostors").value);

  if (totalImpostors >= totalPlayers / 2) {
    alert("Los impostores no pueden ser la mitad o más de los jugadores.");
    return;
  }

  playersContainer.innerHTML = "";

  const savedPlayers = getSavedPlayers();

  for (let i = 1; i <= totalPlayers; i++) {
    playersContainer.innerHTML += `
            <div class="form-group">
                <label>Jugador ${i}</label>
                <input
                    type="text"
                    placeholder="Nombre del jugador"
                    class="player-name"
                    value="${escapeHtml(savedPlayers[i - 1])}"
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

    localStorage.setItem(savedPlayersKey, JSON.stringify(players));

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
        runVotingPhase();
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
                                <h1 class="impostor-role">
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

    function runVotingPhase() {
      let alive = roles.map((_, index) => index);

      const impostorCount = () =>
        roles.filter((player, i) => player.isImpostor && alive.includes(i)).length;

      const crewCount = () => alive.length - impostorCount();

      const playRound = () => {
        if (impostorCount() === 0) {
          showResult("¡Ganó el equipo! Atraparon a todos los impostores.");
          return;
        }

        if (impostorCount() >= crewCount()) {
          showResult("¡Ganaron los impostores! Tomaron el control.");
          return;
        }

        const votes = new Array(roles.length).fill(-1);
        const voters = alive.slice();
        let position = 0;

        const showVoteScreen = () => {
          if (position >= voters.length) {
            resolveVotes();
            return;
          }

          const voterIndex = voters[position];
          const voter = roles[voterIndex];

          const options = alive
            .filter((index) => index !== voterIndex)
            .map(
              (index) => `
                <button class="vote-option" data-index="${index}">
                  ${roles[index].name}
                </button>
              `
            )
            .join("");

          gameScreen.innerHTML = `
            <h2>Pasale el celular a ${voter.name}</h2>
            <p>¿Quién crees que es el impostor?</p>
            <div class="vote-options">${options}</div>
            <button id="vote-skip">No estoy seguro / Pasar</button>
          `;

          document.querySelectorAll(".vote-option").forEach((button) => {
            button.addEventListener("click", () => {
              votes[voterIndex] = Number(button.dataset.index);
              position++;
              showVoteScreen();
            });
          });

          document.getElementById("vote-skip").addEventListener("click", () => {
            votes[voterIndex] = -1;
            position++;
            showVoteScreen();
          });
        };

        const resolveVotes = () => {
          const counts = roles.map(() => 0);

          for (const vote of votes) {
            if (vote >= 0) counts[vote]++;
          }

          const maxVotes = Math.max(...counts);

          const accusedIndexes = counts
            .map((count, index) => (count === maxVotes ? index : -1))
            .filter((index) => index !== -1);

          if (maxVotes === 0 || accusedIndexes.length > 1) {
            showRoundInfo("Nadie fue votado esta ronda.");
            return;
          }

          const eliminated = roles[accusedIndexes[0]];
          alive = alive.filter((index) => index !== accusedIndexes[0]);

          showRoundInfo(
            `${eliminated.name} fue votado fuera. ${
              eliminated.isImpostor ? "¡Era el impostor!" : "Era inocente..."
            }`
          );
        };

        const showRoundInfo = (message) => {
          gameScreen.innerHTML = `
            <h2>${message}</h2>
            <button id="next-round">Continuar</button>
          `;

          document.getElementById("next-round").addEventListener("click", () => {
            gameScreen.innerHTML = "";
            playRound();
          });
        };

        showVoteScreen();
      };

      const showResult = (title) => {
        gameScreen.innerHTML = `
          <h2>${title}</h2>
          <p>${roles
            .map(
              (player) =>
                `${player.name}: ${player.isImpostor ? "Impostor" : "Crew"}`
            )
            .join("<br>")}</p>
          <button id="play-again">Jugar de nuevo</button>
        `;

        document.getElementById("play-again").addEventListener("click", () => {
          gameScreen.innerHTML = "";
          setupScreen.style.display = "block";
          playersContainer.innerHTML = "";
        });
      };

      playRound();
    }

    showPlayerScreen();
  });
});
