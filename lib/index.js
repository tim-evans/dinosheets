import StyleSheetShim from 'dinosheets/shim';
import { keys, uniq, copy, filter, reduce, forEach } from 'dinosheets/utils';

var uid = 1;

// Under memory pressure or in some other cases Chrome may not update
// the document.styleSheets property synchronously. Here we poll to
// be sure it has updated.
//
// See: https://github.com/tim-evans/ember-autoresize/issues/27
function getStyleSheet(element, callback) {
  let sheet;
  for (var i = document.styleSheets.length -1; i >= 0; i--) {
    let stylesheet = document.styleSheets[i];
    if (stylesheet.ownerNode === element) {
      sheet = stylesheet;
      break;
    }
  }

  if (!sheet) {
    setTimeout(function () {
      getStyleSheet(element, callback);
    }, 0);
  } else {
    callback(sheet);
  }
}

class DinoSheet {
  constructor(media='all') {
    const element = document.createElement('style');
    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    element.type = 'text/css';
    element.media = media;
    this.media = media;
    this.element = element;
    this.id = this.element.id = `dinosheet-${uid++}`;

    head.appendChild(element);

    getStyleSheet(element, (styleSheet) => {
      this.styleSheet = new StyleSheetShim(styleSheet);
    });
    this.activeStyles = {};
    this.bufferedStyles = {};
  }

  destroy() {
    if (this.isDestroyed) { return; }

    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    head.removeChild(this.element);
    this.isDestroyed = true;
    this.element = null;
    this.styleSheet = null;
    this.activeStyles = {};
    this.bufferedStyles = {};
  }

  css(selector, styles) {
    if (styles == null) {
      delete this.bufferedStyles[selector];
    }

    for (let rule in styles) {
      if (!styles.hasOwnProperty(rule)) { continue; }

      let value = styles[rule];
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
          rule = `${selector} ${rule}`;
        }
        this.css(rule, value);
      }
    }
    return this;
  }

  discardChanges() {
    this.bufferedStyles = copy(this.activeStyles);
    return this;
  }

  applyStyles() {
    if (this.isDestroyed) { return; }

    // The stylesheet may have not been instantiated yet;
    // apply styles *after* the element has been resolved
    if (!this.styleSheet) {
      getStyleSheet(this.element, () => {
        this.applyStyles();
      });
      return;
    }

    const styleSheet = this.styleSheet;

    forEach(this.diff(), (diff) => {
      let { selector, rules } = diff;
      if (rules == null) {
        styleSheet.deleteRule(selector);
      } else if (rules) {
        styleSheet.insertOrUpdateRule(selector, rules);
      }
    });

    this.activeStyles = copy(this.bufferedStyles);
  }

  diff() {
    const activeStyles = this.activeStyles;
    const bufferedStyles = this.bufferedStyles;

    const changes = [];
    const selectors = uniq(keys(activeStyles).concat(keys(bufferedStyles)));
    forEach(selectors, (selector) => {
      const activeRules = activeStyles[selector];
      const bufferedRules = bufferedStyles[selector];
      if (activeRules == null || bufferedRules == null) {
        changes.push({ selector, rules: bufferedRules });
      } else {
        const rules = uniq(keys(bufferedRules).concat(keys(activeRules)));
        const changedProperties = filter(rules, (rule) => {
          return activeRules[rule] !== bufferedRules[rule];
        });
        const changedRules = reduce(changedProperties, (rules, rule) => {
          rules[rule] = bufferedRules[rule] || null;
          return rules;
        }, {});

        if (changedProperties.length) {
          changes.push({ selector, rules: changedRules });
        }
      }
    });
    return changes;
  }

  toString() {
    if (this.isDestroyed) { return ''; }
    return this.styleSheet.toString();
  }
}

export default DinoSheet;
