"use strict";

import * as view from "./view";

import $ from "jquery";

$.getJSON("election_2010.json", function(json) {
    console.log("Loaded 2010 data - " + json.length + " rows");
    let div = $("#election2010");
    new view.View(div, json);
});

$.getJSON("election_2015.json", function(json) {
    console.log("Loaded 2015 data - " + json.length + " rows");
    let div = $("#election2015");
    new view.View(div, json);
});
