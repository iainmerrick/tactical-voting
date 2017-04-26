#!/usr/bin/env node

"use strict";

const assert = require("assert");

const election = require("../src/election");

// Raw election data is a CSV-like array of arrays.
// The first row contains column headers (e.g. party names).
// The remaining rows contain voting data, one row per constituency.
// The first column is assumed to be the constituency name.
const DATA = [
    ["Name",                "Conservative", "Labour",   "Liberal Democrat", "SNP"],
    ["Scotland",            3000,           5000,       2000,               8000],
    ["England",             25000,          20000,      15000,              0],
    ["Wales",               2000,           4000,       3000,               0],
    ["Northern Ireland",    500,            300,        100,                0]
];

const SEATS = {
    "Conservative": 2,
    "Labour": 1,
    "Liberal Democrat": 0,
    "SNP": 1
};

const VOTES = {
    "Conservative": 30500,
    "Labour": 29300,
    "Liberal Democrat": 20100,
    "SNP": 8000
};

assert.deepStrictEqual(election.get_seats(DATA), SEATS);
assert.deepStrictEqual(election.get_votes(DATA), VOTES);

console.log("Success!");
