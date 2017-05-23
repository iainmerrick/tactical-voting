"use strict";

import $ from "jquery";

import * as view from "./view";

// Ugh, looks like Bootstrap doesn't work with ES6 properly
window.jQuery = $;
require("bootstrap");

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    new view.View($("#2010ge"), json, {});
});

let POLL = {
    Con: 46.9,
    Lab: 31.8,
    LD: 8.0,
    UKIP: 4.8,
    Green: 2.5
};

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    new view.View($("#2015ge"), json, {});
    new view.View($("#2017ge"), json, {
        poll: POLL,
        double_checkbox: true
    });
});
