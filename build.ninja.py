#!/usr/bin/env python

"""Prints build.ninja to stdout"""

import glob
import os
import sys

os.chdir(os.path.dirname(sys.argv[0]))

SRCS = glob.glob("src/*.js")

print """
NODE_BIN = node_modules/.bin

BROWSERIFY = ${NODE_BIN}/browserify
UGLIFYJS = ${NODE_BIN}/uglifyjs
BABEL = ${NODE_BIN}/babel
CSV_TO_JSON = data/election_csv_to_json.js

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
    command = cd `dirname $in` && ../$UGLIFYJS `basename $in` -o ../$out --in-source-map inline --source-map ../$out.map --source-map-includeSources

rule csv_to_json
    command = $CSV_TO_JSON $in > $out

rule copy
    command = cp $in $out

build build.ninja : generate build.ninja.py

build $NODE: install package.json
"""

for src in SRCS:
    print "build out/%(src)s : babel %(src)s | $NODE" % locals()

OUT_SRCS = " ".join(["out/" + src for src in SRCS])
    
print """
build out/main.js : babel main.js | $NODE
build out/bundle.js : bundle out/main.js | %(OUT_SRCS)s $NODE

build docs/main.js | docs/main.js.map: ugly out/bundle.js | $NODE
build docs/election_2010.json : csv_to_json data/election_2010.csv | $NODE %(OUT_SRCS)s
build docs/election_2015.json : csv_to_json data/election_2015.csv | $NODE %(OUT_SRCS)s
build docs/index.html : copy index.html
""" % locals()