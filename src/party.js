"use strict";

// Dictionary of raw party data:
// - Key is the canonical short name.
// - Value is an array of aliases.
// - The first alias is the canonical long name.
const PARTY_DATA = {
    Con: ["Conservative"],
    Lab: ["Labour", "Lab Co-op"],
    LD: ["Liberal Democrat"],
    DUP: ["Democratic Unionist Party"],
    SNP: ["Scottish National Party"],
    PC: ["Plaid Cymru"],
    SDLP: ["Social Democratic and Labour Party"],
    Green: ["Green Party", "GRN"],
    Alliance: ["Alliance Party of Northern Ireland", "APNI"],
    UUP: ["Ulster Unionist Party"],
    UKIP: ["UK Independence Party"],
    SF: ["Sinn Féin", "Sinn Fein"], // Abstentionist, doesn't sit in the Commons
    Speaker: ["Speaker"] // Speaker of the House, traditionally non-partisan
};

const SHORT_NAME_MAP = {}; // Map of anything -> short name
const LONG_NAME_MAP = {}; // Map of anything -> long name

for (let short_name in PARTY_DATA) {
    const aliases = PARTY_DATA[short_name];
    const long_name = aliases[0];
    SHORT_NAME_MAP[short_name.toLowerCase()] = short_name;
    LONG_NAME_MAP[short_name.toLowerCase()] = long_name;
    for (let alias of aliases) {
        SHORT_NAME_MAP[alias.toLowerCase()] = short_name;
        LONG_NAME_MAP[alias.toLowerCase()] = long_name;
    }
}

/**
 * Get the canonical short version of any party name or synonym
 */ 
export function short_name(party) {
    return SHORT_NAME_MAP[party.toLowerCase()] || "Other";
}

/**
 * Get the canonical long version of any party name or synonym
 */ 
export function long_name(party) {
    return LONG_NAME_MAP[party.toLowerCase()] || "Other";
}

/**
 * Returns true for parties that vote normally in the House of Commons.
 * Only returns false for some special cases (Sinn Féin and the Speaker).
 */
export function takes_seat(party) {
    party = short_name(party);
    return party !== "SF" && party !== "Speaker";
}
