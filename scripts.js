"use strict";

(function () {
  const colors = [
    "#4AC0FD",
    "#66C266",
    "#FF7788",
    "#EE88FF",
    "#DDAA22",
    "#66CCCC",
    "#999999",
    "#D0D8E0",
  ];

  const box = document.querySelector(".box");
  const flagP = document.getElementById("flags-p");
  const flagAP = document.getElementById("flags-ap");
  const minesP = document.getElementById("mines-p");
  const endScreen = document.querySelector(".end-game-screen");
  const endScreenTitle = document.querySelector(".end-game-title");
  const restartBtn = document.getElementById("restart-btn");
  const modeSelector = document.getElementById("mode-selector");

  let gameMode = localStorage.getItem("mode")
    ? localStorage.getItem("mode")
    : "easy";
  modeSelector.value = gameMode;

  restartBtn.addEventListener("click", restart);
  modeSelector.addEventListener("change", () => {
    gameMode = modeSelector.value;
    localStorage.setItem("mode", gameMode);
    restart();
  });

  let gameEnded = false;

  let cols =
    gameMode === "easy"
      ? 10
      : gameMode === "medium"
      ? 18
      : gameMode === "hard"
      ? 24
      : 10;
  let rows =
    gameMode === "easy"
      ? 8
      : gameMode === "medium"
      ? 14
      : gameMode === "hard"
      ? 20
      : 8;

  box.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  box.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  let mineNumber =
    gameMode === "easy"
      ? 10
      : gameMode === "medium"
      ? 40
      : gameMode === "hard"
      ? 99
      : 10;
  minesP.innerHTML = mineNumber;
  flagAP.innerHTML = mineNumber;

  let currentMinesNumber = 0;
  let flagNumber = 0;

  let map = [];

  class Block {
    i;
    j;
    color;
    el;
    number = 0;
    isMine = false;
    isFlagged = false;
    isDigged = false;
    isExploded = false;

    constructor(i, j, color, el) {
      this.i = i;
      this.j = j;
      this.color = color;
      this.el = el;
      el.addEventListener("click", () => {
        if (!gameEnded) {
          this.dig();
        }
      });
      el.addEventListener("contextmenu", () => {
        if (!gameEnded) {
          this.flag();
        }
      });
    }

    dig(auto = true) {
      if (!this.isFlagged && !gameEnded) {
        if (!this.isMine || this.number === -1) {
          this.isDigged = true;
          this.el.classList.add(`digged`);
          this.el.classList.add(`dirt-${this.color}`);
          this.el.classList.remove(this.color);
          if (this.number > 0) {
            this.el.innerHTML = this.number;
            this.el.style.color = colors[this.number - 1];
          }
          if (this.number === 0) {
            this.number = -2;
            if (auto) {
              refreshMapFromPoint(this);
            }
          }

          if (countFreeBlocks() === mineNumber && flagNumber === mineNumber) {
            winGame();
          }
        } else {
          endGame();
        }
      }
    }

    flag() {
      if (!this.isDigged && !gameEnded) {
        if (!this.isFlagged && flagNumber === mineNumber) {
          return;
        } else {
          this.isFlagged = this.isFlagged ? false : true;
          if (this.isFlagged) {
            this.el.classList.add("has-flag");
            flagNumber++;
          } else {
            this.el.classList.remove("has-flag");
            flagNumber--;
          }
          flagP.innerHTML = flagNumber;

          if (countFreeBlocks() === mineNumber && flagNumber === mineNumber) {
            winGame();
          }
        }
      }
    }

    makeMine() {
      this.el.addEventListener("click", () => {
        if (!this.isFlagged) {
          this.explode();
          endGame();
        }
      });
      this.isMine = true;
      this.number = -1;
    }

    explode() {
      if (this.isFlagged) {
        this.el.classList.remove("has-flag");
        this.el.classList.add("has-mine");
      } else {
        this.el.classList.add("has-mine");
      }
      this.isExploded = true;
    }
  }

  function findBlock(i, j) {
    if (map[i]) {
      if (map[i][j]) {
        return map[i][j];
      }
    }
  }

  function countFreeBlocks() {
    let freeBlocks = 0;
    for (let i = 0; i < map.length; i++) {
      const row = map[i];
      for (let j = 0; j < row.length; j++) {
        const block = row[j];
        if (!block.isDigged) {
          freeBlocks++;
        }
      }
    }
    return freeBlocks;
  }

  function generateMap() {
    const blocks = document.querySelectorAll(".block");

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      block.remove();
    }

    let x = cols;
    let y = rows;
    let lastColor = "light";

    for (let i = 0; i < y; i++) {
      map.push([]);
      for (let j = 0; j < x; j++) {
        const button = document.createElement("button");
        button.className = "block " + lastColor;
        button.addEventListener("contextmenu", (e) => e.preventDefault());
        box.appendChild(button);
        map[i].push(new Block(i, j, lastColor, button));
        if (j !== x - 1) {
          lastColor = lastColor === "light" ? "dark" : "light";
        }
      }
    }
  }

  function generateMines() {
    for (let i = 0; i < map.length; i++) {
      const row = map[i];
      for (let j = 0; j < row.length; j++) {
        const block = row[j];
        let chance = Math.floor(Math.random() * 10) > 8;

        if (currentMinesNumber < mineNumber) {
          if (chance && !block.isMine) {
            block.makeMine();
            currentMinesNumber++;
          }
        }
      }
    }
    if (currentMinesNumber < mineNumber) {
      generateMines();
    }
  }

  function refreshMapFromPoint(block) {
    block.dig(false);
    if (block.number < 0) {
      const i = block.i;
      const j = block.j;
      const sides = [
        { i: i + 1, j: j - 1 },
        { i: i - 1, j: j + 1 },
        { i: i + 1, j: j + 1 },
        { i: i - 1, j: j - 1 },
        { i: i + 1, j },
        { i: i - 1, j },
        { i, j: j + 1 },
        { i, j: j - 1 },
      ];

      for (const side of sides) {
        const sideBlock = findBlock(side.i, side.j);

        if (sideBlock && sideBlock.number >= 0) {
          setTimeout(() => {
            refreshMapFromPoint(sideBlock);
          }, 50);
        }
      }
    }
  }

  function generateNumbers() {
    for (let i = 0; i < map.length; i++) {
      const row = map[i];
      for (let j = 0; j < row.length; j++) {
        const block = row[j];
        if (!block.isMine) {
          let minesAround = 0;

          const sides = [
            { i: i + 1, j: j - 1 },
            { i: i - 1, j: j + 1 },
            { i: i + 1, j: j + 1 },
            { i: i - 1, j: j - 1 },
            { i: i + 1, j },
            { i: i - 1, j },
            { i, j: j + 1 },
            { i, j: j - 1 },
          ];

          for (const side of sides) {
            const sideBlock = findBlock(side.i, side.j);

            if (sideBlock && sideBlock.isMine) {
              minesAround++;
            }
          }

          block.number = minesAround;
        }
      }
    }
  }

  function winGame() {
    gameEnded = true;
    endScreen.classList.remove("hide");
    endScreenTitle.innerHTML = "Congratulations! You won the game 🎉";
  }

  function endGame() {
    gameEnded = true;
    let explodeCount = 0;
    for (let i = 0; i < map.length; i++) {
      const row = map[i];
      for (let j = 0; j < row.length; j++) {
        const block = row[j];
        if (block.isMine) {
          if (!block.isExploded) {
            setTimeout(() => {
              block.explode();
            }, 200 * explodeCount);
            explodeCount++;
          }
        }
      }
    }
    setTimeout(() => {
      endScreen.classList.remove("hide");
      endScreenTitle.innerHTML = "Awwwww! You lost the game ☹";
    }, (mineNumber - 1) * 200);
  }

  function restart() {
    gameEnded = false;

    cols =
      gameMode === "easy"
        ? 10
        : gameMode === "medium"
        ? 18
        : gameMode === "hard"
        ? 24
        : 10;
    rows =
      gameMode === "easy"
        ? 8
        : gameMode === "medium"
        ? 14
        : gameMode === "hard"
        ? 20
        : 8;

    box.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    box.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    mineNumber =
      gameMode === "easy"
        ? 10
        : gameMode === "medium"
        ? 40
        : gameMode === "hard"
        ? 99
        : 10;
    minesP.innerHTML = mineNumber;
    flagAP.innerHTML = mineNumber;

    currentMinesNumber = 0;
    flagNumber = 0;

    map = [];

    endScreen.classList.add("hide");
    endScreenTitle.innerHTML = "";

    generateMap();
    generateMines();
    generateNumbers();
  }

  generateMap();
  generateMines();
  generateNumbers();
})();
