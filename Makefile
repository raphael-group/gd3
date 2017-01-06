SMASH=node_modules/smash/smash
UGLIFY=node_modules/uglify-js/bin/uglifyjs
GD3=src/gd3.js

gd3.js: $(shell $(SMASH) --list $(GD3))
				$(SMASH) $(GD3) | $(UGLIFY) - -b indent-level=2 -o $@

global: $(shell $(SMASH) --list $(GD3))
				$(SMASH) $(GD3) | $(UGLIFY) - -b indent-level=2 -o $@

test:	$(shell $(SMASH) --list $(GD3))
				$(SMASH) $(GD3) > gd3.test.js