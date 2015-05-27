const funnel = require('broccoli-funnel');
const concat = require('broccoli-concat');
const mergeTrees = require('broccoli-merge-trees');
const esTranspiler = require('broccoli-babel-transpiler');
const env = process.env.ENV;
const pkg = require('./package.json');

const transpile = function (tree) {
  return esTranspiler(tree, {
    stage: 0,
    moduleIds: true,
    modules: 'amd',

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

const js = transpile('lib');

const main = concat(js, {
  inputFiles: [
    '**/*.js'
  ],
  outputFile: '/' + pkg.name + '.js'
});

const trees = [main];

if (env === 'test') {
  const test = concat(transpile('tests'), {
    inputFiles: [
      '**/*-test.js'
    ],
    outputFile: '/' + pkg.name + '-tests.js'
  });
  const qunit = funnel('bower_components/qunit/qunit', {
    destDir: 'assets'
  });
  const loader = mergeTrees([
    funnel('bower_components/loader.js', {
      destDir: 'assets',
      include: ['loader.js']
    }),
    funnel('tests', {
      destDir: 'assets',
      include: ['test-loader.js']
    })
  ]);
  const index = funnel('tests', {
    include: ['index.html']
  });
  trees.push(test, qunit, index, loader);
}

module.exports = mergeTrees(trees);
