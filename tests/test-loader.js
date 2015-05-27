(function () {
  function shouldLoadModule(moduleName) {
    return (moduleName.match(/[-_]test$/));
  }

  var moduleName;

  for (moduleName in requirejs.entries) {
    if (shouldLoadModule(moduleName)) {
      require(moduleName);
    }
  }
}());
