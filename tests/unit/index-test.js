import DinoSheet from 'dinosheets';

function cssText(rule) {
  let style = rule.style.cssText;
  style = style.replace(/\s*$/, '');
  if (style.charAt(style.length - 1) !== ';') {
    style = style + ';';
  }
  return style.toLowerCase();
}

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
