# Tactical Voting in UK Elections

This is just a description of the source code. Check out the [GitHub Pages site](https://iainmerrick.github.io/tactical-voting/) if you want to actually play with the visualization.

## How to build it

You'll need [Ninja](https://ninja-build.org) and [Node](https://nodejs.org) to build the site. On a Mac, install via [Homebrew](https://brew.sh):

```
brew install ninja
brew install node
```

Then to build, just:

```
ninja
```

It should figure out that it needs various Node modules and install those locally.

Output goes into the `docs` directory (which is where GitHub Pages picks it up):

```
open docs/index.html
```

If you change the code you'll need to rebuild and refresh the website.

The output needs to be checked in. Once it's pushed, GitHub Pages will pick it up.

## How it works

First, note this is a completely static website. I wanted to be able to serve it from GitHub and I wanted people to be able to fork it easily. Some things could be done more smoothly if there were a server-side component, but there isn't.

Raw election data lives in the `data` directory. These files come directly, unedited, from the UK's [Electoral Commission](http://www.electoralcommission.org.uk/our-work/our-research/electoral-data). The `data/election_csv_to_json.js` script tidies up this raw data (for example, collapsing all the minor parties into a single "Other" column) and converts it into a simple JSON format.

The code and markup for the site are in the `src` directory. The code is roughly split along model/view/controller lines (although not yet in a very clean or formal way). We use [Babel](http://babeljs.io) to translate it from ES6 to normal JS, [Browserify](https://browserify.org) to pack the modules and libraries into a single file, and [UglifyJS](http://lisperator.net/uglifyjs/) to compress it. It would most likely be a win to switch to a standard JS build system, but Ninja works OK for now.

The main bar charts use [Chart.js](http://www.chartjs.org), as that looked like the quickest and easiest option when I was getting started. The horizontal charts are just `div` tags inside a table. Chart.js has decent defaults but is a little inflexible, so now I know what's needed, I think [D3](https://d3js.org) would be a better starting point even though it has a very steep learning curve.

## Possible improvements

The design is a bit eccentric—I'm more of a C++ programmer, and just wanted to get something up quickly rather than taking the time to learn all the latest JS best practices. Constructive criticism welcome!

Now that I've got a working version out the door, I'm tempted to rewrite this more slowly and carefully. My current thoughts on how to do that:

- Move to a more formal Model/View/Controller (Presenter?) design
- Probably use React (although I hear good things about Elm too)
- Probably use D3 for the charts
- Maybe drop Bootstrap, I don't feel it's adding much value here

I'm particularly interested in recommendations on:

- A good simple mobile-friendly UI widget to adjust the polling numbers
- A build system that provides both fast debugging and a compact static site

## TODO

- Add a FAQ
  - Assuming there are any...
- Update the URL and query parameters as you play with the charts
  - So sharing the URL loads the same chart
  - Would be nice to somehow update the Open Graph metadata to match your chart!
  - I don't see how that's possible in a purely static website though
- Maybe allow multiple tactical groupings
  - e.g. Con+UKIP versus Lab+LD
  - Don't want the UI to get too complicated though
  - Two columns of checkboxes instead of one?
- Maybe add smaller parties
  - e.g. show all the Northern Ireland parties
  - They don't have a big impact nationally though
