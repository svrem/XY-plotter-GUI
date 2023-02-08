const numbers = [
  null,
  [
    [0, 0],
    [0.5, 0],
    [0.5, 0.8],
  ],
  [
    [0, 0],
    [0.8, 0],
    [0.8, 0.2],
    [0.2, 0.2],
    [0.2, 0.5],
    [0.8, 0.5],
    [0.8, 0.8],
    [0.2, 0.8],
  ],
  [
    [0, 0],
    [0.2, 0],
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.5],
    [0.3, 0.5],
    [0.8, 0.5],
    [0.8, 0.8],
    [0.2, 0.8],
  ],
  [
    [0, 0],
    [0.6, 0],
    [0.6, 0.8],
    [0.6, 0.5],
    [0.2, 0.5],
    [0.2, 0.8],
  ],
  [
    [0, 0],
    [0.2, 0],
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.5],
    [0.2, 0.5],
    [0.2, 0.8],
    [0.8, 0.8],
  ],
  [
    [0, 0],
    [0.2, 0],
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.5],
    [0.2, 0.5],
    [0.2, 0.2],
    [0.2, 0.8],
    [0.8, 0.8],
  ],
  [
    [0, 0],
    [0.4, 0],
    [0.8, 0.8],
    [0.2, 0.8],
  ],
  [
    [0, 0],
    [0.8, 0],
    [0.8, 0.2],
    [0.2, 0.2],
    [0.2, 0.5],
    [0.8, 0.5],
    [0.8, 0.2],
    [0.8, 0.8],
    [0.2, 0.8],
    [0.2, 0.5],
    [0.8, 0.5],
  ],
  [
    [0, 0],
    [0.2, 0],
    [0.2, 0.2],
    [0.8, 0.2],
    [0.8, 0.8],
    [0.2, 0.8],
    [0.2, 0.5],
    [0.8, 0.5],
  ],
];

const draw_sudoku = async (sudoku, start_delta, tile_size) => {
  const top = tile_size * 9;

  const commands = ["G28", `G1 X${start_delta} Y${start_delta}`];

  const move_to_coords = (x = null, y = null) => {
    if ((x !== null) & (y !== null))
      commands.push(`G1 X${x + start_delta} Y${y + start_delta}`);
    else if (y === null) commands.push(`G1 X${x + start_delta}`);
    else if (x === null) commands.push(`G1 Y${y + start_delta}`);
  };

  const gen_grid = () => {
    for (let x = 0; x < 9; x += 2) {
      move_to_coords(x * tile_size, top);
      move_to_coords((x + 1) * tile_size, top);
      move_to_coords((x + 1) * tile_size, 0);
      move_to_coords((x + 2) * tile_size, 0);
    }

    commands.pop();

    move_to_coords(0, 0);

    for (let y = 0; y < 9; y += 2) {
      move_to_coords(top, y * tile_size);
      move_to_coords(top, (y + 1) * tile_size);
      move_to_coords(0, (y + 1) * tile_size);
      move_to_coords(0, (y + 2) * tile_size);
    }

    commands.pop();
  };

  const go_to_tile = (x, y) => {
    move_to_coords(x * tile_size);
    move_to_coords(null, y * tile_size);

    return [x * tile_size, y * tile_size];
  };

  const draw_number = (number, curr_loc) => {
    const ops = numbers[number];

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      move_to_coords(
        curr_loc[0] + tile_size * op[0],
        curr_loc[1] + tile_size * op[1]
      );
    }

    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i];
      move_to_coords(
        curr_loc[0] + tile_size * op[0],
        curr_loc[1] + tile_size * op[1]
      );
    }
  };

  gen_grid();
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const digit = sudoku[8 - j][i];
      if (digit === 0) continue;
      const loc = go_to_tile(i, j);
      
      draw_number(digit, loc);
    }
  }

  go_to_tile(0,0)
  commands.push("G28")

  console.log(commands.join("\n"))
  const COM = document.getElementById("com-select").value;
  const rate = parseInt(document.getElementById("baud-rate").value);

  await serialport.connect(COM, rate);
  await new Promise(r => setTimeout(r, 2000));

  await serialport.write("G90\r\n")
  await serialport.write("G21\r\n")


  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    await serialport.write(command + "\r\n");
  }
};
