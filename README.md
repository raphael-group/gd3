#gd3

A library of genomics visualizations.

### Setup

1. **Requirements**: [npm](https://npmjs.org/) and [node](http://nodejs.org/).
2. **Clone**: `git clone https://<user>@bitbucket.org/raphaellab/gd3.git`.
3. **Install dependencies**: `npm install`.

### Javascript: (`js/`)

*Visualization scripts*

Oncoprinter(`js/oncoprinter.js`)

Subnetworks(`js/subnetwork.js`)

Lolliplots(`js/lolliplots.js`)

### Styles (`js/style/`)

*Pre-defined style files.* 

`js/default-style.js`: default styles

### Draw (`.`)
*Node.js scripts for saving visualizations to SVG.*

Oncoprinter(`drawOncoprint.js`)

    Usage: node drawOncoprint.js --json=</path/to/json> --outdir=</path/to/output>

Lolliplot(`drawLolliplot.js`)

    Usage: node drawLolliplot.js --json=</path/to/json> --outfile=</path/to/output/file>
