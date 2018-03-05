# Lyre Fretboard

Create configurable SVG chord charts for stringed instruments.

## Installation

`npm install @lyre/fretboard`

## Usage

```javascript
import {default as Fretboard} from '@lyre/fretboard'

var fretboard = new Fretboard({
    container: "myContainerId",
    strings: 6,
    frets: 5,
    showFretLabels: true,
    tuning: ['E', 'A', 'D', 'G', 'B', 'e'],

    //F chord
    fingering: [
        {
            string: [1, 6],
            fret: 1,
            finger: 1
        },
        {
            string: 3,
            fret: 2,
            finger: 2
        },
        {
            string: 4,
            fret: 3,
            finger: 4
        },
        {
            string: 5,
            fret: 3,
            finger: 3
        } 
    ]
});
```