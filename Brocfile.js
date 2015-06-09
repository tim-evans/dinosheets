/* global require, module, process */
var funnel = require('broccoli-funnel');
var concat = require('broccoli-concat');
var mergeTrees = require('broccoli-merge-trees');
var esTranspiler = require('broccoli-babel-transpiler');
var env = process.env.ENV;
var pkg = require('./package.json');

var transpile = function (tree, opts) {
  return esTranspiler(tree, {
    stage: 0,
    moduleIds: true,
    modules: opts.modules,
    loose: ['es6.classes', 'es6.modules'],

    // Transforms /index.js files to use their containing directory name
    getModuleId: function (name) {
      name = pkg.name + '/' + name;
      return name.replace(/\/index$/, '');
    },

    // Fix relative imports inside /index's
    resolveModuleSource: function (source, filename) {
      var match = filename.match(/(.+)\/index\.\S+$/i);

      // is this an import inside an /index file?
      if (match) {
        var path = match[1];
        return source
          .replace(/^\.\//, path + '/')
          .replace(/^\.\.\//, '');
      } else {
        return source;
      }
    }
  });
};

var amd = concat(transpile('lib', { modules: 'amd' }), {
  inputFiles: [
    '**/*.js'
  ],
  outputFile: '/' + pkg.name + '.amd.js'
});

var trees = [amd];

if (env === 'test') {
  var test = concat(transpile('tests', { modules: 'amd' }), {
    inputFiles: [
      '**/*-test.js'
    ],
    outputFile: '/' + pkg.name + '-tests.js'
  });
  var qunit = funnel('bower_components/qunit/qunit', {
    destDir: 'assets'
  });
  var loader = mergeTrees([
    funnel('bower_components/loader.js', {
      destDir: 'assets',
      include: ['loader.js']
    }),
    funnel('tests', {
      destDir: 'assets',
      include: ['test-loader.js']
    })
  ]);
  var index = funnel('tests', {
    include: ['index.html']
  });
  trees.push(test, qunit, index, loader);
}

module.exports = mergeTrees(trees);
