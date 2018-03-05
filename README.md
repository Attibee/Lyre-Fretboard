# Lyre Fretboard

Create configurable SVG chord charts for stringed instruments.

## Installation

`npm install @lyre/fretboard`

## Usage

```javascript
import {default as Fretboard} from '@lyre/fretboard'

var fretboard = new Fretboard({
    container: 'myContainerId',
    frets: 5,
    strings: 6,
    fingering: [

    ]
});