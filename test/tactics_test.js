#!/usr/bin/env node

"use strict";

require("babel-register");

const assert = require("assert");

const election = require("../src/election");
const tactics = require("../src/tactics");

// See election_test.js for explanation of this data format.
const DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     20,     10      ], // 50
    ["England",             70,     40,     10      ], // 120
    ["Wales",               15,     5,      10      ]  // 30
];

const VOTES = { Con: 105, Lab: 65, Lib: 30 };
const SEATS = { Con: 2.5, Lab: 0.5, Lib: 0 };

// Not a full test of the election module, just checking that VOTES and SEATS are correct!
assert.deepStrictEqual(election.get_votes(DATA), VOTES);
assert.deepStrictEqual(election.get_seats(DATA), SEATS);


const BLOC = ["Lib", "Lab"];

const BLOC_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     30,     0       ], // 50
    ["England",             70,     50,     0       ], // 120
    ["Wales",               15,     0,      15      ]  // 30
];

const BLOC_SEATS = { Con: 1.5, Lab: 1, Lib: 0.5 };

assert.deepStrictEqual(tactics.adjust_data_with_tactics(DATA, BLOC), BLOC_DATA);
assert.deepStrictEqual(election.get_seats(BLOC_DATA), BLOC_SEATS);


console.log("Success!");
