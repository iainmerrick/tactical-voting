#!/usr/bin/env node

"use strict";

require("babel-register");

const assert = require("assert");

const election = require("../src/election");

// Raw election data is a CSV-like array of arrays.
// The first row contains column headers (e.g. party names).
// The remaining rows contain voting data, one row per constituency.
// The first column is assumed to be the constituency name.
const DATA = [
    ["Name",                "Conservative", "Labour",   "Liberal Democrat", "SNP"   ],
    ["Scotland",            3000,           5000,       2000,               8000    ],
    ["North",               20000,          25000,      15000,              0       ],
    ["Midlands",            20000,          25000,      15000,              0       ],
    ["South",               25000,          20000,      15000,              0       ],
    ["London",              25000,          20000,      15000,              0       ],
    ["Wales",               2000,           4000,       3000,               0       ],
    ["Northern Ireland",    500,            300,        100,                0       ]
];

const SEATS = {
    "Conservative": 3,
    "Labour": 3,
    "Liberal Democrat": 0,
    "SNP": 1
};

const VOTES = {
    "Conservative": 95500,
    "Labour": 99300,
    "Liberal Democrat": 65100,
    "SNP": 8000
};

assert.deepStrictEqual(election.get_seats(DATA), SEATS);
assert.deepStrictEqual(election.get_votes(DATA), VOTES);


// Tied seats should be split evenly
const TIE = [
    ["Name",    "Con",  "Lab"   ],
    ["Conwin",  20,     10      ],
    ["Tied",    15,     15      ]
];

const TIE_SEATS = { Con: 1.5, Lab: 0.5 };

assert.deepStrictEqual(election.get_seats(TIE), TIE_SEATS);


console.log("Success!");
