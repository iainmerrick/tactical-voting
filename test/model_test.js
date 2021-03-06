#!/usr/bin/env node

"use strict";

require("babel-register");

let _ = require("underscore");
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

let SEATS_WITH_ABSTENTIONISTS = {
    Con: 10,
    Lab: 5,
    LD: 3,
    SF: 1,
    Speaker: 1,
    Other: 1
}

let SEATS_WITHOUT_ABSTENTIONISTS = {
    Con: 10,
    Lab: 5,
    LD: 3,
    SF: 0,
    Speaker: 0,
    Other: 1
}

assert.deepStrictEqual(
    SEATS_WITHOUT_ABSTENTIONISTS,
    model.remove_unused_seats(SEATS_WITH_ABSTENTIONISTS));

assert.deepStrictEqual([10, 5],
    model.count_by_party(SEATS_WITH_ABSTENTIONISTS, ["Con", "Lab"]));

assert.deepStrictEqual([10, 5, 6],
    model.count_by_party(SEATS_WITH_ABSTENTIONISTS, ["Con", "Lab", "Other"]));

assert.deepStrictEqual([10, 5, 3, 3],
    model.count_by_party(SEATS_WITH_ABSTENTIONISTS, ["Con", "Lab", "LD", "Other"]));

assert.deepStrictEqual([10, 5],
    model.count_by_party(SEATS_WITHOUT_ABSTENTIONISTS, ["Con", "Lab"]));

assert.deepStrictEqual([10, 5, 4],
    model.count_by_party(SEATS_WITHOUT_ABSTENTIONISTS, ["Con", "Lab", "Other"]));

assert.deepStrictEqual([10, 5, 3, 1],
    model.count_by_party(SEATS_WITHOUT_ABSTENTIONISTS, ["Con", "Lab", "LD", "Other"]));

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

// Should be able to use multiple tactical groups (as long as they don't overlap).
DATA = [
    ["Name",    "A",    "B",    "C",    "D",    "E" ],
    ["Aton",    1,      2,      3,      4,      5   ],
    ["Beton",   2,      3,      4,      5,      1   ],
    ["Ceton",   3,      4,      5,      1,      2   ],
    ["Deton",   4,      5,      1,      2,      3   ],
    ["Eton",    5,      1,      2,      3,      4   ]
];

let PARTIES = ["A", "B", "C", "D", "E"];

for (let i = 0; i < 20; ++i) {
    let p = _.shuffle(PARTIES);
    let bloc1 = [p[0], p[1]];
    let bloc2 = [p[2], p[3]];
    
    let result1 = model.adjust_data_with_tactics(DATA, bloc1);
    let result2 = model.adjust_data_with_tactics(DATA, bloc2);
    
    let result12 = model.adjust_data_with_tactics(result1, bloc2);
    let result21 = model.adjust_data_with_tactics(result2, bloc1);
    
    assert.deepStrictEqual(result12, result21);
}

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

// Applying uniform national swing to the original data.
// Scotland has 50 votes, so 25% down means losing 12.5 votes, and so on
let FORECAST_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            7.5,    26.25,  16.25   ],
    ["England",             40,     55,     25      ],
    ["Wales",               2.5,    18.75,  8.75    ]
];

assert.deepStrictEqual(model.adjust_data_with_poll(DATA, POLL), FORECAST_DATA);

// Updated vote counts should be exactly in line with the poll
assert.deepStrictEqual(
    model.normalize_votes(model.get_votes(model.adjust_data_with_poll(DATA, POLL))),
    NORMALIZED_POLL);

// Some parties are omitted from polls

let PARTIAL_POLL = { Con: 25, Lab: 50, Other: 25 }

assert.deepStrictEqual(model.adjust_data_with_poll(DATA, PARTIAL_POLL), FORECAST_DATA);

// -40 swing for Con, +40 for everyone else (so +20 for each of Labour and Lib Dem)
PARTIAL_POLL = { Con: 10, Other: 90 }

FORECAST_DATA = [
    ["Name",                "Con",  "Lab",  "Lib"   ],
    ["Scotland",            0,      30,     20      ],
    ["England",             22,     64,     34      ],
    ["Wales",               -2,     21,     11      ]
];

assert.deepStrictEqual(model.adjust_data_with_poll(DATA, PARTIAL_POLL), FORECAST_DATA);

// ---------------------------------------------------------------------------------------

console.log("Success!");
