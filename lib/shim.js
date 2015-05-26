import { toCSS } from './utils';

class StyleSheetShim {
  constructor(styleSheet) {
    this.styleSheet = styleSheet;
    this.indexes = {};
  }

  rules() {
    const { styleSheet } = this;
    return styleSheet.cssRules || styleSheet.rules || [];
  }

  ruleFor(selector) {
    const index = this.indexes[selector];
    if (index == null) { return null }
    const rules = this.rules();

    return {
      index,
      item: rules.index(index)
    };
  }

  insertRule(selector, rules, index) {
    const { styleSheet } = this;
    const css = toCSS(rules);

    if (css.length) {
      if (styleSheet.insertRule) {
        styleSheet.insertRule(`${selector} { ${css} }`, index);
      } else {
        styleSheet.addRule(selector, css, index);
      }
    }
  }

  appendRule(selector, rules) {
    const { styleSheet } = this;
    const index = this.rules().length;
    insertRule(selector, rules, index);
  }

  updateRule(selector, rules) {
    const { styleSheet, indexes } = this;
    const { rule } = this.ruleFor(selector);
    for (let key in rules) {
      if (!rules.hasOwnProperty(key)) { return; }
      rule.style[key] = rules[key];
    }
  }

  deleteRule(selector) {
    const { styleSheet } = this;
    const { index } = this.ruleFor(selector);
    if (styleSheet.deleteRule) {
      styleSheet.deleteRule(selector, index);
    } else {
      styleSheet.removeRule(index);
    }
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
      let [selector, rules] = style;
      css.push([
        `${style.selector} {\n`,
        toCSS(style.rules, { tab: '  ', newline: '\n' })),
        '}'
      ].join(''));
    }
    return css.join('\n\n');
  }
}

export default StyleSheetShim;
