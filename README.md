## Dinosheets [![Build Status](https://travis-ci.org/tim-evans/dinosheets.svg?branch=master)](https://travis-ci.org/tim-evans/dinosheets) [![Code Climate](https://codeclimate.com/github/tim-evans/dinosheets/badges/gpa.svg)](https://codeclimate.com/github/tim-evans/dinosheets)

Dinosheets is a dynamic stylesheet library that provides a Sass / SCSS like experience with rule definitions and mutations. The library is speedy and integrates well with libraries that have run loops (like Ember).

There is a single method for inserting, updating, and deleting CSS rules called `css`. When the rules should by applied to the stylesheet, calling `applyStyles` will efficiently update the styles.

### Compatibility

[![Sauce Test Status](https://saucelabs.com/browser-matrix/timmyce.svg)](https://saucelabs.com/u/timmyce)

Dinosheets tests against older browsers that are harder to get your hands on. Please submit an issue if you'd like another browser added to the matrix.

For compatibility documentation, see [quirksmode](http://www.quirksmode.org/dom/w3c_css.html).
