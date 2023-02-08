// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
const { SerialPort } = require("serialport");
const { SVG } = require("@svgdotjs/svg.js")
const { writeFileSync } = require("fs")

// const port = new SerialPort({
//   path: "COM1",
//   baudRate: 10,
//   autoOpen: false,
// });
let port;
let resolve_func = () => { };

contextBridge.exposeInMainWorld("serialport", {
  list: () => {
    return SerialPort.list();
  },
  connect: async (COM, baud) => {
    port = new SerialPort({
      path: COM,
      baudRate: baud,
    }).setEncoding("ascii")

    // const parser = port.pipe(new ReadlineParser({
    //   delimiter: '\r\n',
    //   encoding: 'ascii',
    // }));
    // parser.on('data', data => {console.log(data)});

    port.on("error", err => {
      console.log(err)
    })

    port.on("data", data => {
      console.log(data)
      if (data.endsWith("OK\r\n")) resolve_func()
    })
    return new Promise((resolve) => {
      port.on("open", () => { { resolve() } });

    });
  },
  write: (message) => {
    console.log("writing:", message)

    return new Promise((resolve) => {

      port.write(message, (err) => {
        if (err) {
          console.log(err)
        }
      });

      resolve_func = resolve

    });
  },
});

contextBridge.exposeInMainWorld("SVG", {
  generate_svg: async (sudoku) => {

    document.getElementById("svg-wrapper").innerHTML = "";
    const draw = SVG().addTo("#svg-wrapper").size(1000, 1000);

    // outline (cut)
    draw.line(30, 30, 970, 30).stroke({ width: 1, color: "red" });
    draw.line(30, 30, 30, 970).stroke({ width: 1, color: "red" });
    draw.line(30, 970, 970, 970).stroke({ width: 1, color: "red" });
    draw.line(970, 30, 970, 970).stroke({ width: 1, color: "red" });

    // outline (hard)
    draw.line(50, 50, 950, 50).stroke({ width: 1, color: "#00FF00" });
    draw.line(50, 50, 50, 950).stroke({ width: 1, color: "#00FF00" });
    draw.line(50, 950, 950, 950).stroke({ width: 1, color: "#00FF00" });
    draw.line(950, 50, 950, 950).stroke({ width: 1, color: "#00FF00" });

    // 3x3 squares (hard)
    draw.line(350, 50, 350, 950).stroke({ width: 1, color: "#00FF00" });
    draw.line(650, 50, 650, 950).stroke({ width: 1, color: "#00FF00" });
    draw.line(50, 350, 950, 350).stroke({ width: 1, color: "#00FF00" });
    draw.line(50, 650, 950, 650).stroke({ width: 1, color: "#00FF00" });

    // squares (soft)
    for (let x = 100; x < 900; x += 100) {
      if (x === 300 || x === 600) continue;
      draw.line(50 + x, 50, 50 + x, 950).stroke({ width: 1, color: "blue" });
    }
    for (let y = 100; y < 900; y += 100) {
      if (y === 300 || y === 600) continue;
      draw.line(50, 50 + y, 950, 50 + y).stroke({ width: 1, color: "blue" });
    }

    // numbers (soft)
    for (let col = 0; col < 9; col++) {
      for (let row = 0; row < 9; row++) {
        const num = sudoku[col][row];
        if (num === 0) continue;

        draw
          .text(num)
          .dx(row * 100 + 100)
          .dy(col * 100 + 120)
          .fill({
            color: "black",
          })
          .font({
            family: "Verdana",
            size: 50,
            anchor: "middle",
            leading: 0,
          });
      }
    }

    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(
      document.getElementById("svg-wrapper").children[0]
    );

    //add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
      );
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const path = await ipcRenderer.invoke("open-svg-save-dialog");
    writeFileSync(path, source);
  },
});
