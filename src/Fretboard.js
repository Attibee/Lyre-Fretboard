"use strict";

var SVG = require("svgjs");
var Config = require("@attibee/config");
var Note = require("@lyre/note");

/**
 * Class for drawing chord charts and fretboards of any number frets of strings.
 */
class Fretboard {
    /**
     * Initiates the configuration and draws the Fretboard.
     * 
     * @param {object} config The configuration object
     */
    constructor(config) {
        this._initiateConfig(config);
        this._draw();
    }
    
    /**
     * Draws the fretboard calling all draw methods.
     */
    _draw() {
        this.svg = SVG(this.config.get("container"))
                .viewbox(0, 0, (this.config.get("strings") + 1) * 25, (this.config.get("frets") + 1) * 40)
                .width(500);
        
        //draw the fret/string grid
        this._drawGrid();
        
        //draw the fret markers
        this._drawFretMarkers();
        
        //draws the fret number indicator
        this._drawFretLabels();
        
        //draw the string notes
        this._drawNotes(); 
    }
    
    /**
     * Draws a grid of strings and frets.
     */
    _drawGrid() {
        var firstFret = this._getFirstFret(this.config.get("fingering"));
        
        //15 pixel padding for fret labels
        this.fretGroup = this.svg.group().id("grid").transform({
            x: 35,
            y: 20
        });
        
        //draw frets
        //width of fret spans width of thes trings
        var fretWidth = (this.config.get("strings") - 1) * 25 + 2;
        
        //draw each fret
        for(var i = 0; i <= this.config.get("frets"); i++) {
            //draw the nut if the first fret is the nut
            if(i == 0 && firstFret == 1) {
                this.fretGroup.rect(fretWidth, 6).attr({x: 0, y: i * 30});
            } else {
                this.fretGroup.rect(fretWidth, 2).attr({x: 0, y: i * 30});
            }
        }
        
        //draw strings
        var stringHeight = this.config.get("frets") * 30;
                
        for(var i = 0; i < this.config.get("strings"); i++) {
            this.fretGroup.rect(2, stringHeight).attr({x: i * 25, y: 0});
        }   
    }
    
    /**
     * Draws all of the fret markers along the grid.
     */
    _drawFretMarkers() {
        var fingering = this.config.get("fingering");
        
        //add unplayed notes to the fingering
        var unplayed = this._getUnplayedStrings();

        for(let string of unplayed) {
            fingering.push({
                string: string,
                fret: -1,
                finger: 0
            });
        }
        
        //draw all pogs
        for(var d of fingering) {
            this.addFretMarker(d.string, d.fret, d.finger);
        }
    }
    
    /**
     * Returns the X position of a string along the fret grid.
     * 
     * @param {int} string The nth string on the fretboard
     * 
     * @return {float} The x position of the string. 
     */
    _getStringPos(string) {
        //invert string to count opposite direction
        var inverseString = this.config.get("strings") - string;
        
        return inverseString * 25;
    }
    
    /**
     * Returns the Y position of a fret along the fret grid.
     * 
     * @param {int} fret The nth fret on the fretboard
     * 
     * @return {float} The y position of the fret. 
     */
    _getRelativeFretPos(fret) {
        return (fret - this._getFirstFret(this.config.get("fingering")) + 1) * 30 - 15;
    }

    _getAbsoluteFretPos(fret) {
        return fret * 30 - 15;
    }
    
    /**
     * Initiates the configuration by setting the defaults.
     * @param {object} config The configuration object.
     */
    _initiateConfig(config) {
        this.config = new Config(
            config,
            //default values
            {
                frets: 5,
                strings: 6,
                fingering: [],
                showFretLabels: false,
                showNotes: false
            }
        );
    }

    /**
     * Converts the fingering to an array of string:fret pairs, including
     * unplayed strings as -1.
     * 
     * @return Array of string:fret pairs
     */
    _getFretStructure() {
        var strings = this.config.get("strings");
        var fullFingering = Array(strings).fill(-1, 0, strings);

        for(var f of this.config.get("fingering")) {
            var fret = parseInt(f.fret);
            var string = f.string;
            
            if(typeof f.string == "object") {
                var min = Math.min(f.string[0], f.string[1]);
                var max = Math.max(f.string[0], f.string[1]);
                
                for(var string = min; string <= max; string++) {
                    if(fret > fullFingering[string-1]) {
                        fullFingering[string-1] = fret;
                    }
                }
            } else {
                if(fret > fullFingering[string-1]) {
                    fullFingering[string-1] = fret;
                }
            }
        }
        
        return fullFingering;
    }
    
    /**
     * Calculates the note being played from tuning and fret position on the
     * string, and adds the note at the bottom of string.
     */
    _drawNotes() {
        this._noteGroup = this.svg.group().id("notes").transform({
            x: 35,
            y: this._getAbsoluteFretPos(this.config.get("frets") + 1) //place below last frets
        });;
        
        var tuning = this.config.get("tuning");
        var fingering = this._getFretStructure();
        
        for(let i = 0; i < fingering.length; i++) {
            var string = this.config.get("strings") - i; //strings are in reverse order of array
            var fret = parseInt(fingering[i]);
 
            //ignore unplayed frets
            if(fret === -1) continue;
            
            //calculate note
            var note = Note.Parse(tuning[string-1]);
            var intervalNote = note.getTransposition(fret);
            
            var offset = intervalNote.toString().length === 2 ? 7 : 4; //center text 

            this._noteGroup.text(intervalNote.toString()).attr({
                "fill": "black",
                "style": "font-weight: bold; font-size: 14px",
                x: this._getStringPos(i + 1) - offset
            });
        }
    }
    
    /**
     * Calculates which strings are unplayed from the fret structure.
     * @returns {Array} An array of unplayed strings.
     */
    _getUnplayedStrings() {
        var frets = this._getFretStructure();
        var unplayed = [];
        
        for(let string in frets) {
            let fret = frets[string];
            
            if(fret === -1) {
                unplayed.push(parseInt(string)+1);
            }
        }
        
        return unplayed;
    }
    
    /**
     * Calculates the beginning fret. The nut is always the beginning fret if
     * all fret positions can fret within the number of frets shown. Otherwise
     * the first fret is the lowest fingered fret.
     * 
     * @returns {Number} The number of the beginning fret.
     */
    _getFirstFret(fingering) {
        var min = Infinity, max = -Infinity;

        for(var f of fingering) {
            var fret = parseInt(f.fret);

            //ignore open and closed
            if(fret === -1 || fret === 0) continue;
            
            if(fret < min) {
                min = fret;
            }
            
            if(fret > max) {
                max = fret;
            }
        }
        
        if(max <= 5)
            return 1;
        else
            return min;
    }

    /**
     * Draws the fret number to the left of all frets. The nut is never labeled
     * but indicated by a bold fret bar.
     */
    _drawFretLabels() {
        //first fret is always the lowest fret in fingering
        var startFret = this._getFirstFret(this.config.get("fingering"));
        var group = this.svg.group().id("fret_labels").transform({y: 20});
        
        //draw all fret labels
        if(this.config.get("showFretLabels")) {
            for(var i = 0; i < this.config.get("frets"); i++) {
                group.text((startFret + i).toString()).attr({
                    "fill": "black",
                    "style": "font-weight: bold; font-size: 18px",
                    y: i * 30 + 8,
                    "alignment-baseline": "middle"
                });
            }
        //always draw starting fret if it's not 1
        } else if(startFret !== 1) {
            if(this.config.get("startingFret") == 1) {
                group.text("1").attr({
                    "fill": "black",
                    "style": "font-weight: bold; font-size: 18px",
                    y: 8,
                    "alignment-baseline": "middle"
                });
            } 
        }
    }
    
    /**
     * Adds a fret marker on the mth string and nth fret with the label. If
     * the string is an array pair, then then a barre marker is created from
     * the string[0] to string[1] positions.
     * @param {Int|Number} string The string position. Array pair indicates a barre marker.
     * @param {Int} fret The fret position.
     * @param {String} label The label to place on the fret marker.
     */
    addFretMarker(string, fret, label) {
        var pogG = this.fretGroup.group().id(label);
        var label = label.toString();
        
        if(typeof string === "object") { //barred marker is two markers with a bar between
            var min = Math.min(string[0], string[1]);
            var max = Math.max(string[0], string[1]);
            
            //draw bar between pogs
            pogG.rect(this._getStringPos(min) - this._getStringPos(max), 10).attr({
                x: this._getStringPos(max),
                y: this._getRelativeFretPos(fret) - 4
            });
            
            //draw the two markers on either end
            this.addFretMarker(min, fret, label);
            this.addFretMarker(max, fret, label);
        } else if(fret === Fretboard.CLOSED_STRING) { //closed string is an X
            pogG.polygon("14,2 12,0 7,5 2,0 0,2 5,7 0,12 2,14 7,9 12,14 14,12 9,7").transform({
                x: this._getStringPos(string) - 6,
                y: this._getAbsoluteFretPos(0) + 1
            });
        } else if(fret === Fretboard.OPEN_STRING) { //open string is a circle
            pogG.circle(13).attr({
                'stroke-width': 2,
                'stroke': 'black',
                'fill': 'white'
            }).transform({
                x: this._getStringPos(string) - 6,
                y: this._getAbsoluteFretPos(0) + 2
            });
        } else {
            //regular labeled marker
            pogG.transform({
                x: this._getStringPos(string) - 10,
                y: this._getRelativeFretPos(fret) - 10
            });

            pogG.circle(22).attr({
                "fill": "black",
                "stroke-width": 0
            });
            
            //the label
            pogG.text(label).attr({
                "text-anchor": "middle",
                "alignment-baseline": "middle",
                "fill": "white",
                "style": "font-weight: bold; font-size: 18px",
                "x": 11,
                "y": -3
            });
        }
    }
}

Fretboard.OPEN_STRING = 0;
Fretboard.CLOSED_STRING = -1;

module.exports = Fretboard;