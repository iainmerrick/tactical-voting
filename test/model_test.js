#!/usr/bin/env node

"use strict";

require("babel-register");

let assert = require("assert");

let model = require("../src/model");

// ---------------------------------------------------------------------------------------
// Parties

assert.strictEqual(model.party_name("Con"), "Con");
assert.strictEqual(model.party_name("Lab"), "Lab");

// Case insensitive
assert.strictEqual(model.party_name("con"), "Con");

// Aliases
assert.strictEqual(model.party_name("Lab Co-op"), "Lab");

// Unknown parties become "Other"
assert.strictEqual(model.party_name("foo"), "Other");

// Long names
assert.strictEqual(model.party_long_name("Con"), "Conservative");
assert.strictEqual(model.party_long_name("LD"), "Liberal Democrat");

// Case insensitive
assert.strictEqual(model.party_long_name("snp"), "Scottish National Party");

// Unicode
assert.strictEqual(model.party_long_name("Sinn Fein"), "Sinn Féin");

// Sinn Féin and the Speaker are abstentionist.
assert.strictEqual(model.party_takes_seat("sf"), false);
assert.strictEqual(model.party_takes_seat("speaker"), false);
assert.strictEqual(model.party_takes_seat("con"), true);
assert.strictEqual(model.party_takes_seat("lab"), true);
assert.strictEqual(model.party_takes_seat("other"), true);

// Colors
assert.strictEqual(model.party_color("con"), model.party_color("Conservative"));
assert.strictEqual(model.party_color("foo"), model.party_color("bar"));
assert.notStrictEqual(model.party_color("Con"), model.party_color("Lab"));

// ---------------------------------------------------------------------------------------
// Elections

// Raw election data is a CSV-like array of arrays.
// The first row contains column headers (e.g. party names).
// The remaining rows contain voting data, one row per constituency.
// The first column is assumed to be the constituency name.
let DATA = [
    ["Name",                "Conservative", "Labour",   "Liberal Democrat", "SNP"   ],
    ["Scotland",            3000,           5000,       2000,               8000    ],
    ["North",               20000,          25000,      15000,              0       ],
    ["Midlands",            20000,          25000,      15000,              0       ],
    ["South",               25000,          20000,      15000,              0       ],
    ["London",              25000,          20000,      15000,              0       ],
    ["Wales",               2000,           4000,       3000,               0       ],
    ["Northern Ireland",    500,            300,        100,                0       ]
];

let SEATS = {
    "Conservative": 3,
    "Labour": 3,
    "Liberal Democrat": 0,
    "SNP": 1
};

let VOTES = {
    "Conservative": 95500,
    "Labour": 99300,
    "Liberal Democrat": 65100,
    "SNP": 8000
};

assert.deepStrictEqual(model.get_seats(DATA), SEATS);
assert.deepStrictEqual(model.get_votes(DATA), VOTES);

// Tied seats should be split evenly
let TIE = [
    ["Name",    "Con",  "Lab"   ],
    ["Conwin",  20,     10      ],
    ["Tied",    15,     15      ]
];

let TIE_SEATS = { Con: 1.5, Lab: 0.5 };

assert.deepStrictEqual(model.get_seats(TIE), TIE_SEATS);

// ---------------------------------------------------------------------------------------
// Tactical voting

DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     20,     10      ], // 50
    ["England",             70,     40,     10      ], // 120
    ["Wales",               15,     5,      10      ]  // 30
];

VOTES = { Con: 105, Lab: 65, Lib: 30 };
SEATS = { Con: 2.5, Lab: 0.5, Lib: 0 };

// This is just to check that VOTES and SEATS are correct!
assert.deepStrictEqual(model.get_votes(DATA), VOTES);
assert.deepStrictEqual(model.get_seats(DATA), SEATS);

// Tactical voting example. By voting together, Lib and Lab can pick up 0.5 seats each.
let BLOC = ["Lib", "Lab"];

let BLOC_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     30,     0       ], // 50
    ["England",             70,     50,     0       ], // 120
    ["Wales",               15,     0,      15      ]  // 30
];

let BLOC_SEATS = { Con: 1.5, Lab: 1, Lib: 0.5 };

assert.deepStrictEqual(model.adjust_data_with_tactics(DATA, BLOC), BLOC_DATA);
assert.deepStrictEqual(model.get_seats(BLOC_DATA), BLOC_SEATS);

// ---------------------------------------------------------------------------------------
// Swingometer

// See election_test.js for explanation of this data format.
DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            20,     20,     10      ], // 50
    ["England",             70,     40,     10      ], // 120
    ["Wales",               10,     15,     5       ]  // 30
];

VOTES = { Con: 100, Lab: 75, Lib: 25 };

// Not a full test of the election module, just checking that VOTES is correct!
assert.deepStrictEqual(model.get_votes(DATA), VOTES);


// Note that the poll totals to 100 (percent) whereas the votes total to 200.
// That's fine, what matters is the relative positions of the parties.
let POLL = { Con: 25, Lab: 50, Lib: 25 };

// The above poll normalized to fractions.
let NORMALIZED_POLL = { Con: 0.25, Lab: 0.5, Lib: 0.25 };

assert.deepStrictEqual(model.normalize_votes(POLL), NORMALIZED_POLL);


// Swing is the fractional difference of each party's vote share.
// Here I have the Conservatives 25 points down, Labour and Lib Dems 12.5% up
let SWING = { Con: -0.25, Lab: 0.125, Lib: 0.125 };

assert.deepStrictEqual(model.get_swing(VOTES, POLL), SWING);


// Applying uniform national swing to the original data.
// Scotland has 50 votes, so 25% down means losing 12.5 votes, and so on
let FORECAST_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            7.5,    26.25,  16.25   ],
    ["England",             40,     55,     25      ],
    ["Wales",               2.5,    18.75,  8.75    ]
];

assert.deepStrictEqual(model.adjust_data_with_poll(DATA, POLL), FORECAST_DATA);

// ---------------------------------------------------------------------------------------

console.log("Success!");
