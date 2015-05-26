import StyleSheetShim from './shim';
const { keys } = Ember;

class DinoSheet {
  constructor(media='all') {
    const element = document.createElement('style');
    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    element.type = 'text/css';
    element.media = media;
    this.media = media;
    this.element = element;
    this.id = this.element.id = Ember.guidFor(this);

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
    this._locked = true;
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

    this.sync();
  }

  insertRule(selector, rule, value) {
    this.bufferedStyles[selector] = this.bufferedStyles[selector] || {};
    this.bufferedStyles[selector][rule] = value;
    if (!this._locked) {
      this.sync();
    }
  }

  deleteRule(selector, rule) {
    if (this.bufferedStyles[selector]) {
      delete this.bufferedStyles[selector][rule];
    }
    if (!this._locked) {
      this.sync();
    }
  }

  deleteSelector(selector) {
    delete this.styles[selector];
    if (!this._locked) {
      this.sync();
    }
  }

  sync() {
    const styleSheet = this.styleSheet;
    const styles = this.bufferedStyles;

    this.diff().forEach(({ selector, rules }) => {
      let style = styles[selector];

      if (index == null) {
        styleSheet.appendRule(selector, style);
      } else if (rules) {
        styleSheet.updateRule(selector, rules);
      } else {
        styleSheet.deleteRule(selector, style);
      }
    });

    this.activeStyles = Ember.copy(styles, true);
  }

  diff() {
    const activeStyles = this.activeStyles;
    const bufferedStyles = this.bufferedStyles;

    const changes = Ember.A([]);
    const selectors = Ember.A(keys(activeStyles).concat(keys(bufferedStyles))).uniq();
    selectors.forEach((selector) => {
      const activeRules = activeStyles[selector];
      const bufferedRules = bufferedStyles[selector];
      if (activeRules == null || bufferedRules == null) {
        changes.push({ selector });
      } else {
        const rules = Ember.A(keys(bufferedRules).concat(keys(activeRules))).uniq();
        const changedProperties = rules.filter((rule) => {
          return activeRules[rule] !== bufferedRules[rule];
        });
        const changedRules = changedProperties.reduce((rules, rule) => {
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
