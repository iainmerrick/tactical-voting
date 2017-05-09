"use strict";

import _ from "underscore";
import $ from "jquery";
import "chart.js";
import "chartjs-plugin-annotation";

import * as model from "./model";
import * as utils from "./utils";

// https://en.wikipedia.org/wiki/Wikipedia:Index_of_United_Kingdom_political_parties_meta_attributes
const PARTY_COLORS = {
    Con: "#0087DC",
    Lab: "#DC241f",
    LD: "#FAA61A",
    DUP: "#D46A4C",
    SNP: "#FFFF00",
    PC: "#008142",
    SDLP: "#99FF66",
    Green: "#6AB023",
    Alliance: "#F6CB2F",
    UUP: "#9999FF",
    UKIP: "#70147A",
    SF: "#008800",
    Speaker: "#444444",
};

const GREY = "#CCCCCC";
function party_color(party) {
    party = model.party_name(party);
    return PARTY_COLORS[party] || GREY;
}

// These are the party names we'll actually show on our charts, in order.
const NAMES = [
    "Con",
    "Lab",
    "LD",
    "UKIP",
    "Green",
    "SNP",
    "PC",
    "Other",
];

const ZEROES = _.map(NAMES, function(name) { return 0; });
const COLORS = _.map(NAMES, function(name) { return party_color(name); });

export class View {

    constructor(div, json, poll_data) {
        this.div = div;
        this.json = json;
        this.poll_data = poll_data;
        this.checkbox_map = {};
        this.vote_charts = [];
        this.seat_charts = [];
        this.votes = ZEROES;
        this.seats = ZEROES;

        let view = this;

        this.reset_poll();

        div.find("table.poll").each(function(ix, table) {
            for (let name of NAMES) {
                let color = party_color(name);
                let tr = $(`<tr class="party" id="${name}">
                    <td>${name}</td>
                    <td><form class="form-inline"><div class="form-group"><div class="input-group"><div class="input-group-addon decrement">-</div><input type="text" class="form-control percent" style="text-align: right;"><div class="increment input-group-addon">+</div></div></div></form></td>
                    <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div></td>
                </tr>`);
                if (name === "Other") {
                    // No controls for 'other'
                    tr.find(".input-group-addon").css("visibility", "hidden");
                    tr.find(".input-group-addon").attr("disabled", true);
                }
                tr.find(".increment").click(function(event) {
                    console.log("inc!");
                });
                tr.find(".decrement").click(function(event) {
                    console.log("dec!");
                });
                tr.css("user-select", "none");
                tr.appendTo(table);
            }
        });

        div.find("table.results").each(function(ix, table) {
            for (let name of NAMES) {
                let color = party_color(name);
                let tr = $(`<tr class='party' id='${name}'>
                    <td>${name}
                    <td class='vote' style='text-align: right'>
                    <td><div class='hbar' style='background-color: ${color}; width: 0%; height: 1.5em;'></div>
                    <td><label><input type='checkbox' name='${name}'></label>&nbsp;&nbsp;<span class='impact'>
                </tr>`);
                if (name === "Other") {
                    // No tactical voting checkbox for 'Other'
                    tr.find("label").css("visibility", "hidden");
                } else {
                    tr.click(function(event) {
                        if (event.target.tagName.toLowerCase() === "input") {
                            // Click was on a checkbox, it will already be handled correctly
                        } else {
                            // Click on another part of the row -- simulate click on checkbox
                            tr.find("input").trigger("click");
                        }
                    });
                }
                tr.css("user-select", "none");
                tr.appendTo(table);
            }
        });

        div.find("input:checkbox").each(function(ix, checkbox) {
            view.checkbox_map[checkbox.name] = checkbox;
        });
        div.find("input:checkbox").change(function(element) {
            view.update();
        });

        div.find("canvas.seats").each(function(ix, canvas) {
            let chart = new Chart(canvas, {
                type: "bar",
                options: {
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            id: "party-axis",
                            categoryPercentage: 1.0,
                            barPercentage: 0.9,
                            gridLines: {
                                display: false,
                                color: "white",
                                lineWidth: 0,
                            },
                            ticks: {
                                callback(label, index, labels) {
                                    let value = view.seats[index];
                                    return [label, value + ""];
                                },
                            },
                        }],
                        yAxes: [{
                            id: "seats-axis",
                            display: false,
                            ticks: {
                                beginAtZero: true,
                                max: 400,
                            },
                        }]
                    },
                    annotation: {
                        annotations: [{
                            type: "line",
                            mode: "horizontal",
                            scaleID: "seats-axis",
                            borderColor: GREY,
                            borderWidth: 3,
                            borderDash: [3, 3],
                            value: 330,
                            label: {
                                content: "330 seats needed for majority",
                                enabled: true,
                                position: "right",
                                fontColor: Chart.defaults.global.defaultFontColor,
                                fontStyle: "normal",
                                backgroundColor: "white",
                            },
                        }],
                    },
                    tooltips: {
                        enabled: false,
                    },
                    hover: {
                        mode: null,
                    },
                },
                data: {
                    labels: NAMES,
                    datasets: [{
                        label: "Seats",
                        data: ZEROES.slice(),
                        backgroundColor: COLORS,
                    }],
                },
            });
            view.seat_charts.push(chart);
        });

        this.update();
    }

    reset_poll() {
        if (!this.poll_data) {
            return;
        }

        // Fill in gaps in the poll
        this.poll_map = {}
        let vote_data = model.normalize_votes(model.get_votes(this.json));
        let total = 0;
        console.log(vote_data);
        for (let name of NAMES) {
            if (!(name === "Other")) {
                // Assume vote share is unchanged if it's not listed in the poll
                let p = this.poll_data[name] || (vote_data[name] * 100);
                p = Math.round(p * 10); // Use fixed point, 0.1% granularity
                this.poll_map[name] = p;
                total += p;
            }
        }
        this.poll_map.Other = 1000 - total;
    }
    
    update() {
        let view = this;

        let bloc = [];
        for (let party in this.checkbox_map) {
            let checkbox = this.checkbox_map[party];
            if (checkbox.checked) {
                bloc.push(party);
            }
        }

        let old_vote_map = model.normalize_votes(model.get_votes(this.json));
        let old_seat_map = model.get_seats(this.json);
        
        let data = model.adjust_data_with_tactics(this.json, bloc);
        
        let vote_map = model.normalize_votes(model.get_votes(data));
        let seat_map = model.get_seats(data);
        let used_seat_map = model.remove_unused_seats(seat_map);

        this.votes = model.count_by_party(vote_map, NAMES);
        this.seats = model.count_by_party(seat_map, NAMES);
        this.used_seats = model.count_by_party(used_seat_map, NAMES);

        for (let chart of this.vote_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                chart.data.datasets[0].data[i] = this.votes[i];
            }
            chart.update();
        }
        for (let chart of this.seat_charts) {
            for (let i = 0; i < NAMES.length; ++i) {
                let n = this.used_seats[i];
                if (n > 0) {
                    // HACK: add 2 seats, to ensure that at least one pixel is drawn
                    // The difference between 0 seats and 1 seat is pretty significant!
                    // (This doesn't affect the actual results, just the visualization)
                    n += 2;
                }
                chart.data.datasets[0].data[i] = n;
            }
            if (chart.options.annotation) {
                let needed = Math.ceil(utils.sum(this.used_seats) / 2 + 0.01);
                for (let annotation of chart.options.annotation.annotations) {
                    annotation.value = needed + 2; // See HACK above
                    annotation.label.content = needed + " seats needed for majority";
                }
            }
            chart.update();
        }
        $(this.div).find("table.poll tr.party").each(function(ix, tr) {
            let party = tr.id;
            let poll = view.poll_map[party];
            $(tr).find(".percent").val((poll * 0.1).toFixed(1));
            $(tr).find(".hbar").animate({width: (poll * 0.2) + "%"}, 400);
        });
        $(this.div).find("table.results tr.party").each(function(ix, tr) {
            let party = tr.id;
            let new_vote = vote_map[party];
            let new_text = (100 * new_vote).toFixed(1) + "";
            $(tr).find(".vote").each(function(ix, td) {
                let old_text = $(td).text();
                if (!(old_text === new_text)) {
                    $(td).fadeOut(200, function() {
                        $(td).text(new_text).fadeIn(200);
                    });
                }
            });

            $(tr).find(".hbar").animate({width: (new_vote * 200) + "%"}, 400);

            let old_seats = old_seat_map[party];
            let new_seats = seat_map[party];
            let delta = new_seats - old_seats;
            let delta_text;
            delta_text = (delta > 0 ? "+" : "") + delta + " seat";
            if (Math.abs(delta) > 1) delta_text += "s";
            if (delta == 0) delta_text = "";
            $(tr).find(".impact").each(function(ix, td) {
                let old_text = $(td).text();
                if (!(old_text === delta_text)) {
                    $(td).fadeOut(200, function() {
                        $(td).removeClass("text-success");
                        $(td).removeClass("text-danger");
                        if (delta > 0) $(td).addClass("text-success");
                        if (delta < 0) $(td).addClass("text-danger");
                        $(td).text(delta_text).fadeIn(200);
                    });
                }
            });
        });
    }
}
