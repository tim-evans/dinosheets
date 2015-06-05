var keys = Object.keys;

if (keys == null) {
  keys = function (O) {
    var array = [], key;

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

export var keys;

export function copy(O) {
  const dup = {};
  for (let key in O) {
    if (!O.hasOwnProperty(key)) { continue; }
    let value = O[key];
    if (typeof value === 'object') {
      dup[key] = copy(value);
    } else {
      dup[key] = value;
    }
  }

  return dup;
}

export function filter(array, lambda) {
  if (array.filter) {
    return array.filter(lambda);
  }

  const seive = [];

  for (let i = 0, len = array.length; i < len; i++) {
    if (lambda(array[i], i, array)) {
      seive.push(array[i]);
    }
  }
  return seive;
}

export function reduce(array, lambda, seed) {
  if (array.reduce) {
    return array.reduce(lambda, seed);
  }

  var shouldSeed = (arguments.length === 1);

  for (let i = 0, len = array.length; i < len; i++) {
    if (shouldSeed) {
      seed = array[i];
      shouldSeed = false;
    } else {
      seed = lambda(seed, array[i], i, array);
    }
  }

  return seed;
}

export function forEach(array, lambda) {
  if (array.forEach) {
    return array.forEach(lambda);
  }

  var len = array.length, k = 0;

  while (k < len) {
    if (array.hasOwnProperty(k)) {
      lambda(array[k], k, array);
    }

    k += 1;
  }
}

export function uniq(a, b) {
  let acc = {};
  let key;

  for (key in a) {
    if (!a.hasOwnProperty(key)) { continue; }
    acc[a[key]] = true;
  }

  for (key in b) {
    if (!b.hasOwnProperty(key)) { continue; }
    acc[b[key]] = true;
  }

  return keys(acc);
}

export function dasherize(str) {
  return str.replace(/([a-z\d])([A-Z])/g, function (_, a, b) {
    return a + '_' + b.toLowerCase();
  }).replace(/[ _]/g, '-');
}

export function toCSS(rules, format = { tab: '', newline: '' }) {
  if (rules == null) { return ''; }

  let css = [];
  forEach(keys(rules), (key) => {
    let value = rules[key];
    if (key === 'cssFloat') {
      key = 'float';
    }
    css.push(`${format.tab}${dasherize(key)}: ${value};`);
  });

  return css.join(format.newline) + format.newline;
}
