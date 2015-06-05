import StyleSheetShim from 'dinosheets/shim';

let styleSheet = null;
let element = null;

// Retrieve the computed style of the element
function getStyles(element) {
  if (document.defaultView && document.defaultView.getComputedStyle) {
    return document.defaultView.getComputedStyle(element, null);
  }
  return element.currentStyle;
};

function cssText(rule) {
  let style = rule.style.cssText;
  style = style.replace(/\s*$/, '');
  if (style.charAt(style.length - 1) !== ';') {
    style = style + ';';
  }
  return style.toLowerCase();
}

module('StyleSheetShim', {
  beforeEach() {
    element = document.createElement('style');
    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    element.type = 'text/css';
    element.media = 'all';

    head.appendChild(element);

    styleSheet = new StyleSheetShim(document.styleSheets[document.styleSheets.length - 1]);
  },
  afterEach() {
    const head = document.getElementsByTagName('head')[0] ||
                 document.documentElement;
    head.removeChild(element);
  }
});

test('it returns a list of rules for the stylesheet', function (assert) {
  styleSheet.insertRule('body', {
    backgroundColor: 'green'
  });
  styleSheet.insertRule('p', {
    color: 'white'
  });
  assert.equal(styleSheet.rules().length, 2);
});

test('inserting a rule has the desired effect on the page', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });
  let styles = getStyles(document.body);
  assert.equal(styles.fontSize, '200px');
});

test('rules are returned in order of insertion', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });
  styleSheet.insertRule('p', {
    display: 'none'
  });
  styleSheet.insertRule('em', {
    color: 'green'
  });

  let rules = styleSheet.rules();
  assert.equal(rules[0].selectorText.toLowerCase(), 'body');
  assert.equal(rules[1].selectorText.toLowerCase(), 'p');
  assert.equal(rules[2].selectorText.toLowerCase(), 'em');
});

test('ruleFor returns the correct rules', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });
  styleSheet.insertRule('p', {
    display: 'none'
  });
  styleSheet.insertRule('em', {
    fontWeight: 'bold'
  });

  let rule = styleSheet.ruleFor('body').rule;
  assert.equal(cssText(rule), 'font-size: 200px;')
  rule = styleSheet.ruleFor('p').rule;
  assert.equal(cssText(rule), 'display: none;');
  rule = styleSheet.ruleFor('em').rule;
  assert.equal(cssText(rule), 'font-weight: bold;');
});

test('rules can be updated', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });

  let styles = getStyles(document.body);
  assert.equal(styles.fontSize, '200px');

  styleSheet.updateRule('body', {
    fontSize: '10px'
  });

  styles = getStyles(document.body);
  assert.equal(styles.fontSize, '10px');
});

test('rules can be deleted', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });

  styleSheet.deleteRule('body');

  let rule = styleSheet.ruleFor('body');
  assert.equal(rule, null);
});

test('toString returns the serialized stylesheet', function (assert) {
  styleSheet.insertRule('body', {
    fontSize: '200px'
  });
  styleSheet.insertRule('.hello-world', {
    width: '200px',
    height: '100px',
    border: '1px solid'
  });

  assert.equal(styleSheet.toString(),
               ['body {',
                '  font-size: 200px;',
                '}',
                '',
                '.hello-world {',
                '  width: 200px;',
                '  height: 100px;',
                '  border: 1px solid;',
                '}'].join('\n'));
});

test('setting the cssFloat property works', function (assert) {
  styleSheet.insertRule('body', {
    cssFloat: 'right'
  });

  // Check both cssFloat and styleFloat
  let styles = getStyles(document.body);
  if (typeof styles.cssFloat !== 'undefined') {
    assert.equal(styles.cssFloat, 'right',
                 'cssFloat === "right"' + cssText(styleSheet.ruleFor('body').rule));
  } else {
    assert.equal(styles.styleFloat, 'right',
                 'styleFloat === "right"' + cssText(styleSheet.ruleFor('body').rule));
  }
});

test('selectors with a comma are updateable', function (assert) {
  styleSheet.insertRule('button, a[role=button]', {
    textTransform: 'uppercase'
  });

  let button = document.getElementById('button');
  let anchor = document.getElementById('button-role');

  let styles = getStyles(button);
  assert.equal(styles.textTransform, 'uppercase',
               cssText(styleSheet.ruleFor('button').rule));

  styles = getStyles(anchor);
  assert.equal(styles.textTransform, 'uppercase',
               cssText(styleSheet.ruleFor('a[role=button]').rule));

  styleSheet.updateRule('button, a[role=button]', {
    textTransform: 'lowercase'
  });

  styles = getStyles(button);
  assert.equal(styles.textTransform, 'lowercase',
               cssText(styleSheet.ruleFor('button').rule));

  styles = getStyles(anchor);
  assert.equal(styles.textTransform, 'lowercase',
               cssText(styleSheet.ruleFor('a[role=button]').rule));
});
