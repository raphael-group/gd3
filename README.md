#gd3

A library of genomics visualizations.

### Setup

1. **Requirements**: [npm](https://npmjs.org/) and [node](http://nodejs.org/).
2. **Clone**: `git clone https://<user>@bitbucket.org/raphaellab/gd3.git`.
3. **Install dependencies**: `npm install`.

To use the Python scripts, you must also:

1. **Clone HotNet2**: `git clone https://<user>@bitbucket.org/raphaellab/hotnet2.git`.
2. **Add "HOTNET" environment variable**: Add `setenvvar HOTNET <path/to/hotnet2/checkout>` to `~/.environment`

### Javascript: (`js/`)

*Visualization scripts*

Oncoprinter(`js/oncoprinter.js`)

Subnetworks(`js/subnetwork.js`)

Lolliplots(`js/lolliplots.js`)

### Styles (`js/style/`)

*Pre-defined style files.* 

`js/default-style.js`: default styles

`js/pancancer-sample-coloring.json`: cancer type -> color mapping for PanCancer

### Draw (`.`)

*Python scripts for saving visualizations to SVG.*

Python Oncoprinter (`drawOncoprints.py`)

    Usage: see python drawOncoprints.py -h

*Node.js scripts for saving visualizations to SVG.*

Oncoprinter(`drawOncoprint.js`)

    Usage: node drawOncoprint.js --json=</path/to/json> --outdir=</path/to/output>

Lolliplot(`drawLolliplot.js`)

    Usage: node drawLolliplot.js --json=</path/to/json> --outfile=</path/to/output/file>
