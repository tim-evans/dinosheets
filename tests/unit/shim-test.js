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
  styleSheet.appendRule('body', {
    backgroundColor: 'green'
  });
  styleSheet.appendRule('p', {
    color: 'white'
  });
  assert.equal(styleSheet.rules().length, 2);
});

test('inserting a rule has the desired effect on the page', function (assert) {
  styleSheet.appendRule('body', {
    fontSize: '200px'
  });
  let styles = getStyles(document.body);
  assert.equal(styles.fontSize, '200px');
});

test('rules are returned in order of insertion', function (assert) {
  styleSheet.appendRule('body', {
    fontSize: '200px'
  });
  styleSheet.appendRule('p', {
    display: 'none'
  });
  styleSheet.appendRule('em', {
    color: 'green'
  });

  let rules = styleSheet.rules();
  assert.equal(rules.item(0).selectorText, 'body');
  assert.equal(rules.item(1).selectorText, 'p');
  assert.equal(rules.item(2).selectorText, 'em');
});
