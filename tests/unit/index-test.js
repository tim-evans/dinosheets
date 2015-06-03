import DinoSheet from 'dinosheets';

function cssText(rule) {
  let style = rule.style.cssText;
  style = style.replace(/\s*$/, '');
  if (style.charAt(style.length - 1) !== ';') {
    style = style + ';';
  }
  return style.toLowerCase();
}

function cssRules(rule) {
  let style = rule.style.cssText;
  style = style.replace(/\s*$/, '');
  if (style.charAt(style.length - 1) === ';') {
    style = style.slice(0, -1);
  }
  return style.toLowerCase().split('; ');
}

QUnit.assert.contains = function (haystack, needle, message) {
  var actual = haystack.indexOf(needle) > -1;
  console.log(haystack, needle);
  this.push(actual, actual, needle, message);
};

var sheet;

module('DinoSheet', {
  beforeEach() {
    sheet = new DinoSheet();
  },
  afterEach() {
    sheet.destroy();
  }
});

test('it appends a new stylesheet to the dom', function (assert) {
  assert.ok(sheet.id.match(/^dinosheet-\d+$/));
  assert.equal(sheet.element.id, sheet.id);
  const head = document.getElementsByTagName('head')[0] ||
               document.documentElement;
  assert.equal(sheet.element.parentElement, head);
  assert.equal(sheet.element.tagName.toLowerCase(), 'style');
});

test('it interprets nested styles like SCSS', function (assert) {
  sheet.css('body', {
    '.world': {
      '.hello &': {
        color: 'green',
      },
      '&.goodbye': {
        color: 'red'
      }
    }
  });

  let diff = sheet.diff();
  assert.equal(diff.length, 2);
  assert.equal(diff[0].selector, '.hello body .world');
  assert.equal(diff[1].selector, 'body .world.goodbye');
});

test('it applies the changes to the stylesheet after calling applyStyles', function (assert) {
  sheet.css('body', {
    '.world': {
      '.hello &': {
        fontSize: '10px'
      },
      '&.goodbye': {
        width: '20px',
        height: '50px'
      }
    }
  }).applyStyles();

  let rule = sheet.styleSheet.ruleFor('.hello body .world').rule;
  assert.equal(cssText(rule), 'font-size: 10px;')
  rule = sheet.styleSheet.ruleFor('body .world.goodbye').rule;
  assert.equal(cssText(rule), 'width: 20px; height: 50px;');
});

test('changes can be discarded', function (assert) {
  sheet.css('body', {
    '.world': {
      '.hello &': {
        fontSize: '10px'
      },
      '&.goodbye': {
        width: '20px',
        height: '50px'
      }
    }
  });

  let diff = sheet.diff();
  assert.equal(diff.length, 2);
  sheet.discardChanges();
  diff = sheet.diff();
  assert.equal(diff.length, 0);
});

test('selectors can be deleted', function (assert) {
  sheet.css('.tool-tip', {
    position: 'relative',
    '.pointer': {
      position: 'absolute',
      width: '20px',
      height: '10px',
      top: '0px',
      left: '50%',
      marginLeft: '-5px'
    }
  }).applyStyles();

  sheet.css('.tool-tip .pointer', null);

  assert.deepEqual(sheet.diff(), [{
    selector: '.tool-tip .pointer',
    rules: undefined
  }]);
  sheet.applyStyles();
  let rule = sheet.styleSheet.ruleFor('.tool-tip .pointer');
  assert.equal(rule, null);
});

test('rules can be deleted', function (assert) {
  sheet.css('.tool-tip', {
    position: 'relative',
    '.pointer': {
      position: 'absolute',
      width: '20px',
      height: '10px',
      top: '0px',
      left: '50%',
      marginLeft: '-5px'
    }
  }).applyStyles();

  sheet.css('.tool-tip .pointer', {
    marginLeft: null
  });

  assert.deepEqual(sheet.diff(), [{
    selector: '.tool-tip .pointer',
    rules: {
      marginLeft: null
    }
  }]);

  sheet.applyStyles();
  let rule = sheet.styleSheet.ruleFor('.tool-tip .pointer').rule;
  let rules = cssRules(rule);
  assert.contains(rules, 'position: absolute');
  assert.contains(rules, 'width: 20px');
  assert.contains(rules, 'height: 10px');
  assert.contains(rules, 'top: 0px');
  assert.contains(rules, 'left: 50%');
  assert.equal(rules.length, 5);
});

test('rules can be updated', function (assert) {
  sheet.css('.tool-tip', {
    position: 'relative',
    '.pointer': {
      position: 'absolute',
      width: '20px',
      height: '10px',
      top: '0px',
      left: '50%',
      marginLeft: '-5px'
    }
  }).applyStyles();

  sheet.css('.tool-tip .pointer', {
    width: '10px',
    height: '20px',
    top: '50%',
    left: '-10px',
    marginLeft: null,
    marginTop: '-10px'
  });

  assert.deepEqual(sheet.diff(), [{
    selector: '.tool-tip .pointer',
    rules: {
      width: '10px',
      height: '20px',
      top: '50%',
      left: '-10px',
      marginLeft: null,
      marginTop: '-10px'
    }
  }]);

  sheet.applyStyles();
  let rule = sheet.styleSheet.ruleFor('.tool-tip .pointer').rule;
  let rules = cssRules(rule);
  assert.contains(rules, 'position: absolute');
  assert.contains(rules, 'width: 10px');
  assert.contains(rules, 'height: 20px');
  assert.contains(rules, 'top: 50%');
  assert.contains(rules, 'left: -10px');
  assert.contains(rules, 'margin-top: -10px');
});

test('destroying the sheet removes all styles from the dom', function (assert) {
  sheet.css('.tool-tip', {
    position: 'relative',
    '.pointer': {
      position: 'absolute',
      width: '20px',
      height: '10px',
      top: '0px',
      left: '50%',
      marginLeft: '-5px'
    }
  }).applyStyles();

  let id = sheet.id;
  sheet.destroy();
  assert.equal(document.getElementById(id), null);
  assert.equal(sheet.element, null);
});
