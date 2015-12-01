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

  if (value.indexOf('rgba(') !== -1) {
    return test(style, function (el) {
      return el.style[rule].indexOf('rgba(') !== -1;
    });

  } else if (value.indexOf('hsla(') !== -1) {
    return test(style, function (el) {
      return el.style[rule].indexOf('hsla(') !== -1;
    });

  } else if (value.indexOf('-gradient(') !== -1) {
    return test(style, function (el) {
      return el.style[rule].indexOf('gradient') !== -1;
    });

  } else if (rule.indexOf('background') !== -1 &&
             value.indexOf(',') !== -1 &&
             value.indexOf('-gradient(') === -1) {
    return test(style, function (el) {
      el.style.background = 'url(https://),url(https://),red url(https://)';
      return /(url\s*\(.*?){3}/.test(el.style[rule]);
    });

  } else if (rule.indexOf('calc(') !== -1) {
    return test(style, function (el) {
      return el.style[rule].indexOf('calc(') !== -1;
    });

  } else if (rule.indexOf('transform-style') !== -1 &&
             value === 'preserve-3d') {
    return test(style, function (el) {
      return el.style[rule] === 'preserve-3d';
    });

  } else {
    if (cache[rule] != null) {
      return cache[rule];
    }

    let isSupported = test(style, function (el) {
      return el.style[rule] != null ||
             el.style[dasherize(rule)] != null;
    });
    cache[rule] = isSupported;
    return isSupported;
  }
}
