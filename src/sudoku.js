const sudoku_div = document.getElementById("sudoku");
const optionMenu = document.getElementById("option-menu");

const check_column = (loc, state, sudoku) => {
  sudoku[loc].forEach((value) => {
    if (value === 0) return;

    const index = state.indexOf(value);
    if (index !== -1) {
      state.splice(index, 1);
    }
  });

  return state;
};

const check_row = (loc, state, sudoku) => {
  for (let column = 0; column < 9; column++) {
    const value = sudoku[column][loc];
    if (value === 0) continue;

    const index = state.indexOf(value);
    if (index !== -1) {
      state.splice(index, 1);
    }
  }

  return state;
};

const check_cell = (loc, state, sudoku) => {
  const cell_col = Math.floor(loc[0] / 3) * 3;
  const cell_row = Math.floor(loc[1] / 3) * 3;

  for (let column = cell_col; column < cell_col + 3; column++) {
    for (let row = cell_row; row < cell_row + 3; row++) {
      const value = sudoku[column][row];
      if (value === 0) continue;

      const index = state.indexOf(value);
      if (index !== -1) {
        state.splice(index, 1);
      }
    }
  }

  return state;
};

const update_sudoku_visuals = (sudoku) => {
  for (let column = 0; column < 9; column++) {
    for (let row = 0; row < 9; row++) {
      //   if (sudoku[column][row] === 0) continue;
      const tile = document.querySelector(`[coord="${column},${row}"]`);
      tile.innerHTML = sudoku[column][row] || "";
    }
  }
};

let sudoku = [];

for (let column = 0; column < 9; column++) {
  sudoku.push([]);
  for (let row = 0; row < 9; row++) {
    sudoku[column].push(0);

    const tile = document.createElement("h2");
    tile.onclick = (e) => {
      let state = find_possibilities(column, row);

      const selected = document.getElementsByClassName("selected");

      for (let i = 0; i < selected.length; i++) {
        selected.item(i).classList.remove("selected");
      }

      tile.classList.add("selected");

      optionMenu.innerHTML = "";
      for (let index in state) {
        const value = state[index];
        const button = document.createElement("button");
        button.innerHTML = value;

        button.onclick = (e) => {
          sudoku[column][row] = value;
          update_sudoku_visuals(sudoku);
          optionMenu.style.display = "none";
        };

        optionMenu.appendChild(button);
      }

      optionMenu.style.left = e.clientX + "px";
      optionMenu.style.top = e.clientY + "px";
      optionMenu.style.display = "block";
    };
    tile.oncontextmenu = (e) => {
      sudoku[column][row] = 0;
      update_sudoku_visuals(sudoku);
    };

    tile.setAttribute("coord", `${column},${row}`);
    tile.className = "tile";

    sudoku_div.appendChild(tile);
  }
}
document.onkeyup = (e) => {
  const el = document.getElementsByClassName("selected")[0];
  if (!el) return;
  const [column_str, row_str] = el.getAttribute("coord").split(",");
  const column = parseInt(column_str);
  const row = parseInt(row_str);

  if (e.key === "Backspace") {
    sudoku[column][row] = 0;
    update_sudoku_visuals(sudoku);
    el.classList.remove("selected");
    optionMenu.style.display = "none";

    return;
  }

  let state = find_possibilities(column, row).map((v) => v.toString());

  if (!state.includes(e.key)) return;
  sudoku[column][row] = parseInt(e.key);
  update_sudoku_visuals(sudoku);
  el.classList.remove("selected");
  optionMenu.style.display = "none";
};

const solve = async () => {
  const possibility_indexes = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const valid_indexes = [];
  let curr_index = 0;
  let backing = false;

  const visualize = document.getElementById("visualize").checked;

  while (curr_index < 81) {
    col = curr_index % 9;
    row = Math.floor(curr_index / 9);

    if (backing) {
      backing = false;
      sudoku[col][row] = 0;
      valid_indexes.splice(valid_indexes.indexOf(curr_index), 1);
    }

    if (sudoku[col][row] > 0) {
      curr_index += 1;
      continue;
    }

    valid_indexes.push(curr_index);

    const possibilities = find_possibilities(col, row);
    const possibility_index = possibility_indexes[col][row];

    if (possibilities.length <= possibility_index) {
      if (curr_index === valid_indexes.at(0)) {
        break;
      }

      possibility_indexes[col][row] = 0;
      sudoku[col][row] = 0;

      valid_indexes.splice(valid_indexes.indexOf(curr_index), 1);
      curr_index = valid_indexes.at(-1);
      backing = true;
      continue;
    }

    sudoku[col][row] = possibilities[possibility_index];
    possibility_indexes[col][row] += 1;
    if (visualize) {
      update_sudoku_visuals(sudoku);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  update_sudoku_visuals(sudoku);

  return sudoku;
};

const generate_sudoku = async () => {
  const difficulty_percentage =
    document.getElementById("difficulty").value / 100;

  sudoku = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  one_to_nine_range = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  sudoku[0] = one_to_nine_range.sort(() => 0.5 - Math.random());

  sudoku = await solve();
  for (let col = 0; col < 9; col++) {
    for (let row = 0; row < 9; row++) {
      if (Math.random() < difficulty_percentage) {
        sudoku[col][row] = 0;
      }
    }
  }

  update_sudoku_visuals(sudoku);
};

const generate_with_current = async function () {
  const difficulty_percentage =
    document.getElementById("difficulty").value / 100;

  sudoku = await solve();

  for (let col = 0; col < 9; col++) {
    for (let row = 0; row < 9; row++) {
      if (Math.random() < difficulty_percentage) {
        sudoku[col][row] = 0;
      }
    }
  }

  update_sudoku_visuals(sudoku);
};

function find_possibilities(column, row) {
  let state = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  state = check_column(column, state, sudoku);
  state = check_row(row, state, sudoku);
  state = check_cell([column, row], state, sudoku);
  return state;
}
