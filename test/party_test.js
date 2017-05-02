#!/usr/bin/env node

"use strict";

require("babel-register");

const assert = require("assert");

const party = require("../src/party");

assert.strictEqual(party.short_name("Con"), "Con");
assert.strictEqual(party.short_name("Lab"), "Lab");

// Case insensitive
assert.strictEqual(party.short_name("con"), "Con");

// Aliases
assert.strictEqual(party.short_name("Lab Co-op"), "Lab");

// Unknown parties become "Other"
assert.strictEqual(party.short_name("foo"), "Other");

// Long names
assert.strictEqual(party.long_name("Con"), "Conservative");
assert.strictEqual(party.long_name("LD"), "Liberal Democrat");

// Case insensitive
assert.strictEqual(party.long_name("snp"), "Scottish National Party");

// Unicode
assert.strictEqual(party.long_name("Sinn Fein"), "Sinn Féin");

// Sinn Féin and the Speaker are abstentionist.
assert.strictEqual(party.takes_seat("sf"), false);
assert.strictEqual(party.takes_seat("speaker"), false);
assert.strictEqual(party.takes_seat("con"), true);
assert.strictEqual(party.takes_seat("lab"), true);
assert.strictEqual(party.takes_seat("other"), true);


// Colors
assert.strictEqual(party.color("con"), party.color("Conservative"));
assert.strictEqual(party.color("foo"), party.color("bar"));
assert.notStrictEqual(party.color("Con"), party.color("Lab"));


console.log("Success!");
