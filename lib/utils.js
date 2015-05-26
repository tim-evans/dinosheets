import Ember from 'ember';

const dasherize = Ember.String.dasherize;

export default function toCSS(rules, format = { tab: '', newline: '' }) {
  if (rules == null) { return ''; }

  let css = Ember.A(keys(rules)).map((key) => {
    return `${format.tab}${dasherize(key)}: ${rules[key]};`;
  });
  return css.join(format.newline) + format.newline;
}
