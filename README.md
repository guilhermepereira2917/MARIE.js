# MARIE.js

[![Build Status](https://travis-ci.org/MARIE-js/MARIE.js.svg?branch=master)](https://travis-ci.org/MARIE-js/MARIE.js) [![Gitter chat](https://badges.gitter.im/MARIE-js/gitter.png)](https://gitter.im/MARIE-js/Lobby) [![npm version](https://badge.fury.io/js/npm.svg)](https://badge.fury.io/js/npm)
==============
Current version: `0.9.3`

MARIE.js is an implementation of a simulator for a 'Machine Architecture that is Really Intuitive and Easy'
from [The Essentials of Computer Organization and Architecture](https://books.google.com.au/books/about/The_Essentials_of_Computer_Organization.html?id=3kQoAwAAQBAJ&redir_esc=y) (Linda Null, Julia Lobur) in JavaScript.

**[Try the simulator](https://marie-js.github.io/MARIE.js/)**

## Setup
This is for web developers who would like to develop, build or deploy the
MARIE.js project. If this is you, then continue reading below.

MARIE.js is essentially a front-end only site with no servers or databases.
The tools we use are `npm` and `grunt`, which makes developing this project
a little easier.

It is recommended that you use a Unix-like operating system to build, test and
run the code. You'll need to install `npm`, then run the following commands to
install dependencies, build the release version, and run a localhost server as
well as opening the default browser directing to the localhost site.

    sudo npm install -g grunt-cli

    cd /path/to/repo/MARIE.js
    npm install
    grunt

## Development
To test and build the development version of MARIE.js, run the following
commands.

    cd /path/to/repo/MARIE.js
    npm install
    grunt test # you need JRE 8 for this command
    grunt bar-dev

## To Do List
### Improving MARIE.js Codebase
- [ ] further integration of stepping simulator one step backwards
- [ ] Add explanation of instruction when using Autocomplete
- [x] Remove unnecessary CSS

### Documentation
- [ ] Document other files using jsdoc
- [ ] Comment the code whenever it is needed
- [ ] Extend Usability of Wiki and eBook

### Testing
- [ ] Add unit testing

### UI
- [ ] move output mode back to inside output log element
- [x] rename "Register log" to "RTL log"
- [ ] add legend to memory view (yellow=MAR, green=PC)
- [ ] change between cells by using arrow keys (once the user is focusing in one memory cell)
- [ ] remove fading in tabs (reason: unnecessary animation)
- [ ] fix overflow ellipsis in instruction display within datapath view
- [ ] fix overflow scrolling in datapath view
- [x] add time from now message in save file status (e.g. "saved file now","saved file a few minutes ago")`
- [x] add option for autosaving in preferences (set save timer after file modification)
- [ ] add warning message for importing files
- [ ] add placeholder in logs if it is empty
- [ ] responsive dropdown menu
- [ ] fix dropdown menu bug with iOS devices
- [ ] clearly indicate to the user that the status bar is what it is
- [ ] show default placeholder values in preference settings in input textboxes
- [ ] selecting code should not block the highlighted lines
- [ ] add an assembled code tab to the left pane to show how the line numbers are converted into memory
addresses
- [ ] add option in menu to clear all breakpoints
- [x] set lighter grey background to disabled action buttons
- [ ] Use Slickgrid or work out how to use less DOM changes for logs
- [ ] Add time sequence numbers to RTL instructions (e.g. T0)
- [x] Force cursor to be default when hovering over links in navigation menu

## Documentation
We use jsdoc for documenting the code. This can be found within the `doc`
folder.

If you want to build the documentation website again (if you have, say, made
some changes to the documentation of the JavaScript code), then run this
command.

    grunt jsdoc

## Contribute
If you would like to contribute to this project, simply fork this repository
then make the changes to the forked repository. Once changes are made, perform a
pull request to this repository. We'll review the pull request, and if it is
accepted, we'll add your name to our license.

## Recommended Commit Tags
    [D] Dependency Update
    [HF] HotFix
    [P] Patch
    [UI] User Input (including css) Update

    [O] Other

## License

### The MIT License (MIT)

Copyright (c) 2016 Jason Nguyen, Saurabh Joshi, Eric Jiang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
