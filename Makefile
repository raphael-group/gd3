gd3.js: $(shell node_modules/.bin/smash --list src/gd3.js)
				node_modules/.bin/smash src/gd3.js | node_modules/.bin/uglifyjs - -b indent-level=2 -o $@

test:
				node_modules/.bin/smash src/gd3.js > gd3.test.js