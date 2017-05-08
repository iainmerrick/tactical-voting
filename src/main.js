"use strict";

import $ from "jquery";

import * as view from "./view";

// Ugh, looks like Bootstrap doesn't work with ES6 properly
window.jQuery = $;
require("bootstrap");

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    let div = $("#2010ge");
    new view.View(div, json);
});

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    let div = $("#2015ge");
    new view.View(div, json);
});
