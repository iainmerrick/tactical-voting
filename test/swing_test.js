#!/usr/bin/env node

"use strict";

require("babel-register");

const assert = require("assert");

const election = require("../src/election");
const swing = require("../src/swing");

// See election_test.js for explanation of this data format.
const DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     20,     10      ], // 50
    ["England",             70,     40,     10      ], // 120
    ["Wales",               10,     15,     5       ]  // 30
];

const VOTES = { Con: 100, Lab: 75, Lib: 25 };

// Not a full test of the election module, just checking that VOTES is correct!
assert.deepStrictEqual(election.get_votes(DATA), VOTES);


// Note that the poll totals to 100 (percent) whereas the votes total to 200.
// That's fine, what matters is the relative positions of the parties.
const POLL = { Con: 25, Lab: 50, Lib: 25 };

// The above poll normalized to fractions.
const NORMALIZED_POLL = { Con: 0.25, Lab: 0.5, Lib: 0.25 };

assert.deepStrictEqual(swing.normalize_votes(POLL), NORMALIZED_POLL);


// Swing is the fractional difference of each party's vote share.
// Here I have the Conservatives 25 points down, Labour and Lib Dems 12.5% up
const SWING = { Con: -0.25, Lab: 0.125, Lib: 0.125 };

assert.deepStrictEqual(swing.get_swing(VOTES, POLL), SWING);


// Applying uniform national swing to the original data.
// Scotland has 50 votes, so 25% down means losing 12.5 votes, and so on
const FORECAST_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            7.5,    26.25,  16.25   ],
    ["England",             40,     55,     25      ],
    ["Wales",               2.5,    18.75,  8.75    ]
];

assert.deepStrictEqual(swing.adjust_data_with_poll(DATA, POLL), FORECAST_DATA);

console.log("Success!");
