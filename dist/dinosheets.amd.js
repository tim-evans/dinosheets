define('dinosheets', ['exports', 'module', 'dinosheets/shim', 'dinosheets/utils'], function (exports, module, _dinosheetsShim, _dinosheetsUtils) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _StyleSheetShim = _interopRequireDefault(_dinosheetsShim);

  var uid = 1;

  var DinoSheet = (function () {
    function DinoSheet() {
      var media = arguments[0] === undefined ? 'all' : arguments[0];

      _classCallCheck(this, DinoSheet);

      var element = document.createElement('style');
      var head = document.getElementsByTagName('head')[0] || document.documentElement;
      element.type = 'text/css';
      element.media = media;
      this.media = media;
      this.element = element;
      this.id = this.element.id = 'dinosheet-' + uid++;

      head.appendChild(element);

      var styleSheet = document.styleSheets[document.styleSheets.length - 1];
      this.styleSheet = new _StyleSheetShim['default'](styleSheet);
      this.activeStyles = {};
      this.bufferedStyles = {};
    }

    DinoSheet.prototype.destroy = function destroy() {
      if (this.isDestroyed) {
        return;
      }

      var head = document.getElementsByTagName('head')[0] || document.documentElement;
      head.removeChild(this.element);
      this.isDestroyed = true;
      this.element = null;
      this.styleSheet = null;
      this.activeStyles = {};
      this.bufferedStyles = {};
    };

    DinoSheet.prototype.css = function css(selector, styles) {
      if (styles == null) {
        delete this.bufferedStyles[selector];
      }

      for (var rule in styles) {
        if (!styles.hasOwnProperty(rule)) {
          continue;
        }

        var value = styles[rule];
        if (value == null) {
          if (this.bufferedStyles[selector]) {
            delete this.bufferedStyles[selector][rule];
          }
        } else if (typeof value === 'string') {
          this.bufferedStyles[selector] = this.bufferedStyles[selector] || {};
          this.bufferedStyles[selector][rule] = value;
        } else {
          if (rule.indexOf('&') !== -1) {
            rule = rule.replace(/&/g, selector);
          } else {
            rule = '' + selector + ' ' + rule;
          }
          this.css(rule, value);
        }
      }
      return this;
    };

    DinoSheet.prototype.discardChanges = function discardChanges() {
      this.bufferedStyles = (0, _dinosheetsUtils.copy)(this.activeStyles);
      return this;
    };

    DinoSheet.prototype.applyStyles = function applyStyles() {
      if (this.isDestroyed) {
        return;
      }
      var styleSheet = this.styleSheet;

      (0, _dinosheetsUtils.forEach)(this.diff(), function (_ref) {
        var selector = _ref.selector;
        var rules = _ref.rules;

        if (rules == null) {
          styleSheet.deleteRule(selector);
        } else if (rules) {
          styleSheet.insertOrUpdateRule(selector, rules);
        }
      });

      this.activeStyles = (0, _dinosheetsUtils.copy)(this.bufferedStyles);
    };

    DinoSheet.prototype.diff = function diff() {
      var activeStyles = this.activeStyles;
      var bufferedStyles = this.bufferedStyles;

      var changes = [];
      var selectors = (0, _dinosheetsUtils.uniq)((0, _dinosheetsUtils.keys)(activeStyles).concat((0, _dinosheetsUtils.keys)(bufferedStyles)));
      (0, _dinosheetsUtils.forEach)(selectors, function (selector) {
        var activeRules = activeStyles[selector];
        var bufferedRules = bufferedStyles[selector];
        if (activeRules == null || bufferedRules == null) {
          changes.push({ selector: selector, rules: bufferedRules });
        } else {
          var rules = (0, _dinosheetsUtils.uniq)((0, _dinosheetsUtils.keys)(bufferedRules).concat((0, _dinosheetsUtils.keys)(activeRules)));
          var changedProperties = (0, _dinosheetsUtils.filter)(rules, function (rule) {
            return activeRules[rule] !== bufferedRules[rule];
          });
          var changedRules = (0, _dinosheetsUtils.reduce)(changedProperties, function (rules, rule) {
            rules[rule] = bufferedRules[rule] || null;
            return rules;
          }, {});

          if (changedProperties.length) {
            changes.push({ selector: selector, rules: changedRules });
          }
        }
      });
      return changes;
    };

    DinoSheet.prototype.toString = function toString() {
      if (this.isDestroyed) {
        return '';
      }
      return this.styleSheet.toString();
    };

    return DinoSheet;
  })();

  module.exports = DinoSheet;
});
define('dinosheets/shim', ['exports', 'module', 'dinosheets/utils'], function (exports, module, _dinosheetsUtils) {
  'use strict';

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var StyleSheetShim = (function () {
    function StyleSheetShim(styleSheet) {
      _classCallCheck(this, StyleSheetShim);

      this.styleSheet = styleSheet;
      this.indexes = {};
      this.styles = {};
    }

    StyleSheetShim.prototype.rules = function rules() {
      var styleSheet = this.styleSheet;

      return styleSheet.cssRules || styleSheet.rules || [];
    };

    StyleSheetShim.prototype.ruleFor = function ruleFor(selector) {
      var index = this.indexes[selector];
      if (index == null) {
        return null;
      }
      var rules = this.rules();

      return {
        index: index,
        rule: rules[index]
      };
    };

    StyleSheetShim.prototype.insertRule = function insertRule(selector, rules, index) {
      var styleSheet = this.styleSheet;

      var css = (0, _dinosheetsUtils.toCSS)(rules);

      if (index == null) {
        index = this.rules().length;
      }

      if (css.length) {
        this.indexes[selector] = index;
        this.styles[selector] = rules;
        if (styleSheet.insertRule) {
          styleSheet.insertRule('' + selector + ' { ' + css + ' }', index);
        } else {
          styleSheet.addRule(selector, css, index);
        }
      }
    };

    StyleSheetShim.prototype.updateRule = function updateRule(selector, rules) {
      var _ruleFor = this.ruleFor(selector);

      var rule = _ruleFor.rule;

      for (var key in rules) {
        if (!rules.hasOwnProperty(key)) {
          return;
        }
        var value = rules[key];
        if (value == null) {
          delete this.styles[selector][key];
          if (rule.style.removeProperty) {
            rule.style.removeProperty((0, _dinosheetsUtils.dasherize)(key));
          } else {
            rule.style[key] = null;
          }
        } else {
          this.styles[selector][key] = value;
          rule.style[key] = value;
        }
      }
    };

    StyleSheetShim.prototype.insertOrUpdateRule = function insertOrUpdateRule(selector, rules) {
      if (this.ruleFor(selector)) {
        this.updateRule(selector, rules);
      } else {
        this.insertRule(selector, rules);
      }
    };

    StyleSheetShim.prototype.deleteRule = function deleteRule(selector) {
      var styleSheet = this.styleSheet;

      var _ruleFor2 = this.ruleFor(selector);

      var index = _ruleFor2.index;

      if (styleSheet.deleteRule) {
        styleSheet.deleteRule(selector, index);
      } else {
        styleSheet.removeRule(index);
      }
      delete this.indexes[selector];
      delete this.styles[selector];
    };

    StyleSheetShim.prototype.toString = function toString() {
      var sortedStyles = [];
      var styles = this.styles;
      var indexes = this.indexes;

      for (var selector in styles) {
        var rules = styles[selector];
        var index = indexes[selector];
        sortedStyles[index] = [selector, rules];
      }

      var css = [];
      for (var i = 0, len = sortedStyles.length; i < len; i++) {
        var style = sortedStyles[i];
        if (style == null) {
          continue;
        }
        var selector = style[0];
        var rules = style[1];
        css.push(['' + selector + ' {\n', (0, _dinosheetsUtils.toCSS)(rules, { tab: '  ', newline: '\n' }), '}'].join(''));
      }
      return css.join('\n\n');
    };

    return StyleSheetShim;
  })();

  module.exports = StyleSheetShim;
});
define("dinosheets/utils", ["exports"], function (exports) {
  "use strict";

  exports.__esModule = true;
  exports.copy = copy;
  exports.filter = filter;
  exports.reduce = reduce;
  exports.forEach = forEach;
  exports.uniq = uniq;
  exports.dasherize = dasherize;
  exports.toCSS = toCSS;
  var keys = Object.keys;

  if (keys == null) {
    exports.keys = keys = function (O) {
      var array = [],
          key;

      // 1. If the Type(O) is not Object, throw a TypeError exception.
      if (typeof O !== "object" || O == null) {
        throw new TypeError(O + " is not an object.");
      }

      // 5. For each own enumerable property of O whose name String is P
      for (key in O) {
        if (O.hasOwnProperty(key)) {
          array[array.length] = key;
        }
      }

      // 6. Return array.
      return array;
    };
  }

  var keys;

  exports.keys = keys;

  function copy(O) {
    var dup = {};
    for (var key in O) {
      if (!O.hasOwnProperty(key)) {
        continue;
      }
      var value = O[key];
      if (typeof value === "object") {
        dup[key] = copy(value);
      } else {
        dup[key] = value;
      }
    }

    return dup;
  }

  function filter(array, lambda) {
    if (array.filter) {
      return array.filter(lambda);
    }

    var seive = [];

    for (var i = 0, len = array.length; i < len; i++) {
      if (lambda(array[i], i, array)) {
        seive.push(array[i]);
      }
    }
    return seive;
  }

  function reduce(array, lambda, seed) {
    if (array.reduce) {
      return array.reduce(lambda, seed);
    }

    var shouldSeed = arguments.length === 1;

    for (var i = 0, len = array.length; i < len; i++) {
      if (shouldSeed) {
        seed = array[i];
        shouldSeed = false;
      } else {
        seed = lambda(seed, array[i], i, array);
      }
    }

    return seed;
  }

  function forEach(array, lambda) {
    if (array.forEach) {
      return array.forEach(lambda);
    }

    var len = array.length,
        k = 0;

    while (k < len) {
      if (array.hasOwnProperty(k)) {
        lambda(array[k], k, array);
      }

      k += 1;
    }
  }

  function uniq(a, b) {
    var acc = {};
    var key = undefined;

    for (key in a) {
      if (!a.hasOwnProperty(key)) {
        continue;
      }
      acc[a[key]] = true;
    }

    for (key in b) {
      if (!b.hasOwnProperty(key)) {
        continue;
      }
      acc[b[key]] = true;
    }

    return keys(acc);
  }

  function dasherize(str) {
    return str.replace(/([a-z\d])([A-Z])/g, function (_, a, b) {
      return a + "_" + b.toLowerCase();
    }).replace(/[ _]/g, "-");
  }

  function toCSS(rules) {
    var format = arguments[1] === undefined ? { tab: "", newline: "" } : arguments[1];

    if (rules == null) {
      return "";
    }

    var css = [];
    forEach(keys(rules), function (key) {
      css.push("" + format.tab + "" + dasherize(key) + ": " + rules[key] + ";");
    });

    return css.join(format.newline) + format.newline;
  }
});