import { dasherize } from 'dinosheets/utils';

function test(css, fn) {
  let element = document.createElement('div');
  let body = document.body;

  element.style.cssText = css;
  body.appendChild(element);

  let result = fn(element);

  element.parentNode.removeChild(element);

  return !!result;
}

let cache = {};
export default function (rule, value) {
  // Coerce numbers into strings
  value += '';
  let style = `${dasherize(rule)}: ${value};`;
  if (cache[rule] != null) {
    return cache[rule];
  }

  return cache[rule] = test(style, function (el) {
    return el.style.length || el.filter.length;
  });
}
