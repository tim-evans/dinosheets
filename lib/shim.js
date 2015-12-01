import { camelize, dasherize, toCSS, forEach, keys, reduce, map, trim } from 'dinosheets/utils';
import supports from 'dinosheets/supports';

class StyleSheetShim {
  constructor(styleSheet) {
    this.styleSheet = styleSheet;
    this.indexes = {};
    this.styles = {};
  }

  rules() {
    const { styleSheet } = this;
    return styleSheet.cssRules || styleSheet.rules || [];
  }

  ruleFor(selector) {
    const index = this.indexes[selector];
    if (index == null) { return null; }
    const rules = this.rules();

    return {
      index,
      rule: rules[index]
    };
  }

  insertRule(selector, rules, index) {
    const { styleSheet } = this;

    // Lint out all rules that can't be applied
    rules = reduce(keys(rules), (E, rule) => {
      let value = rules[rule];
      if (supports(rule, value)) {
        E[rule] = value;
      }
      return E;
    }, {});

    const css = toCSS(rules);

    if (index == null) {
      index = this.rules().length;
    }

    if (css.length) {
      this.indexes[selector] = index;
      this.styles[selector] = rules;
      if (styleSheet.insertRule) {
        styleSheet.insertRule(`${selector} { ${css} }`, index);
      } else {
        styleSheet.addRule(selector, css, index);

        if (this.ruleFor(selector).rule.selectorText.toLowerCase() !== selector.toLowerCase()) {
          delete this.indexes[selector];
          delete this.styles[selector];
          this._splitsSelectors = true;
          forEach(map(selector.split(','), trim), (selector) => {
            this.indexes[selector] = index++;
            this.styles[selector] = rules;
          });
        }
      }
    }
  }

  updateRule(selector, rules) {
    if (this._splitsSelectors && selector.indexOf(',') !== -1) {
      forEach(map(selector.split(','), trim), (selector) => {
        this.updateRule(selector, rules);
      });
      return;
    }

    // Lint out all rules that can't be applied
    rules = reduce(keys(rules), (E, rule) => {
      let value = rules[rule];
      if (supports(rule, value)) {
        E[rule] = value;
      }
      return E;
    }, {});

    const { rule } = this.ruleFor(selector);
    for (let key in rules) {
      if (!rules.hasOwnProperty(key)) { continue; }
      let value = rules[key];
      key = camelize(key);
      if (key == null) { continue; }

      if (value == null) {
        delete this.styles[selector][key];
        if (rule.style.removeProperty) {
          rule.style.removeProperty(dasherize(key));
        } else {
          rule.style[key] = null;
        }
      } else {
        this.styles[selector][key] = value;
        rule.style[key] = value;
      }
    }
  }

  insertOrUpdateRule(selector, rules) {
    if (this.ruleFor(selector)) {
      this.updateRule(selector, rules);
    } else {
      this.insertRule(selector, rules);
    }
  }

  deleteRule(selector) {
    if (this._splitsSelectors && selector.indexOf(',') !== -1) {
      forEach(map(selector.split(','), trim), (selector) => {
        this.deleteRule(selector);
      });
      return;
    }

    const { styleSheet } = this;
    const { index } = this.ruleFor(selector);
    if (styleSheet.deleteRule) {
      styleSheet.deleteRule(selector, index);
    } else {
      styleSheet.removeRule(index);
    }
    delete this.indexes[selector];
    delete this.styles[selector];
  }

  toString() {
    let sortedStyles = [];
    let styles = this.styles;
    let indexes = this.indexes;

    for (let selector in styles) {
      let rules = styles[selector];
      let index = indexes[selector];
      sortedStyles[index] = [selector, rules];
    }

    let css = [];
    for (let i = 0, len = sortedStyles.length; i < len; i++) {
      let style = sortedStyles[i];
      if (style == null) { continue; }
      let selector = style[0];
      let rules = style[1];
      css.push([
        `${selector} {\n`,
        toCSS(rules, { tab: '  ', newline: '\n' }),
        '}'
      ].join(''));
    }
    return css.join('\n\n');
  }
}

export default StyleSheetShim;
