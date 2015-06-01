import StyleSheetShim from 'dinosheets/shim';
import { keys, uniq, copy, filter, reduce, forEach } from 'dinosheets/utils';

var uid = 1;

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

    let styleSheet = document.styleSheets[document.styleSheets.length - 1];
    this.styleSheet = new StyleSheetShim(styleSheet);
    this.activeStyles = {};
    this.bufferedStyles = {};
  }

  destroy() {
    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    head.removeChild(this.element);
    this.element = null;
    this.styleSheet = null;
    this.activeStyles = null;
    this.bufferedStyles = null;
  }

  rule(selector, styles) {
    if (styles == null) {
      this.deleteSelector(selector);
    }

    for (let rule in styles) {
      if (!styles.hasOwnProperty(rule)) { continue; }

      let value = styles[rule];
      if (value == null) {
        this.deleteRule(selector, rule);
      } else if (typeof value === 'string') {
        this.insertRule(selector, rule, value);
      } else {
        if (rule.indexOf('&') !== -1) {
          rule = rule.replace(/&/g, selector);
        } else {
          rule = `${selector} ${rule}`;
        }
        this.rule(rule, value);
      }
    }
    return this;
  }

  insertRule(selector, rule, value) {
    this.bufferedStyles[selector] = this.bufferedStyles[selector] || {};
    this.bufferedStyles[selector][rule] = value;
    return this;
  }

  deleteRule(selector, rule) {
    if (this.bufferedStyles[selector]) {
      delete this.bufferedStyles[selector][rule];
    }
    return this;
  }

  deleteSelector(selector) {
    delete this.styles[selector];
    return this;
  }

  discardChanges() {
    this.bufferedStyles = copy(this.activeStyles);
    return this;
  }

  sync() {
    const styleSheet = this.styleSheet;

    forEach(this.diff(), ({ selector, rules }) => {
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
    return this.styleSheet.toString();
  }
}

export default DinoSheet;
