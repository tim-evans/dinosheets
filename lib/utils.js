function dasherize(str) {
  return str.replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/[ _]/g, '-');
}

export function toCSS(rules, format = { tab: '', newline: '' }) {
  if (rules == null) { return ''; }

  let css = [];
  for (let key in rules) {
    if (!rules.hasOwnProperty(key)) { continue; }
    css.push(`${format.tab}${dasherize(key)}: ${rules[key]};`);
  }
  return css.join(format.newline) + format.newline;
}
