#!/usr/bin/env node

"use strict";

require("babel-register");

const babyparse = require("babyparse");

const party = require("../src/party");

// First things first. Parse the CSV!

const infile = process.argv[2];
const csv = babyparse.parseFiles(infile, { dynamicTyping: true });

for (let err of csv.errors) {
    throw new Error(err.message);
}

const num_columns = csv.data[0].length;
const constituency_column = 1;

// Bit of a hack to find the first column of per-party data...
// Assume that it's the first column to contain "" in some row.
let first_party_column = num_columns;
for (let row of csv.data) {
    if (!row[constituency_column]) {
        continue;
    }
    for (let i = 0; i < first_party_column; ++i) {
        if (row[i] === "") {
            first_party_column = i;
        }
    }
}

let parties = []; // Canonical party names as they'll appear in the output
let column_to_party = {}; // Map of input column -> output party name
for (let i = first_party_column; i < num_columns; ++i) {
    let name = party.short_name(csv.data[0][i]);
    if (parties.indexOf(name) < 0) {
        parties.push(name);
    }
    column_to_party[i] = name;
}
parties.sort();

// Convert data into our internal format

const header = ["Name"].concat(parties);
const data = [];
for (let i = 1; i < csv.data.length; ++i) {
    const row = csv.data[i];
    if (!row[constituency_column]) {
        continue;
    }
    const votes = {};
    for (let j = first_party_column; j < num_columns; ++j) {
        if (row[j] !== "") {
            const party = column_to_party[j];
            votes[party] = (votes[party] || 0) + row[j];
        }
    }
    const output = [];
    output.push(row[constituency_column]);
    for (let p of parties) {
        output.push(votes[p] || 0);
    }
    data.push(output);
}

// Finally, dump to stdout

process.stdout.write("[");
process.stdout.write(JSON.stringify(header));
for (let row of data) {
    process.stdout.write(",\n ");
    process.stdout.write(JSON.stringify(row));
}
process.stdout.write("\n]\n");
