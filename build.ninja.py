#!/usr/bin/env python

"""Prints build.ninja to stdout"""

import glob
import os
import sys

os.chdir(os.path.dirname(sys.argv[0]))

SRCS = glob.glob("src/*.js")

print """
NODE_BIN = node_modules/.bin

BABEL = ${NODE_BIN}/babel
BROWSERIFY = ${NODE_BIN}/browserify
HTML_MINIFY = ${NODE_BIN}/html-minifier
UGLIFYJS = ${NODE_BIN}/uglifyjs
CSV_TO_JSON = data/election_csv_to_json.js

UGLIFYJS_FLAGS = --compress --mangle
HTML_MINIFY_FLAGS = --collapse-whitespace --remove-comments --remove-optional-tags

NODE = .package.json.stamp

rule generate
    command = ./$in > $out
    generator = true

rule install
    command = npm install && touch $out

rule babel
    command = $BABEL $in > $out

rule bundle
    command = $BROWSERIFY --debug $in > $out

# The 'cd' is a stupid hack to make uglify generate the correct source map path.
# I'm sure there's a command-line flag that'll do this but life is short (as are the docs)
rule ugly
    command = cd `dirname $in` && ../$UGLIFYJS `basename $in` -o ../$out --in-source-map inline --source-map ../$out.map --source-map-includeSources  $UGLIFYJS_FLAGS

rule csv_to_json
    command = $CSV_TO_JSON $in > $out

rule html_minify
    command = $HTML_MINIFY $HTML_MINIFY_FLAGS $in > $out

rule copy
    command = cp $in $out

build build.ninja : generate build.ninja.py

build $NODE: install package.json
"""

for src in SRCS:
    print "build out/%(src)s : babel %(src)s | $NODE" % locals()

OUT_SRCS = " ".join(["out/" + src for src in SRCS])
    
print """
build out/bundle.js : bundle out/src/main.js | %(OUT_SRCS)s $NODE

build docs/main.js | docs/main.js.map: ugly out/bundle.js | $NODE
build docs/election_2010.json : csv_to_json data/election_2010.csv | $NODE $CSV_TO_JSON out/src/model.js
build docs/election_2015.json : csv_to_json data/election_2015.csv | $NODE $CSV_TO_JSON out/src/model.js
build docs/index.html : html_minify src/index.html
build docs/bootstrap.min.css : copy node_modules/bootstrap/dist/css/bootstrap.min.css | $NODE
build docs/bootstrap.min.css.map : copy node_modules/bootstrap/dist/css/bootstrap.min.css.map | $NODE
""" % locals()
