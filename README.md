# Sudoku maker voor de Makeblocks XY plotter

## Installatie

1. Begin met het opzetten van de XY-Plotter-2.0, de documentatie daarvoor staat [hier](https://github.com/Makeblock-official/XY-Plotter-2.0)
1. Download de laatste release [hier](https://github.com/svrem/XY-plotter-GUI/releases).
1. Voer de gedownloade .exe uit.
1. Als alles goed is gegaan zou je nu de GUI moeten zien.

## **Gebruik**

### **Solve**

Los de huidige sudoku op.

### **Generate**

Genereert een sudoku met de moeilijkheid graad

### **Generate (with current)**

Genereeert een sudoku met als begin cijfers de huidige sudoku

### **Generate CNC**

Genereert CNC instructies van de huidige sudoku voor de XY-plotter en voert die uit.

### **Generate SVG**

Genereert een SVG bestand van de huidige sudoku.

### **Difficulty**

Hoeveel van de sudoku onbekend is, dus een leeg blokje. Voor een makkelijkere sudoku verplaats je de slider naar links en voor een moeilijkere naar rechts.

### **Visualize**

Visualize geeft je een inkijkje in hoe het sudoku algorithme werkt.

### **COM Select**

Selecteeer hier het PORT waar de XY plotter is aan gesloten.

### **Baud Rate (115200)**

De Baud Rate hoef je niet vaak te veranderen behalve als je een eigen firmware hebt geschreven.

## Uitleg systemen

<details><summary><strong>Het maken en oplossen van de sudoku's</strong></summary>

Voor het oplossen van sudoku's is het eerste wat je nodig hebt een functie die voor een specifiek vakje de mogelijke opties kan vinden. Dit doe je door alle cijfers van de column, de rij en het 3x3 vak te vinden waar het vakje zich in bevindt.

```js
// Check de column en verwijder de gevonden nummers van de huidige mogelijkheden (begint met een lijst van 1 tot 9)

function check_column(loc, state, sudoku) {
  sudoku[loc].forEach((value) => {
    if (value === 0) return;

    const index = state.indexOf(value);
    if (index !== -1) {
      state.splice(index, 1);
    }
  });

  return state;
}
```

```js
// Check de rij en verwijder de gevonden nummers van de huidige mogelijkheden

function check_row(loc, state, sudoku) {
  for (let column = 0; column < 9; column++) {
    const value = sudoku[column][loc];
    if (value === 0) continue;

    const index = state.indexOf(value);
    if (index !== -1) {
      state.splice(index, 1);
    }
  }

  return state;
}
```

```js
// Check het grote 3x3 vakje en verwijder de gevonden nummers van de huidige mogelijkheden

function check_cell(loc, state, sudoku) {
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
}
```

Deze functies gebruik je door ze aan elkaar te verbinden op deze manier:

```js
function find_possibilities(column, row) {
  let state = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  state = check_column(column, state, sudoku);
  state = check_row(row, state, sudoku);
  state = check_cell([column, row], state, sudoku);
  return state;
}
```

Voor het oplos algorithme zou ik je willen verwijzen naar [deze site](https://iq.opengenus.org/backtracking-sudoku/), omdat het een geweldige en diepgaande uitleg geeft over een soortgelijk algorithme dat in dit project wordt gebruikt.

Als je dit algorithme hebt dan is het relatief makkelijk om een sudoku te genereren. Je begint met een lege sudoku en zet de eerste rij naar een willekeurige sequentie van nummers van 1 tot 9 (bijv. 4,3,5,2,1,7,6,8,9). Daarna los je de sudoku op en verwijder je een gegeven percentage van nummers. Stel je genereert sudoku's zonder het verwijderen van vakjes het je al 9! (of 362880) mogelijke sudoku's.

</details>

<details><summary><strong>Het maken van de CNC instructies</strong></summary>
Voor het maken van de sudoku's hebben we maar twee instructie codes nodig:

- <strong>G28</strong>: Ga terug naar het begin.
- <strong>G1 X Y</strong>: Ga naar de gegeven locatie.

Het genereren van het rooster is vrij simpel.

- Eerste gaan we helemaal omhoog, één vlak lengte opzij, dan weer helemaal omlaag en dan weer één vlak lengte opzij. Dit doen we tot aan het einde van het rooster.
- Dan gaan we weer terug naar het begin.
- En dan ten slot gaan we helemaal opzij, één vlak lengte omhoog, dan weer helemaal terug opzij en dan weer één vlak lengte omhoog. Wederom doen we dit totdat we het einde van het vlak hebben bereikt.

Dit ziet er dan zo uit:

![Grid](https://github.com/svrem/XY-plotter-GUI/blob/63bbc018dc135fd4cec4c5894b0082688bbd015d/images/grid.gif?raw=true)

Om de cijfers in de sudoku te zetten gaan we eerst naar het gekozen vakje toe door over de lijnen heen te lopen zodat we niet krassen door de sudoku heen zetten. Als we zijn aan gekomen bij het vakje zetten we het nummer neer. Belangerijk is dat we weer exact hetzelfde pad terug nemen om zeker te zijn dat we niet de sudoku krassen. Na dit proces kunnen we weer verder bewegen naar het volgende vakje.

Het hele proces ziet er dan zo uit:

![Het heel proces](https://github.com/svrem/XY-plotter-GUI/blob/63bbc018dc135fd4cec4c5894b0082688bbd015d/images/whole_proces.gif?raw=true)

Nadat we de sudoku en de instructies hebben gegenereert (wat in de meeste gevallen niet langer duurt dan een paar milliseconde) kunnen we deze nu uitvoeren op de XY-plotter

Voor als je je eigen instructies wilt testen kan je dit <a href="https://github.com/svrem/XYplotter-sudoku-maker/blob/master/visualizer.py">script</a> gebruiken.

</details>

<details><summary><strong>Het uitvoeren van de CNC instructies</strong></summary>
Voor de communicatie met de XY-plotter gebruik ik een library genaamd <a href="https://www.npmjs.com/package/serialport">Serialport</a>. Met deze library kan je over een USB connectie verbinden met de XY-plotter.

We gaan nu één bij één langs alle instructies en sturen deze naar de XY plotter. Na elke keer dat we iets sturen wachten we op een "OK" terug van de plotter. Als we hier niet wachten voert de plotter de instructies niet meer uit.

<h3><strong>WAARSCHUWING</strong></h3>
Als je zelf ook een script wilt maken die communiceert met de plotter, wacht een paar seconde na dat je verbonden bent met de plotter voordat je de instructies stuurt. De plotter accepteert namelijk geen instructies voordat het één keer met het potlood heeft getikt. In deze tijd stuurt hij ook geen "OK" waardoor je hele programma aan het wachten is op niks, dus alsjeblieft bespaar je zelf de hoofdpijn die ik heb gehad en wacht gewoon een paar seconden.

</details>
