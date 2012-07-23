var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6098 = x == null ? null : x;
  if(p[goog.typeOf(x__6098)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6099__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6099 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6099__delegate.call(this, array, i, idxs)
    };
    G__6099.cljs$lang$maxFixedArity = 2;
    G__6099.cljs$lang$applyTo = function(arglist__6100) {
      var array = cljs.core.first(arglist__6100);
      var i = cljs.core.first(cljs.core.next(arglist__6100));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6100));
      return G__6099__delegate(array, i, idxs)
    };
    G__6099.cljs$lang$arity$variadic = G__6099__delegate;
    return G__6099
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6185 = this$;
      if(and__3822__auto____6185) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6185
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2359__auto____6186 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6187 = cljs.core._invoke[goog.typeOf(x__2359__auto____6186)];
        if(or__3824__auto____6187) {
          return or__3824__auto____6187
        }else {
          var or__3824__auto____6188 = cljs.core._invoke["_"];
          if(or__3824__auto____6188) {
            return or__3824__auto____6188
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6189 = this$;
      if(and__3822__auto____6189) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6189
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2359__auto____6190 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6191 = cljs.core._invoke[goog.typeOf(x__2359__auto____6190)];
        if(or__3824__auto____6191) {
          return or__3824__auto____6191
        }else {
          var or__3824__auto____6192 = cljs.core._invoke["_"];
          if(or__3824__auto____6192) {
            return or__3824__auto____6192
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6193 = this$;
      if(and__3822__auto____6193) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2359__auto____6194 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6195 = cljs.core._invoke[goog.typeOf(x__2359__auto____6194)];
        if(or__3824__auto____6195) {
          return or__3824__auto____6195
        }else {
          var or__3824__auto____6196 = cljs.core._invoke["_"];
          if(or__3824__auto____6196) {
            return or__3824__auto____6196
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6197 = this$;
      if(and__3822__auto____6197) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6197
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2359__auto____6198 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6199 = cljs.core._invoke[goog.typeOf(x__2359__auto____6198)];
        if(or__3824__auto____6199) {
          return or__3824__auto____6199
        }else {
          var or__3824__auto____6200 = cljs.core._invoke["_"];
          if(or__3824__auto____6200) {
            return or__3824__auto____6200
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6201 = this$;
      if(and__3822__auto____6201) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6201
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2359__auto____6202 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6203 = cljs.core._invoke[goog.typeOf(x__2359__auto____6202)];
        if(or__3824__auto____6203) {
          return or__3824__auto____6203
        }else {
          var or__3824__auto____6204 = cljs.core._invoke["_"];
          if(or__3824__auto____6204) {
            return or__3824__auto____6204
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6205 = this$;
      if(and__3822__auto____6205) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6205
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2359__auto____6206 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6207 = cljs.core._invoke[goog.typeOf(x__2359__auto____6206)];
        if(or__3824__auto____6207) {
          return or__3824__auto____6207
        }else {
          var or__3824__auto____6208 = cljs.core._invoke["_"];
          if(or__3824__auto____6208) {
            return or__3824__auto____6208
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6209 = this$;
      if(and__3822__auto____6209) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6209
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2359__auto____6210 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6211 = cljs.core._invoke[goog.typeOf(x__2359__auto____6210)];
        if(or__3824__auto____6211) {
          return or__3824__auto____6211
        }else {
          var or__3824__auto____6212 = cljs.core._invoke["_"];
          if(or__3824__auto____6212) {
            return or__3824__auto____6212
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6213 = this$;
      if(and__3822__auto____6213) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6213
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2359__auto____6214 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6215 = cljs.core._invoke[goog.typeOf(x__2359__auto____6214)];
        if(or__3824__auto____6215) {
          return or__3824__auto____6215
        }else {
          var or__3824__auto____6216 = cljs.core._invoke["_"];
          if(or__3824__auto____6216) {
            return or__3824__auto____6216
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6217 = this$;
      if(and__3822__auto____6217) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6217
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2359__auto____6218 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6219 = cljs.core._invoke[goog.typeOf(x__2359__auto____6218)];
        if(or__3824__auto____6219) {
          return or__3824__auto____6219
        }else {
          var or__3824__auto____6220 = cljs.core._invoke["_"];
          if(or__3824__auto____6220) {
            return or__3824__auto____6220
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6221 = this$;
      if(and__3822__auto____6221) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6221
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2359__auto____6222 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6223 = cljs.core._invoke[goog.typeOf(x__2359__auto____6222)];
        if(or__3824__auto____6223) {
          return or__3824__auto____6223
        }else {
          var or__3824__auto____6224 = cljs.core._invoke["_"];
          if(or__3824__auto____6224) {
            return or__3824__auto____6224
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6225 = this$;
      if(and__3822__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2359__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6227 = cljs.core._invoke[goog.typeOf(x__2359__auto____6226)];
        if(or__3824__auto____6227) {
          return or__3824__auto____6227
        }else {
          var or__3824__auto____6228 = cljs.core._invoke["_"];
          if(or__3824__auto____6228) {
            return or__3824__auto____6228
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6229 = this$;
      if(and__3822__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2359__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6231 = cljs.core._invoke[goog.typeOf(x__2359__auto____6230)];
        if(or__3824__auto____6231) {
          return or__3824__auto____6231
        }else {
          var or__3824__auto____6232 = cljs.core._invoke["_"];
          if(or__3824__auto____6232) {
            return or__3824__auto____6232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6233 = this$;
      if(and__3822__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2359__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6235 = cljs.core._invoke[goog.typeOf(x__2359__auto____6234)];
        if(or__3824__auto____6235) {
          return or__3824__auto____6235
        }else {
          var or__3824__auto____6236 = cljs.core._invoke["_"];
          if(or__3824__auto____6236) {
            return or__3824__auto____6236
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2359__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2359__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2359__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2359__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2359__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2359__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2359__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2359__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2359__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2359__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2359__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2359__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2359__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2359__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2359__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2359__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6273 = coll;
    if(and__3822__auto____6273) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6273
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2359__auto____6274 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6275 = cljs.core._count[goog.typeOf(x__2359__auto____6274)];
      if(or__3824__auto____6275) {
        return or__3824__auto____6275
      }else {
        var or__3824__auto____6276 = cljs.core._count["_"];
        if(or__3824__auto____6276) {
          return or__3824__auto____6276
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6281 = coll;
    if(and__3822__auto____6281) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6281
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2359__auto____6282 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6283 = cljs.core._empty[goog.typeOf(x__2359__auto____6282)];
      if(or__3824__auto____6283) {
        return or__3824__auto____6283
      }else {
        var or__3824__auto____6284 = cljs.core._empty["_"];
        if(or__3824__auto____6284) {
          return or__3824__auto____6284
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6289 = coll;
    if(and__3822__auto____6289) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6289
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2359__auto____6290 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6291 = cljs.core._conj[goog.typeOf(x__2359__auto____6290)];
      if(or__3824__auto____6291) {
        return or__3824__auto____6291
      }else {
        var or__3824__auto____6292 = cljs.core._conj["_"];
        if(or__3824__auto____6292) {
          return or__3824__auto____6292
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6301 = coll;
      if(and__3822__auto____6301) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6301
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2359__auto____6302 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6303 = cljs.core._nth[goog.typeOf(x__2359__auto____6302)];
        if(or__3824__auto____6303) {
          return or__3824__auto____6303
        }else {
          var or__3824__auto____6304 = cljs.core._nth["_"];
          if(or__3824__auto____6304) {
            return or__3824__auto____6304
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6305 = coll;
      if(and__3822__auto____6305) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6305
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2359__auto____6306 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6307 = cljs.core._nth[goog.typeOf(x__2359__auto____6306)];
        if(or__3824__auto____6307) {
          return or__3824__auto____6307
        }else {
          var or__3824__auto____6308 = cljs.core._nth["_"];
          if(or__3824__auto____6308) {
            return or__3824__auto____6308
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6313 = coll;
    if(and__3822__auto____6313) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6313
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2359__auto____6314 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6315 = cljs.core._first[goog.typeOf(x__2359__auto____6314)];
      if(or__3824__auto____6315) {
        return or__3824__auto____6315
      }else {
        var or__3824__auto____6316 = cljs.core._first["_"];
        if(or__3824__auto____6316) {
          return or__3824__auto____6316
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6321 = coll;
    if(and__3822__auto____6321) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6321
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2359__auto____6322 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6323 = cljs.core._rest[goog.typeOf(x__2359__auto____6322)];
      if(or__3824__auto____6323) {
        return or__3824__auto____6323
      }else {
        var or__3824__auto____6324 = cljs.core._rest["_"];
        if(or__3824__auto____6324) {
          return or__3824__auto____6324
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6329 = coll;
    if(and__3822__auto____6329) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6329
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2359__auto____6330 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6331 = cljs.core._next[goog.typeOf(x__2359__auto____6330)];
      if(or__3824__auto____6331) {
        return or__3824__auto____6331
      }else {
        var or__3824__auto____6332 = cljs.core._next["_"];
        if(or__3824__auto____6332) {
          return or__3824__auto____6332
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6341 = o;
      if(and__3822__auto____6341) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6341
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2359__auto____6342 = o == null ? null : o;
      return function() {
        var or__3824__auto____6343 = cljs.core._lookup[goog.typeOf(x__2359__auto____6342)];
        if(or__3824__auto____6343) {
          return or__3824__auto____6343
        }else {
          var or__3824__auto____6344 = cljs.core._lookup["_"];
          if(or__3824__auto____6344) {
            return or__3824__auto____6344
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6345 = o;
      if(and__3822__auto____6345) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6345
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2359__auto____6346 = o == null ? null : o;
      return function() {
        var or__3824__auto____6347 = cljs.core._lookup[goog.typeOf(x__2359__auto____6346)];
        if(or__3824__auto____6347) {
          return or__3824__auto____6347
        }else {
          var or__3824__auto____6348 = cljs.core._lookup["_"];
          if(or__3824__auto____6348) {
            return or__3824__auto____6348
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6353 = coll;
    if(and__3822__auto____6353) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6353
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2359__auto____6354 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6355 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2359__auto____6354)];
      if(or__3824__auto____6355) {
        return or__3824__auto____6355
      }else {
        var or__3824__auto____6356 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6356) {
          return or__3824__auto____6356
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6361 = coll;
    if(and__3822__auto____6361) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6361
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2359__auto____6362 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6363 = cljs.core._assoc[goog.typeOf(x__2359__auto____6362)];
      if(or__3824__auto____6363) {
        return or__3824__auto____6363
      }else {
        var or__3824__auto____6364 = cljs.core._assoc["_"];
        if(or__3824__auto____6364) {
          return or__3824__auto____6364
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6369 = coll;
    if(and__3822__auto____6369) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6369
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2359__auto____6370 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6371 = cljs.core._dissoc[goog.typeOf(x__2359__auto____6370)];
      if(or__3824__auto____6371) {
        return or__3824__auto____6371
      }else {
        var or__3824__auto____6372 = cljs.core._dissoc["_"];
        if(or__3824__auto____6372) {
          return or__3824__auto____6372
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6377 = coll;
    if(and__3822__auto____6377) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6377
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2359__auto____6378 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6379 = cljs.core._key[goog.typeOf(x__2359__auto____6378)];
      if(or__3824__auto____6379) {
        return or__3824__auto____6379
      }else {
        var or__3824__auto____6380 = cljs.core._key["_"];
        if(or__3824__auto____6380) {
          return or__3824__auto____6380
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6385 = coll;
    if(and__3822__auto____6385) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6385
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2359__auto____6386 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6387 = cljs.core._val[goog.typeOf(x__2359__auto____6386)];
      if(or__3824__auto____6387) {
        return or__3824__auto____6387
      }else {
        var or__3824__auto____6388 = cljs.core._val["_"];
        if(or__3824__auto____6388) {
          return or__3824__auto____6388
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6393 = coll;
    if(and__3822__auto____6393) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6393
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2359__auto____6394 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6395 = cljs.core._disjoin[goog.typeOf(x__2359__auto____6394)];
      if(or__3824__auto____6395) {
        return or__3824__auto____6395
      }else {
        var or__3824__auto____6396 = cljs.core._disjoin["_"];
        if(or__3824__auto____6396) {
          return or__3824__auto____6396
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6401 = coll;
    if(and__3822__auto____6401) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6401
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2359__auto____6402 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6403 = cljs.core._peek[goog.typeOf(x__2359__auto____6402)];
      if(or__3824__auto____6403) {
        return or__3824__auto____6403
      }else {
        var or__3824__auto____6404 = cljs.core._peek["_"];
        if(or__3824__auto____6404) {
          return or__3824__auto____6404
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6409 = coll;
    if(and__3822__auto____6409) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6409
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2359__auto____6410 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6411 = cljs.core._pop[goog.typeOf(x__2359__auto____6410)];
      if(or__3824__auto____6411) {
        return or__3824__auto____6411
      }else {
        var or__3824__auto____6412 = cljs.core._pop["_"];
        if(or__3824__auto____6412) {
          return or__3824__auto____6412
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6417 = coll;
    if(and__3822__auto____6417) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6417
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2359__auto____6418 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6419 = cljs.core._assoc_n[goog.typeOf(x__2359__auto____6418)];
      if(or__3824__auto____6419) {
        return or__3824__auto____6419
      }else {
        var or__3824__auto____6420 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6420) {
          return or__3824__auto____6420
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6425 = o;
    if(and__3822__auto____6425) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6425
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2359__auto____6426 = o == null ? null : o;
    return function() {
      var or__3824__auto____6427 = cljs.core._deref[goog.typeOf(x__2359__auto____6426)];
      if(or__3824__auto____6427) {
        return or__3824__auto____6427
      }else {
        var or__3824__auto____6428 = cljs.core._deref["_"];
        if(or__3824__auto____6428) {
          return or__3824__auto____6428
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6433 = o;
    if(and__3822__auto____6433) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6433
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2359__auto____6434 = o == null ? null : o;
    return function() {
      var or__3824__auto____6435 = cljs.core._deref_with_timeout[goog.typeOf(x__2359__auto____6434)];
      if(or__3824__auto____6435) {
        return or__3824__auto____6435
      }else {
        var or__3824__auto____6436 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6436) {
          return or__3824__auto____6436
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6441 = o;
    if(and__3822__auto____6441) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6441
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2359__auto____6442 = o == null ? null : o;
    return function() {
      var or__3824__auto____6443 = cljs.core._meta[goog.typeOf(x__2359__auto____6442)];
      if(or__3824__auto____6443) {
        return or__3824__auto____6443
      }else {
        var or__3824__auto____6444 = cljs.core._meta["_"];
        if(or__3824__auto____6444) {
          return or__3824__auto____6444
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6449 = o;
    if(and__3822__auto____6449) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6449
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2359__auto____6450 = o == null ? null : o;
    return function() {
      var or__3824__auto____6451 = cljs.core._with_meta[goog.typeOf(x__2359__auto____6450)];
      if(or__3824__auto____6451) {
        return or__3824__auto____6451
      }else {
        var or__3824__auto____6452 = cljs.core._with_meta["_"];
        if(or__3824__auto____6452) {
          return or__3824__auto____6452
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6461 = coll;
      if(and__3822__auto____6461) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6461
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2359__auto____6462 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6463 = cljs.core._reduce[goog.typeOf(x__2359__auto____6462)];
        if(or__3824__auto____6463) {
          return or__3824__auto____6463
        }else {
          var or__3824__auto____6464 = cljs.core._reduce["_"];
          if(or__3824__auto____6464) {
            return or__3824__auto____6464
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6465 = coll;
      if(and__3822__auto____6465) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6465
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2359__auto____6466 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6467 = cljs.core._reduce[goog.typeOf(x__2359__auto____6466)];
        if(or__3824__auto____6467) {
          return or__3824__auto____6467
        }else {
          var or__3824__auto____6468 = cljs.core._reduce["_"];
          if(or__3824__auto____6468) {
            return or__3824__auto____6468
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6473 = coll;
    if(and__3822__auto____6473) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6473
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2359__auto____6474 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6475 = cljs.core._kv_reduce[goog.typeOf(x__2359__auto____6474)];
      if(or__3824__auto____6475) {
        return or__3824__auto____6475
      }else {
        var or__3824__auto____6476 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6476) {
          return or__3824__auto____6476
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6481 = o;
    if(and__3822__auto____6481) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6481
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2359__auto____6482 = o == null ? null : o;
    return function() {
      var or__3824__auto____6483 = cljs.core._equiv[goog.typeOf(x__2359__auto____6482)];
      if(or__3824__auto____6483) {
        return or__3824__auto____6483
      }else {
        var or__3824__auto____6484 = cljs.core._equiv["_"];
        if(or__3824__auto____6484) {
          return or__3824__auto____6484
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6489 = o;
    if(and__3822__auto____6489) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6489
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2359__auto____6490 = o == null ? null : o;
    return function() {
      var or__3824__auto____6491 = cljs.core._hash[goog.typeOf(x__2359__auto____6490)];
      if(or__3824__auto____6491) {
        return or__3824__auto____6491
      }else {
        var or__3824__auto____6492 = cljs.core._hash["_"];
        if(or__3824__auto____6492) {
          return or__3824__auto____6492
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6497 = o;
    if(and__3822__auto____6497) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6497
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2359__auto____6498 = o == null ? null : o;
    return function() {
      var or__3824__auto____6499 = cljs.core._seq[goog.typeOf(x__2359__auto____6498)];
      if(or__3824__auto____6499) {
        return or__3824__auto____6499
      }else {
        var or__3824__auto____6500 = cljs.core._seq["_"];
        if(or__3824__auto____6500) {
          return or__3824__auto____6500
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6505 = coll;
    if(and__3822__auto____6505) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6505
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2359__auto____6506 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6507 = cljs.core._rseq[goog.typeOf(x__2359__auto____6506)];
      if(or__3824__auto____6507) {
        return or__3824__auto____6507
      }else {
        var or__3824__auto____6508 = cljs.core._rseq["_"];
        if(or__3824__auto____6508) {
          return or__3824__auto____6508
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6513 = coll;
    if(and__3822__auto____6513) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6513
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2359__auto____6514 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6515 = cljs.core._sorted_seq[goog.typeOf(x__2359__auto____6514)];
      if(or__3824__auto____6515) {
        return or__3824__auto____6515
      }else {
        var or__3824__auto____6516 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6516) {
          return or__3824__auto____6516
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6521 = coll;
    if(and__3822__auto____6521) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6521
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2359__auto____6522 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6523 = cljs.core._sorted_seq_from[goog.typeOf(x__2359__auto____6522)];
      if(or__3824__auto____6523) {
        return or__3824__auto____6523
      }else {
        var or__3824__auto____6524 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6524) {
          return or__3824__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6529 = coll;
    if(and__3822__auto____6529) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6529
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2359__auto____6530 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6531 = cljs.core._entry_key[goog.typeOf(x__2359__auto____6530)];
      if(or__3824__auto____6531) {
        return or__3824__auto____6531
      }else {
        var or__3824__auto____6532 = cljs.core._entry_key["_"];
        if(or__3824__auto____6532) {
          return or__3824__auto____6532
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6537 = coll;
    if(and__3822__auto____6537) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6537
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2359__auto____6538 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6539 = cljs.core._comparator[goog.typeOf(x__2359__auto____6538)];
      if(or__3824__auto____6539) {
        return or__3824__auto____6539
      }else {
        var or__3824__auto____6540 = cljs.core._comparator["_"];
        if(or__3824__auto____6540) {
          return or__3824__auto____6540
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6545 = o;
    if(and__3822__auto____6545) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6545
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2359__auto____6546 = o == null ? null : o;
    return function() {
      var or__3824__auto____6547 = cljs.core._pr_seq[goog.typeOf(x__2359__auto____6546)];
      if(or__3824__auto____6547) {
        return or__3824__auto____6547
      }else {
        var or__3824__auto____6548 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6548) {
          return or__3824__auto____6548
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6553 = d;
    if(and__3822__auto____6553) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6553
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2359__auto____6554 = d == null ? null : d;
    return function() {
      var or__3824__auto____6555 = cljs.core._realized_QMARK_[goog.typeOf(x__2359__auto____6554)];
      if(or__3824__auto____6555) {
        return or__3824__auto____6555
      }else {
        var or__3824__auto____6556 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6556) {
          return or__3824__auto____6556
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6561 = this$;
    if(and__3822__auto____6561) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6561
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2359__auto____6562 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6563 = cljs.core._notify_watches[goog.typeOf(x__2359__auto____6562)];
      if(or__3824__auto____6563) {
        return or__3824__auto____6563
      }else {
        var or__3824__auto____6564 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6564) {
          return or__3824__auto____6564
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6569 = this$;
    if(and__3822__auto____6569) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6569
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2359__auto____6570 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6571 = cljs.core._add_watch[goog.typeOf(x__2359__auto____6570)];
      if(or__3824__auto____6571) {
        return or__3824__auto____6571
      }else {
        var or__3824__auto____6572 = cljs.core._add_watch["_"];
        if(or__3824__auto____6572) {
          return or__3824__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6577 = this$;
    if(and__3822__auto____6577) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6577
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2359__auto____6578 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6579 = cljs.core._remove_watch[goog.typeOf(x__2359__auto____6578)];
      if(or__3824__auto____6579) {
        return or__3824__auto____6579
      }else {
        var or__3824__auto____6580 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6580) {
          return or__3824__auto____6580
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6585 = coll;
    if(and__3822__auto____6585) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6585
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2359__auto____6586 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6587 = cljs.core._as_transient[goog.typeOf(x__2359__auto____6586)];
      if(or__3824__auto____6587) {
        return or__3824__auto____6587
      }else {
        var or__3824__auto____6588 = cljs.core._as_transient["_"];
        if(or__3824__auto____6588) {
          return or__3824__auto____6588
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6593 = tcoll;
    if(and__3822__auto____6593) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6593
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2359__auto____6594 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6595 = cljs.core._conj_BANG_[goog.typeOf(x__2359__auto____6594)];
      if(or__3824__auto____6595) {
        return or__3824__auto____6595
      }else {
        var or__3824__auto____6596 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6596) {
          return or__3824__auto____6596
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6601 = tcoll;
    if(and__3822__auto____6601) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6601
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2359__auto____6602 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6603 = cljs.core._persistent_BANG_[goog.typeOf(x__2359__auto____6602)];
      if(or__3824__auto____6603) {
        return or__3824__auto____6603
      }else {
        var or__3824__auto____6604 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6604) {
          return or__3824__auto____6604
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6609 = tcoll;
    if(and__3822__auto____6609) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6609
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2359__auto____6610 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6611 = cljs.core._assoc_BANG_[goog.typeOf(x__2359__auto____6610)];
      if(or__3824__auto____6611) {
        return or__3824__auto____6611
      }else {
        var or__3824__auto____6612 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6612) {
          return or__3824__auto____6612
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6617 = tcoll;
    if(and__3822__auto____6617) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6617
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2359__auto____6618 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6619 = cljs.core._dissoc_BANG_[goog.typeOf(x__2359__auto____6618)];
      if(or__3824__auto____6619) {
        return or__3824__auto____6619
      }else {
        var or__3824__auto____6620 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6620) {
          return or__3824__auto____6620
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6625 = tcoll;
    if(and__3822__auto____6625) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6625
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2359__auto____6626 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6627 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2359__auto____6626)];
      if(or__3824__auto____6627) {
        return or__3824__auto____6627
      }else {
        var or__3824__auto____6628 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6628) {
          return or__3824__auto____6628
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6633 = tcoll;
    if(and__3822__auto____6633) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6633
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2359__auto____6634 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6635 = cljs.core._pop_BANG_[goog.typeOf(x__2359__auto____6634)];
      if(or__3824__auto____6635) {
        return or__3824__auto____6635
      }else {
        var or__3824__auto____6636 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6636) {
          return or__3824__auto____6636
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6641 = tcoll;
    if(and__3822__auto____6641) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6641
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2359__auto____6642 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6643 = cljs.core._disjoin_BANG_[goog.typeOf(x__2359__auto____6642)];
      if(or__3824__auto____6643) {
        return or__3824__auto____6643
      }else {
        var or__3824__auto____6644 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6644) {
          return or__3824__auto____6644
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6649 = x;
    if(and__3822__auto____6649) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6649
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2359__auto____6650 = x == null ? null : x;
    return function() {
      var or__3824__auto____6651 = cljs.core._compare[goog.typeOf(x__2359__auto____6650)];
      if(or__3824__auto____6651) {
        return or__3824__auto____6651
      }else {
        var or__3824__auto____6652 = cljs.core._compare["_"];
        if(or__3824__auto____6652) {
          return or__3824__auto____6652
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6657 = coll;
    if(and__3822__auto____6657) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6657
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2359__auto____6658 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6659 = cljs.core._drop_first[goog.typeOf(x__2359__auto____6658)];
      if(or__3824__auto____6659) {
        return or__3824__auto____6659
      }else {
        var or__3824__auto____6660 = cljs.core._drop_first["_"];
        if(or__3824__auto____6660) {
          return or__3824__auto____6660
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6665 = coll;
    if(and__3822__auto____6665) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6665
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2359__auto____6666 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6667 = cljs.core._chunked_first[goog.typeOf(x__2359__auto____6666)];
      if(or__3824__auto____6667) {
        return or__3824__auto____6667
      }else {
        var or__3824__auto____6668 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6668) {
          return or__3824__auto____6668
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6673 = coll;
    if(and__3822__auto____6673) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6673
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2359__auto____6674 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6675 = cljs.core._chunked_rest[goog.typeOf(x__2359__auto____6674)];
      if(or__3824__auto____6675) {
        return or__3824__auto____6675
      }else {
        var or__3824__auto____6676 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6676) {
          return or__3824__auto____6676
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6681 = coll;
    if(and__3822__auto____6681) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6681
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2359__auto____6682 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6683 = cljs.core._chunked_next[goog.typeOf(x__2359__auto____6682)];
      if(or__3824__auto____6683) {
        return or__3824__auto____6683
      }else {
        var or__3824__auto____6684 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6684) {
          return or__3824__auto____6684
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6686 = x === y;
    if(or__3824__auto____6686) {
      return or__3824__auto____6686
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6687__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6688 = y;
            var G__6689 = cljs.core.first.call(null, more);
            var G__6690 = cljs.core.next.call(null, more);
            x = G__6688;
            y = G__6689;
            more = G__6690;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6687 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6687__delegate.call(this, x, y, more)
    };
    G__6687.cljs$lang$maxFixedArity = 2;
    G__6687.cljs$lang$applyTo = function(arglist__6691) {
      var x = cljs.core.first(arglist__6691);
      var y = cljs.core.first(cljs.core.next(arglist__6691));
      var more = cljs.core.rest(cljs.core.next(arglist__6691));
      return G__6687__delegate(x, y, more)
    };
    G__6687.cljs$lang$arity$variadic = G__6687__delegate;
    return G__6687
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6692 = null;
  var G__6692__2 = function(o, k) {
    return null
  };
  var G__6692__3 = function(o, k, not_found) {
    return not_found
  };
  G__6692 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6692__2.call(this, o, k);
      case 3:
        return G__6692__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6692
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6693 = null;
  var G__6693__2 = function(_, f) {
    return f.call(null)
  };
  var G__6693__3 = function(_, f, start) {
    return start
  };
  G__6693 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6693__2.call(this, _, f);
      case 3:
        return G__6693__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6693
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6694 = null;
  var G__6694__2 = function(_, n) {
    return null
  };
  var G__6694__3 = function(_, n, not_found) {
    return not_found
  };
  G__6694 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6694__2.call(this, _, n);
      case 3:
        return G__6694__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6694
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6695 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6695) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6695
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6708 = cljs.core._count.call(null, cicoll);
    if(cnt__6708 === 0) {
      return f.call(null)
    }else {
      var val__6709 = cljs.core._nth.call(null, cicoll, 0);
      var n__6710 = 1;
      while(true) {
        if(n__6710 < cnt__6708) {
          var nval__6711 = f.call(null, val__6709, cljs.core._nth.call(null, cicoll, n__6710));
          if(cljs.core.reduced_QMARK_.call(null, nval__6711)) {
            return cljs.core.deref.call(null, nval__6711)
          }else {
            var G__6720 = nval__6711;
            var G__6721 = n__6710 + 1;
            val__6709 = G__6720;
            n__6710 = G__6721;
            continue
          }
        }else {
          return val__6709
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6712 = cljs.core._count.call(null, cicoll);
    var val__6713 = val;
    var n__6714 = 0;
    while(true) {
      if(n__6714 < cnt__6712) {
        var nval__6715 = f.call(null, val__6713, cljs.core._nth.call(null, cicoll, n__6714));
        if(cljs.core.reduced_QMARK_.call(null, nval__6715)) {
          return cljs.core.deref.call(null, nval__6715)
        }else {
          var G__6722 = nval__6715;
          var G__6723 = n__6714 + 1;
          val__6713 = G__6722;
          n__6714 = G__6723;
          continue
        }
      }else {
        return val__6713
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6716 = cljs.core._count.call(null, cicoll);
    var val__6717 = val;
    var n__6718 = idx;
    while(true) {
      if(n__6718 < cnt__6716) {
        var nval__6719 = f.call(null, val__6717, cljs.core._nth.call(null, cicoll, n__6718));
        if(cljs.core.reduced_QMARK_.call(null, nval__6719)) {
          return cljs.core.deref.call(null, nval__6719)
        }else {
          var G__6724 = nval__6719;
          var G__6725 = n__6718 + 1;
          val__6717 = G__6724;
          n__6718 = G__6725;
          continue
        }
      }else {
        return val__6717
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6738 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6739 = arr[0];
      var n__6740 = 1;
      while(true) {
        if(n__6740 < cnt__6738) {
          var nval__6741 = f.call(null, val__6739, arr[n__6740]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6741)) {
            return cljs.core.deref.call(null, nval__6741)
          }else {
            var G__6750 = nval__6741;
            var G__6751 = n__6740 + 1;
            val__6739 = G__6750;
            n__6740 = G__6751;
            continue
          }
        }else {
          return val__6739
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6742 = arr.length;
    var val__6743 = val;
    var n__6744 = 0;
    while(true) {
      if(n__6744 < cnt__6742) {
        var nval__6745 = f.call(null, val__6743, arr[n__6744]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6745)) {
          return cljs.core.deref.call(null, nval__6745)
        }else {
          var G__6752 = nval__6745;
          var G__6753 = n__6744 + 1;
          val__6743 = G__6752;
          n__6744 = G__6753;
          continue
        }
      }else {
        return val__6743
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6746 = arr.length;
    var val__6747 = val;
    var n__6748 = idx;
    while(true) {
      if(n__6748 < cnt__6746) {
        var nval__6749 = f.call(null, val__6747, arr[n__6748]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6749)) {
          return cljs.core.deref.call(null, nval__6749)
        }else {
          var G__6754 = nval__6749;
          var G__6755 = n__6748 + 1;
          val__6747 = G__6754;
          n__6748 = G__6755;
          continue
        }
      }else {
        return val__6747
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6756 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6757 = this;
  if(this__6757.i + 1 < this__6757.a.length) {
    return new cljs.core.IndexedSeq(this__6757.a, this__6757.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6758 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6759 = this;
  var c__6760 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6760 > 0) {
    return new cljs.core.RSeq(coll, c__6760 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6761 = this;
  var this__6762 = this;
  return cljs.core.pr_str.call(null, this__6762)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6763 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6763.a)) {
    return cljs.core.ci_reduce.call(null, this__6763.a, f, this__6763.a[this__6763.i], this__6763.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6763.a[this__6763.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6764 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6764.a)) {
    return cljs.core.ci_reduce.call(null, this__6764.a, f, start, this__6764.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6765 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6766 = this;
  return this__6766.a.length - this__6766.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6767 = this;
  return this__6767.a[this__6767.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6768 = this;
  if(this__6768.i + 1 < this__6768.a.length) {
    return new cljs.core.IndexedSeq(this__6768.a, this__6768.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6769 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6770 = this;
  var i__6771 = n + this__6770.i;
  if(i__6771 < this__6770.a.length) {
    return this__6770.a[i__6771]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6772 = this;
  var i__6773 = n + this__6772.i;
  if(i__6773 < this__6772.a.length) {
    return this__6772.a[i__6773]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6774 = null;
  var G__6774__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6774__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6774 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6774__2.call(this, array, f);
      case 3:
        return G__6774__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6774
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6775 = null;
  var G__6775__2 = function(array, k) {
    return array[k]
  };
  var G__6775__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6775 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6775__2.call(this, array, k);
      case 3:
        return G__6775__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6775
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6776 = null;
  var G__6776__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6776__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6776 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6776__2.call(this, array, n);
      case 3:
        return G__6776__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6776
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6777 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6778 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6779 = this;
  var this__6780 = this;
  return cljs.core.pr_str.call(null, this__6780)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6781 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6782 = this;
  return this__6782.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6783 = this;
  return cljs.core._nth.call(null, this__6783.ci, this__6783.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6784 = this;
  if(this__6784.i > 0) {
    return new cljs.core.RSeq(this__6784.ci, this__6784.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6785 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6786 = this;
  return new cljs.core.RSeq(this__6786.ci, this__6786.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6787 = this;
  return this__6787.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6791__6792 = coll;
      if(G__6791__6792) {
        if(function() {
          var or__3824__auto____6793 = G__6791__6792.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6793) {
            return or__3824__auto____6793
          }else {
            return G__6791__6792.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6791__6792.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6791__6792)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6791__6792)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6798__6799 = coll;
      if(G__6798__6799) {
        if(function() {
          var or__3824__auto____6800 = G__6798__6799.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6800) {
            return or__3824__auto____6800
          }else {
            return G__6798__6799.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6798__6799.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6798__6799)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6798__6799)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6801 = cljs.core.seq.call(null, coll);
      if(s__6801 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6801)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6806__6807 = coll;
      if(G__6806__6807) {
        if(function() {
          var or__3824__auto____6808 = G__6806__6807.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6808) {
            return or__3824__auto____6808
          }else {
            return G__6806__6807.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6806__6807.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6806__6807)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6806__6807)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6809 = cljs.core.seq.call(null, coll);
      if(!(s__6809 == null)) {
        return cljs.core._rest.call(null, s__6809)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6813__6814 = coll;
      if(G__6813__6814) {
        if(function() {
          var or__3824__auto____6815 = G__6813__6814.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6815) {
            return or__3824__auto____6815
          }else {
            return G__6813__6814.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6813__6814.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6813__6814)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6813__6814)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6817 = cljs.core.next.call(null, s);
    if(!(sn__6817 == null)) {
      var G__6818 = sn__6817;
      s = G__6818;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6819__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6820 = conj.call(null, coll, x);
          var G__6821 = cljs.core.first.call(null, xs);
          var G__6822 = cljs.core.next.call(null, xs);
          coll = G__6820;
          x = G__6821;
          xs = G__6822;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6819 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6819__delegate.call(this, coll, x, xs)
    };
    G__6819.cljs$lang$maxFixedArity = 2;
    G__6819.cljs$lang$applyTo = function(arglist__6823) {
      var coll = cljs.core.first(arglist__6823);
      var x = cljs.core.first(cljs.core.next(arglist__6823));
      var xs = cljs.core.rest(cljs.core.next(arglist__6823));
      return G__6819__delegate(coll, x, xs)
    };
    G__6819.cljs$lang$arity$variadic = G__6819__delegate;
    return G__6819
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6826 = cljs.core.seq.call(null, coll);
  var acc__6827 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6826)) {
      return acc__6827 + cljs.core._count.call(null, s__6826)
    }else {
      var G__6828 = cljs.core.next.call(null, s__6826);
      var G__6829 = acc__6827 + 1;
      s__6826 = G__6828;
      acc__6827 = G__6829;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6836__6837 = coll;
        if(G__6836__6837) {
          if(function() {
            var or__3824__auto____6838 = G__6836__6837.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6838) {
              return or__3824__auto____6838
            }else {
              return G__6836__6837.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6836__6837.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6836__6837)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6836__6837)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6839__6840 = coll;
        if(G__6839__6840) {
          if(function() {
            var or__3824__auto____6841 = G__6839__6840.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6841) {
              return or__3824__auto____6841
            }else {
              return G__6839__6840.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6839__6840.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6839__6840)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6839__6840)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6844__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6843 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6845 = ret__6843;
          var G__6846 = cljs.core.first.call(null, kvs);
          var G__6847 = cljs.core.second.call(null, kvs);
          var G__6848 = cljs.core.nnext.call(null, kvs);
          coll = G__6845;
          k = G__6846;
          v = G__6847;
          kvs = G__6848;
          continue
        }else {
          return ret__6843
        }
        break
      }
    };
    var G__6844 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6844__delegate.call(this, coll, k, v, kvs)
    };
    G__6844.cljs$lang$maxFixedArity = 3;
    G__6844.cljs$lang$applyTo = function(arglist__6849) {
      var coll = cljs.core.first(arglist__6849);
      var k = cljs.core.first(cljs.core.next(arglist__6849));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6849)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6849)));
      return G__6844__delegate(coll, k, v, kvs)
    };
    G__6844.cljs$lang$arity$variadic = G__6844__delegate;
    return G__6844
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6852__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6851 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6853 = ret__6851;
          var G__6854 = cljs.core.first.call(null, ks);
          var G__6855 = cljs.core.next.call(null, ks);
          coll = G__6853;
          k = G__6854;
          ks = G__6855;
          continue
        }else {
          return ret__6851
        }
        break
      }
    };
    var G__6852 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6852__delegate.call(this, coll, k, ks)
    };
    G__6852.cljs$lang$maxFixedArity = 2;
    G__6852.cljs$lang$applyTo = function(arglist__6856) {
      var coll = cljs.core.first(arglist__6856);
      var k = cljs.core.first(cljs.core.next(arglist__6856));
      var ks = cljs.core.rest(cljs.core.next(arglist__6856));
      return G__6852__delegate(coll, k, ks)
    };
    G__6852.cljs$lang$arity$variadic = G__6852__delegate;
    return G__6852
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6860__6861 = o;
    if(G__6860__6861) {
      if(function() {
        var or__3824__auto____6862 = G__6860__6861.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6862) {
          return or__3824__auto____6862
        }else {
          return G__6860__6861.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6860__6861.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6860__6861)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6860__6861)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6865__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6864 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6866 = ret__6864;
          var G__6867 = cljs.core.first.call(null, ks);
          var G__6868 = cljs.core.next.call(null, ks);
          coll = G__6866;
          k = G__6867;
          ks = G__6868;
          continue
        }else {
          return ret__6864
        }
        break
      }
    };
    var G__6865 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6865__delegate.call(this, coll, k, ks)
    };
    G__6865.cljs$lang$maxFixedArity = 2;
    G__6865.cljs$lang$applyTo = function(arglist__6869) {
      var coll = cljs.core.first(arglist__6869);
      var k = cljs.core.first(cljs.core.next(arglist__6869));
      var ks = cljs.core.rest(cljs.core.next(arglist__6869));
      return G__6865__delegate(coll, k, ks)
    };
    G__6865.cljs$lang$arity$variadic = G__6865__delegate;
    return G__6865
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6871 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6871;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6871
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6873 = cljs.core.string_hash_cache[k];
  if(!(h__6873 == null)) {
    return h__6873
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6875 = goog.isString(o);
      if(and__3822__auto____6875) {
        return check_cache
      }else {
        return and__3822__auto____6875
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6879__6880 = x;
    if(G__6879__6880) {
      if(function() {
        var or__3824__auto____6881 = G__6879__6880.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6881) {
          return or__3824__auto____6881
        }else {
          return G__6879__6880.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6879__6880.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6879__6880)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6879__6880)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6885__6886 = x;
    if(G__6885__6886) {
      if(function() {
        var or__3824__auto____6887 = G__6885__6886.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6887) {
          return or__3824__auto____6887
        }else {
          return G__6885__6886.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6885__6886.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6885__6886)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6885__6886)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6891__6892 = x;
  if(G__6891__6892) {
    if(function() {
      var or__3824__auto____6893 = G__6891__6892.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6893) {
        return or__3824__auto____6893
      }else {
        return G__6891__6892.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6891__6892.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6891__6892)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6891__6892)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6897__6898 = x;
  if(G__6897__6898) {
    if(function() {
      var or__3824__auto____6899 = G__6897__6898.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6899) {
        return or__3824__auto____6899
      }else {
        return G__6897__6898.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6897__6898.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6897__6898)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6897__6898)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6903__6904 = x;
  if(G__6903__6904) {
    if(function() {
      var or__3824__auto____6905 = G__6903__6904.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6905) {
        return or__3824__auto____6905
      }else {
        return G__6903__6904.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6903__6904.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6903__6904)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6903__6904)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6909__6910 = x;
  if(G__6909__6910) {
    if(function() {
      var or__3824__auto____6911 = G__6909__6910.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6911) {
        return or__3824__auto____6911
      }else {
        return G__6909__6910.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6909__6910.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6909__6910)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6909__6910)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6915__6916 = x;
  if(G__6915__6916) {
    if(function() {
      var or__3824__auto____6917 = G__6915__6916.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6917) {
        return or__3824__auto____6917
      }else {
        return G__6915__6916.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6915__6916.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6915__6916)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6915__6916)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6921__6922 = x;
    if(G__6921__6922) {
      if(function() {
        var or__3824__auto____6923 = G__6921__6922.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6923) {
          return or__3824__auto____6923
        }else {
          return G__6921__6922.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6921__6922.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6921__6922)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6921__6922)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6927__6928 = x;
  if(G__6927__6928) {
    if(function() {
      var or__3824__auto____6929 = G__6927__6928.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6929) {
        return or__3824__auto____6929
      }else {
        return G__6927__6928.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6927__6928.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6927__6928)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6927__6928)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6933__6934 = x;
  if(G__6933__6934) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6935 = null;
      if(cljs.core.truth_(or__3824__auto____6935)) {
        return or__3824__auto____6935
      }else {
        return G__6933__6934.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6933__6934.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6933__6934)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6933__6934)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6936__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6936 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6936__delegate.call(this, keyvals)
    };
    G__6936.cljs$lang$maxFixedArity = 0;
    G__6936.cljs$lang$applyTo = function(arglist__6937) {
      var keyvals = cljs.core.seq(arglist__6937);
      return G__6936__delegate(keyvals)
    };
    G__6936.cljs$lang$arity$variadic = G__6936__delegate;
    return G__6936
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6939 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6939.push(key)
  });
  return keys__6939
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6943 = i;
  var j__6944 = j;
  var len__6945 = len;
  while(true) {
    if(len__6945 === 0) {
      return to
    }else {
      to[j__6944] = from[i__6943];
      var G__6946 = i__6943 + 1;
      var G__6947 = j__6944 + 1;
      var G__6948 = len__6945 - 1;
      i__6943 = G__6946;
      j__6944 = G__6947;
      len__6945 = G__6948;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6952 = i + (len - 1);
  var j__6953 = j + (len - 1);
  var len__6954 = len;
  while(true) {
    if(len__6954 === 0) {
      return to
    }else {
      to[j__6953] = from[i__6952];
      var G__6955 = i__6952 - 1;
      var G__6956 = j__6953 - 1;
      var G__6957 = len__6954 - 1;
      i__6952 = G__6955;
      j__6953 = G__6956;
      len__6954 = G__6957;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6961__6962 = s;
    if(G__6961__6962) {
      if(function() {
        var or__3824__auto____6963 = G__6961__6962.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____6963) {
          return or__3824__auto____6963
        }else {
          return G__6961__6962.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6961__6962.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6961__6962)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6961__6962)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6967__6968 = s;
  if(G__6967__6968) {
    if(function() {
      var or__3824__auto____6969 = G__6967__6968.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____6969) {
        return or__3824__auto____6969
      }else {
        return G__6967__6968.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6967__6968.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6967__6968)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6967__6968)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____6972 = goog.isString(x);
  if(and__3822__auto____6972) {
    return!function() {
      var or__3824__auto____6973 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____6973) {
        return or__3824__auto____6973
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____6972
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____6975 = goog.isString(x);
  if(and__3822__auto____6975) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____6975
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____6977 = goog.isString(x);
  if(and__3822__auto____6977) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____6977
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____6982 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____6982) {
    return or__3824__auto____6982
  }else {
    var G__6983__6984 = f;
    if(G__6983__6984) {
      if(function() {
        var or__3824__auto____6985 = G__6983__6984.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____6985) {
          return or__3824__auto____6985
        }else {
          return G__6983__6984.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6983__6984.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6983__6984)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6983__6984)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____6987 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____6987) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____6987
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____6990 = coll;
    if(cljs.core.truth_(and__3822__auto____6990)) {
      var and__3822__auto____6991 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____6991) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____6991
      }
    }else {
      return and__3822__auto____6990
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7000__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__6996 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__6997 = more;
        while(true) {
          var x__6998 = cljs.core.first.call(null, xs__6997);
          var etc__6999 = cljs.core.next.call(null, xs__6997);
          if(cljs.core.truth_(xs__6997)) {
            if(cljs.core.contains_QMARK_.call(null, s__6996, x__6998)) {
              return false
            }else {
              var G__7001 = cljs.core.conj.call(null, s__6996, x__6998);
              var G__7002 = etc__6999;
              s__6996 = G__7001;
              xs__6997 = G__7002;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7000 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7000__delegate.call(this, x, y, more)
    };
    G__7000.cljs$lang$maxFixedArity = 2;
    G__7000.cljs$lang$applyTo = function(arglist__7003) {
      var x = cljs.core.first(arglist__7003);
      var y = cljs.core.first(cljs.core.next(arglist__7003));
      var more = cljs.core.rest(cljs.core.next(arglist__7003));
      return G__7000__delegate(x, y, more)
    };
    G__7000.cljs$lang$arity$variadic = G__7000__delegate;
    return G__7000
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7007__7008 = x;
            if(G__7007__7008) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7009 = null;
                if(cljs.core.truth_(or__3824__auto____7009)) {
                  return or__3824__auto____7009
                }else {
                  return G__7007__7008.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7007__7008.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7007__7008)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7007__7008)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7014 = cljs.core.count.call(null, xs);
    var yl__7015 = cljs.core.count.call(null, ys);
    if(xl__7014 < yl__7015) {
      return-1
    }else {
      if(xl__7014 > yl__7015) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7014, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7016 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7017 = d__7016 === 0;
        if(and__3822__auto____7017) {
          return n + 1 < len
        }else {
          return and__3822__auto____7017
        }
      }()) {
        var G__7018 = xs;
        var G__7019 = ys;
        var G__7020 = len;
        var G__7021 = n + 1;
        xs = G__7018;
        ys = G__7019;
        len = G__7020;
        n = G__7021;
        continue
      }else {
        return d__7016
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7023 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7023)) {
        return r__7023
      }else {
        if(cljs.core.truth_(r__7023)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7025 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7025, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7025)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7031 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7031) {
      var s__7032 = temp__3971__auto____7031;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7032), cljs.core.next.call(null, s__7032))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7033 = val;
    var coll__7034 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7034) {
        var nval__7035 = f.call(null, val__7033, cljs.core.first.call(null, coll__7034));
        if(cljs.core.reduced_QMARK_.call(null, nval__7035)) {
          return cljs.core.deref.call(null, nval__7035)
        }else {
          var G__7036 = nval__7035;
          var G__7037 = cljs.core.next.call(null, coll__7034);
          val__7033 = G__7036;
          coll__7034 = G__7037;
          continue
        }
      }else {
        return val__7033
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7039 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7039);
  return cljs.core.vec.call(null, a__7039)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7046__7047 = coll;
      if(G__7046__7047) {
        if(function() {
          var or__3824__auto____7048 = G__7046__7047.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7048) {
            return or__3824__auto____7048
          }else {
            return G__7046__7047.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7046__7047.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7046__7047)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7046__7047)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7049__7050 = coll;
      if(G__7049__7050) {
        if(function() {
          var or__3824__auto____7051 = G__7049__7050.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7051) {
            return or__3824__auto____7051
          }else {
            return G__7049__7050.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7049__7050.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7049__7050)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7049__7050)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7052 = this;
  return this__7052.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7053__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7053 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7053__delegate.call(this, x, y, more)
    };
    G__7053.cljs$lang$maxFixedArity = 2;
    G__7053.cljs$lang$applyTo = function(arglist__7054) {
      var x = cljs.core.first(arglist__7054);
      var y = cljs.core.first(cljs.core.next(arglist__7054));
      var more = cljs.core.rest(cljs.core.next(arglist__7054));
      return G__7053__delegate(x, y, more)
    };
    G__7053.cljs$lang$arity$variadic = G__7053__delegate;
    return G__7053
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7055__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7055 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7055__delegate.call(this, x, y, more)
    };
    G__7055.cljs$lang$maxFixedArity = 2;
    G__7055.cljs$lang$applyTo = function(arglist__7056) {
      var x = cljs.core.first(arglist__7056);
      var y = cljs.core.first(cljs.core.next(arglist__7056));
      var more = cljs.core.rest(cljs.core.next(arglist__7056));
      return G__7055__delegate(x, y, more)
    };
    G__7055.cljs$lang$arity$variadic = G__7055__delegate;
    return G__7055
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7057__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7057 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7057__delegate.call(this, x, y, more)
    };
    G__7057.cljs$lang$maxFixedArity = 2;
    G__7057.cljs$lang$applyTo = function(arglist__7058) {
      var x = cljs.core.first(arglist__7058);
      var y = cljs.core.first(cljs.core.next(arglist__7058));
      var more = cljs.core.rest(cljs.core.next(arglist__7058));
      return G__7057__delegate(x, y, more)
    };
    G__7057.cljs$lang$arity$variadic = G__7057__delegate;
    return G__7057
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7059__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7059 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7059__delegate.call(this, x, y, more)
    };
    G__7059.cljs$lang$maxFixedArity = 2;
    G__7059.cljs$lang$applyTo = function(arglist__7060) {
      var x = cljs.core.first(arglist__7060);
      var y = cljs.core.first(cljs.core.next(arglist__7060));
      var more = cljs.core.rest(cljs.core.next(arglist__7060));
      return G__7059__delegate(x, y, more)
    };
    G__7059.cljs$lang$arity$variadic = G__7059__delegate;
    return G__7059
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7061__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7062 = y;
            var G__7063 = cljs.core.first.call(null, more);
            var G__7064 = cljs.core.next.call(null, more);
            x = G__7062;
            y = G__7063;
            more = G__7064;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7061 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7061__delegate.call(this, x, y, more)
    };
    G__7061.cljs$lang$maxFixedArity = 2;
    G__7061.cljs$lang$applyTo = function(arglist__7065) {
      var x = cljs.core.first(arglist__7065);
      var y = cljs.core.first(cljs.core.next(arglist__7065));
      var more = cljs.core.rest(cljs.core.next(arglist__7065));
      return G__7061__delegate(x, y, more)
    };
    G__7061.cljs$lang$arity$variadic = G__7061__delegate;
    return G__7061
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7066__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7067 = y;
            var G__7068 = cljs.core.first.call(null, more);
            var G__7069 = cljs.core.next.call(null, more);
            x = G__7067;
            y = G__7068;
            more = G__7069;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7066 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7066__delegate.call(this, x, y, more)
    };
    G__7066.cljs$lang$maxFixedArity = 2;
    G__7066.cljs$lang$applyTo = function(arglist__7070) {
      var x = cljs.core.first(arglist__7070);
      var y = cljs.core.first(cljs.core.next(arglist__7070));
      var more = cljs.core.rest(cljs.core.next(arglist__7070));
      return G__7066__delegate(x, y, more)
    };
    G__7066.cljs$lang$arity$variadic = G__7066__delegate;
    return G__7066
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7071__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7072 = y;
            var G__7073 = cljs.core.first.call(null, more);
            var G__7074 = cljs.core.next.call(null, more);
            x = G__7072;
            y = G__7073;
            more = G__7074;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7071 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7071__delegate.call(this, x, y, more)
    };
    G__7071.cljs$lang$maxFixedArity = 2;
    G__7071.cljs$lang$applyTo = function(arglist__7075) {
      var x = cljs.core.first(arglist__7075);
      var y = cljs.core.first(cljs.core.next(arglist__7075));
      var more = cljs.core.rest(cljs.core.next(arglist__7075));
      return G__7071__delegate(x, y, more)
    };
    G__7071.cljs$lang$arity$variadic = G__7071__delegate;
    return G__7071
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7076__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7077 = y;
            var G__7078 = cljs.core.first.call(null, more);
            var G__7079 = cljs.core.next.call(null, more);
            x = G__7077;
            y = G__7078;
            more = G__7079;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7076 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7076__delegate.call(this, x, y, more)
    };
    G__7076.cljs$lang$maxFixedArity = 2;
    G__7076.cljs$lang$applyTo = function(arglist__7080) {
      var x = cljs.core.first(arglist__7080);
      var y = cljs.core.first(cljs.core.next(arglist__7080));
      var more = cljs.core.rest(cljs.core.next(arglist__7080));
      return G__7076__delegate(x, y, more)
    };
    G__7076.cljs$lang$arity$variadic = G__7076__delegate;
    return G__7076
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7081__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7081 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7081__delegate.call(this, x, y, more)
    };
    G__7081.cljs$lang$maxFixedArity = 2;
    G__7081.cljs$lang$applyTo = function(arglist__7082) {
      var x = cljs.core.first(arglist__7082);
      var y = cljs.core.first(cljs.core.next(arglist__7082));
      var more = cljs.core.rest(cljs.core.next(arglist__7082));
      return G__7081__delegate(x, y, more)
    };
    G__7081.cljs$lang$arity$variadic = G__7081__delegate;
    return G__7081
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7083__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7083 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7083__delegate.call(this, x, y, more)
    };
    G__7083.cljs$lang$maxFixedArity = 2;
    G__7083.cljs$lang$applyTo = function(arglist__7084) {
      var x = cljs.core.first(arglist__7084);
      var y = cljs.core.first(cljs.core.next(arglist__7084));
      var more = cljs.core.rest(cljs.core.next(arglist__7084));
      return G__7083__delegate(x, y, more)
    };
    G__7083.cljs$lang$arity$variadic = G__7083__delegate;
    return G__7083
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7086 = n % d;
  return cljs.core.fix.call(null, (n - rem__7086) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7088 = cljs.core.quot.call(null, n, d);
  return n - d * q__7088
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7091 = v - (v >> 1 & 1431655765);
  var v__7092 = (v__7091 & 858993459) + (v__7091 >> 2 & 858993459);
  return(v__7092 + (v__7092 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7093__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7094 = y;
            var G__7095 = cljs.core.first.call(null, more);
            var G__7096 = cljs.core.next.call(null, more);
            x = G__7094;
            y = G__7095;
            more = G__7096;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7093 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7093__delegate.call(this, x, y, more)
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = function(arglist__7097) {
      var x = cljs.core.first(arglist__7097);
      var y = cljs.core.first(cljs.core.next(arglist__7097));
      var more = cljs.core.rest(cljs.core.next(arglist__7097));
      return G__7093__delegate(x, y, more)
    };
    G__7093.cljs$lang$arity$variadic = G__7093__delegate;
    return G__7093
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7101 = n;
  var xs__7102 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7103 = xs__7102;
      if(and__3822__auto____7103) {
        return n__7101 > 0
      }else {
        return and__3822__auto____7103
      }
    }())) {
      var G__7104 = n__7101 - 1;
      var G__7105 = cljs.core.next.call(null, xs__7102);
      n__7101 = G__7104;
      xs__7102 = G__7105;
      continue
    }else {
      return xs__7102
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7106__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7107 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7108 = cljs.core.next.call(null, more);
            sb = G__7107;
            more = G__7108;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7106 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7106__delegate.call(this, x, ys)
    };
    G__7106.cljs$lang$maxFixedArity = 1;
    G__7106.cljs$lang$applyTo = function(arglist__7109) {
      var x = cljs.core.first(arglist__7109);
      var ys = cljs.core.rest(arglist__7109);
      return G__7106__delegate(x, ys)
    };
    G__7106.cljs$lang$arity$variadic = G__7106__delegate;
    return G__7106
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7110__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7111 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7112 = cljs.core.next.call(null, more);
            sb = G__7111;
            more = G__7112;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7110 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7110__delegate.call(this, x, ys)
    };
    G__7110.cljs$lang$maxFixedArity = 1;
    G__7110.cljs$lang$applyTo = function(arglist__7113) {
      var x = cljs.core.first(arglist__7113);
      var ys = cljs.core.rest(arglist__7113);
      return G__7110__delegate(x, ys)
    };
    G__7110.cljs$lang$arity$variadic = G__7110__delegate;
    return G__7110
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7114) {
    var fmt = cljs.core.first(arglist__7114);
    var args = cljs.core.rest(arglist__7114);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7117 = cljs.core.seq.call(null, x);
    var ys__7118 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7117 == null) {
        return ys__7118 == null
      }else {
        if(ys__7118 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7117), cljs.core.first.call(null, ys__7118))) {
            var G__7119 = cljs.core.next.call(null, xs__7117);
            var G__7120 = cljs.core.next.call(null, ys__7118);
            xs__7117 = G__7119;
            ys__7118 = G__7120;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7121_SHARP_, p2__7122_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7121_SHARP_, cljs.core.hash.call(null, p2__7122_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7126 = 0;
  var s__7127 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7127) {
      var e__7128 = cljs.core.first.call(null, s__7127);
      var G__7129 = (h__7126 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7128)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7128)))) % 4503599627370496;
      var G__7130 = cljs.core.next.call(null, s__7127);
      h__7126 = G__7129;
      s__7127 = G__7130;
      continue
    }else {
      return h__7126
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7134 = 0;
  var s__7135 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7135) {
      var e__7136 = cljs.core.first.call(null, s__7135);
      var G__7137 = (h__7134 + cljs.core.hash.call(null, e__7136)) % 4503599627370496;
      var G__7138 = cljs.core.next.call(null, s__7135);
      h__7134 = G__7137;
      s__7135 = G__7138;
      continue
    }else {
      return h__7134
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7159__7160 = cljs.core.seq.call(null, fn_map);
  if(G__7159__7160) {
    var G__7162__7164 = cljs.core.first.call(null, G__7159__7160);
    var vec__7163__7165 = G__7162__7164;
    var key_name__7166 = cljs.core.nth.call(null, vec__7163__7165, 0, null);
    var f__7167 = cljs.core.nth.call(null, vec__7163__7165, 1, null);
    var G__7159__7168 = G__7159__7160;
    var G__7162__7169 = G__7162__7164;
    var G__7159__7170 = G__7159__7168;
    while(true) {
      var vec__7171__7172 = G__7162__7169;
      var key_name__7173 = cljs.core.nth.call(null, vec__7171__7172, 0, null);
      var f__7174 = cljs.core.nth.call(null, vec__7171__7172, 1, null);
      var G__7159__7175 = G__7159__7170;
      var str_name__7176 = cljs.core.name.call(null, key_name__7173);
      obj[str_name__7176] = f__7174;
      var temp__3974__auto____7177 = cljs.core.next.call(null, G__7159__7175);
      if(temp__3974__auto____7177) {
        var G__7159__7178 = temp__3974__auto____7177;
        var G__7179 = cljs.core.first.call(null, G__7159__7178);
        var G__7180 = G__7159__7178;
        G__7162__7169 = G__7179;
        G__7159__7170 = G__7180;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7181 = this;
  var h__2188__auto____7182 = this__7181.__hash;
  if(!(h__2188__auto____7182 == null)) {
    return h__2188__auto____7182
  }else {
    var h__2188__auto____7183 = cljs.core.hash_coll.call(null, coll);
    this__7181.__hash = h__2188__auto____7183;
    return h__2188__auto____7183
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7184 = this;
  if(this__7184.count === 1) {
    return null
  }else {
    return this__7184.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7185 = this;
  return new cljs.core.List(this__7185.meta, o, coll, this__7185.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7186 = this;
  var this__7187 = this;
  return cljs.core.pr_str.call(null, this__7187)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7188 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7189 = this;
  return this__7189.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7190 = this;
  return this__7190.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7191 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7192 = this;
  return this__7192.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7193 = this;
  if(this__7193.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7193.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7194 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7195 = this;
  return new cljs.core.List(meta, this__7195.first, this__7195.rest, this__7195.count, this__7195.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7196 = this;
  return this__7196.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7197 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7198 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7199 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7200 = this;
  return new cljs.core.List(this__7200.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7201 = this;
  var this__7202 = this;
  return cljs.core.pr_str.call(null, this__7202)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7203 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7204 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7205 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7206 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7207 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7208 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7209 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7210 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7211 = this;
  return this__7211.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7212 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7216__7217 = coll;
  if(G__7216__7217) {
    if(function() {
      var or__3824__auto____7218 = G__7216__7217.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7218) {
        return or__3824__auto____7218
      }else {
        return G__7216__7217.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7216__7217.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7216__7217)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7216__7217)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7219__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7219 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7219__delegate.call(this, x, y, z, items)
    };
    G__7219.cljs$lang$maxFixedArity = 3;
    G__7219.cljs$lang$applyTo = function(arglist__7220) {
      var x = cljs.core.first(arglist__7220);
      var y = cljs.core.first(cljs.core.next(arglist__7220));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7220)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7220)));
      return G__7219__delegate(x, y, z, items)
    };
    G__7219.cljs$lang$arity$variadic = G__7219__delegate;
    return G__7219
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7221 = this;
  var h__2188__auto____7222 = this__7221.__hash;
  if(!(h__2188__auto____7222 == null)) {
    return h__2188__auto____7222
  }else {
    var h__2188__auto____7223 = cljs.core.hash_coll.call(null, coll);
    this__7221.__hash = h__2188__auto____7223;
    return h__2188__auto____7223
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7224 = this;
  if(this__7224.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7224.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7225 = this;
  return new cljs.core.Cons(null, o, coll, this__7225.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7226 = this;
  var this__7227 = this;
  return cljs.core.pr_str.call(null, this__7227)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7228 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7229 = this;
  return this__7229.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7230 = this;
  if(this__7230.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7230.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7231 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7232 = this;
  return new cljs.core.Cons(meta, this__7232.first, this__7232.rest, this__7232.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7233 = this;
  return this__7233.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7234 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7234.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7239 = coll == null;
    if(or__3824__auto____7239) {
      return or__3824__auto____7239
    }else {
      var G__7240__7241 = coll;
      if(G__7240__7241) {
        if(function() {
          var or__3824__auto____7242 = G__7240__7241.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7242) {
            return or__3824__auto____7242
          }else {
            return G__7240__7241.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7240__7241.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7240__7241)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7240__7241)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7246__7247 = x;
  if(G__7246__7247) {
    if(function() {
      var or__3824__auto____7248 = G__7246__7247.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7248) {
        return or__3824__auto____7248
      }else {
        return G__7246__7247.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7246__7247.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7246__7247)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7246__7247)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7249 = null;
  var G__7249__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7249__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7249 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7249__2.call(this, string, f);
      case 3:
        return G__7249__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7249
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7250 = null;
  var G__7250__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7250__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7250 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7250__2.call(this, string, k);
      case 3:
        return G__7250__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7250
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7251 = null;
  var G__7251__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7251__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7251 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7251__2.call(this, string, n);
      case 3:
        return G__7251__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7251
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7263 = null;
  var G__7263__2 = function(this_sym7254, coll) {
    var this__7256 = this;
    var this_sym7254__7257 = this;
    var ___7258 = this_sym7254__7257;
    if(coll == null) {
      return null
    }else {
      var strobj__7259 = coll.strobj;
      if(strobj__7259 == null) {
        return cljs.core._lookup.call(null, coll, this__7256.k, null)
      }else {
        return strobj__7259[this__7256.k]
      }
    }
  };
  var G__7263__3 = function(this_sym7255, coll, not_found) {
    var this__7256 = this;
    var this_sym7255__7260 = this;
    var ___7261 = this_sym7255__7260;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7256.k, not_found)
    }
  };
  G__7263 = function(this_sym7255, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7263__2.call(this, this_sym7255, coll);
      case 3:
        return G__7263__3.call(this, this_sym7255, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7263
}();
cljs.core.Keyword.prototype.apply = function(this_sym7252, args7253) {
  var this__7262 = this;
  return this_sym7252.call.apply(this_sym7252, [this_sym7252].concat(args7253.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7272 = null;
  var G__7272__2 = function(this_sym7266, coll) {
    var this_sym7266__7268 = this;
    var this__7269 = this_sym7266__7268;
    return cljs.core._lookup.call(null, coll, this__7269.toString(), null)
  };
  var G__7272__3 = function(this_sym7267, coll, not_found) {
    var this_sym7267__7270 = this;
    var this__7271 = this_sym7267__7270;
    return cljs.core._lookup.call(null, coll, this__7271.toString(), not_found)
  };
  G__7272 = function(this_sym7267, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7272__2.call(this, this_sym7267, coll);
      case 3:
        return G__7272__3.call(this, this_sym7267, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7272
}();
String.prototype.apply = function(this_sym7264, args7265) {
  return this_sym7264.call.apply(this_sym7264, [this_sym7264].concat(args7265.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7274 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7274
  }else {
    lazy_seq.x = x__7274.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7275 = this;
  var h__2188__auto____7276 = this__7275.__hash;
  if(!(h__2188__auto____7276 == null)) {
    return h__2188__auto____7276
  }else {
    var h__2188__auto____7277 = cljs.core.hash_coll.call(null, coll);
    this__7275.__hash = h__2188__auto____7277;
    return h__2188__auto____7277
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7278 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7279 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7280 = this;
  var this__7281 = this;
  return cljs.core.pr_str.call(null, this__7281)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7282 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7283 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7284 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7285 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7286 = this;
  return new cljs.core.LazySeq(meta, this__7286.realized, this__7286.x, this__7286.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7287 = this;
  return this__7287.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7288 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7288.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7289 = this;
  return this__7289.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7290 = this;
  var ___7291 = this;
  this__7290.buf[this__7290.end] = o;
  return this__7290.end = this__7290.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7292 = this;
  var ___7293 = this;
  var ret__7294 = new cljs.core.ArrayChunk(this__7292.buf, 0, this__7292.end);
  this__7292.buf = null;
  return ret__7294
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7295 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7295.arr[this__7295.off], this__7295.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7296 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7296.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7297 = this;
  if(this__7297.off === this__7297.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7297.arr, this__7297.off + 1, this__7297.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7298 = this;
  return this__7298.arr[this__7298.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7299 = this;
  if(function() {
    var and__3822__auto____7300 = i >= 0;
    if(and__3822__auto____7300) {
      return i < this__7299.end - this__7299.off
    }else {
      return and__3822__auto____7300
    }
  }()) {
    return this__7299.arr[this__7299.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7301 = this;
  return this__7301.end - this__7301.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7302 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7303 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7304 = this;
  return cljs.core._nth.call(null, this__7304.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7305 = this;
  if(cljs.core._count.call(null, this__7305.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7305.chunk), this__7305.more, this__7305.meta)
  }else {
    if(this__7305.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7305.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7306 = this;
  if(this__7306.more == null) {
    return null
  }else {
    return this__7306.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7307 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7308 = this;
  return new cljs.core.ChunkedCons(this__7308.chunk, this__7308.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7309 = this;
  return this__7309.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7310 = this;
  return this__7310.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7311 = this;
  if(this__7311.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7311.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7315__7316 = s;
    if(G__7315__7316) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7317 = null;
        if(cljs.core.truth_(or__3824__auto____7317)) {
          return or__3824__auto____7317
        }else {
          return G__7315__7316.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7315__7316.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7315__7316)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7315__7316)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7320 = [];
  var s__7321 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7321)) {
      ary__7320.push(cljs.core.first.call(null, s__7321));
      var G__7322 = cljs.core.next.call(null, s__7321);
      s__7321 = G__7322;
      continue
    }else {
      return ary__7320
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7326 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7327 = 0;
  var xs__7328 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7328) {
      ret__7326[i__7327] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7328));
      var G__7329 = i__7327 + 1;
      var G__7330 = cljs.core.next.call(null, xs__7328);
      i__7327 = G__7329;
      xs__7328 = G__7330;
      continue
    }else {
    }
    break
  }
  return ret__7326
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7338 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7339 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7340 = 0;
      var s__7341 = s__7339;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7342 = s__7341;
          if(and__3822__auto____7342) {
            return i__7340 < size
          }else {
            return and__3822__auto____7342
          }
        }())) {
          a__7338[i__7340] = cljs.core.first.call(null, s__7341);
          var G__7345 = i__7340 + 1;
          var G__7346 = cljs.core.next.call(null, s__7341);
          i__7340 = G__7345;
          s__7341 = G__7346;
          continue
        }else {
          return a__7338
        }
        break
      }
    }else {
      var n__2523__auto____7343 = size;
      var i__7344 = 0;
      while(true) {
        if(i__7344 < n__2523__auto____7343) {
          a__7338[i__7344] = init_val_or_seq;
          var G__7347 = i__7344 + 1;
          i__7344 = G__7347;
          continue
        }else {
        }
        break
      }
      return a__7338
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7355 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7356 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7357 = 0;
      var s__7358 = s__7356;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7359 = s__7358;
          if(and__3822__auto____7359) {
            return i__7357 < size
          }else {
            return and__3822__auto____7359
          }
        }())) {
          a__7355[i__7357] = cljs.core.first.call(null, s__7358);
          var G__7362 = i__7357 + 1;
          var G__7363 = cljs.core.next.call(null, s__7358);
          i__7357 = G__7362;
          s__7358 = G__7363;
          continue
        }else {
          return a__7355
        }
        break
      }
    }else {
      var n__2523__auto____7360 = size;
      var i__7361 = 0;
      while(true) {
        if(i__7361 < n__2523__auto____7360) {
          a__7355[i__7361] = init_val_or_seq;
          var G__7364 = i__7361 + 1;
          i__7361 = G__7364;
          continue
        }else {
        }
        break
      }
      return a__7355
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7372 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7373 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7374 = 0;
      var s__7375 = s__7373;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7376 = s__7375;
          if(and__3822__auto____7376) {
            return i__7374 < size
          }else {
            return and__3822__auto____7376
          }
        }())) {
          a__7372[i__7374] = cljs.core.first.call(null, s__7375);
          var G__7379 = i__7374 + 1;
          var G__7380 = cljs.core.next.call(null, s__7375);
          i__7374 = G__7379;
          s__7375 = G__7380;
          continue
        }else {
          return a__7372
        }
        break
      }
    }else {
      var n__2523__auto____7377 = size;
      var i__7378 = 0;
      while(true) {
        if(i__7378 < n__2523__auto____7377) {
          a__7372[i__7378] = init_val_or_seq;
          var G__7381 = i__7378 + 1;
          i__7378 = G__7381;
          continue
        }else {
        }
        break
      }
      return a__7372
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7386 = s;
    var i__7387 = n;
    var sum__7388 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7389 = i__7387 > 0;
        if(and__3822__auto____7389) {
          return cljs.core.seq.call(null, s__7386)
        }else {
          return and__3822__auto____7389
        }
      }())) {
        var G__7390 = cljs.core.next.call(null, s__7386);
        var G__7391 = i__7387 - 1;
        var G__7392 = sum__7388 + 1;
        s__7386 = G__7390;
        i__7387 = G__7391;
        sum__7388 = G__7392;
        continue
      }else {
        return sum__7388
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7397 = cljs.core.seq.call(null, x);
      if(s__7397) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7397)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7397), concat.call(null, cljs.core.chunk_rest.call(null, s__7397), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7397), concat.call(null, cljs.core.rest.call(null, s__7397), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7401__delegate = function(x, y, zs) {
      var cat__7400 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7399 = cljs.core.seq.call(null, xys);
          if(xys__7399) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7399)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7399), cat.call(null, cljs.core.chunk_rest.call(null, xys__7399), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7399), cat.call(null, cljs.core.rest.call(null, xys__7399), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7400.call(null, concat.call(null, x, y), zs)
    };
    var G__7401 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7401__delegate.call(this, x, y, zs)
    };
    G__7401.cljs$lang$maxFixedArity = 2;
    G__7401.cljs$lang$applyTo = function(arglist__7402) {
      var x = cljs.core.first(arglist__7402);
      var y = cljs.core.first(cljs.core.next(arglist__7402));
      var zs = cljs.core.rest(cljs.core.next(arglist__7402));
      return G__7401__delegate(x, y, zs)
    };
    G__7401.cljs$lang$arity$variadic = G__7401__delegate;
    return G__7401
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7403__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7403 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7403__delegate.call(this, a, b, c, d, more)
    };
    G__7403.cljs$lang$maxFixedArity = 4;
    G__7403.cljs$lang$applyTo = function(arglist__7404) {
      var a = cljs.core.first(arglist__7404);
      var b = cljs.core.first(cljs.core.next(arglist__7404));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7404)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7404))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7404))));
      return G__7403__delegate(a, b, c, d, more)
    };
    G__7403.cljs$lang$arity$variadic = G__7403__delegate;
    return G__7403
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7446 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7447 = cljs.core._first.call(null, args__7446);
    var args__7448 = cljs.core._rest.call(null, args__7446);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7447)
      }else {
        return f.call(null, a__7447)
      }
    }else {
      var b__7449 = cljs.core._first.call(null, args__7448);
      var args__7450 = cljs.core._rest.call(null, args__7448);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7447, b__7449)
        }else {
          return f.call(null, a__7447, b__7449)
        }
      }else {
        var c__7451 = cljs.core._first.call(null, args__7450);
        var args__7452 = cljs.core._rest.call(null, args__7450);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7447, b__7449, c__7451)
          }else {
            return f.call(null, a__7447, b__7449, c__7451)
          }
        }else {
          var d__7453 = cljs.core._first.call(null, args__7452);
          var args__7454 = cljs.core._rest.call(null, args__7452);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7447, b__7449, c__7451, d__7453)
            }else {
              return f.call(null, a__7447, b__7449, c__7451, d__7453)
            }
          }else {
            var e__7455 = cljs.core._first.call(null, args__7454);
            var args__7456 = cljs.core._rest.call(null, args__7454);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7447, b__7449, c__7451, d__7453, e__7455)
              }else {
                return f.call(null, a__7447, b__7449, c__7451, d__7453, e__7455)
              }
            }else {
              var f__7457 = cljs.core._first.call(null, args__7456);
              var args__7458 = cljs.core._rest.call(null, args__7456);
              if(argc === 6) {
                if(f__7457.cljs$lang$arity$6) {
                  return f__7457.cljs$lang$arity$6(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457)
                }else {
                  return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457)
                }
              }else {
                var g__7459 = cljs.core._first.call(null, args__7458);
                var args__7460 = cljs.core._rest.call(null, args__7458);
                if(argc === 7) {
                  if(f__7457.cljs$lang$arity$7) {
                    return f__7457.cljs$lang$arity$7(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459)
                  }else {
                    return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459)
                  }
                }else {
                  var h__7461 = cljs.core._first.call(null, args__7460);
                  var args__7462 = cljs.core._rest.call(null, args__7460);
                  if(argc === 8) {
                    if(f__7457.cljs$lang$arity$8) {
                      return f__7457.cljs$lang$arity$8(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461)
                    }else {
                      return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461)
                    }
                  }else {
                    var i__7463 = cljs.core._first.call(null, args__7462);
                    var args__7464 = cljs.core._rest.call(null, args__7462);
                    if(argc === 9) {
                      if(f__7457.cljs$lang$arity$9) {
                        return f__7457.cljs$lang$arity$9(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463)
                      }else {
                        return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463)
                      }
                    }else {
                      var j__7465 = cljs.core._first.call(null, args__7464);
                      var args__7466 = cljs.core._rest.call(null, args__7464);
                      if(argc === 10) {
                        if(f__7457.cljs$lang$arity$10) {
                          return f__7457.cljs$lang$arity$10(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465)
                        }else {
                          return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465)
                        }
                      }else {
                        var k__7467 = cljs.core._first.call(null, args__7466);
                        var args__7468 = cljs.core._rest.call(null, args__7466);
                        if(argc === 11) {
                          if(f__7457.cljs$lang$arity$11) {
                            return f__7457.cljs$lang$arity$11(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467)
                          }else {
                            return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467)
                          }
                        }else {
                          var l__7469 = cljs.core._first.call(null, args__7468);
                          var args__7470 = cljs.core._rest.call(null, args__7468);
                          if(argc === 12) {
                            if(f__7457.cljs$lang$arity$12) {
                              return f__7457.cljs$lang$arity$12(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469)
                            }else {
                              return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469)
                            }
                          }else {
                            var m__7471 = cljs.core._first.call(null, args__7470);
                            var args__7472 = cljs.core._rest.call(null, args__7470);
                            if(argc === 13) {
                              if(f__7457.cljs$lang$arity$13) {
                                return f__7457.cljs$lang$arity$13(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471)
                              }else {
                                return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471)
                              }
                            }else {
                              var n__7473 = cljs.core._first.call(null, args__7472);
                              var args__7474 = cljs.core._rest.call(null, args__7472);
                              if(argc === 14) {
                                if(f__7457.cljs$lang$arity$14) {
                                  return f__7457.cljs$lang$arity$14(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473)
                                }else {
                                  return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473)
                                }
                              }else {
                                var o__7475 = cljs.core._first.call(null, args__7474);
                                var args__7476 = cljs.core._rest.call(null, args__7474);
                                if(argc === 15) {
                                  if(f__7457.cljs$lang$arity$15) {
                                    return f__7457.cljs$lang$arity$15(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475)
                                  }else {
                                    return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475)
                                  }
                                }else {
                                  var p__7477 = cljs.core._first.call(null, args__7476);
                                  var args__7478 = cljs.core._rest.call(null, args__7476);
                                  if(argc === 16) {
                                    if(f__7457.cljs$lang$arity$16) {
                                      return f__7457.cljs$lang$arity$16(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477)
                                    }else {
                                      return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477)
                                    }
                                  }else {
                                    var q__7479 = cljs.core._first.call(null, args__7478);
                                    var args__7480 = cljs.core._rest.call(null, args__7478);
                                    if(argc === 17) {
                                      if(f__7457.cljs$lang$arity$17) {
                                        return f__7457.cljs$lang$arity$17(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479)
                                      }else {
                                        return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479)
                                      }
                                    }else {
                                      var r__7481 = cljs.core._first.call(null, args__7480);
                                      var args__7482 = cljs.core._rest.call(null, args__7480);
                                      if(argc === 18) {
                                        if(f__7457.cljs$lang$arity$18) {
                                          return f__7457.cljs$lang$arity$18(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481)
                                        }else {
                                          return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481)
                                        }
                                      }else {
                                        var s__7483 = cljs.core._first.call(null, args__7482);
                                        var args__7484 = cljs.core._rest.call(null, args__7482);
                                        if(argc === 19) {
                                          if(f__7457.cljs$lang$arity$19) {
                                            return f__7457.cljs$lang$arity$19(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481, s__7483)
                                          }else {
                                            return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481, s__7483)
                                          }
                                        }else {
                                          var t__7485 = cljs.core._first.call(null, args__7484);
                                          var args__7486 = cljs.core._rest.call(null, args__7484);
                                          if(argc === 20) {
                                            if(f__7457.cljs$lang$arity$20) {
                                              return f__7457.cljs$lang$arity$20(a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481, s__7483, t__7485)
                                            }else {
                                              return f__7457.call(null, a__7447, b__7449, c__7451, d__7453, e__7455, f__7457, g__7459, h__7461, i__7463, j__7465, k__7467, l__7469, m__7471, n__7473, o__7475, p__7477, q__7479, r__7481, s__7483, t__7485)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7501 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7502 = cljs.core.bounded_count.call(null, args, fixed_arity__7501 + 1);
      if(bc__7502 <= fixed_arity__7501) {
        return cljs.core.apply_to.call(null, f, bc__7502, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7503 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7504 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7505 = cljs.core.bounded_count.call(null, arglist__7503, fixed_arity__7504 + 1);
      if(bc__7505 <= fixed_arity__7504) {
        return cljs.core.apply_to.call(null, f, bc__7505, arglist__7503)
      }else {
        return f.cljs$lang$applyTo(arglist__7503)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7503))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7506 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7507 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7508 = cljs.core.bounded_count.call(null, arglist__7506, fixed_arity__7507 + 1);
      if(bc__7508 <= fixed_arity__7507) {
        return cljs.core.apply_to.call(null, f, bc__7508, arglist__7506)
      }else {
        return f.cljs$lang$applyTo(arglist__7506)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7506))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7509 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7510 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7511 = cljs.core.bounded_count.call(null, arglist__7509, fixed_arity__7510 + 1);
      if(bc__7511 <= fixed_arity__7510) {
        return cljs.core.apply_to.call(null, f, bc__7511, arglist__7509)
      }else {
        return f.cljs$lang$applyTo(arglist__7509)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7509))
    }
  };
  var apply__6 = function() {
    var G__7515__delegate = function(f, a, b, c, d, args) {
      var arglist__7512 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7513 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7514 = cljs.core.bounded_count.call(null, arglist__7512, fixed_arity__7513 + 1);
        if(bc__7514 <= fixed_arity__7513) {
          return cljs.core.apply_to.call(null, f, bc__7514, arglist__7512)
        }else {
          return f.cljs$lang$applyTo(arglist__7512)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7512))
      }
    };
    var G__7515 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7515__delegate.call(this, f, a, b, c, d, args)
    };
    G__7515.cljs$lang$maxFixedArity = 5;
    G__7515.cljs$lang$applyTo = function(arglist__7516) {
      var f = cljs.core.first(arglist__7516);
      var a = cljs.core.first(cljs.core.next(arglist__7516));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7516)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7516))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7516)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7516)))));
      return G__7515__delegate(f, a, b, c, d, args)
    };
    G__7515.cljs$lang$arity$variadic = G__7515__delegate;
    return G__7515
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7517) {
    var obj = cljs.core.first(arglist__7517);
    var f = cljs.core.first(cljs.core.next(arglist__7517));
    var args = cljs.core.rest(cljs.core.next(arglist__7517));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7518__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7518 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7518__delegate.call(this, x, y, more)
    };
    G__7518.cljs$lang$maxFixedArity = 2;
    G__7518.cljs$lang$applyTo = function(arglist__7519) {
      var x = cljs.core.first(arglist__7519);
      var y = cljs.core.first(cljs.core.next(arglist__7519));
      var more = cljs.core.rest(cljs.core.next(arglist__7519));
      return G__7518__delegate(x, y, more)
    };
    G__7518.cljs$lang$arity$variadic = G__7518__delegate;
    return G__7518
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7520 = pred;
        var G__7521 = cljs.core.next.call(null, coll);
        pred = G__7520;
        coll = G__7521;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7523 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7523)) {
        return or__3824__auto____7523
      }else {
        var G__7524 = pred;
        var G__7525 = cljs.core.next.call(null, coll);
        pred = G__7524;
        coll = G__7525;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7526 = null;
    var G__7526__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7526__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7526__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7526__3 = function() {
      var G__7527__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7527 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7527__delegate.call(this, x, y, zs)
      };
      G__7527.cljs$lang$maxFixedArity = 2;
      G__7527.cljs$lang$applyTo = function(arglist__7528) {
        var x = cljs.core.first(arglist__7528);
        var y = cljs.core.first(cljs.core.next(arglist__7528));
        var zs = cljs.core.rest(cljs.core.next(arglist__7528));
        return G__7527__delegate(x, y, zs)
      };
      G__7527.cljs$lang$arity$variadic = G__7527__delegate;
      return G__7527
    }();
    G__7526 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7526__0.call(this);
        case 1:
          return G__7526__1.call(this, x);
        case 2:
          return G__7526__2.call(this, x, y);
        default:
          return G__7526__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7526.cljs$lang$maxFixedArity = 2;
    G__7526.cljs$lang$applyTo = G__7526__3.cljs$lang$applyTo;
    return G__7526
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7529__delegate = function(args) {
      return x
    };
    var G__7529 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7529__delegate.call(this, args)
    };
    G__7529.cljs$lang$maxFixedArity = 0;
    G__7529.cljs$lang$applyTo = function(arglist__7530) {
      var args = cljs.core.seq(arglist__7530);
      return G__7529__delegate(args)
    };
    G__7529.cljs$lang$arity$variadic = G__7529__delegate;
    return G__7529
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7537 = null;
      var G__7537__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7537__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7537__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7537__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7537__4 = function() {
        var G__7538__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7538 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7538__delegate.call(this, x, y, z, args)
        };
        G__7538.cljs$lang$maxFixedArity = 3;
        G__7538.cljs$lang$applyTo = function(arglist__7539) {
          var x = cljs.core.first(arglist__7539);
          var y = cljs.core.first(cljs.core.next(arglist__7539));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7539)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7539)));
          return G__7538__delegate(x, y, z, args)
        };
        G__7538.cljs$lang$arity$variadic = G__7538__delegate;
        return G__7538
      }();
      G__7537 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7537__0.call(this);
          case 1:
            return G__7537__1.call(this, x);
          case 2:
            return G__7537__2.call(this, x, y);
          case 3:
            return G__7537__3.call(this, x, y, z);
          default:
            return G__7537__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7537.cljs$lang$maxFixedArity = 3;
      G__7537.cljs$lang$applyTo = G__7537__4.cljs$lang$applyTo;
      return G__7537
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7540 = null;
      var G__7540__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7540__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7540__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7540__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7540__4 = function() {
        var G__7541__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7541 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7541__delegate.call(this, x, y, z, args)
        };
        G__7541.cljs$lang$maxFixedArity = 3;
        G__7541.cljs$lang$applyTo = function(arglist__7542) {
          var x = cljs.core.first(arglist__7542);
          var y = cljs.core.first(cljs.core.next(arglist__7542));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7542)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7542)));
          return G__7541__delegate(x, y, z, args)
        };
        G__7541.cljs$lang$arity$variadic = G__7541__delegate;
        return G__7541
      }();
      G__7540 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7540__0.call(this);
          case 1:
            return G__7540__1.call(this, x);
          case 2:
            return G__7540__2.call(this, x, y);
          case 3:
            return G__7540__3.call(this, x, y, z);
          default:
            return G__7540__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7540.cljs$lang$maxFixedArity = 3;
      G__7540.cljs$lang$applyTo = G__7540__4.cljs$lang$applyTo;
      return G__7540
    }()
  };
  var comp__4 = function() {
    var G__7543__delegate = function(f1, f2, f3, fs) {
      var fs__7534 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7544__delegate = function(args) {
          var ret__7535 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7534), args);
          var fs__7536 = cljs.core.next.call(null, fs__7534);
          while(true) {
            if(fs__7536) {
              var G__7545 = cljs.core.first.call(null, fs__7536).call(null, ret__7535);
              var G__7546 = cljs.core.next.call(null, fs__7536);
              ret__7535 = G__7545;
              fs__7536 = G__7546;
              continue
            }else {
              return ret__7535
            }
            break
          }
        };
        var G__7544 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7544__delegate.call(this, args)
        };
        G__7544.cljs$lang$maxFixedArity = 0;
        G__7544.cljs$lang$applyTo = function(arglist__7547) {
          var args = cljs.core.seq(arglist__7547);
          return G__7544__delegate(args)
        };
        G__7544.cljs$lang$arity$variadic = G__7544__delegate;
        return G__7544
      }()
    };
    var G__7543 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7543__delegate.call(this, f1, f2, f3, fs)
    };
    G__7543.cljs$lang$maxFixedArity = 3;
    G__7543.cljs$lang$applyTo = function(arglist__7548) {
      var f1 = cljs.core.first(arglist__7548);
      var f2 = cljs.core.first(cljs.core.next(arglist__7548));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7548)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7548)));
      return G__7543__delegate(f1, f2, f3, fs)
    };
    G__7543.cljs$lang$arity$variadic = G__7543__delegate;
    return G__7543
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7549__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7549 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7549__delegate.call(this, args)
      };
      G__7549.cljs$lang$maxFixedArity = 0;
      G__7549.cljs$lang$applyTo = function(arglist__7550) {
        var args = cljs.core.seq(arglist__7550);
        return G__7549__delegate(args)
      };
      G__7549.cljs$lang$arity$variadic = G__7549__delegate;
      return G__7549
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7551__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7551 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7551__delegate.call(this, args)
      };
      G__7551.cljs$lang$maxFixedArity = 0;
      G__7551.cljs$lang$applyTo = function(arglist__7552) {
        var args = cljs.core.seq(arglist__7552);
        return G__7551__delegate(args)
      };
      G__7551.cljs$lang$arity$variadic = G__7551__delegate;
      return G__7551
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7553__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7553 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7553__delegate.call(this, args)
      };
      G__7553.cljs$lang$maxFixedArity = 0;
      G__7553.cljs$lang$applyTo = function(arglist__7554) {
        var args = cljs.core.seq(arglist__7554);
        return G__7553__delegate(args)
      };
      G__7553.cljs$lang$arity$variadic = G__7553__delegate;
      return G__7553
    }()
  };
  var partial__5 = function() {
    var G__7555__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7556__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7556 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7556__delegate.call(this, args)
        };
        G__7556.cljs$lang$maxFixedArity = 0;
        G__7556.cljs$lang$applyTo = function(arglist__7557) {
          var args = cljs.core.seq(arglist__7557);
          return G__7556__delegate(args)
        };
        G__7556.cljs$lang$arity$variadic = G__7556__delegate;
        return G__7556
      }()
    };
    var G__7555 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7555__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7555.cljs$lang$maxFixedArity = 4;
    G__7555.cljs$lang$applyTo = function(arglist__7558) {
      var f = cljs.core.first(arglist__7558);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7558));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7558)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7558))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7558))));
      return G__7555__delegate(f, arg1, arg2, arg3, more)
    };
    G__7555.cljs$lang$arity$variadic = G__7555__delegate;
    return G__7555
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7559 = null;
      var G__7559__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7559__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7559__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7559__4 = function() {
        var G__7560__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7560 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7560__delegate.call(this, a, b, c, ds)
        };
        G__7560.cljs$lang$maxFixedArity = 3;
        G__7560.cljs$lang$applyTo = function(arglist__7561) {
          var a = cljs.core.first(arglist__7561);
          var b = cljs.core.first(cljs.core.next(arglist__7561));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7561)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7561)));
          return G__7560__delegate(a, b, c, ds)
        };
        G__7560.cljs$lang$arity$variadic = G__7560__delegate;
        return G__7560
      }();
      G__7559 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7559__1.call(this, a);
          case 2:
            return G__7559__2.call(this, a, b);
          case 3:
            return G__7559__3.call(this, a, b, c);
          default:
            return G__7559__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7559.cljs$lang$maxFixedArity = 3;
      G__7559.cljs$lang$applyTo = G__7559__4.cljs$lang$applyTo;
      return G__7559
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7562 = null;
      var G__7562__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7562__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7562__4 = function() {
        var G__7563__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7563 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7563__delegate.call(this, a, b, c, ds)
        };
        G__7563.cljs$lang$maxFixedArity = 3;
        G__7563.cljs$lang$applyTo = function(arglist__7564) {
          var a = cljs.core.first(arglist__7564);
          var b = cljs.core.first(cljs.core.next(arglist__7564));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7564)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7564)));
          return G__7563__delegate(a, b, c, ds)
        };
        G__7563.cljs$lang$arity$variadic = G__7563__delegate;
        return G__7563
      }();
      G__7562 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7562__2.call(this, a, b);
          case 3:
            return G__7562__3.call(this, a, b, c);
          default:
            return G__7562__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7562.cljs$lang$maxFixedArity = 3;
      G__7562.cljs$lang$applyTo = G__7562__4.cljs$lang$applyTo;
      return G__7562
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7565 = null;
      var G__7565__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7565__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7565__4 = function() {
        var G__7566__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7566 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7566__delegate.call(this, a, b, c, ds)
        };
        G__7566.cljs$lang$maxFixedArity = 3;
        G__7566.cljs$lang$applyTo = function(arglist__7567) {
          var a = cljs.core.first(arglist__7567);
          var b = cljs.core.first(cljs.core.next(arglist__7567));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7567)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7567)));
          return G__7566__delegate(a, b, c, ds)
        };
        G__7566.cljs$lang$arity$variadic = G__7566__delegate;
        return G__7566
      }();
      G__7565 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7565__2.call(this, a, b);
          case 3:
            return G__7565__3.call(this, a, b, c);
          default:
            return G__7565__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7565.cljs$lang$maxFixedArity = 3;
      G__7565.cljs$lang$applyTo = G__7565__4.cljs$lang$applyTo;
      return G__7565
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7583 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7591 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7591) {
        var s__7592 = temp__3974__auto____7591;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7592)) {
          var c__7593 = cljs.core.chunk_first.call(null, s__7592);
          var size__7594 = cljs.core.count.call(null, c__7593);
          var b__7595 = cljs.core.chunk_buffer.call(null, size__7594);
          var n__2523__auto____7596 = size__7594;
          var i__7597 = 0;
          while(true) {
            if(i__7597 < n__2523__auto____7596) {
              cljs.core.chunk_append.call(null, b__7595, f.call(null, idx + i__7597, cljs.core._nth.call(null, c__7593, i__7597)));
              var G__7598 = i__7597 + 1;
              i__7597 = G__7598;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7595), mapi.call(null, idx + size__7594, cljs.core.chunk_rest.call(null, s__7592)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7592)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7592)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7583.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7608 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7608) {
      var s__7609 = temp__3974__auto____7608;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7609)) {
        var c__7610 = cljs.core.chunk_first.call(null, s__7609);
        var size__7611 = cljs.core.count.call(null, c__7610);
        var b__7612 = cljs.core.chunk_buffer.call(null, size__7611);
        var n__2523__auto____7613 = size__7611;
        var i__7614 = 0;
        while(true) {
          if(i__7614 < n__2523__auto____7613) {
            var x__7615 = f.call(null, cljs.core._nth.call(null, c__7610, i__7614));
            if(x__7615 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7612, x__7615)
            }
            var G__7617 = i__7614 + 1;
            i__7614 = G__7617;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7612), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7609)))
      }else {
        var x__7616 = f.call(null, cljs.core.first.call(null, s__7609));
        if(x__7616 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7609))
        }else {
          return cljs.core.cons.call(null, x__7616, keep.call(null, f, cljs.core.rest.call(null, s__7609)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7643 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7653 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7653) {
        var s__7654 = temp__3974__auto____7653;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7654)) {
          var c__7655 = cljs.core.chunk_first.call(null, s__7654);
          var size__7656 = cljs.core.count.call(null, c__7655);
          var b__7657 = cljs.core.chunk_buffer.call(null, size__7656);
          var n__2523__auto____7658 = size__7656;
          var i__7659 = 0;
          while(true) {
            if(i__7659 < n__2523__auto____7658) {
              var x__7660 = f.call(null, idx + i__7659, cljs.core._nth.call(null, c__7655, i__7659));
              if(x__7660 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7657, x__7660)
              }
              var G__7662 = i__7659 + 1;
              i__7659 = G__7662;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7657), keepi.call(null, idx + size__7656, cljs.core.chunk_rest.call(null, s__7654)))
        }else {
          var x__7661 = f.call(null, idx, cljs.core.first.call(null, s__7654));
          if(x__7661 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7654))
          }else {
            return cljs.core.cons.call(null, x__7661, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7654)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7643.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7748 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7748)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7748
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7749 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7749)) {
            var and__3822__auto____7750 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7750)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7750
            }
          }else {
            return and__3822__auto____7749
          }
        }())
      };
      var ep1__4 = function() {
        var G__7819__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7751 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7751)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7751
            }
          }())
        };
        var G__7819 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7819__delegate.call(this, x, y, z, args)
        };
        G__7819.cljs$lang$maxFixedArity = 3;
        G__7819.cljs$lang$applyTo = function(arglist__7820) {
          var x = cljs.core.first(arglist__7820);
          var y = cljs.core.first(cljs.core.next(arglist__7820));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7820)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7820)));
          return G__7819__delegate(x, y, z, args)
        };
        G__7819.cljs$lang$arity$variadic = G__7819__delegate;
        return G__7819
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7763 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7763)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7763
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7764 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7764)) {
            var and__3822__auto____7765 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7765)) {
              var and__3822__auto____7766 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7766)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7766
              }
            }else {
              return and__3822__auto____7765
            }
          }else {
            return and__3822__auto____7764
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7767 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7767)) {
            var and__3822__auto____7768 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7768)) {
              var and__3822__auto____7769 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7769)) {
                var and__3822__auto____7770 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7770)) {
                  var and__3822__auto____7771 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7771)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7771
                  }
                }else {
                  return and__3822__auto____7770
                }
              }else {
                return and__3822__auto____7769
              }
            }else {
              return and__3822__auto____7768
            }
          }else {
            return and__3822__auto____7767
          }
        }())
      };
      var ep2__4 = function() {
        var G__7821__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7772 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7772)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7618_SHARP_) {
                var and__3822__auto____7773 = p1.call(null, p1__7618_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7773)) {
                  return p2.call(null, p1__7618_SHARP_)
                }else {
                  return and__3822__auto____7773
                }
              }, args)
            }else {
              return and__3822__auto____7772
            }
          }())
        };
        var G__7821 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7821__delegate.call(this, x, y, z, args)
        };
        G__7821.cljs$lang$maxFixedArity = 3;
        G__7821.cljs$lang$applyTo = function(arglist__7822) {
          var x = cljs.core.first(arglist__7822);
          var y = cljs.core.first(cljs.core.next(arglist__7822));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7822)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7822)));
          return G__7821__delegate(x, y, z, args)
        };
        G__7821.cljs$lang$arity$variadic = G__7821__delegate;
        return G__7821
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7792 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7792)) {
            var and__3822__auto____7793 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7793)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7793
            }
          }else {
            return and__3822__auto____7792
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7794 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7794)) {
            var and__3822__auto____7795 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7795)) {
              var and__3822__auto____7796 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7796)) {
                var and__3822__auto____7797 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7797)) {
                  var and__3822__auto____7798 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7798)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7798
                  }
                }else {
                  return and__3822__auto____7797
                }
              }else {
                return and__3822__auto____7796
              }
            }else {
              return and__3822__auto____7795
            }
          }else {
            return and__3822__auto____7794
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7799 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7799)) {
            var and__3822__auto____7800 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7800)) {
              var and__3822__auto____7801 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7801)) {
                var and__3822__auto____7802 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7802)) {
                  var and__3822__auto____7803 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7803)) {
                    var and__3822__auto____7804 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7804)) {
                      var and__3822__auto____7805 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7805)) {
                        var and__3822__auto____7806 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7806)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7806
                        }
                      }else {
                        return and__3822__auto____7805
                      }
                    }else {
                      return and__3822__auto____7804
                    }
                  }else {
                    return and__3822__auto____7803
                  }
                }else {
                  return and__3822__auto____7802
                }
              }else {
                return and__3822__auto____7801
              }
            }else {
              return and__3822__auto____7800
            }
          }else {
            return and__3822__auto____7799
          }
        }())
      };
      var ep3__4 = function() {
        var G__7823__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7807 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7807)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7619_SHARP_) {
                var and__3822__auto____7808 = p1.call(null, p1__7619_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7808)) {
                  var and__3822__auto____7809 = p2.call(null, p1__7619_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7809)) {
                    return p3.call(null, p1__7619_SHARP_)
                  }else {
                    return and__3822__auto____7809
                  }
                }else {
                  return and__3822__auto____7808
                }
              }, args)
            }else {
              return and__3822__auto____7807
            }
          }())
        };
        var G__7823 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7823__delegate.call(this, x, y, z, args)
        };
        G__7823.cljs$lang$maxFixedArity = 3;
        G__7823.cljs$lang$applyTo = function(arglist__7824) {
          var x = cljs.core.first(arglist__7824);
          var y = cljs.core.first(cljs.core.next(arglist__7824));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7824)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7824)));
          return G__7823__delegate(x, y, z, args)
        };
        G__7823.cljs$lang$arity$variadic = G__7823__delegate;
        return G__7823
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7825__delegate = function(p1, p2, p3, ps) {
      var ps__7810 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7620_SHARP_) {
            return p1__7620_SHARP_.call(null, x)
          }, ps__7810)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7621_SHARP_) {
            var and__3822__auto____7815 = p1__7621_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7815)) {
              return p1__7621_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7815
            }
          }, ps__7810)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7622_SHARP_) {
            var and__3822__auto____7816 = p1__7622_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7816)) {
              var and__3822__auto____7817 = p1__7622_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7817)) {
                return p1__7622_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7817
              }
            }else {
              return and__3822__auto____7816
            }
          }, ps__7810)
        };
        var epn__4 = function() {
          var G__7826__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7818 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7818)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7623_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7623_SHARP_, args)
                }, ps__7810)
              }else {
                return and__3822__auto____7818
              }
            }())
          };
          var G__7826 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7826__delegate.call(this, x, y, z, args)
          };
          G__7826.cljs$lang$maxFixedArity = 3;
          G__7826.cljs$lang$applyTo = function(arglist__7827) {
            var x = cljs.core.first(arglist__7827);
            var y = cljs.core.first(cljs.core.next(arglist__7827));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7827)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7827)));
            return G__7826__delegate(x, y, z, args)
          };
          G__7826.cljs$lang$arity$variadic = G__7826__delegate;
          return G__7826
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7825 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7825__delegate.call(this, p1, p2, p3, ps)
    };
    G__7825.cljs$lang$maxFixedArity = 3;
    G__7825.cljs$lang$applyTo = function(arglist__7828) {
      var p1 = cljs.core.first(arglist__7828);
      var p2 = cljs.core.first(cljs.core.next(arglist__7828));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7828)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7828)));
      return G__7825__delegate(p1, p2, p3, ps)
    };
    G__7825.cljs$lang$arity$variadic = G__7825__delegate;
    return G__7825
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7909 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7909)) {
          return or__3824__auto____7909
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7910 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7910)) {
          return or__3824__auto____7910
        }else {
          var or__3824__auto____7911 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7911)) {
            return or__3824__auto____7911
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7980__delegate = function(x, y, z, args) {
          var or__3824__auto____7912 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7912)) {
            return or__3824__auto____7912
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7980 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7980__delegate.call(this, x, y, z, args)
        };
        G__7980.cljs$lang$maxFixedArity = 3;
        G__7980.cljs$lang$applyTo = function(arglist__7981) {
          var x = cljs.core.first(arglist__7981);
          var y = cljs.core.first(cljs.core.next(arglist__7981));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7981)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7981)));
          return G__7980__delegate(x, y, z, args)
        };
        G__7980.cljs$lang$arity$variadic = G__7980__delegate;
        return G__7980
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7924 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7924)) {
          return or__3824__auto____7924
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7925 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7925)) {
          return or__3824__auto____7925
        }else {
          var or__3824__auto____7926 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7926)) {
            return or__3824__auto____7926
          }else {
            var or__3824__auto____7927 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7927)) {
              return or__3824__auto____7927
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7928 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7928)) {
          return or__3824__auto____7928
        }else {
          var or__3824__auto____7929 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7929)) {
            return or__3824__auto____7929
          }else {
            var or__3824__auto____7930 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7930)) {
              return or__3824__auto____7930
            }else {
              var or__3824__auto____7931 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7931)) {
                return or__3824__auto____7931
              }else {
                var or__3824__auto____7932 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7932)) {
                  return or__3824__auto____7932
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7982__delegate = function(x, y, z, args) {
          var or__3824__auto____7933 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7933)) {
            return or__3824__auto____7933
          }else {
            return cljs.core.some.call(null, function(p1__7663_SHARP_) {
              var or__3824__auto____7934 = p1.call(null, p1__7663_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7934)) {
                return or__3824__auto____7934
              }else {
                return p2.call(null, p1__7663_SHARP_)
              }
            }, args)
          }
        };
        var G__7982 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7982__delegate.call(this, x, y, z, args)
        };
        G__7982.cljs$lang$maxFixedArity = 3;
        G__7982.cljs$lang$applyTo = function(arglist__7983) {
          var x = cljs.core.first(arglist__7983);
          var y = cljs.core.first(cljs.core.next(arglist__7983));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7983)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7983)));
          return G__7982__delegate(x, y, z, args)
        };
        G__7982.cljs$lang$arity$variadic = G__7982__delegate;
        return G__7982
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____7953 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7953)) {
          return or__3824__auto____7953
        }else {
          var or__3824__auto____7954 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7954)) {
            return or__3824__auto____7954
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7955 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7955)) {
          return or__3824__auto____7955
        }else {
          var or__3824__auto____7956 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7956)) {
            return or__3824__auto____7956
          }else {
            var or__3824__auto____7957 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7957)) {
              return or__3824__auto____7957
            }else {
              var or__3824__auto____7958 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7958)) {
                return or__3824__auto____7958
              }else {
                var or__3824__auto____7959 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7959)) {
                  return or__3824__auto____7959
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7960 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7960)) {
          return or__3824__auto____7960
        }else {
          var or__3824__auto____7961 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7961)) {
            return or__3824__auto____7961
          }else {
            var or__3824__auto____7962 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7962)) {
              return or__3824__auto____7962
            }else {
              var or__3824__auto____7963 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7963)) {
                return or__3824__auto____7963
              }else {
                var or__3824__auto____7964 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7964)) {
                  return or__3824__auto____7964
                }else {
                  var or__3824__auto____7965 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____7965)) {
                    return or__3824__auto____7965
                  }else {
                    var or__3824__auto____7966 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____7966)) {
                      return or__3824__auto____7966
                    }else {
                      var or__3824__auto____7967 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____7967)) {
                        return or__3824__auto____7967
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7984__delegate = function(x, y, z, args) {
          var or__3824__auto____7968 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7968)) {
            return or__3824__auto____7968
          }else {
            return cljs.core.some.call(null, function(p1__7664_SHARP_) {
              var or__3824__auto____7969 = p1.call(null, p1__7664_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7969)) {
                return or__3824__auto____7969
              }else {
                var or__3824__auto____7970 = p2.call(null, p1__7664_SHARP_);
                if(cljs.core.truth_(or__3824__auto____7970)) {
                  return or__3824__auto____7970
                }else {
                  return p3.call(null, p1__7664_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7984 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7984__delegate.call(this, x, y, z, args)
        };
        G__7984.cljs$lang$maxFixedArity = 3;
        G__7984.cljs$lang$applyTo = function(arglist__7985) {
          var x = cljs.core.first(arglist__7985);
          var y = cljs.core.first(cljs.core.next(arglist__7985));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7985)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7985)));
          return G__7984__delegate(x, y, z, args)
        };
        G__7984.cljs$lang$arity$variadic = G__7984__delegate;
        return G__7984
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7986__delegate = function(p1, p2, p3, ps) {
      var ps__7971 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7665_SHARP_) {
            return p1__7665_SHARP_.call(null, x)
          }, ps__7971)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7666_SHARP_) {
            var or__3824__auto____7976 = p1__7666_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7976)) {
              return or__3824__auto____7976
            }else {
              return p1__7666_SHARP_.call(null, y)
            }
          }, ps__7971)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7667_SHARP_) {
            var or__3824__auto____7977 = p1__7667_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7977)) {
              return or__3824__auto____7977
            }else {
              var or__3824__auto____7978 = p1__7667_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7978)) {
                return or__3824__auto____7978
              }else {
                return p1__7667_SHARP_.call(null, z)
              }
            }
          }, ps__7971)
        };
        var spn__4 = function() {
          var G__7987__delegate = function(x, y, z, args) {
            var or__3824__auto____7979 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____7979)) {
              return or__3824__auto____7979
            }else {
              return cljs.core.some.call(null, function(p1__7668_SHARP_) {
                return cljs.core.some.call(null, p1__7668_SHARP_, args)
              }, ps__7971)
            }
          };
          var G__7987 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7987__delegate.call(this, x, y, z, args)
          };
          G__7987.cljs$lang$maxFixedArity = 3;
          G__7987.cljs$lang$applyTo = function(arglist__7988) {
            var x = cljs.core.first(arglist__7988);
            var y = cljs.core.first(cljs.core.next(arglist__7988));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7988)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7988)));
            return G__7987__delegate(x, y, z, args)
          };
          G__7987.cljs$lang$arity$variadic = G__7987__delegate;
          return G__7987
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7986 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7986__delegate.call(this, p1, p2, p3, ps)
    };
    G__7986.cljs$lang$maxFixedArity = 3;
    G__7986.cljs$lang$applyTo = function(arglist__7989) {
      var p1 = cljs.core.first(arglist__7989);
      var p2 = cljs.core.first(cljs.core.next(arglist__7989));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7989)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7989)));
      return G__7986__delegate(p1, p2, p3, ps)
    };
    G__7986.cljs$lang$arity$variadic = G__7986__delegate;
    return G__7986
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8008 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8008) {
        var s__8009 = temp__3974__auto____8008;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8009)) {
          var c__8010 = cljs.core.chunk_first.call(null, s__8009);
          var size__8011 = cljs.core.count.call(null, c__8010);
          var b__8012 = cljs.core.chunk_buffer.call(null, size__8011);
          var n__2523__auto____8013 = size__8011;
          var i__8014 = 0;
          while(true) {
            if(i__8014 < n__2523__auto____8013) {
              cljs.core.chunk_append.call(null, b__8012, f.call(null, cljs.core._nth.call(null, c__8010, i__8014)));
              var G__8026 = i__8014 + 1;
              i__8014 = G__8026;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8012), map.call(null, f, cljs.core.chunk_rest.call(null, s__8009)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8009)), map.call(null, f, cljs.core.rest.call(null, s__8009)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8015 = cljs.core.seq.call(null, c1);
      var s2__8016 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8017 = s1__8015;
        if(and__3822__auto____8017) {
          return s2__8016
        }else {
          return and__3822__auto____8017
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8015), cljs.core.first.call(null, s2__8016)), map.call(null, f, cljs.core.rest.call(null, s1__8015), cljs.core.rest.call(null, s2__8016)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8018 = cljs.core.seq.call(null, c1);
      var s2__8019 = cljs.core.seq.call(null, c2);
      var s3__8020 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8021 = s1__8018;
        if(and__3822__auto____8021) {
          var and__3822__auto____8022 = s2__8019;
          if(and__3822__auto____8022) {
            return s3__8020
          }else {
            return and__3822__auto____8022
          }
        }else {
          return and__3822__auto____8021
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8018), cljs.core.first.call(null, s2__8019), cljs.core.first.call(null, s3__8020)), map.call(null, f, cljs.core.rest.call(null, s1__8018), cljs.core.rest.call(null, s2__8019), cljs.core.rest.call(null, s3__8020)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8027__delegate = function(f, c1, c2, c3, colls) {
      var step__8025 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8024 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8024)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8024), step.call(null, map.call(null, cljs.core.rest, ss__8024)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7829_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7829_SHARP_)
      }, step__8025.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8027 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8027__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8027.cljs$lang$maxFixedArity = 4;
    G__8027.cljs$lang$applyTo = function(arglist__8028) {
      var f = cljs.core.first(arglist__8028);
      var c1 = cljs.core.first(cljs.core.next(arglist__8028));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8028)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8028))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8028))));
      return G__8027__delegate(f, c1, c2, c3, colls)
    };
    G__8027.cljs$lang$arity$variadic = G__8027__delegate;
    return G__8027
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8031 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8031) {
        var s__8032 = temp__3974__auto____8031;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8032), take.call(null, n - 1, cljs.core.rest.call(null, s__8032)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8038 = function(n, coll) {
    while(true) {
      var s__8036 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8037 = n > 0;
        if(and__3822__auto____8037) {
          return s__8036
        }else {
          return and__3822__auto____8037
        }
      }())) {
        var G__8039 = n - 1;
        var G__8040 = cljs.core.rest.call(null, s__8036);
        n = G__8039;
        coll = G__8040;
        continue
      }else {
        return s__8036
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8038.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8043 = cljs.core.seq.call(null, coll);
  var lead__8044 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8044) {
      var G__8045 = cljs.core.next.call(null, s__8043);
      var G__8046 = cljs.core.next.call(null, lead__8044);
      s__8043 = G__8045;
      lead__8044 = G__8046;
      continue
    }else {
      return s__8043
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8052 = function(pred, coll) {
    while(true) {
      var s__8050 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8051 = s__8050;
        if(and__3822__auto____8051) {
          return pred.call(null, cljs.core.first.call(null, s__8050))
        }else {
          return and__3822__auto____8051
        }
      }())) {
        var G__8053 = pred;
        var G__8054 = cljs.core.rest.call(null, s__8050);
        pred = G__8053;
        coll = G__8054;
        continue
      }else {
        return s__8050
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8052.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8057 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8057) {
      var s__8058 = temp__3974__auto____8057;
      return cljs.core.concat.call(null, s__8058, cycle.call(null, s__8058))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8063 = cljs.core.seq.call(null, c1);
      var s2__8064 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8065 = s1__8063;
        if(and__3822__auto____8065) {
          return s2__8064
        }else {
          return and__3822__auto____8065
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8063), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8064), interleave.call(null, cljs.core.rest.call(null, s1__8063), cljs.core.rest.call(null, s2__8064))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8067__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8066 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8066)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8066), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8066)))
        }else {
          return null
        }
      }, null)
    };
    var G__8067 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8067__delegate.call(this, c1, c2, colls)
    };
    G__8067.cljs$lang$maxFixedArity = 2;
    G__8067.cljs$lang$applyTo = function(arglist__8068) {
      var c1 = cljs.core.first(arglist__8068);
      var c2 = cljs.core.first(cljs.core.next(arglist__8068));
      var colls = cljs.core.rest(cljs.core.next(arglist__8068));
      return G__8067__delegate(c1, c2, colls)
    };
    G__8067.cljs$lang$arity$variadic = G__8067__delegate;
    return G__8067
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8078 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8076 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8076) {
        var coll__8077 = temp__3971__auto____8076;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8077), cat.call(null, cljs.core.rest.call(null, coll__8077), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8078.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8079__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8079 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8079__delegate.call(this, f, coll, colls)
    };
    G__8079.cljs$lang$maxFixedArity = 2;
    G__8079.cljs$lang$applyTo = function(arglist__8080) {
      var f = cljs.core.first(arglist__8080);
      var coll = cljs.core.first(cljs.core.next(arglist__8080));
      var colls = cljs.core.rest(cljs.core.next(arglist__8080));
      return G__8079__delegate(f, coll, colls)
    };
    G__8079.cljs$lang$arity$variadic = G__8079__delegate;
    return G__8079
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8090 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8090) {
      var s__8091 = temp__3974__auto____8090;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8091)) {
        var c__8092 = cljs.core.chunk_first.call(null, s__8091);
        var size__8093 = cljs.core.count.call(null, c__8092);
        var b__8094 = cljs.core.chunk_buffer.call(null, size__8093);
        var n__2523__auto____8095 = size__8093;
        var i__8096 = 0;
        while(true) {
          if(i__8096 < n__2523__auto____8095) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8092, i__8096)))) {
              cljs.core.chunk_append.call(null, b__8094, cljs.core._nth.call(null, c__8092, i__8096))
            }else {
            }
            var G__8099 = i__8096 + 1;
            i__8096 = G__8099;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8094), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8091)))
      }else {
        var f__8097 = cljs.core.first.call(null, s__8091);
        var r__8098 = cljs.core.rest.call(null, s__8091);
        if(cljs.core.truth_(pred.call(null, f__8097))) {
          return cljs.core.cons.call(null, f__8097, filter.call(null, pred, r__8098))
        }else {
          return filter.call(null, pred, r__8098)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8102 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8102.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8100_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8100_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8106__8107 = to;
    if(G__8106__8107) {
      if(function() {
        var or__3824__auto____8108 = G__8106__8107.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8108) {
          return or__3824__auto____8108
        }else {
          return G__8106__8107.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8106__8107.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8106__8107)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8106__8107)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8109__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8109 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8109__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8109.cljs$lang$maxFixedArity = 4;
    G__8109.cljs$lang$applyTo = function(arglist__8110) {
      var f = cljs.core.first(arglist__8110);
      var c1 = cljs.core.first(cljs.core.next(arglist__8110));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8110)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8110))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8110))));
      return G__8109__delegate(f, c1, c2, c3, colls)
    };
    G__8109.cljs$lang$arity$variadic = G__8109__delegate;
    return G__8109
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8117 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8117) {
        var s__8118 = temp__3974__auto____8117;
        var p__8119 = cljs.core.take.call(null, n, s__8118);
        if(n === cljs.core.count.call(null, p__8119)) {
          return cljs.core.cons.call(null, p__8119, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8118)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8120 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8120) {
        var s__8121 = temp__3974__auto____8120;
        var p__8122 = cljs.core.take.call(null, n, s__8121);
        if(n === cljs.core.count.call(null, p__8122)) {
          return cljs.core.cons.call(null, p__8122, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8121)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8122, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8127 = cljs.core.lookup_sentinel;
    var m__8128 = m;
    var ks__8129 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8129) {
        var m__8130 = cljs.core._lookup.call(null, m__8128, cljs.core.first.call(null, ks__8129), sentinel__8127);
        if(sentinel__8127 === m__8130) {
          return not_found
        }else {
          var G__8131 = sentinel__8127;
          var G__8132 = m__8130;
          var G__8133 = cljs.core.next.call(null, ks__8129);
          sentinel__8127 = G__8131;
          m__8128 = G__8132;
          ks__8129 = G__8133;
          continue
        }
      }else {
        return m__8128
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8134, v) {
  var vec__8139__8140 = p__8134;
  var k__8141 = cljs.core.nth.call(null, vec__8139__8140, 0, null);
  var ks__8142 = cljs.core.nthnext.call(null, vec__8139__8140, 1);
  if(cljs.core.truth_(ks__8142)) {
    return cljs.core.assoc.call(null, m, k__8141, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8141, null), ks__8142, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8141, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8143, f, args) {
    var vec__8148__8149 = p__8143;
    var k__8150 = cljs.core.nth.call(null, vec__8148__8149, 0, null);
    var ks__8151 = cljs.core.nthnext.call(null, vec__8148__8149, 1);
    if(cljs.core.truth_(ks__8151)) {
      return cljs.core.assoc.call(null, m, k__8150, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8150, null), ks__8151, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8150, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8150, null), args))
    }
  };
  var update_in = function(m, p__8143, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8143, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8152) {
    var m = cljs.core.first(arglist__8152);
    var p__8143 = cljs.core.first(cljs.core.next(arglist__8152));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8152)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8152)));
    return update_in__delegate(m, p__8143, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8155 = this;
  var h__2188__auto____8156 = this__8155.__hash;
  if(!(h__2188__auto____8156 == null)) {
    return h__2188__auto____8156
  }else {
    var h__2188__auto____8157 = cljs.core.hash_coll.call(null, coll);
    this__8155.__hash = h__2188__auto____8157;
    return h__2188__auto____8157
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8158 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8159 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8160 = this;
  var new_array__8161 = this__8160.array.slice();
  new_array__8161[k] = v;
  return new cljs.core.Vector(this__8160.meta, new_array__8161, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8192 = null;
  var G__8192__2 = function(this_sym8162, k) {
    var this__8164 = this;
    var this_sym8162__8165 = this;
    var coll__8166 = this_sym8162__8165;
    return coll__8166.cljs$core$ILookup$_lookup$arity$2(coll__8166, k)
  };
  var G__8192__3 = function(this_sym8163, k, not_found) {
    var this__8164 = this;
    var this_sym8163__8167 = this;
    var coll__8168 = this_sym8163__8167;
    return coll__8168.cljs$core$ILookup$_lookup$arity$3(coll__8168, k, not_found)
  };
  G__8192 = function(this_sym8163, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8192__2.call(this, this_sym8163, k);
      case 3:
        return G__8192__3.call(this, this_sym8163, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8192
}();
cljs.core.Vector.prototype.apply = function(this_sym8153, args8154) {
  var this__8169 = this;
  return this_sym8153.call.apply(this_sym8153, [this_sym8153].concat(args8154.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8170 = this;
  var new_array__8171 = this__8170.array.slice();
  new_array__8171.push(o);
  return new cljs.core.Vector(this__8170.meta, new_array__8171, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8172 = this;
  var this__8173 = this;
  return cljs.core.pr_str.call(null, this__8173)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8174 = this;
  return cljs.core.ci_reduce.call(null, this__8174.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8175 = this;
  return cljs.core.ci_reduce.call(null, this__8175.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8176 = this;
  if(this__8176.array.length > 0) {
    var vector_seq__8177 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8176.array.length) {
          return cljs.core.cons.call(null, this__8176.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8177.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8178 = this;
  return this__8178.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8179 = this;
  var count__8180 = this__8179.array.length;
  if(count__8180 > 0) {
    return this__8179.array[count__8180 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8181 = this;
  if(this__8181.array.length > 0) {
    var new_array__8182 = this__8181.array.slice();
    new_array__8182.pop();
    return new cljs.core.Vector(this__8181.meta, new_array__8182, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8183 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8184 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8185 = this;
  return new cljs.core.Vector(meta, this__8185.array, this__8185.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8186 = this;
  return this__8186.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8187 = this;
  if(function() {
    var and__3822__auto____8188 = 0 <= n;
    if(and__3822__auto____8188) {
      return n < this__8187.array.length
    }else {
      return and__3822__auto____8188
    }
  }()) {
    return this__8187.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8189 = this;
  if(function() {
    var and__3822__auto____8190 = 0 <= n;
    if(and__3822__auto____8190) {
      return n < this__8189.array.length
    }else {
      return and__3822__auto____8190
    }
  }()) {
    return this__8189.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8191 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8191.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2306__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8194 = pv.cnt;
  if(cnt__8194 < 32) {
    return 0
  }else {
    return cnt__8194 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8200 = level;
  var ret__8201 = node;
  while(true) {
    if(ll__8200 === 0) {
      return ret__8201
    }else {
      var embed__8202 = ret__8201;
      var r__8203 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8204 = cljs.core.pv_aset.call(null, r__8203, 0, embed__8202);
      var G__8205 = ll__8200 - 5;
      var G__8206 = r__8203;
      ll__8200 = G__8205;
      ret__8201 = G__8206;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8212 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8213 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8212, subidx__8213, tailnode);
    return ret__8212
  }else {
    var child__8214 = cljs.core.pv_aget.call(null, parent, subidx__8213);
    if(!(child__8214 == null)) {
      var node_to_insert__8215 = push_tail.call(null, pv, level - 5, child__8214, tailnode);
      cljs.core.pv_aset.call(null, ret__8212, subidx__8213, node_to_insert__8215);
      return ret__8212
    }else {
      var node_to_insert__8216 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8212, subidx__8213, node_to_insert__8216);
      return ret__8212
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8220 = 0 <= i;
    if(and__3822__auto____8220) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8220
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8221 = pv.root;
      var level__8222 = pv.shift;
      while(true) {
        if(level__8222 > 0) {
          var G__8223 = cljs.core.pv_aget.call(null, node__8221, i >>> level__8222 & 31);
          var G__8224 = level__8222 - 5;
          node__8221 = G__8223;
          level__8222 = G__8224;
          continue
        }else {
          return node__8221.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8227 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8227, i & 31, val);
    return ret__8227
  }else {
    var subidx__8228 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8227, subidx__8228, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8228), i, val));
    return ret__8227
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8234 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8235 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8234));
    if(function() {
      var and__3822__auto____8236 = new_child__8235 == null;
      if(and__3822__auto____8236) {
        return subidx__8234 === 0
      }else {
        return and__3822__auto____8236
      }
    }()) {
      return null
    }else {
      var ret__8237 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8237, subidx__8234, new_child__8235);
      return ret__8237
    }
  }else {
    if(subidx__8234 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8238 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8238, subidx__8234, null);
        return ret__8238
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8241 = this;
  return new cljs.core.TransientVector(this__8241.cnt, this__8241.shift, cljs.core.tv_editable_root.call(null, this__8241.root), cljs.core.tv_editable_tail.call(null, this__8241.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8242 = this;
  var h__2188__auto____8243 = this__8242.__hash;
  if(!(h__2188__auto____8243 == null)) {
    return h__2188__auto____8243
  }else {
    var h__2188__auto____8244 = cljs.core.hash_coll.call(null, coll);
    this__8242.__hash = h__2188__auto____8244;
    return h__2188__auto____8244
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8245 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8246 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8247 = this;
  if(function() {
    var and__3822__auto____8248 = 0 <= k;
    if(and__3822__auto____8248) {
      return k < this__8247.cnt
    }else {
      return and__3822__auto____8248
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8249 = this__8247.tail.slice();
      new_tail__8249[k & 31] = v;
      return new cljs.core.PersistentVector(this__8247.meta, this__8247.cnt, this__8247.shift, this__8247.root, new_tail__8249, null)
    }else {
      return new cljs.core.PersistentVector(this__8247.meta, this__8247.cnt, this__8247.shift, cljs.core.do_assoc.call(null, coll, this__8247.shift, this__8247.root, k, v), this__8247.tail, null)
    }
  }else {
    if(k === this__8247.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8247.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8297 = null;
  var G__8297__2 = function(this_sym8250, k) {
    var this__8252 = this;
    var this_sym8250__8253 = this;
    var coll__8254 = this_sym8250__8253;
    return coll__8254.cljs$core$ILookup$_lookup$arity$2(coll__8254, k)
  };
  var G__8297__3 = function(this_sym8251, k, not_found) {
    var this__8252 = this;
    var this_sym8251__8255 = this;
    var coll__8256 = this_sym8251__8255;
    return coll__8256.cljs$core$ILookup$_lookup$arity$3(coll__8256, k, not_found)
  };
  G__8297 = function(this_sym8251, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8297__2.call(this, this_sym8251, k);
      case 3:
        return G__8297__3.call(this, this_sym8251, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8297
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8239, args8240) {
  var this__8257 = this;
  return this_sym8239.call.apply(this_sym8239, [this_sym8239].concat(args8240.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8258 = this;
  var step_init__8259 = [0, init];
  var i__8260 = 0;
  while(true) {
    if(i__8260 < this__8258.cnt) {
      var arr__8261 = cljs.core.array_for.call(null, v, i__8260);
      var len__8262 = arr__8261.length;
      var init__8266 = function() {
        var j__8263 = 0;
        var init__8264 = step_init__8259[1];
        while(true) {
          if(j__8263 < len__8262) {
            var init__8265 = f.call(null, init__8264, j__8263 + i__8260, arr__8261[j__8263]);
            if(cljs.core.reduced_QMARK_.call(null, init__8265)) {
              return init__8265
            }else {
              var G__8298 = j__8263 + 1;
              var G__8299 = init__8265;
              j__8263 = G__8298;
              init__8264 = G__8299;
              continue
            }
          }else {
            step_init__8259[0] = len__8262;
            step_init__8259[1] = init__8264;
            return init__8264
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8266)) {
        return cljs.core.deref.call(null, init__8266)
      }else {
        var G__8300 = i__8260 + step_init__8259[0];
        i__8260 = G__8300;
        continue
      }
    }else {
      return step_init__8259[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8267 = this;
  if(this__8267.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8268 = this__8267.tail.slice();
    new_tail__8268.push(o);
    return new cljs.core.PersistentVector(this__8267.meta, this__8267.cnt + 1, this__8267.shift, this__8267.root, new_tail__8268, null)
  }else {
    var root_overflow_QMARK___8269 = this__8267.cnt >>> 5 > 1 << this__8267.shift;
    var new_shift__8270 = root_overflow_QMARK___8269 ? this__8267.shift + 5 : this__8267.shift;
    var new_root__8272 = root_overflow_QMARK___8269 ? function() {
      var n_r__8271 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8271, 0, this__8267.root);
      cljs.core.pv_aset.call(null, n_r__8271, 1, cljs.core.new_path.call(null, null, this__8267.shift, new cljs.core.VectorNode(null, this__8267.tail)));
      return n_r__8271
    }() : cljs.core.push_tail.call(null, coll, this__8267.shift, this__8267.root, new cljs.core.VectorNode(null, this__8267.tail));
    return new cljs.core.PersistentVector(this__8267.meta, this__8267.cnt + 1, new_shift__8270, new_root__8272, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8273 = this;
  if(this__8273.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8273.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8274 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8275 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8276 = this;
  var this__8277 = this;
  return cljs.core.pr_str.call(null, this__8277)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8278 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8279 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8280 = this;
  if(this__8280.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8281 = this;
  return this__8281.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8282 = this;
  if(this__8282.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8282.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8283 = this;
  if(this__8283.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8283.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8283.meta)
    }else {
      if(1 < this__8283.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8283.meta, this__8283.cnt - 1, this__8283.shift, this__8283.root, this__8283.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8284 = cljs.core.array_for.call(null, coll, this__8283.cnt - 2);
          var nr__8285 = cljs.core.pop_tail.call(null, coll, this__8283.shift, this__8283.root);
          var new_root__8286 = nr__8285 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8285;
          var cnt_1__8287 = this__8283.cnt - 1;
          if(function() {
            var and__3822__auto____8288 = 5 < this__8283.shift;
            if(and__3822__auto____8288) {
              return cljs.core.pv_aget.call(null, new_root__8286, 1) == null
            }else {
              return and__3822__auto____8288
            }
          }()) {
            return new cljs.core.PersistentVector(this__8283.meta, cnt_1__8287, this__8283.shift - 5, cljs.core.pv_aget.call(null, new_root__8286, 0), new_tail__8284, null)
          }else {
            return new cljs.core.PersistentVector(this__8283.meta, cnt_1__8287, this__8283.shift, new_root__8286, new_tail__8284, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8289 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8290 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8291 = this;
  return new cljs.core.PersistentVector(meta, this__8291.cnt, this__8291.shift, this__8291.root, this__8291.tail, this__8291.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8292 = this;
  return this__8292.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8293 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8294 = this;
  if(function() {
    var and__3822__auto____8295 = 0 <= n;
    if(and__3822__auto____8295) {
      return n < this__8294.cnt
    }else {
      return and__3822__auto____8295
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8296 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8296.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8301 = xs.length;
  var xs__8302 = no_clone === true ? xs : xs.slice();
  if(l__8301 < 32) {
    return new cljs.core.PersistentVector(null, l__8301, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8302, null)
  }else {
    var node__8303 = xs__8302.slice(0, 32);
    var v__8304 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8303, null);
    var i__8305 = 32;
    var out__8306 = cljs.core._as_transient.call(null, v__8304);
    while(true) {
      if(i__8305 < l__8301) {
        var G__8307 = i__8305 + 1;
        var G__8308 = cljs.core.conj_BANG_.call(null, out__8306, xs__8302[i__8305]);
        i__8305 = G__8307;
        out__8306 = G__8308;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8306)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8309) {
    var args = cljs.core.seq(arglist__8309);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8310 = this;
  if(this__8310.off + 1 < this__8310.node.length) {
    var s__8311 = cljs.core.chunked_seq.call(null, this__8310.vec, this__8310.node, this__8310.i, this__8310.off + 1);
    if(s__8311 == null) {
      return null
    }else {
      return s__8311
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8312 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8313 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8314 = this;
  return this__8314.node[this__8314.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8315 = this;
  if(this__8315.off + 1 < this__8315.node.length) {
    var s__8316 = cljs.core.chunked_seq.call(null, this__8315.vec, this__8315.node, this__8315.i, this__8315.off + 1);
    if(s__8316 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8316
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8317 = this;
  var l__8318 = this__8317.node.length;
  var s__8319 = this__8317.i + l__8318 < cljs.core._count.call(null, this__8317.vec) ? cljs.core.chunked_seq.call(null, this__8317.vec, this__8317.i + l__8318, 0) : null;
  if(s__8319 == null) {
    return null
  }else {
    return s__8319
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8320 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8321 = this;
  return cljs.core.chunked_seq.call(null, this__8321.vec, this__8321.node, this__8321.i, this__8321.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8322 = this;
  return this__8322.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8323 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8323.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8324 = this;
  return cljs.core.array_chunk.call(null, this__8324.node, this__8324.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8325 = this;
  var l__8326 = this__8325.node.length;
  var s__8327 = this__8325.i + l__8326 < cljs.core._count.call(null, this__8325.vec) ? cljs.core.chunked_seq.call(null, this__8325.vec, this__8325.i + l__8326, 0) : null;
  if(s__8327 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8327
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8330 = this;
  var h__2188__auto____8331 = this__8330.__hash;
  if(!(h__2188__auto____8331 == null)) {
    return h__2188__auto____8331
  }else {
    var h__2188__auto____8332 = cljs.core.hash_coll.call(null, coll);
    this__8330.__hash = h__2188__auto____8332;
    return h__2188__auto____8332
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8333 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8334 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8335 = this;
  var v_pos__8336 = this__8335.start + key;
  return new cljs.core.Subvec(this__8335.meta, cljs.core._assoc.call(null, this__8335.v, v_pos__8336, val), this__8335.start, this__8335.end > v_pos__8336 + 1 ? this__8335.end : v_pos__8336 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8362 = null;
  var G__8362__2 = function(this_sym8337, k) {
    var this__8339 = this;
    var this_sym8337__8340 = this;
    var coll__8341 = this_sym8337__8340;
    return coll__8341.cljs$core$ILookup$_lookup$arity$2(coll__8341, k)
  };
  var G__8362__3 = function(this_sym8338, k, not_found) {
    var this__8339 = this;
    var this_sym8338__8342 = this;
    var coll__8343 = this_sym8338__8342;
    return coll__8343.cljs$core$ILookup$_lookup$arity$3(coll__8343, k, not_found)
  };
  G__8362 = function(this_sym8338, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8362__2.call(this, this_sym8338, k);
      case 3:
        return G__8362__3.call(this, this_sym8338, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8362
}();
cljs.core.Subvec.prototype.apply = function(this_sym8328, args8329) {
  var this__8344 = this;
  return this_sym8328.call.apply(this_sym8328, [this_sym8328].concat(args8329.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8345 = this;
  return new cljs.core.Subvec(this__8345.meta, cljs.core._assoc_n.call(null, this__8345.v, this__8345.end, o), this__8345.start, this__8345.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8346 = this;
  var this__8347 = this;
  return cljs.core.pr_str.call(null, this__8347)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8348 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8349 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8350 = this;
  var subvec_seq__8351 = function subvec_seq(i) {
    if(i === this__8350.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8350.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8351.call(null, this__8350.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8352 = this;
  return this__8352.end - this__8352.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8353 = this;
  return cljs.core._nth.call(null, this__8353.v, this__8353.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8354 = this;
  if(this__8354.start === this__8354.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8354.meta, this__8354.v, this__8354.start, this__8354.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8355 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8356 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8357 = this;
  return new cljs.core.Subvec(meta, this__8357.v, this__8357.start, this__8357.end, this__8357.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8358 = this;
  return this__8358.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8359 = this;
  return cljs.core._nth.call(null, this__8359.v, this__8359.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8360 = this;
  return cljs.core._nth.call(null, this__8360.v, this__8360.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8361 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8361.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8364 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8364, 0, tl.length);
  return ret__8364
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8368 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8369 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8368, subidx__8369, level === 5 ? tail_node : function() {
    var child__8370 = cljs.core.pv_aget.call(null, ret__8368, subidx__8369);
    if(!(child__8370 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8370, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8368
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8375 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8376 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8377 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8375, subidx__8376));
    if(function() {
      var and__3822__auto____8378 = new_child__8377 == null;
      if(and__3822__auto____8378) {
        return subidx__8376 === 0
      }else {
        return and__3822__auto____8378
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8375, subidx__8376, new_child__8377);
      return node__8375
    }
  }else {
    if(subidx__8376 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8375, subidx__8376, null);
        return node__8375
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8383 = 0 <= i;
    if(and__3822__auto____8383) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8383
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8384 = tv.root;
      var node__8385 = root__8384;
      var level__8386 = tv.shift;
      while(true) {
        if(level__8386 > 0) {
          var G__8387 = cljs.core.tv_ensure_editable.call(null, root__8384.edit, cljs.core.pv_aget.call(null, node__8385, i >>> level__8386 & 31));
          var G__8388 = level__8386 - 5;
          node__8385 = G__8387;
          level__8386 = G__8388;
          continue
        }else {
          return node__8385.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8428 = null;
  var G__8428__2 = function(this_sym8391, k) {
    var this__8393 = this;
    var this_sym8391__8394 = this;
    var coll__8395 = this_sym8391__8394;
    return coll__8395.cljs$core$ILookup$_lookup$arity$2(coll__8395, k)
  };
  var G__8428__3 = function(this_sym8392, k, not_found) {
    var this__8393 = this;
    var this_sym8392__8396 = this;
    var coll__8397 = this_sym8392__8396;
    return coll__8397.cljs$core$ILookup$_lookup$arity$3(coll__8397, k, not_found)
  };
  G__8428 = function(this_sym8392, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8428__2.call(this, this_sym8392, k);
      case 3:
        return G__8428__3.call(this, this_sym8392, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8428
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8389, args8390) {
  var this__8398 = this;
  return this_sym8389.call.apply(this_sym8389, [this_sym8389].concat(args8390.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8399 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8400 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8401 = this;
  if(this__8401.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8402 = this;
  if(function() {
    var and__3822__auto____8403 = 0 <= n;
    if(and__3822__auto____8403) {
      return n < this__8402.cnt
    }else {
      return and__3822__auto____8403
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8404 = this;
  if(this__8404.root.edit) {
    return this__8404.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8405 = this;
  if(this__8405.root.edit) {
    if(function() {
      var and__3822__auto____8406 = 0 <= n;
      if(and__3822__auto____8406) {
        return n < this__8405.cnt
      }else {
        return and__3822__auto____8406
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8405.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8411 = function go(level, node) {
          var node__8409 = cljs.core.tv_ensure_editable.call(null, this__8405.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8409, n & 31, val);
            return node__8409
          }else {
            var subidx__8410 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8409, subidx__8410, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8409, subidx__8410)));
            return node__8409
          }
        }.call(null, this__8405.shift, this__8405.root);
        this__8405.root = new_root__8411;
        return tcoll
      }
    }else {
      if(n === this__8405.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8405.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8412 = this;
  if(this__8412.root.edit) {
    if(this__8412.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8412.cnt) {
        this__8412.cnt = 0;
        return tcoll
      }else {
        if((this__8412.cnt - 1 & 31) > 0) {
          this__8412.cnt = this__8412.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8413 = cljs.core.editable_array_for.call(null, tcoll, this__8412.cnt - 2);
            var new_root__8415 = function() {
              var nr__8414 = cljs.core.tv_pop_tail.call(null, tcoll, this__8412.shift, this__8412.root);
              if(!(nr__8414 == null)) {
                return nr__8414
              }else {
                return new cljs.core.VectorNode(this__8412.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8416 = 5 < this__8412.shift;
              if(and__3822__auto____8416) {
                return cljs.core.pv_aget.call(null, new_root__8415, 1) == null
              }else {
                return and__3822__auto____8416
              }
            }()) {
              var new_root__8417 = cljs.core.tv_ensure_editable.call(null, this__8412.root.edit, cljs.core.pv_aget.call(null, new_root__8415, 0));
              this__8412.root = new_root__8417;
              this__8412.shift = this__8412.shift - 5;
              this__8412.cnt = this__8412.cnt - 1;
              this__8412.tail = new_tail__8413;
              return tcoll
            }else {
              this__8412.root = new_root__8415;
              this__8412.cnt = this__8412.cnt - 1;
              this__8412.tail = new_tail__8413;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8418 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8419 = this;
  if(this__8419.root.edit) {
    if(this__8419.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8419.tail[this__8419.cnt & 31] = o;
      this__8419.cnt = this__8419.cnt + 1;
      return tcoll
    }else {
      var tail_node__8420 = new cljs.core.VectorNode(this__8419.root.edit, this__8419.tail);
      var new_tail__8421 = cljs.core.make_array.call(null, 32);
      new_tail__8421[0] = o;
      this__8419.tail = new_tail__8421;
      if(this__8419.cnt >>> 5 > 1 << this__8419.shift) {
        var new_root_array__8422 = cljs.core.make_array.call(null, 32);
        var new_shift__8423 = this__8419.shift + 5;
        new_root_array__8422[0] = this__8419.root;
        new_root_array__8422[1] = cljs.core.new_path.call(null, this__8419.root.edit, this__8419.shift, tail_node__8420);
        this__8419.root = new cljs.core.VectorNode(this__8419.root.edit, new_root_array__8422);
        this__8419.shift = new_shift__8423;
        this__8419.cnt = this__8419.cnt + 1;
        return tcoll
      }else {
        var new_root__8424 = cljs.core.tv_push_tail.call(null, tcoll, this__8419.shift, this__8419.root, tail_node__8420);
        this__8419.root = new_root__8424;
        this__8419.cnt = this__8419.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8425 = this;
  if(this__8425.root.edit) {
    this__8425.root.edit = null;
    var len__8426 = this__8425.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8427 = cljs.core.make_array.call(null, len__8426);
    cljs.core.array_copy.call(null, this__8425.tail, 0, trimmed_tail__8427, 0, len__8426);
    return new cljs.core.PersistentVector(null, this__8425.cnt, this__8425.shift, this__8425.root, trimmed_tail__8427, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8429 = this;
  var h__2188__auto____8430 = this__8429.__hash;
  if(!(h__2188__auto____8430 == null)) {
    return h__2188__auto____8430
  }else {
    var h__2188__auto____8431 = cljs.core.hash_coll.call(null, coll);
    this__8429.__hash = h__2188__auto____8431;
    return h__2188__auto____8431
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8432 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8433 = this;
  var this__8434 = this;
  return cljs.core.pr_str.call(null, this__8434)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8435 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8436 = this;
  return cljs.core._first.call(null, this__8436.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8437 = this;
  var temp__3971__auto____8438 = cljs.core.next.call(null, this__8437.front);
  if(temp__3971__auto____8438) {
    var f1__8439 = temp__3971__auto____8438;
    return new cljs.core.PersistentQueueSeq(this__8437.meta, f1__8439, this__8437.rear, null)
  }else {
    if(this__8437.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8437.meta, this__8437.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8440 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8441 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8441.front, this__8441.rear, this__8441.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8442 = this;
  return this__8442.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8443 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8443.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8444 = this;
  var h__2188__auto____8445 = this__8444.__hash;
  if(!(h__2188__auto____8445 == null)) {
    return h__2188__auto____8445
  }else {
    var h__2188__auto____8446 = cljs.core.hash_coll.call(null, coll);
    this__8444.__hash = h__2188__auto____8446;
    return h__2188__auto____8446
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8447 = this;
  if(cljs.core.truth_(this__8447.front)) {
    return new cljs.core.PersistentQueue(this__8447.meta, this__8447.count + 1, this__8447.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8448 = this__8447.rear;
      if(cljs.core.truth_(or__3824__auto____8448)) {
        return or__3824__auto____8448
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8447.meta, this__8447.count + 1, cljs.core.conj.call(null, this__8447.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8449 = this;
  var this__8450 = this;
  return cljs.core.pr_str.call(null, this__8450)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8451 = this;
  var rear__8452 = cljs.core.seq.call(null, this__8451.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8453 = this__8451.front;
    if(cljs.core.truth_(or__3824__auto____8453)) {
      return or__3824__auto____8453
    }else {
      return rear__8452
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8451.front, cljs.core.seq.call(null, rear__8452), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8454 = this;
  return this__8454.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8455 = this;
  return cljs.core._first.call(null, this__8455.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8456 = this;
  if(cljs.core.truth_(this__8456.front)) {
    var temp__3971__auto____8457 = cljs.core.next.call(null, this__8456.front);
    if(temp__3971__auto____8457) {
      var f1__8458 = temp__3971__auto____8457;
      return new cljs.core.PersistentQueue(this__8456.meta, this__8456.count - 1, f1__8458, this__8456.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8456.meta, this__8456.count - 1, cljs.core.seq.call(null, this__8456.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8459 = this;
  return cljs.core.first.call(null, this__8459.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8460 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8461 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8462 = this;
  return new cljs.core.PersistentQueue(meta, this__8462.count, this__8462.front, this__8462.rear, this__8462.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8463 = this;
  return this__8463.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8464 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8465 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8468 = array.length;
  var i__8469 = 0;
  while(true) {
    if(i__8469 < len__8468) {
      if(k === array[i__8469]) {
        return i__8469
      }else {
        var G__8470 = i__8469 + incr;
        i__8469 = G__8470;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8473 = cljs.core.hash.call(null, a);
  var b__8474 = cljs.core.hash.call(null, b);
  if(a__8473 < b__8474) {
    return-1
  }else {
    if(a__8473 > b__8474) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8482 = m.keys;
  var len__8483 = ks__8482.length;
  var so__8484 = m.strobj;
  var out__8485 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8486 = 0;
  var out__8487 = cljs.core.transient$.call(null, out__8485);
  while(true) {
    if(i__8486 < len__8483) {
      var k__8488 = ks__8482[i__8486];
      var G__8489 = i__8486 + 1;
      var G__8490 = cljs.core.assoc_BANG_.call(null, out__8487, k__8488, so__8484[k__8488]);
      i__8486 = G__8489;
      out__8487 = G__8490;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8487, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8496 = {};
  var l__8497 = ks.length;
  var i__8498 = 0;
  while(true) {
    if(i__8498 < l__8497) {
      var k__8499 = ks[i__8498];
      new_obj__8496[k__8499] = obj[k__8499];
      var G__8500 = i__8498 + 1;
      i__8498 = G__8500;
      continue
    }else {
    }
    break
  }
  return new_obj__8496
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8503 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8504 = this;
  var h__2188__auto____8505 = this__8504.__hash;
  if(!(h__2188__auto____8505 == null)) {
    return h__2188__auto____8505
  }else {
    var h__2188__auto____8506 = cljs.core.hash_imap.call(null, coll);
    this__8504.__hash = h__2188__auto____8506;
    return h__2188__auto____8506
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8507 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8508 = this;
  if(function() {
    var and__3822__auto____8509 = goog.isString(k);
    if(and__3822__auto____8509) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8508.keys) == null)
    }else {
      return and__3822__auto____8509
    }
  }()) {
    return this__8508.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8510 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8511 = this__8510.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8511) {
        return or__3824__auto____8511
      }else {
        return this__8510.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8510.keys) == null)) {
        var new_strobj__8512 = cljs.core.obj_clone.call(null, this__8510.strobj, this__8510.keys);
        new_strobj__8512[k] = v;
        return new cljs.core.ObjMap(this__8510.meta, this__8510.keys, new_strobj__8512, this__8510.update_count + 1, null)
      }else {
        var new_strobj__8513 = cljs.core.obj_clone.call(null, this__8510.strobj, this__8510.keys);
        var new_keys__8514 = this__8510.keys.slice();
        new_strobj__8513[k] = v;
        new_keys__8514.push(k);
        return new cljs.core.ObjMap(this__8510.meta, new_keys__8514, new_strobj__8513, this__8510.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8515 = this;
  if(function() {
    var and__3822__auto____8516 = goog.isString(k);
    if(and__3822__auto____8516) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8515.keys) == null)
    }else {
      return and__3822__auto____8516
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8538 = null;
  var G__8538__2 = function(this_sym8517, k) {
    var this__8519 = this;
    var this_sym8517__8520 = this;
    var coll__8521 = this_sym8517__8520;
    return coll__8521.cljs$core$ILookup$_lookup$arity$2(coll__8521, k)
  };
  var G__8538__3 = function(this_sym8518, k, not_found) {
    var this__8519 = this;
    var this_sym8518__8522 = this;
    var coll__8523 = this_sym8518__8522;
    return coll__8523.cljs$core$ILookup$_lookup$arity$3(coll__8523, k, not_found)
  };
  G__8538 = function(this_sym8518, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8538__2.call(this, this_sym8518, k);
      case 3:
        return G__8538__3.call(this, this_sym8518, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8538
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8501, args8502) {
  var this__8524 = this;
  return this_sym8501.call.apply(this_sym8501, [this_sym8501].concat(args8502.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8525 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8526 = this;
  var this__8527 = this;
  return cljs.core.pr_str.call(null, this__8527)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8528 = this;
  if(this__8528.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8491_SHARP_) {
      return cljs.core.vector.call(null, p1__8491_SHARP_, this__8528.strobj[p1__8491_SHARP_])
    }, this__8528.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8529 = this;
  return this__8529.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8530 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8531 = this;
  return new cljs.core.ObjMap(meta, this__8531.keys, this__8531.strobj, this__8531.update_count, this__8531.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8532 = this;
  return this__8532.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8533 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8533.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8534 = this;
  if(function() {
    var and__3822__auto____8535 = goog.isString(k);
    if(and__3822__auto____8535) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8534.keys) == null)
    }else {
      return and__3822__auto____8535
    }
  }()) {
    var new_keys__8536 = this__8534.keys.slice();
    var new_strobj__8537 = cljs.core.obj_clone.call(null, this__8534.strobj, this__8534.keys);
    new_keys__8536.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8536), 1);
    cljs.core.js_delete.call(null, new_strobj__8537, k);
    return new cljs.core.ObjMap(this__8534.meta, new_keys__8536, new_strobj__8537, this__8534.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8542 = this;
  var h__2188__auto____8543 = this__8542.__hash;
  if(!(h__2188__auto____8543 == null)) {
    return h__2188__auto____8543
  }else {
    var h__2188__auto____8544 = cljs.core.hash_imap.call(null, coll);
    this__8542.__hash = h__2188__auto____8544;
    return h__2188__auto____8544
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8545 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8546 = this;
  var bucket__8547 = this__8546.hashobj[cljs.core.hash.call(null, k)];
  var i__8548 = cljs.core.truth_(bucket__8547) ? cljs.core.scan_array.call(null, 2, k, bucket__8547) : null;
  if(cljs.core.truth_(i__8548)) {
    return bucket__8547[i__8548 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8549 = this;
  var h__8550 = cljs.core.hash.call(null, k);
  var bucket__8551 = this__8549.hashobj[h__8550];
  if(cljs.core.truth_(bucket__8551)) {
    var new_bucket__8552 = bucket__8551.slice();
    var new_hashobj__8553 = goog.object.clone(this__8549.hashobj);
    new_hashobj__8553[h__8550] = new_bucket__8552;
    var temp__3971__auto____8554 = cljs.core.scan_array.call(null, 2, k, new_bucket__8552);
    if(cljs.core.truth_(temp__3971__auto____8554)) {
      var i__8555 = temp__3971__auto____8554;
      new_bucket__8552[i__8555 + 1] = v;
      return new cljs.core.HashMap(this__8549.meta, this__8549.count, new_hashobj__8553, null)
    }else {
      new_bucket__8552.push(k, v);
      return new cljs.core.HashMap(this__8549.meta, this__8549.count + 1, new_hashobj__8553, null)
    }
  }else {
    var new_hashobj__8556 = goog.object.clone(this__8549.hashobj);
    new_hashobj__8556[h__8550] = [k, v];
    return new cljs.core.HashMap(this__8549.meta, this__8549.count + 1, new_hashobj__8556, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8557 = this;
  var bucket__8558 = this__8557.hashobj[cljs.core.hash.call(null, k)];
  var i__8559 = cljs.core.truth_(bucket__8558) ? cljs.core.scan_array.call(null, 2, k, bucket__8558) : null;
  if(cljs.core.truth_(i__8559)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8584 = null;
  var G__8584__2 = function(this_sym8560, k) {
    var this__8562 = this;
    var this_sym8560__8563 = this;
    var coll__8564 = this_sym8560__8563;
    return coll__8564.cljs$core$ILookup$_lookup$arity$2(coll__8564, k)
  };
  var G__8584__3 = function(this_sym8561, k, not_found) {
    var this__8562 = this;
    var this_sym8561__8565 = this;
    var coll__8566 = this_sym8561__8565;
    return coll__8566.cljs$core$ILookup$_lookup$arity$3(coll__8566, k, not_found)
  };
  G__8584 = function(this_sym8561, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8584__2.call(this, this_sym8561, k);
      case 3:
        return G__8584__3.call(this, this_sym8561, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8584
}();
cljs.core.HashMap.prototype.apply = function(this_sym8540, args8541) {
  var this__8567 = this;
  return this_sym8540.call.apply(this_sym8540, [this_sym8540].concat(args8541.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8568 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8569 = this;
  var this__8570 = this;
  return cljs.core.pr_str.call(null, this__8570)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8571 = this;
  if(this__8571.count > 0) {
    var hashes__8572 = cljs.core.js_keys.call(null, this__8571.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8539_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8571.hashobj[p1__8539_SHARP_]))
    }, hashes__8572)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8573 = this;
  return this__8573.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8574 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8575 = this;
  return new cljs.core.HashMap(meta, this__8575.count, this__8575.hashobj, this__8575.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8576 = this;
  return this__8576.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8577 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8577.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8578 = this;
  var h__8579 = cljs.core.hash.call(null, k);
  var bucket__8580 = this__8578.hashobj[h__8579];
  var i__8581 = cljs.core.truth_(bucket__8580) ? cljs.core.scan_array.call(null, 2, k, bucket__8580) : null;
  if(cljs.core.not.call(null, i__8581)) {
    return coll
  }else {
    var new_hashobj__8582 = goog.object.clone(this__8578.hashobj);
    if(3 > bucket__8580.length) {
      cljs.core.js_delete.call(null, new_hashobj__8582, h__8579)
    }else {
      var new_bucket__8583 = bucket__8580.slice();
      new_bucket__8583.splice(i__8581, 2);
      new_hashobj__8582[h__8579] = new_bucket__8583
    }
    return new cljs.core.HashMap(this__8578.meta, this__8578.count - 1, new_hashobj__8582, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8585 = ks.length;
  var i__8586 = 0;
  var out__8587 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8586 < len__8585) {
      var G__8588 = i__8586 + 1;
      var G__8589 = cljs.core.assoc.call(null, out__8587, ks[i__8586], vs[i__8586]);
      i__8586 = G__8588;
      out__8587 = G__8589;
      continue
    }else {
      return out__8587
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8593 = m.arr;
  var len__8594 = arr__8593.length;
  var i__8595 = 0;
  while(true) {
    if(len__8594 <= i__8595) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8593[i__8595], k)) {
        return i__8595
      }else {
        if("\ufdd0'else") {
          var G__8596 = i__8595 + 2;
          i__8595 = G__8596;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8599 = this;
  return new cljs.core.TransientArrayMap({}, this__8599.arr.length, this__8599.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8600 = this;
  var h__2188__auto____8601 = this__8600.__hash;
  if(!(h__2188__auto____8601 == null)) {
    return h__2188__auto____8601
  }else {
    var h__2188__auto____8602 = cljs.core.hash_imap.call(null, coll);
    this__8600.__hash = h__2188__auto____8602;
    return h__2188__auto____8602
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8603 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8604 = this;
  var idx__8605 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8605 === -1) {
    return not_found
  }else {
    return this__8604.arr[idx__8605 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8606 = this;
  var idx__8607 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8607 === -1) {
    if(this__8606.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8606.meta, this__8606.cnt + 1, function() {
        var G__8608__8609 = this__8606.arr.slice();
        G__8608__8609.push(k);
        G__8608__8609.push(v);
        return G__8608__8609
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8606.arr[idx__8607 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8606.meta, this__8606.cnt, function() {
          var G__8610__8611 = this__8606.arr.slice();
          G__8610__8611[idx__8607 + 1] = v;
          return G__8610__8611
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8612 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8644 = null;
  var G__8644__2 = function(this_sym8613, k) {
    var this__8615 = this;
    var this_sym8613__8616 = this;
    var coll__8617 = this_sym8613__8616;
    return coll__8617.cljs$core$ILookup$_lookup$arity$2(coll__8617, k)
  };
  var G__8644__3 = function(this_sym8614, k, not_found) {
    var this__8615 = this;
    var this_sym8614__8618 = this;
    var coll__8619 = this_sym8614__8618;
    return coll__8619.cljs$core$ILookup$_lookup$arity$3(coll__8619, k, not_found)
  };
  G__8644 = function(this_sym8614, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8644__2.call(this, this_sym8614, k);
      case 3:
        return G__8644__3.call(this, this_sym8614, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8644
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8597, args8598) {
  var this__8620 = this;
  return this_sym8597.call.apply(this_sym8597, [this_sym8597].concat(args8598.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8621 = this;
  var len__8622 = this__8621.arr.length;
  var i__8623 = 0;
  var init__8624 = init;
  while(true) {
    if(i__8623 < len__8622) {
      var init__8625 = f.call(null, init__8624, this__8621.arr[i__8623], this__8621.arr[i__8623 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8625)) {
        return cljs.core.deref.call(null, init__8625)
      }else {
        var G__8645 = i__8623 + 2;
        var G__8646 = init__8625;
        i__8623 = G__8645;
        init__8624 = G__8646;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8626 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8627 = this;
  var this__8628 = this;
  return cljs.core.pr_str.call(null, this__8628)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8629 = this;
  if(this__8629.cnt > 0) {
    var len__8630 = this__8629.arr.length;
    var array_map_seq__8631 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8630) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8629.arr[i], this__8629.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8631.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8632 = this;
  return this__8632.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8633 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8634 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8634.cnt, this__8634.arr, this__8634.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8635 = this;
  return this__8635.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8636 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8636.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8637 = this;
  var idx__8638 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8638 >= 0) {
    var len__8639 = this__8637.arr.length;
    var new_len__8640 = len__8639 - 2;
    if(new_len__8640 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8641 = cljs.core.make_array.call(null, new_len__8640);
      var s__8642 = 0;
      var d__8643 = 0;
      while(true) {
        if(s__8642 >= len__8639) {
          return new cljs.core.PersistentArrayMap(this__8637.meta, this__8637.cnt - 1, new_arr__8641, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8637.arr[s__8642])) {
            var G__8647 = s__8642 + 2;
            var G__8648 = d__8643;
            s__8642 = G__8647;
            d__8643 = G__8648;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8641[d__8643] = this__8637.arr[s__8642];
              new_arr__8641[d__8643 + 1] = this__8637.arr[s__8642 + 1];
              var G__8649 = s__8642 + 2;
              var G__8650 = d__8643 + 2;
              s__8642 = G__8649;
              d__8643 = G__8650;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8651 = cljs.core.count.call(null, ks);
  var i__8652 = 0;
  var out__8653 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8652 < len__8651) {
      var G__8654 = i__8652 + 1;
      var G__8655 = cljs.core.assoc_BANG_.call(null, out__8653, ks[i__8652], vs[i__8652]);
      i__8652 = G__8654;
      out__8653 = G__8655;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8653)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8656 = this;
  if(cljs.core.truth_(this__8656.editable_QMARK_)) {
    var idx__8657 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8657 >= 0) {
      this__8656.arr[idx__8657] = this__8656.arr[this__8656.len - 2];
      this__8656.arr[idx__8657 + 1] = this__8656.arr[this__8656.len - 1];
      var G__8658__8659 = this__8656.arr;
      G__8658__8659.pop();
      G__8658__8659.pop();
      G__8658__8659;
      this__8656.len = this__8656.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8660 = this;
  if(cljs.core.truth_(this__8660.editable_QMARK_)) {
    var idx__8661 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8661 === -1) {
      if(this__8660.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8660.len = this__8660.len + 2;
        this__8660.arr.push(key);
        this__8660.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8660.len, this__8660.arr), key, val)
      }
    }else {
      if(val === this__8660.arr[idx__8661 + 1]) {
        return tcoll
      }else {
        this__8660.arr[idx__8661 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8662 = this;
  if(cljs.core.truth_(this__8662.editable_QMARK_)) {
    if(function() {
      var G__8663__8664 = o;
      if(G__8663__8664) {
        if(function() {
          var or__3824__auto____8665 = G__8663__8664.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8665) {
            return or__3824__auto____8665
          }else {
            return G__8663__8664.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8663__8664.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8663__8664)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8663__8664)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8666 = cljs.core.seq.call(null, o);
      var tcoll__8667 = tcoll;
      while(true) {
        var temp__3971__auto____8668 = cljs.core.first.call(null, es__8666);
        if(cljs.core.truth_(temp__3971__auto____8668)) {
          var e__8669 = temp__3971__auto____8668;
          var G__8675 = cljs.core.next.call(null, es__8666);
          var G__8676 = tcoll__8667.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8667, cljs.core.key.call(null, e__8669), cljs.core.val.call(null, e__8669));
          es__8666 = G__8675;
          tcoll__8667 = G__8676;
          continue
        }else {
          return tcoll__8667
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8670 = this;
  if(cljs.core.truth_(this__8670.editable_QMARK_)) {
    this__8670.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8670.len, 2), this__8670.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8671 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8672 = this;
  if(cljs.core.truth_(this__8672.editable_QMARK_)) {
    var idx__8673 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8673 === -1) {
      return not_found
    }else {
      return this__8672.arr[idx__8673 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8674 = this;
  if(cljs.core.truth_(this__8674.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8674.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8679 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8680 = 0;
  while(true) {
    if(i__8680 < len) {
      var G__8681 = cljs.core.assoc_BANG_.call(null, out__8679, arr[i__8680], arr[i__8680 + 1]);
      var G__8682 = i__8680 + 2;
      out__8679 = G__8681;
      i__8680 = G__8682;
      continue
    }else {
      return out__8679
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2306__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8687__8688 = arr.slice();
    G__8687__8688[i] = a;
    return G__8687__8688
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8689__8690 = arr.slice();
    G__8689__8690[i] = a;
    G__8689__8690[j] = b;
    return G__8689__8690
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8692 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8692, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8692, 2 * i, new_arr__8692.length - 2 * i);
  return new_arr__8692
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8695 = inode.ensure_editable(edit);
    editable__8695.arr[i] = a;
    return editable__8695
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8696 = inode.ensure_editable(edit);
    editable__8696.arr[i] = a;
    editable__8696.arr[j] = b;
    return editable__8696
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8703 = arr.length;
  var i__8704 = 0;
  var init__8705 = init;
  while(true) {
    if(i__8704 < len__8703) {
      var init__8708 = function() {
        var k__8706 = arr[i__8704];
        if(!(k__8706 == null)) {
          return f.call(null, init__8705, k__8706, arr[i__8704 + 1])
        }else {
          var node__8707 = arr[i__8704 + 1];
          if(!(node__8707 == null)) {
            return node__8707.kv_reduce(f, init__8705)
          }else {
            return init__8705
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8708)) {
        return cljs.core.deref.call(null, init__8708)
      }else {
        var G__8709 = i__8704 + 2;
        var G__8710 = init__8708;
        i__8704 = G__8709;
        init__8705 = G__8710;
        continue
      }
    }else {
      return init__8705
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8711 = this;
  var inode__8712 = this;
  if(this__8711.bitmap === bit) {
    return null
  }else {
    var editable__8713 = inode__8712.ensure_editable(e);
    var earr__8714 = editable__8713.arr;
    var len__8715 = earr__8714.length;
    editable__8713.bitmap = bit ^ editable__8713.bitmap;
    cljs.core.array_copy.call(null, earr__8714, 2 * (i + 1), earr__8714, 2 * i, len__8715 - 2 * (i + 1));
    earr__8714[len__8715 - 2] = null;
    earr__8714[len__8715 - 1] = null;
    return editable__8713
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8716 = this;
  var inode__8717 = this;
  var bit__8718 = 1 << (hash >>> shift & 31);
  var idx__8719 = cljs.core.bitmap_indexed_node_index.call(null, this__8716.bitmap, bit__8718);
  if((this__8716.bitmap & bit__8718) === 0) {
    var n__8720 = cljs.core.bit_count.call(null, this__8716.bitmap);
    if(2 * n__8720 < this__8716.arr.length) {
      var editable__8721 = inode__8717.ensure_editable(edit);
      var earr__8722 = editable__8721.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8722, 2 * idx__8719, earr__8722, 2 * (idx__8719 + 1), 2 * (n__8720 - idx__8719));
      earr__8722[2 * idx__8719] = key;
      earr__8722[2 * idx__8719 + 1] = val;
      editable__8721.bitmap = editable__8721.bitmap | bit__8718;
      return editable__8721
    }else {
      if(n__8720 >= 16) {
        var nodes__8723 = cljs.core.make_array.call(null, 32);
        var jdx__8724 = hash >>> shift & 31;
        nodes__8723[jdx__8724] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8725 = 0;
        var j__8726 = 0;
        while(true) {
          if(i__8725 < 32) {
            if((this__8716.bitmap >>> i__8725 & 1) === 0) {
              var G__8779 = i__8725 + 1;
              var G__8780 = j__8726;
              i__8725 = G__8779;
              j__8726 = G__8780;
              continue
            }else {
              nodes__8723[i__8725] = !(this__8716.arr[j__8726] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8716.arr[j__8726]), this__8716.arr[j__8726], this__8716.arr[j__8726 + 1], added_leaf_QMARK_) : this__8716.arr[j__8726 + 1];
              var G__8781 = i__8725 + 1;
              var G__8782 = j__8726 + 2;
              i__8725 = G__8781;
              j__8726 = G__8782;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8720 + 1, nodes__8723)
      }else {
        if("\ufdd0'else") {
          var new_arr__8727 = cljs.core.make_array.call(null, 2 * (n__8720 + 4));
          cljs.core.array_copy.call(null, this__8716.arr, 0, new_arr__8727, 0, 2 * idx__8719);
          new_arr__8727[2 * idx__8719] = key;
          new_arr__8727[2 * idx__8719 + 1] = val;
          cljs.core.array_copy.call(null, this__8716.arr, 2 * idx__8719, new_arr__8727, 2 * (idx__8719 + 1), 2 * (n__8720 - idx__8719));
          added_leaf_QMARK_.val = true;
          var editable__8728 = inode__8717.ensure_editable(edit);
          editable__8728.arr = new_arr__8727;
          editable__8728.bitmap = editable__8728.bitmap | bit__8718;
          return editable__8728
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8729 = this__8716.arr[2 * idx__8719];
    var val_or_node__8730 = this__8716.arr[2 * idx__8719 + 1];
    if(key_or_nil__8729 == null) {
      var n__8731 = val_or_node__8730.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8731 === val_or_node__8730) {
        return inode__8717
      }else {
        return cljs.core.edit_and_set.call(null, inode__8717, edit, 2 * idx__8719 + 1, n__8731)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8729)) {
        if(val === val_or_node__8730) {
          return inode__8717
        }else {
          return cljs.core.edit_and_set.call(null, inode__8717, edit, 2 * idx__8719 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8717, edit, 2 * idx__8719, null, 2 * idx__8719 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8729, val_or_node__8730, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8732 = this;
  var inode__8733 = this;
  return cljs.core.create_inode_seq.call(null, this__8732.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8734 = this;
  var inode__8735 = this;
  var bit__8736 = 1 << (hash >>> shift & 31);
  if((this__8734.bitmap & bit__8736) === 0) {
    return inode__8735
  }else {
    var idx__8737 = cljs.core.bitmap_indexed_node_index.call(null, this__8734.bitmap, bit__8736);
    var key_or_nil__8738 = this__8734.arr[2 * idx__8737];
    var val_or_node__8739 = this__8734.arr[2 * idx__8737 + 1];
    if(key_or_nil__8738 == null) {
      var n__8740 = val_or_node__8739.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8740 === val_or_node__8739) {
        return inode__8735
      }else {
        if(!(n__8740 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8735, edit, 2 * idx__8737 + 1, n__8740)
        }else {
          if(this__8734.bitmap === bit__8736) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8735.edit_and_remove_pair(edit, bit__8736, idx__8737)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8738)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8735.edit_and_remove_pair(edit, bit__8736, idx__8737)
      }else {
        if("\ufdd0'else") {
          return inode__8735
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8741 = this;
  var inode__8742 = this;
  if(e === this__8741.edit) {
    return inode__8742
  }else {
    var n__8743 = cljs.core.bit_count.call(null, this__8741.bitmap);
    var new_arr__8744 = cljs.core.make_array.call(null, n__8743 < 0 ? 4 : 2 * (n__8743 + 1));
    cljs.core.array_copy.call(null, this__8741.arr, 0, new_arr__8744, 0, 2 * n__8743);
    return new cljs.core.BitmapIndexedNode(e, this__8741.bitmap, new_arr__8744)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8745 = this;
  var inode__8746 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8745.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8747 = this;
  var inode__8748 = this;
  var bit__8749 = 1 << (hash >>> shift & 31);
  if((this__8747.bitmap & bit__8749) === 0) {
    return not_found
  }else {
    var idx__8750 = cljs.core.bitmap_indexed_node_index.call(null, this__8747.bitmap, bit__8749);
    var key_or_nil__8751 = this__8747.arr[2 * idx__8750];
    var val_or_node__8752 = this__8747.arr[2 * idx__8750 + 1];
    if(key_or_nil__8751 == null) {
      return val_or_node__8752.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8751)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8751, val_or_node__8752], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8753 = this;
  var inode__8754 = this;
  var bit__8755 = 1 << (hash >>> shift & 31);
  if((this__8753.bitmap & bit__8755) === 0) {
    return inode__8754
  }else {
    var idx__8756 = cljs.core.bitmap_indexed_node_index.call(null, this__8753.bitmap, bit__8755);
    var key_or_nil__8757 = this__8753.arr[2 * idx__8756];
    var val_or_node__8758 = this__8753.arr[2 * idx__8756 + 1];
    if(key_or_nil__8757 == null) {
      var n__8759 = val_or_node__8758.inode_without(shift + 5, hash, key);
      if(n__8759 === val_or_node__8758) {
        return inode__8754
      }else {
        if(!(n__8759 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8753.bitmap, cljs.core.clone_and_set.call(null, this__8753.arr, 2 * idx__8756 + 1, n__8759))
        }else {
          if(this__8753.bitmap === bit__8755) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8753.bitmap ^ bit__8755, cljs.core.remove_pair.call(null, this__8753.arr, idx__8756))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8757)) {
        return new cljs.core.BitmapIndexedNode(null, this__8753.bitmap ^ bit__8755, cljs.core.remove_pair.call(null, this__8753.arr, idx__8756))
      }else {
        if("\ufdd0'else") {
          return inode__8754
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8760 = this;
  var inode__8761 = this;
  var bit__8762 = 1 << (hash >>> shift & 31);
  var idx__8763 = cljs.core.bitmap_indexed_node_index.call(null, this__8760.bitmap, bit__8762);
  if((this__8760.bitmap & bit__8762) === 0) {
    var n__8764 = cljs.core.bit_count.call(null, this__8760.bitmap);
    if(n__8764 >= 16) {
      var nodes__8765 = cljs.core.make_array.call(null, 32);
      var jdx__8766 = hash >>> shift & 31;
      nodes__8765[jdx__8766] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8767 = 0;
      var j__8768 = 0;
      while(true) {
        if(i__8767 < 32) {
          if((this__8760.bitmap >>> i__8767 & 1) === 0) {
            var G__8783 = i__8767 + 1;
            var G__8784 = j__8768;
            i__8767 = G__8783;
            j__8768 = G__8784;
            continue
          }else {
            nodes__8765[i__8767] = !(this__8760.arr[j__8768] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8760.arr[j__8768]), this__8760.arr[j__8768], this__8760.arr[j__8768 + 1], added_leaf_QMARK_) : this__8760.arr[j__8768 + 1];
            var G__8785 = i__8767 + 1;
            var G__8786 = j__8768 + 2;
            i__8767 = G__8785;
            j__8768 = G__8786;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8764 + 1, nodes__8765)
    }else {
      var new_arr__8769 = cljs.core.make_array.call(null, 2 * (n__8764 + 1));
      cljs.core.array_copy.call(null, this__8760.arr, 0, new_arr__8769, 0, 2 * idx__8763);
      new_arr__8769[2 * idx__8763] = key;
      new_arr__8769[2 * idx__8763 + 1] = val;
      cljs.core.array_copy.call(null, this__8760.arr, 2 * idx__8763, new_arr__8769, 2 * (idx__8763 + 1), 2 * (n__8764 - idx__8763));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8760.bitmap | bit__8762, new_arr__8769)
    }
  }else {
    var key_or_nil__8770 = this__8760.arr[2 * idx__8763];
    var val_or_node__8771 = this__8760.arr[2 * idx__8763 + 1];
    if(key_or_nil__8770 == null) {
      var n__8772 = val_or_node__8771.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8772 === val_or_node__8771) {
        return inode__8761
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8760.bitmap, cljs.core.clone_and_set.call(null, this__8760.arr, 2 * idx__8763 + 1, n__8772))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8770)) {
        if(val === val_or_node__8771) {
          return inode__8761
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8760.bitmap, cljs.core.clone_and_set.call(null, this__8760.arr, 2 * idx__8763 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8760.bitmap, cljs.core.clone_and_set.call(null, this__8760.arr, 2 * idx__8763, null, 2 * idx__8763 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8770, val_or_node__8771, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8773 = this;
  var inode__8774 = this;
  var bit__8775 = 1 << (hash >>> shift & 31);
  if((this__8773.bitmap & bit__8775) === 0) {
    return not_found
  }else {
    var idx__8776 = cljs.core.bitmap_indexed_node_index.call(null, this__8773.bitmap, bit__8775);
    var key_or_nil__8777 = this__8773.arr[2 * idx__8776];
    var val_or_node__8778 = this__8773.arr[2 * idx__8776 + 1];
    if(key_or_nil__8777 == null) {
      return val_or_node__8778.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8777)) {
        return val_or_node__8778
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8794 = array_node.arr;
  var len__8795 = 2 * (array_node.cnt - 1);
  var new_arr__8796 = cljs.core.make_array.call(null, len__8795);
  var i__8797 = 0;
  var j__8798 = 1;
  var bitmap__8799 = 0;
  while(true) {
    if(i__8797 < len__8795) {
      if(function() {
        var and__3822__auto____8800 = !(i__8797 === idx);
        if(and__3822__auto____8800) {
          return!(arr__8794[i__8797] == null)
        }else {
          return and__3822__auto____8800
        }
      }()) {
        new_arr__8796[j__8798] = arr__8794[i__8797];
        var G__8801 = i__8797 + 1;
        var G__8802 = j__8798 + 2;
        var G__8803 = bitmap__8799 | 1 << i__8797;
        i__8797 = G__8801;
        j__8798 = G__8802;
        bitmap__8799 = G__8803;
        continue
      }else {
        var G__8804 = i__8797 + 1;
        var G__8805 = j__8798;
        var G__8806 = bitmap__8799;
        i__8797 = G__8804;
        j__8798 = G__8805;
        bitmap__8799 = G__8806;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8799, new_arr__8796)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8807 = this;
  var inode__8808 = this;
  var idx__8809 = hash >>> shift & 31;
  var node__8810 = this__8807.arr[idx__8809];
  if(node__8810 == null) {
    var editable__8811 = cljs.core.edit_and_set.call(null, inode__8808, edit, idx__8809, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8811.cnt = editable__8811.cnt + 1;
    return editable__8811
  }else {
    var n__8812 = node__8810.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8812 === node__8810) {
      return inode__8808
    }else {
      return cljs.core.edit_and_set.call(null, inode__8808, edit, idx__8809, n__8812)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8813 = this;
  var inode__8814 = this;
  return cljs.core.create_array_node_seq.call(null, this__8813.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8815 = this;
  var inode__8816 = this;
  var idx__8817 = hash >>> shift & 31;
  var node__8818 = this__8815.arr[idx__8817];
  if(node__8818 == null) {
    return inode__8816
  }else {
    var n__8819 = node__8818.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8819 === node__8818) {
      return inode__8816
    }else {
      if(n__8819 == null) {
        if(this__8815.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8816, edit, idx__8817)
        }else {
          var editable__8820 = cljs.core.edit_and_set.call(null, inode__8816, edit, idx__8817, n__8819);
          editable__8820.cnt = editable__8820.cnt - 1;
          return editable__8820
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8816, edit, idx__8817, n__8819)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8821 = this;
  var inode__8822 = this;
  if(e === this__8821.edit) {
    return inode__8822
  }else {
    return new cljs.core.ArrayNode(e, this__8821.cnt, this__8821.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8823 = this;
  var inode__8824 = this;
  var len__8825 = this__8823.arr.length;
  var i__8826 = 0;
  var init__8827 = init;
  while(true) {
    if(i__8826 < len__8825) {
      var node__8828 = this__8823.arr[i__8826];
      if(!(node__8828 == null)) {
        var init__8829 = node__8828.kv_reduce(f, init__8827);
        if(cljs.core.reduced_QMARK_.call(null, init__8829)) {
          return cljs.core.deref.call(null, init__8829)
        }else {
          var G__8848 = i__8826 + 1;
          var G__8849 = init__8829;
          i__8826 = G__8848;
          init__8827 = G__8849;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8827
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8830 = this;
  var inode__8831 = this;
  var idx__8832 = hash >>> shift & 31;
  var node__8833 = this__8830.arr[idx__8832];
  if(!(node__8833 == null)) {
    return node__8833.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8834 = this;
  var inode__8835 = this;
  var idx__8836 = hash >>> shift & 31;
  var node__8837 = this__8834.arr[idx__8836];
  if(!(node__8837 == null)) {
    var n__8838 = node__8837.inode_without(shift + 5, hash, key);
    if(n__8838 === node__8837) {
      return inode__8835
    }else {
      if(n__8838 == null) {
        if(this__8834.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8835, null, idx__8836)
        }else {
          return new cljs.core.ArrayNode(null, this__8834.cnt - 1, cljs.core.clone_and_set.call(null, this__8834.arr, idx__8836, n__8838))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8834.cnt, cljs.core.clone_and_set.call(null, this__8834.arr, idx__8836, n__8838))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8835
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8839 = this;
  var inode__8840 = this;
  var idx__8841 = hash >>> shift & 31;
  var node__8842 = this__8839.arr[idx__8841];
  if(node__8842 == null) {
    return new cljs.core.ArrayNode(null, this__8839.cnt + 1, cljs.core.clone_and_set.call(null, this__8839.arr, idx__8841, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8843 = node__8842.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8843 === node__8842) {
      return inode__8840
    }else {
      return new cljs.core.ArrayNode(null, this__8839.cnt, cljs.core.clone_and_set.call(null, this__8839.arr, idx__8841, n__8843))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8844 = this;
  var inode__8845 = this;
  var idx__8846 = hash >>> shift & 31;
  var node__8847 = this__8844.arr[idx__8846];
  if(!(node__8847 == null)) {
    return node__8847.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8852 = 2 * cnt;
  var i__8853 = 0;
  while(true) {
    if(i__8853 < lim__8852) {
      if(cljs.core.key_test.call(null, key, arr[i__8853])) {
        return i__8853
      }else {
        var G__8854 = i__8853 + 2;
        i__8853 = G__8854;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8855 = this;
  var inode__8856 = this;
  if(hash === this__8855.collision_hash) {
    var idx__8857 = cljs.core.hash_collision_node_find_index.call(null, this__8855.arr, this__8855.cnt, key);
    if(idx__8857 === -1) {
      if(this__8855.arr.length > 2 * this__8855.cnt) {
        var editable__8858 = cljs.core.edit_and_set.call(null, inode__8856, edit, 2 * this__8855.cnt, key, 2 * this__8855.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8858.cnt = editable__8858.cnt + 1;
        return editable__8858
      }else {
        var len__8859 = this__8855.arr.length;
        var new_arr__8860 = cljs.core.make_array.call(null, len__8859 + 2);
        cljs.core.array_copy.call(null, this__8855.arr, 0, new_arr__8860, 0, len__8859);
        new_arr__8860[len__8859] = key;
        new_arr__8860[len__8859 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8856.ensure_editable_array(edit, this__8855.cnt + 1, new_arr__8860)
      }
    }else {
      if(this__8855.arr[idx__8857 + 1] === val) {
        return inode__8856
      }else {
        return cljs.core.edit_and_set.call(null, inode__8856, edit, idx__8857 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8855.collision_hash >>> shift & 31), [null, inode__8856, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8861 = this;
  var inode__8862 = this;
  return cljs.core.create_inode_seq.call(null, this__8861.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8863 = this;
  var inode__8864 = this;
  var idx__8865 = cljs.core.hash_collision_node_find_index.call(null, this__8863.arr, this__8863.cnt, key);
  if(idx__8865 === -1) {
    return inode__8864
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8863.cnt === 1) {
      return null
    }else {
      var editable__8866 = inode__8864.ensure_editable(edit);
      var earr__8867 = editable__8866.arr;
      earr__8867[idx__8865] = earr__8867[2 * this__8863.cnt - 2];
      earr__8867[idx__8865 + 1] = earr__8867[2 * this__8863.cnt - 1];
      earr__8867[2 * this__8863.cnt - 1] = null;
      earr__8867[2 * this__8863.cnt - 2] = null;
      editable__8866.cnt = editable__8866.cnt - 1;
      return editable__8866
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8868 = this;
  var inode__8869 = this;
  if(e === this__8868.edit) {
    return inode__8869
  }else {
    var new_arr__8870 = cljs.core.make_array.call(null, 2 * (this__8868.cnt + 1));
    cljs.core.array_copy.call(null, this__8868.arr, 0, new_arr__8870, 0, 2 * this__8868.cnt);
    return new cljs.core.HashCollisionNode(e, this__8868.collision_hash, this__8868.cnt, new_arr__8870)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8871 = this;
  var inode__8872 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8871.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8873 = this;
  var inode__8874 = this;
  var idx__8875 = cljs.core.hash_collision_node_find_index.call(null, this__8873.arr, this__8873.cnt, key);
  if(idx__8875 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8873.arr[idx__8875])) {
      return cljs.core.PersistentVector.fromArray([this__8873.arr[idx__8875], this__8873.arr[idx__8875 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8876 = this;
  var inode__8877 = this;
  var idx__8878 = cljs.core.hash_collision_node_find_index.call(null, this__8876.arr, this__8876.cnt, key);
  if(idx__8878 === -1) {
    return inode__8877
  }else {
    if(this__8876.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8876.collision_hash, this__8876.cnt - 1, cljs.core.remove_pair.call(null, this__8876.arr, cljs.core.quot.call(null, idx__8878, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8879 = this;
  var inode__8880 = this;
  if(hash === this__8879.collision_hash) {
    var idx__8881 = cljs.core.hash_collision_node_find_index.call(null, this__8879.arr, this__8879.cnt, key);
    if(idx__8881 === -1) {
      var len__8882 = this__8879.arr.length;
      var new_arr__8883 = cljs.core.make_array.call(null, len__8882 + 2);
      cljs.core.array_copy.call(null, this__8879.arr, 0, new_arr__8883, 0, len__8882);
      new_arr__8883[len__8882] = key;
      new_arr__8883[len__8882 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8879.collision_hash, this__8879.cnt + 1, new_arr__8883)
    }else {
      if(cljs.core._EQ_.call(null, this__8879.arr[idx__8881], val)) {
        return inode__8880
      }else {
        return new cljs.core.HashCollisionNode(null, this__8879.collision_hash, this__8879.cnt, cljs.core.clone_and_set.call(null, this__8879.arr, idx__8881 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8879.collision_hash >>> shift & 31), [null, inode__8880])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8884 = this;
  var inode__8885 = this;
  var idx__8886 = cljs.core.hash_collision_node_find_index.call(null, this__8884.arr, this__8884.cnt, key);
  if(idx__8886 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8884.arr[idx__8886])) {
      return this__8884.arr[idx__8886 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8887 = this;
  var inode__8888 = this;
  if(e === this__8887.edit) {
    this__8887.arr = array;
    this__8887.cnt = count;
    return inode__8888
  }else {
    return new cljs.core.HashCollisionNode(this__8887.edit, this__8887.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8893 = cljs.core.hash.call(null, key1);
    if(key1hash__8893 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8893, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8894 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8893, key1, val1, added_leaf_QMARK___8894).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8894)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8895 = cljs.core.hash.call(null, key1);
    if(key1hash__8895 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8895, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8896 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8895, key1, val1, added_leaf_QMARK___8896).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8896)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8897 = this;
  var h__2188__auto____8898 = this__8897.__hash;
  if(!(h__2188__auto____8898 == null)) {
    return h__2188__auto____8898
  }else {
    var h__2188__auto____8899 = cljs.core.hash_coll.call(null, coll);
    this__8897.__hash = h__2188__auto____8899;
    return h__2188__auto____8899
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8900 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8901 = this;
  var this__8902 = this;
  return cljs.core.pr_str.call(null, this__8902)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8903 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8904 = this;
  if(this__8904.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8904.nodes[this__8904.i], this__8904.nodes[this__8904.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8904.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8905 = this;
  if(this__8905.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8905.nodes, this__8905.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8905.nodes, this__8905.i, cljs.core.next.call(null, this__8905.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8906 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8907 = this;
  return new cljs.core.NodeSeq(meta, this__8907.nodes, this__8907.i, this__8907.s, this__8907.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8908 = this;
  return this__8908.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8909 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8909.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8916 = nodes.length;
      var j__8917 = i;
      while(true) {
        if(j__8917 < len__8916) {
          if(!(nodes[j__8917] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8917, null, null)
          }else {
            var temp__3971__auto____8918 = nodes[j__8917 + 1];
            if(cljs.core.truth_(temp__3971__auto____8918)) {
              var node__8919 = temp__3971__auto____8918;
              var temp__3971__auto____8920 = node__8919.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8920)) {
                var node_seq__8921 = temp__3971__auto____8920;
                return new cljs.core.NodeSeq(null, nodes, j__8917 + 2, node_seq__8921, null)
              }else {
                var G__8922 = j__8917 + 2;
                j__8917 = G__8922;
                continue
              }
            }else {
              var G__8923 = j__8917 + 2;
              j__8917 = G__8923;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8924 = this;
  var h__2188__auto____8925 = this__8924.__hash;
  if(!(h__2188__auto____8925 == null)) {
    return h__2188__auto____8925
  }else {
    var h__2188__auto____8926 = cljs.core.hash_coll.call(null, coll);
    this__8924.__hash = h__2188__auto____8926;
    return h__2188__auto____8926
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8927 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8928 = this;
  var this__8929 = this;
  return cljs.core.pr_str.call(null, this__8929)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8930 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8931 = this;
  return cljs.core.first.call(null, this__8931.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8932 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8932.nodes, this__8932.i, cljs.core.next.call(null, this__8932.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8933 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8934 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8934.nodes, this__8934.i, this__8934.s, this__8934.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8935 = this;
  return this__8935.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8936 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8936.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8943 = nodes.length;
      var j__8944 = i;
      while(true) {
        if(j__8944 < len__8943) {
          var temp__3971__auto____8945 = nodes[j__8944];
          if(cljs.core.truth_(temp__3971__auto____8945)) {
            var nj__8946 = temp__3971__auto____8945;
            var temp__3971__auto____8947 = nj__8946.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8947)) {
              var ns__8948 = temp__3971__auto____8947;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8944 + 1, ns__8948, null)
            }else {
              var G__8949 = j__8944 + 1;
              j__8944 = G__8949;
              continue
            }
          }else {
            var G__8950 = j__8944 + 1;
            j__8944 = G__8950;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8953 = this;
  return new cljs.core.TransientHashMap({}, this__8953.root, this__8953.cnt, this__8953.has_nil_QMARK_, this__8953.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8954 = this;
  var h__2188__auto____8955 = this__8954.__hash;
  if(!(h__2188__auto____8955 == null)) {
    return h__2188__auto____8955
  }else {
    var h__2188__auto____8956 = cljs.core.hash_imap.call(null, coll);
    this__8954.__hash = h__2188__auto____8956;
    return h__2188__auto____8956
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8957 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8958 = this;
  if(k == null) {
    if(this__8958.has_nil_QMARK_) {
      return this__8958.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8958.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8958.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8959 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8960 = this__8959.has_nil_QMARK_;
      if(and__3822__auto____8960) {
        return v === this__8959.nil_val
      }else {
        return and__3822__auto____8960
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8959.meta, this__8959.has_nil_QMARK_ ? this__8959.cnt : this__8959.cnt + 1, this__8959.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8961 = new cljs.core.Box(false);
    var new_root__8962 = (this__8959.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8959.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8961);
    if(new_root__8962 === this__8959.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8959.meta, added_leaf_QMARK___8961.val ? this__8959.cnt + 1 : this__8959.cnt, new_root__8962, this__8959.has_nil_QMARK_, this__8959.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8963 = this;
  if(k == null) {
    return this__8963.has_nil_QMARK_
  }else {
    if(this__8963.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8963.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8986 = null;
  var G__8986__2 = function(this_sym8964, k) {
    var this__8966 = this;
    var this_sym8964__8967 = this;
    var coll__8968 = this_sym8964__8967;
    return coll__8968.cljs$core$ILookup$_lookup$arity$2(coll__8968, k)
  };
  var G__8986__3 = function(this_sym8965, k, not_found) {
    var this__8966 = this;
    var this_sym8965__8969 = this;
    var coll__8970 = this_sym8965__8969;
    return coll__8970.cljs$core$ILookup$_lookup$arity$3(coll__8970, k, not_found)
  };
  G__8986 = function(this_sym8965, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8986__2.call(this, this_sym8965, k);
      case 3:
        return G__8986__3.call(this, this_sym8965, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8986
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8951, args8952) {
  var this__8971 = this;
  return this_sym8951.call.apply(this_sym8951, [this_sym8951].concat(args8952.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8972 = this;
  var init__8973 = this__8972.has_nil_QMARK_ ? f.call(null, init, null, this__8972.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8973)) {
    return cljs.core.deref.call(null, init__8973)
  }else {
    if(!(this__8972.root == null)) {
      return this__8972.root.kv_reduce(f, init__8973)
    }else {
      if("\ufdd0'else") {
        return init__8973
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8974 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8975 = this;
  var this__8976 = this;
  return cljs.core.pr_str.call(null, this__8976)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8977 = this;
  if(this__8977.cnt > 0) {
    var s__8978 = !(this__8977.root == null) ? this__8977.root.inode_seq() : null;
    if(this__8977.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8977.nil_val], true), s__8978)
    }else {
      return s__8978
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8979 = this;
  return this__8979.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8980 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8981 = this;
  return new cljs.core.PersistentHashMap(meta, this__8981.cnt, this__8981.root, this__8981.has_nil_QMARK_, this__8981.nil_val, this__8981.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8982 = this;
  return this__8982.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8983 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8983.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8984 = this;
  if(k == null) {
    if(this__8984.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8984.meta, this__8984.cnt - 1, this__8984.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8984.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8985 = this__8984.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8985 === this__8984.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8984.meta, this__8984.cnt - 1, new_root__8985, this__8984.has_nil_QMARK_, this__8984.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8987 = ks.length;
  var i__8988 = 0;
  var out__8989 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8988 < len__8987) {
      var G__8990 = i__8988 + 1;
      var G__8991 = cljs.core.assoc_BANG_.call(null, out__8989, ks[i__8988], vs[i__8988]);
      i__8988 = G__8990;
      out__8989 = G__8991;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8989)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8992 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8993 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8994 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8995 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8996 = this;
  if(k == null) {
    if(this__8996.has_nil_QMARK_) {
      return this__8996.nil_val
    }else {
      return null
    }
  }else {
    if(this__8996.root == null) {
      return null
    }else {
      return this__8996.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8997 = this;
  if(k == null) {
    if(this__8997.has_nil_QMARK_) {
      return this__8997.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8997.root == null) {
      return not_found
    }else {
      return this__8997.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8998 = this;
  if(this__8998.edit) {
    return this__8998.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8999 = this;
  var tcoll__9000 = this;
  if(this__8999.edit) {
    if(function() {
      var G__9001__9002 = o;
      if(G__9001__9002) {
        if(function() {
          var or__3824__auto____9003 = G__9001__9002.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9003) {
            return or__3824__auto____9003
          }else {
            return G__9001__9002.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9001__9002.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9001__9002)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9001__9002)
      }
    }()) {
      return tcoll__9000.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9004 = cljs.core.seq.call(null, o);
      var tcoll__9005 = tcoll__9000;
      while(true) {
        var temp__3971__auto____9006 = cljs.core.first.call(null, es__9004);
        if(cljs.core.truth_(temp__3971__auto____9006)) {
          var e__9007 = temp__3971__auto____9006;
          var G__9018 = cljs.core.next.call(null, es__9004);
          var G__9019 = tcoll__9005.assoc_BANG_(cljs.core.key.call(null, e__9007), cljs.core.val.call(null, e__9007));
          es__9004 = G__9018;
          tcoll__9005 = G__9019;
          continue
        }else {
          return tcoll__9005
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9008 = this;
  var tcoll__9009 = this;
  if(this__9008.edit) {
    if(k == null) {
      if(this__9008.nil_val === v) {
      }else {
        this__9008.nil_val = v
      }
      if(this__9008.has_nil_QMARK_) {
      }else {
        this__9008.count = this__9008.count + 1;
        this__9008.has_nil_QMARK_ = true
      }
      return tcoll__9009
    }else {
      var added_leaf_QMARK___9010 = new cljs.core.Box(false);
      var node__9011 = (this__9008.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9008.root).inode_assoc_BANG_(this__9008.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9010);
      if(node__9011 === this__9008.root) {
      }else {
        this__9008.root = node__9011
      }
      if(added_leaf_QMARK___9010.val) {
        this__9008.count = this__9008.count + 1
      }else {
      }
      return tcoll__9009
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9012 = this;
  var tcoll__9013 = this;
  if(this__9012.edit) {
    if(k == null) {
      if(this__9012.has_nil_QMARK_) {
        this__9012.has_nil_QMARK_ = false;
        this__9012.nil_val = null;
        this__9012.count = this__9012.count - 1;
        return tcoll__9013
      }else {
        return tcoll__9013
      }
    }else {
      if(this__9012.root == null) {
        return tcoll__9013
      }else {
        var removed_leaf_QMARK___9014 = new cljs.core.Box(false);
        var node__9015 = this__9012.root.inode_without_BANG_(this__9012.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9014);
        if(node__9015 === this__9012.root) {
        }else {
          this__9012.root = node__9015
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9014[0])) {
          this__9012.count = this__9012.count - 1
        }else {
        }
        return tcoll__9013
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9016 = this;
  var tcoll__9017 = this;
  if(this__9016.edit) {
    this__9016.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9016.count, this__9016.root, this__9016.has_nil_QMARK_, this__9016.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9022 = node;
  var stack__9023 = stack;
  while(true) {
    if(!(t__9022 == null)) {
      var G__9024 = ascending_QMARK_ ? t__9022.left : t__9022.right;
      var G__9025 = cljs.core.conj.call(null, stack__9023, t__9022);
      t__9022 = G__9024;
      stack__9023 = G__9025;
      continue
    }else {
      return stack__9023
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9026 = this;
  var h__2188__auto____9027 = this__9026.__hash;
  if(!(h__2188__auto____9027 == null)) {
    return h__2188__auto____9027
  }else {
    var h__2188__auto____9028 = cljs.core.hash_coll.call(null, coll);
    this__9026.__hash = h__2188__auto____9028;
    return h__2188__auto____9028
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9029 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9030 = this;
  var this__9031 = this;
  return cljs.core.pr_str.call(null, this__9031)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9032 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9033 = this;
  if(this__9033.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9033.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9034 = this;
  return cljs.core.peek.call(null, this__9034.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9035 = this;
  var t__9036 = cljs.core.first.call(null, this__9035.stack);
  var next_stack__9037 = cljs.core.tree_map_seq_push.call(null, this__9035.ascending_QMARK_ ? t__9036.right : t__9036.left, cljs.core.next.call(null, this__9035.stack), this__9035.ascending_QMARK_);
  if(!(next_stack__9037 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9037, this__9035.ascending_QMARK_, this__9035.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9038 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9039 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9039.stack, this__9039.ascending_QMARK_, this__9039.cnt, this__9039.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9040 = this;
  return this__9040.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9042 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9042) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9042
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9044 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9044) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9044
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9048 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9048)) {
    return cljs.core.deref.call(null, init__9048)
  }else {
    var init__9049 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9048) : init__9048;
    if(cljs.core.reduced_QMARK_.call(null, init__9049)) {
      return cljs.core.deref.call(null, init__9049)
    }else {
      var init__9050 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9049) : init__9049;
      if(cljs.core.reduced_QMARK_.call(null, init__9050)) {
        return cljs.core.deref.call(null, init__9050)
      }else {
        return init__9050
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9053 = this;
  var h__2188__auto____9054 = this__9053.__hash;
  if(!(h__2188__auto____9054 == null)) {
    return h__2188__auto____9054
  }else {
    var h__2188__auto____9055 = cljs.core.hash_coll.call(null, coll);
    this__9053.__hash = h__2188__auto____9055;
    return h__2188__auto____9055
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9056 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9057 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9058 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9058.key, this__9058.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9106 = null;
  var G__9106__2 = function(this_sym9059, k) {
    var this__9061 = this;
    var this_sym9059__9062 = this;
    var node__9063 = this_sym9059__9062;
    return node__9063.cljs$core$ILookup$_lookup$arity$2(node__9063, k)
  };
  var G__9106__3 = function(this_sym9060, k, not_found) {
    var this__9061 = this;
    var this_sym9060__9064 = this;
    var node__9065 = this_sym9060__9064;
    return node__9065.cljs$core$ILookup$_lookup$arity$3(node__9065, k, not_found)
  };
  G__9106 = function(this_sym9060, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9106__2.call(this, this_sym9060, k);
      case 3:
        return G__9106__3.call(this, this_sym9060, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9106
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9051, args9052) {
  var this__9066 = this;
  return this_sym9051.call.apply(this_sym9051, [this_sym9051].concat(args9052.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9067 = this;
  return cljs.core.PersistentVector.fromArray([this__9067.key, this__9067.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9068 = this;
  return this__9068.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9069 = this;
  return this__9069.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9070 = this;
  var node__9071 = this;
  return ins.balance_right(node__9071)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9072 = this;
  var node__9073 = this;
  return new cljs.core.RedNode(this__9072.key, this__9072.val, this__9072.left, this__9072.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9074 = this;
  var node__9075 = this;
  return cljs.core.balance_right_del.call(null, this__9074.key, this__9074.val, this__9074.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9076 = this;
  var node__9077 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9078 = this;
  var node__9079 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9079, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9080 = this;
  var node__9081 = this;
  return cljs.core.balance_left_del.call(null, this__9080.key, this__9080.val, del, this__9080.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9082 = this;
  var node__9083 = this;
  return ins.balance_left(node__9083)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9084 = this;
  var node__9085 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9085, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9107 = null;
  var G__9107__0 = function() {
    var this__9086 = this;
    var this__9088 = this;
    return cljs.core.pr_str.call(null, this__9088)
  };
  G__9107 = function() {
    switch(arguments.length) {
      case 0:
        return G__9107__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9107
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9089 = this;
  var node__9090 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9090, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9091 = this;
  var node__9092 = this;
  return node__9092
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9093 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9094 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9095 = this;
  return cljs.core.list.call(null, this__9095.key, this__9095.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9096 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9097 = this;
  return this__9097.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9098 = this;
  return cljs.core.PersistentVector.fromArray([this__9098.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9099 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9099.key, this__9099.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9100 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9101 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9101.key, this__9101.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9102 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9103 = this;
  if(n === 0) {
    return this__9103.key
  }else {
    if(n === 1) {
      return this__9103.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9104 = this;
  if(n === 0) {
    return this__9104.key
  }else {
    if(n === 1) {
      return this__9104.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9105 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9110 = this;
  var h__2188__auto____9111 = this__9110.__hash;
  if(!(h__2188__auto____9111 == null)) {
    return h__2188__auto____9111
  }else {
    var h__2188__auto____9112 = cljs.core.hash_coll.call(null, coll);
    this__9110.__hash = h__2188__auto____9112;
    return h__2188__auto____9112
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9113 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9114 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9115 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9115.key, this__9115.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9163 = null;
  var G__9163__2 = function(this_sym9116, k) {
    var this__9118 = this;
    var this_sym9116__9119 = this;
    var node__9120 = this_sym9116__9119;
    return node__9120.cljs$core$ILookup$_lookup$arity$2(node__9120, k)
  };
  var G__9163__3 = function(this_sym9117, k, not_found) {
    var this__9118 = this;
    var this_sym9117__9121 = this;
    var node__9122 = this_sym9117__9121;
    return node__9122.cljs$core$ILookup$_lookup$arity$3(node__9122, k, not_found)
  };
  G__9163 = function(this_sym9117, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9163__2.call(this, this_sym9117, k);
      case 3:
        return G__9163__3.call(this, this_sym9117, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9163
}();
cljs.core.RedNode.prototype.apply = function(this_sym9108, args9109) {
  var this__9123 = this;
  return this_sym9108.call.apply(this_sym9108, [this_sym9108].concat(args9109.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9124 = this;
  return cljs.core.PersistentVector.fromArray([this__9124.key, this__9124.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9125 = this;
  return this__9125.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9126 = this;
  return this__9126.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9127 = this;
  var node__9128 = this;
  return new cljs.core.RedNode(this__9127.key, this__9127.val, this__9127.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9129 = this;
  var node__9130 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9131 = this;
  var node__9132 = this;
  return new cljs.core.RedNode(this__9131.key, this__9131.val, this__9131.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9133 = this;
  var node__9134 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9135 = this;
  var node__9136 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9136, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9137 = this;
  var node__9138 = this;
  return new cljs.core.RedNode(this__9137.key, this__9137.val, del, this__9137.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9139 = this;
  var node__9140 = this;
  return new cljs.core.RedNode(this__9139.key, this__9139.val, ins, this__9139.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9141 = this;
  var node__9142 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9141.left)) {
    return new cljs.core.RedNode(this__9141.key, this__9141.val, this__9141.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9141.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9141.right)) {
      return new cljs.core.RedNode(this__9141.right.key, this__9141.right.val, new cljs.core.BlackNode(this__9141.key, this__9141.val, this__9141.left, this__9141.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9141.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9142, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9164 = null;
  var G__9164__0 = function() {
    var this__9143 = this;
    var this__9145 = this;
    return cljs.core.pr_str.call(null, this__9145)
  };
  G__9164 = function() {
    switch(arguments.length) {
      case 0:
        return G__9164__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9164
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9146 = this;
  var node__9147 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9146.right)) {
    return new cljs.core.RedNode(this__9146.key, this__9146.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9146.left, null), this__9146.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9146.left)) {
      return new cljs.core.RedNode(this__9146.left.key, this__9146.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9146.left.left, null), new cljs.core.BlackNode(this__9146.key, this__9146.val, this__9146.left.right, this__9146.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9147, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9148 = this;
  var node__9149 = this;
  return new cljs.core.BlackNode(this__9148.key, this__9148.val, this__9148.left, this__9148.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9150 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9151 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9152 = this;
  return cljs.core.list.call(null, this__9152.key, this__9152.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9153 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9154 = this;
  return this__9154.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9155 = this;
  return cljs.core.PersistentVector.fromArray([this__9155.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9156 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9156.key, this__9156.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9157 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9158 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9158.key, this__9158.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9159 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9160 = this;
  if(n === 0) {
    return this__9160.key
  }else {
    if(n === 1) {
      return this__9160.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9161 = this;
  if(n === 0) {
    return this__9161.key
  }else {
    if(n === 1) {
      return this__9161.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9162 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9168 = comp.call(null, k, tree.key);
    if(c__9168 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9168 < 0) {
        var ins__9169 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9169 == null)) {
          return tree.add_left(ins__9169)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9170 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9170 == null)) {
            return tree.add_right(ins__9170)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9173 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9173)) {
            return new cljs.core.RedNode(app__9173.key, app__9173.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9173.left, null), new cljs.core.RedNode(right.key, right.val, app__9173.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9173, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9174 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9174)) {
              return new cljs.core.RedNode(app__9174.key, app__9174.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9174.left, null), new cljs.core.BlackNode(right.key, right.val, app__9174.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9174, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9180 = comp.call(null, k, tree.key);
    if(c__9180 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9180 < 0) {
        var del__9181 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9182 = !(del__9181 == null);
          if(or__3824__auto____9182) {
            return or__3824__auto____9182
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9181, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9181, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9183 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9184 = !(del__9183 == null);
            if(or__3824__auto____9184) {
              return or__3824__auto____9184
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9183)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9183, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9187 = tree.key;
  var c__9188 = comp.call(null, k, tk__9187);
  if(c__9188 === 0) {
    return tree.replace(tk__9187, v, tree.left, tree.right)
  }else {
    if(c__9188 < 0) {
      return tree.replace(tk__9187, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9187, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9191 = this;
  var h__2188__auto____9192 = this__9191.__hash;
  if(!(h__2188__auto____9192 == null)) {
    return h__2188__auto____9192
  }else {
    var h__2188__auto____9193 = cljs.core.hash_imap.call(null, coll);
    this__9191.__hash = h__2188__auto____9193;
    return h__2188__auto____9193
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9194 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9195 = this;
  var n__9196 = coll.entry_at(k);
  if(!(n__9196 == null)) {
    return n__9196.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9197 = this;
  var found__9198 = [null];
  var t__9199 = cljs.core.tree_map_add.call(null, this__9197.comp, this__9197.tree, k, v, found__9198);
  if(t__9199 == null) {
    var found_node__9200 = cljs.core.nth.call(null, found__9198, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9200.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9197.comp, cljs.core.tree_map_replace.call(null, this__9197.comp, this__9197.tree, k, v), this__9197.cnt, this__9197.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9197.comp, t__9199.blacken(), this__9197.cnt + 1, this__9197.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9201 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9235 = null;
  var G__9235__2 = function(this_sym9202, k) {
    var this__9204 = this;
    var this_sym9202__9205 = this;
    var coll__9206 = this_sym9202__9205;
    return coll__9206.cljs$core$ILookup$_lookup$arity$2(coll__9206, k)
  };
  var G__9235__3 = function(this_sym9203, k, not_found) {
    var this__9204 = this;
    var this_sym9203__9207 = this;
    var coll__9208 = this_sym9203__9207;
    return coll__9208.cljs$core$ILookup$_lookup$arity$3(coll__9208, k, not_found)
  };
  G__9235 = function(this_sym9203, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9235__2.call(this, this_sym9203, k);
      case 3:
        return G__9235__3.call(this, this_sym9203, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9235
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9189, args9190) {
  var this__9209 = this;
  return this_sym9189.call.apply(this_sym9189, [this_sym9189].concat(args9190.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9210 = this;
  if(!(this__9210.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9210.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9211 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9212 = this;
  if(this__9212.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9212.tree, false, this__9212.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9213 = this;
  var this__9214 = this;
  return cljs.core.pr_str.call(null, this__9214)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9215 = this;
  var coll__9216 = this;
  var t__9217 = this__9215.tree;
  while(true) {
    if(!(t__9217 == null)) {
      var c__9218 = this__9215.comp.call(null, k, t__9217.key);
      if(c__9218 === 0) {
        return t__9217
      }else {
        if(c__9218 < 0) {
          var G__9236 = t__9217.left;
          t__9217 = G__9236;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9237 = t__9217.right;
            t__9217 = G__9237;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9219 = this;
  if(this__9219.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9219.tree, ascending_QMARK_, this__9219.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9220 = this;
  if(this__9220.cnt > 0) {
    var stack__9221 = null;
    var t__9222 = this__9220.tree;
    while(true) {
      if(!(t__9222 == null)) {
        var c__9223 = this__9220.comp.call(null, k, t__9222.key);
        if(c__9223 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9221, t__9222), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9223 < 0) {
              var G__9238 = cljs.core.conj.call(null, stack__9221, t__9222);
              var G__9239 = t__9222.left;
              stack__9221 = G__9238;
              t__9222 = G__9239;
              continue
            }else {
              var G__9240 = stack__9221;
              var G__9241 = t__9222.right;
              stack__9221 = G__9240;
              t__9222 = G__9241;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9223 > 0) {
                var G__9242 = cljs.core.conj.call(null, stack__9221, t__9222);
                var G__9243 = t__9222.right;
                stack__9221 = G__9242;
                t__9222 = G__9243;
                continue
              }else {
                var G__9244 = stack__9221;
                var G__9245 = t__9222.left;
                stack__9221 = G__9244;
                t__9222 = G__9245;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9221 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9221, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9224 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9225 = this;
  return this__9225.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9226 = this;
  if(this__9226.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9226.tree, true, this__9226.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9227 = this;
  return this__9227.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9228 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9229 = this;
  return new cljs.core.PersistentTreeMap(this__9229.comp, this__9229.tree, this__9229.cnt, meta, this__9229.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9230 = this;
  return this__9230.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9231 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9231.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9232 = this;
  var found__9233 = [null];
  var t__9234 = cljs.core.tree_map_remove.call(null, this__9232.comp, this__9232.tree, k, found__9233);
  if(t__9234 == null) {
    if(cljs.core.nth.call(null, found__9233, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9232.comp, null, 0, this__9232.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9232.comp, t__9234.blacken(), this__9232.cnt - 1, this__9232.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9248 = cljs.core.seq.call(null, keyvals);
    var out__9249 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9248) {
        var G__9250 = cljs.core.nnext.call(null, in__9248);
        var G__9251 = cljs.core.assoc_BANG_.call(null, out__9249, cljs.core.first.call(null, in__9248), cljs.core.second.call(null, in__9248));
        in__9248 = G__9250;
        out__9249 = G__9251;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9249)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9252) {
    var keyvals = cljs.core.seq(arglist__9252);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9253) {
    var keyvals = cljs.core.seq(arglist__9253);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9257 = [];
    var obj__9258 = {};
    var kvs__9259 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9259) {
        ks__9257.push(cljs.core.first.call(null, kvs__9259));
        obj__9258[cljs.core.first.call(null, kvs__9259)] = cljs.core.second.call(null, kvs__9259);
        var G__9260 = cljs.core.nnext.call(null, kvs__9259);
        kvs__9259 = G__9260;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9257, obj__9258)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9261) {
    var keyvals = cljs.core.seq(arglist__9261);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9264 = cljs.core.seq.call(null, keyvals);
    var out__9265 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9264) {
        var G__9266 = cljs.core.nnext.call(null, in__9264);
        var G__9267 = cljs.core.assoc.call(null, out__9265, cljs.core.first.call(null, in__9264), cljs.core.second.call(null, in__9264));
        in__9264 = G__9266;
        out__9265 = G__9267;
        continue
      }else {
        return out__9265
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9268) {
    var keyvals = cljs.core.seq(arglist__9268);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9271 = cljs.core.seq.call(null, keyvals);
    var out__9272 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9271) {
        var G__9273 = cljs.core.nnext.call(null, in__9271);
        var G__9274 = cljs.core.assoc.call(null, out__9272, cljs.core.first.call(null, in__9271), cljs.core.second.call(null, in__9271));
        in__9271 = G__9273;
        out__9272 = G__9274;
        continue
      }else {
        return out__9272
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9275) {
    var comparator = cljs.core.first(arglist__9275);
    var keyvals = cljs.core.rest(arglist__9275);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9276_SHARP_, p2__9277_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9279 = p1__9276_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9279)) {
            return or__3824__auto____9279
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9277_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9280) {
    var maps = cljs.core.seq(arglist__9280);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9288 = function(m, e) {
        var k__9286 = cljs.core.first.call(null, e);
        var v__9287 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9286)) {
          return cljs.core.assoc.call(null, m, k__9286, f.call(null, cljs.core._lookup.call(null, m, k__9286, null), v__9287))
        }else {
          return cljs.core.assoc.call(null, m, k__9286, v__9287)
        }
      };
      var merge2__9290 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9288, function() {
          var or__3824__auto____9289 = m1;
          if(cljs.core.truth_(or__3824__auto____9289)) {
            return or__3824__auto____9289
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9290, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9291) {
    var f = cljs.core.first(arglist__9291);
    var maps = cljs.core.rest(arglist__9291);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9296 = cljs.core.ObjMap.EMPTY;
  var keys__9297 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9297) {
      var key__9298 = cljs.core.first.call(null, keys__9297);
      var entry__9299 = cljs.core._lookup.call(null, map, key__9298, "\ufdd0'user/not-found");
      var G__9300 = cljs.core.not_EQ_.call(null, entry__9299, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9296, key__9298, entry__9299) : ret__9296;
      var G__9301 = cljs.core.next.call(null, keys__9297);
      ret__9296 = G__9300;
      keys__9297 = G__9301;
      continue
    }else {
      return ret__9296
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9305 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9305.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9306 = this;
  var h__2188__auto____9307 = this__9306.__hash;
  if(!(h__2188__auto____9307 == null)) {
    return h__2188__auto____9307
  }else {
    var h__2188__auto____9308 = cljs.core.hash_iset.call(null, coll);
    this__9306.__hash = h__2188__auto____9308;
    return h__2188__auto____9308
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9309 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9310 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9310.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9331 = null;
  var G__9331__2 = function(this_sym9311, k) {
    var this__9313 = this;
    var this_sym9311__9314 = this;
    var coll__9315 = this_sym9311__9314;
    return coll__9315.cljs$core$ILookup$_lookup$arity$2(coll__9315, k)
  };
  var G__9331__3 = function(this_sym9312, k, not_found) {
    var this__9313 = this;
    var this_sym9312__9316 = this;
    var coll__9317 = this_sym9312__9316;
    return coll__9317.cljs$core$ILookup$_lookup$arity$3(coll__9317, k, not_found)
  };
  G__9331 = function(this_sym9312, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9331__2.call(this, this_sym9312, k);
      case 3:
        return G__9331__3.call(this, this_sym9312, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9331
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9303, args9304) {
  var this__9318 = this;
  return this_sym9303.call.apply(this_sym9303, [this_sym9303].concat(args9304.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9319 = this;
  return new cljs.core.PersistentHashSet(this__9319.meta, cljs.core.assoc.call(null, this__9319.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9320 = this;
  var this__9321 = this;
  return cljs.core.pr_str.call(null, this__9321)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9322 = this;
  return cljs.core.keys.call(null, this__9322.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9323 = this;
  return new cljs.core.PersistentHashSet(this__9323.meta, cljs.core.dissoc.call(null, this__9323.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9324 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9325 = this;
  var and__3822__auto____9326 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9326) {
    var and__3822__auto____9327 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9327) {
      return cljs.core.every_QMARK_.call(null, function(p1__9302_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9302_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9327
    }
  }else {
    return and__3822__auto____9326
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9328 = this;
  return new cljs.core.PersistentHashSet(meta, this__9328.hash_map, this__9328.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9329 = this;
  return this__9329.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9330 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9330.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9332 = cljs.core.count.call(null, items);
  var i__9333 = 0;
  var out__9334 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9333 < len__9332) {
      var G__9335 = i__9333 + 1;
      var G__9336 = cljs.core.conj_BANG_.call(null, out__9334, items[i__9333]);
      i__9333 = G__9335;
      out__9334 = G__9336;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9334)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9354 = null;
  var G__9354__2 = function(this_sym9340, k) {
    var this__9342 = this;
    var this_sym9340__9343 = this;
    var tcoll__9344 = this_sym9340__9343;
    if(cljs.core._lookup.call(null, this__9342.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9354__3 = function(this_sym9341, k, not_found) {
    var this__9342 = this;
    var this_sym9341__9345 = this;
    var tcoll__9346 = this_sym9341__9345;
    if(cljs.core._lookup.call(null, this__9342.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9354 = function(this_sym9341, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9354__2.call(this, this_sym9341, k);
      case 3:
        return G__9354__3.call(this, this_sym9341, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9354
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9338, args9339) {
  var this__9347 = this;
  return this_sym9338.call.apply(this_sym9338, [this_sym9338].concat(args9339.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9348 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9349 = this;
  if(cljs.core._lookup.call(null, this__9349.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9350 = this;
  return cljs.core.count.call(null, this__9350.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9351 = this;
  this__9351.transient_map = cljs.core.dissoc_BANG_.call(null, this__9351.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9352 = this;
  this__9352.transient_map = cljs.core.assoc_BANG_.call(null, this__9352.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9353 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9353.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9357 = this;
  var h__2188__auto____9358 = this__9357.__hash;
  if(!(h__2188__auto____9358 == null)) {
    return h__2188__auto____9358
  }else {
    var h__2188__auto____9359 = cljs.core.hash_iset.call(null, coll);
    this__9357.__hash = h__2188__auto____9359;
    return h__2188__auto____9359
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9360 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9361 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9361.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9387 = null;
  var G__9387__2 = function(this_sym9362, k) {
    var this__9364 = this;
    var this_sym9362__9365 = this;
    var coll__9366 = this_sym9362__9365;
    return coll__9366.cljs$core$ILookup$_lookup$arity$2(coll__9366, k)
  };
  var G__9387__3 = function(this_sym9363, k, not_found) {
    var this__9364 = this;
    var this_sym9363__9367 = this;
    var coll__9368 = this_sym9363__9367;
    return coll__9368.cljs$core$ILookup$_lookup$arity$3(coll__9368, k, not_found)
  };
  G__9387 = function(this_sym9363, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9387__2.call(this, this_sym9363, k);
      case 3:
        return G__9387__3.call(this, this_sym9363, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9387
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9355, args9356) {
  var this__9369 = this;
  return this_sym9355.call.apply(this_sym9355, [this_sym9355].concat(args9356.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9370 = this;
  return new cljs.core.PersistentTreeSet(this__9370.meta, cljs.core.assoc.call(null, this__9370.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9371 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9371.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9372 = this;
  var this__9373 = this;
  return cljs.core.pr_str.call(null, this__9373)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9374 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9374.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9375 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9375.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9376 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9377 = this;
  return cljs.core._comparator.call(null, this__9377.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9378 = this;
  return cljs.core.keys.call(null, this__9378.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9379 = this;
  return new cljs.core.PersistentTreeSet(this__9379.meta, cljs.core.dissoc.call(null, this__9379.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9380 = this;
  return cljs.core.count.call(null, this__9380.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9381 = this;
  var and__3822__auto____9382 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9382) {
    var and__3822__auto____9383 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9383) {
      return cljs.core.every_QMARK_.call(null, function(p1__9337_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9337_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9383
    }
  }else {
    return and__3822__auto____9382
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9384 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9384.tree_map, this__9384.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9385 = this;
  return this__9385.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9386 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9386.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9392__delegate = function(keys) {
      var in__9390 = cljs.core.seq.call(null, keys);
      var out__9391 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9390)) {
          var G__9393 = cljs.core.next.call(null, in__9390);
          var G__9394 = cljs.core.conj_BANG_.call(null, out__9391, cljs.core.first.call(null, in__9390));
          in__9390 = G__9393;
          out__9391 = G__9394;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9391)
        }
        break
      }
    };
    var G__9392 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9392__delegate.call(this, keys)
    };
    G__9392.cljs$lang$maxFixedArity = 0;
    G__9392.cljs$lang$applyTo = function(arglist__9395) {
      var keys = cljs.core.seq(arglist__9395);
      return G__9392__delegate(keys)
    };
    G__9392.cljs$lang$arity$variadic = G__9392__delegate;
    return G__9392
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9396) {
    var keys = cljs.core.seq(arglist__9396);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9398) {
    var comparator = cljs.core.first(arglist__9398);
    var keys = cljs.core.rest(arglist__9398);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9404 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9405 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9405)) {
        var e__9406 = temp__3971__auto____9405;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9406))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9404, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9397_SHARP_) {
      var temp__3971__auto____9407 = cljs.core.find.call(null, smap, p1__9397_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9407)) {
        var e__9408 = temp__3971__auto____9407;
        return cljs.core.second.call(null, e__9408)
      }else {
        return p1__9397_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9438 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9431, seen) {
        while(true) {
          var vec__9432__9433 = p__9431;
          var f__9434 = cljs.core.nth.call(null, vec__9432__9433, 0, null);
          var xs__9435 = vec__9432__9433;
          var temp__3974__auto____9436 = cljs.core.seq.call(null, xs__9435);
          if(temp__3974__auto____9436) {
            var s__9437 = temp__3974__auto____9436;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9434)) {
              var G__9439 = cljs.core.rest.call(null, s__9437);
              var G__9440 = seen;
              p__9431 = G__9439;
              seen = G__9440;
              continue
            }else {
              return cljs.core.cons.call(null, f__9434, step.call(null, cljs.core.rest.call(null, s__9437), cljs.core.conj.call(null, seen, f__9434)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9438.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9443 = cljs.core.PersistentVector.EMPTY;
  var s__9444 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9444)) {
      var G__9445 = cljs.core.conj.call(null, ret__9443, cljs.core.first.call(null, s__9444));
      var G__9446 = cljs.core.next.call(null, s__9444);
      ret__9443 = G__9445;
      s__9444 = G__9446;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9443)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9449 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9449) {
        return or__3824__auto____9449
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9450 = x.lastIndexOf("/");
      if(i__9450 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9450 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9453 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9453) {
      return or__3824__auto____9453
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9454 = x.lastIndexOf("/");
    if(i__9454 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9454)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9461 = cljs.core.ObjMap.EMPTY;
  var ks__9462 = cljs.core.seq.call(null, keys);
  var vs__9463 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9464 = ks__9462;
      if(and__3822__auto____9464) {
        return vs__9463
      }else {
        return and__3822__auto____9464
      }
    }()) {
      var G__9465 = cljs.core.assoc.call(null, map__9461, cljs.core.first.call(null, ks__9462), cljs.core.first.call(null, vs__9463));
      var G__9466 = cljs.core.next.call(null, ks__9462);
      var G__9467 = cljs.core.next.call(null, vs__9463);
      map__9461 = G__9465;
      ks__9462 = G__9466;
      vs__9463 = G__9467;
      continue
    }else {
      return map__9461
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9470__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9455_SHARP_, p2__9456_SHARP_) {
        return max_key.call(null, k, p1__9455_SHARP_, p2__9456_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9470 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9470__delegate.call(this, k, x, y, more)
    };
    G__9470.cljs$lang$maxFixedArity = 3;
    G__9470.cljs$lang$applyTo = function(arglist__9471) {
      var k = cljs.core.first(arglist__9471);
      var x = cljs.core.first(cljs.core.next(arglist__9471));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9471)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9471)));
      return G__9470__delegate(k, x, y, more)
    };
    G__9470.cljs$lang$arity$variadic = G__9470__delegate;
    return G__9470
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9472__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9468_SHARP_, p2__9469_SHARP_) {
        return min_key.call(null, k, p1__9468_SHARP_, p2__9469_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9472 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9472__delegate.call(this, k, x, y, more)
    };
    G__9472.cljs$lang$maxFixedArity = 3;
    G__9472.cljs$lang$applyTo = function(arglist__9473) {
      var k = cljs.core.first(arglist__9473);
      var x = cljs.core.first(cljs.core.next(arglist__9473));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9473)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9473)));
      return G__9472__delegate(k, x, y, more)
    };
    G__9472.cljs$lang$arity$variadic = G__9472__delegate;
    return G__9472
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9476 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9476) {
        var s__9477 = temp__3974__auto____9476;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9477), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9477)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9480 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9480) {
      var s__9481 = temp__3974__auto____9480;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9481)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9481), take_while.call(null, pred, cljs.core.rest.call(null, s__9481)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9483 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9483.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9495 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9496 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9496)) {
        var vec__9497__9498 = temp__3974__auto____9496;
        var e__9499 = cljs.core.nth.call(null, vec__9497__9498, 0, null);
        var s__9500 = vec__9497__9498;
        if(cljs.core.truth_(include__9495.call(null, e__9499))) {
          return s__9500
        }else {
          return cljs.core.next.call(null, s__9500)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9495, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9501 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9501)) {
      var vec__9502__9503 = temp__3974__auto____9501;
      var e__9504 = cljs.core.nth.call(null, vec__9502__9503, 0, null);
      var s__9505 = vec__9502__9503;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9504)) ? s__9505 : cljs.core.next.call(null, s__9505))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9517 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9518 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9518)) {
        var vec__9519__9520 = temp__3974__auto____9518;
        var e__9521 = cljs.core.nth.call(null, vec__9519__9520, 0, null);
        var s__9522 = vec__9519__9520;
        if(cljs.core.truth_(include__9517.call(null, e__9521))) {
          return s__9522
        }else {
          return cljs.core.next.call(null, s__9522)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9517, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9523 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9523)) {
      var vec__9524__9525 = temp__3974__auto____9523;
      var e__9526 = cljs.core.nth.call(null, vec__9524__9525, 0, null);
      var s__9527 = vec__9524__9525;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9526)) ? s__9527 : cljs.core.next.call(null, s__9527))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9528 = this;
  var h__2188__auto____9529 = this__9528.__hash;
  if(!(h__2188__auto____9529 == null)) {
    return h__2188__auto____9529
  }else {
    var h__2188__auto____9530 = cljs.core.hash_coll.call(null, rng);
    this__9528.__hash = h__2188__auto____9530;
    return h__2188__auto____9530
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9531 = this;
  if(this__9531.step > 0) {
    if(this__9531.start + this__9531.step < this__9531.end) {
      return new cljs.core.Range(this__9531.meta, this__9531.start + this__9531.step, this__9531.end, this__9531.step, null)
    }else {
      return null
    }
  }else {
    if(this__9531.start + this__9531.step > this__9531.end) {
      return new cljs.core.Range(this__9531.meta, this__9531.start + this__9531.step, this__9531.end, this__9531.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9532 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9533 = this;
  var this__9534 = this;
  return cljs.core.pr_str.call(null, this__9534)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9535 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9536 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9537 = this;
  if(this__9537.step > 0) {
    if(this__9537.start < this__9537.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9537.start > this__9537.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9538 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9538.end - this__9538.start) / this__9538.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9539 = this;
  return this__9539.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9540 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9540.meta, this__9540.start + this__9540.step, this__9540.end, this__9540.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9541 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9542 = this;
  return new cljs.core.Range(meta, this__9542.start, this__9542.end, this__9542.step, this__9542.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9543 = this;
  return this__9543.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9544 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9544.start + n * this__9544.step
  }else {
    if(function() {
      var and__3822__auto____9545 = this__9544.start > this__9544.end;
      if(and__3822__auto____9545) {
        return this__9544.step === 0
      }else {
        return and__3822__auto____9545
      }
    }()) {
      return this__9544.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9546 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9546.start + n * this__9546.step
  }else {
    if(function() {
      var and__3822__auto____9547 = this__9546.start > this__9546.end;
      if(and__3822__auto____9547) {
        return this__9546.step === 0
      }else {
        return and__3822__auto____9547
      }
    }()) {
      return this__9546.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9548 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9548.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9551 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9551) {
      var s__9552 = temp__3974__auto____9551;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9552), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9552)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9559 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9559) {
      var s__9560 = temp__3974__auto____9559;
      var fst__9561 = cljs.core.first.call(null, s__9560);
      var fv__9562 = f.call(null, fst__9561);
      var run__9563 = cljs.core.cons.call(null, fst__9561, cljs.core.take_while.call(null, function(p1__9553_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9562, f.call(null, p1__9553_SHARP_))
      }, cljs.core.next.call(null, s__9560)));
      return cljs.core.cons.call(null, run__9563, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9563), s__9560))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9578 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9578) {
        var s__9579 = temp__3971__auto____9578;
        return reductions.call(null, f, cljs.core.first.call(null, s__9579), cljs.core.rest.call(null, s__9579))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9580 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9580) {
        var s__9581 = temp__3974__auto____9580;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9581)), cljs.core.rest.call(null, s__9581))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9584 = null;
      var G__9584__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9584__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9584__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9584__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9584__4 = function() {
        var G__9585__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9585 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9585__delegate.call(this, x, y, z, args)
        };
        G__9585.cljs$lang$maxFixedArity = 3;
        G__9585.cljs$lang$applyTo = function(arglist__9586) {
          var x = cljs.core.first(arglist__9586);
          var y = cljs.core.first(cljs.core.next(arglist__9586));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9586)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9586)));
          return G__9585__delegate(x, y, z, args)
        };
        G__9585.cljs$lang$arity$variadic = G__9585__delegate;
        return G__9585
      }();
      G__9584 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9584__0.call(this);
          case 1:
            return G__9584__1.call(this, x);
          case 2:
            return G__9584__2.call(this, x, y);
          case 3:
            return G__9584__3.call(this, x, y, z);
          default:
            return G__9584__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9584.cljs$lang$maxFixedArity = 3;
      G__9584.cljs$lang$applyTo = G__9584__4.cljs$lang$applyTo;
      return G__9584
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9587 = null;
      var G__9587__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9587__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9587__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9587__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9587__4 = function() {
        var G__9588__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9588 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9588__delegate.call(this, x, y, z, args)
        };
        G__9588.cljs$lang$maxFixedArity = 3;
        G__9588.cljs$lang$applyTo = function(arglist__9589) {
          var x = cljs.core.first(arglist__9589);
          var y = cljs.core.first(cljs.core.next(arglist__9589));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9589)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9589)));
          return G__9588__delegate(x, y, z, args)
        };
        G__9588.cljs$lang$arity$variadic = G__9588__delegate;
        return G__9588
      }();
      G__9587 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9587__0.call(this);
          case 1:
            return G__9587__1.call(this, x);
          case 2:
            return G__9587__2.call(this, x, y);
          case 3:
            return G__9587__3.call(this, x, y, z);
          default:
            return G__9587__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9587.cljs$lang$maxFixedArity = 3;
      G__9587.cljs$lang$applyTo = G__9587__4.cljs$lang$applyTo;
      return G__9587
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9590 = null;
      var G__9590__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9590__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9590__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9590__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9590__4 = function() {
        var G__9591__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9591 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9591__delegate.call(this, x, y, z, args)
        };
        G__9591.cljs$lang$maxFixedArity = 3;
        G__9591.cljs$lang$applyTo = function(arglist__9592) {
          var x = cljs.core.first(arglist__9592);
          var y = cljs.core.first(cljs.core.next(arglist__9592));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9592)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9592)));
          return G__9591__delegate(x, y, z, args)
        };
        G__9591.cljs$lang$arity$variadic = G__9591__delegate;
        return G__9591
      }();
      G__9590 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9590__0.call(this);
          case 1:
            return G__9590__1.call(this, x);
          case 2:
            return G__9590__2.call(this, x, y);
          case 3:
            return G__9590__3.call(this, x, y, z);
          default:
            return G__9590__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9590.cljs$lang$maxFixedArity = 3;
      G__9590.cljs$lang$applyTo = G__9590__4.cljs$lang$applyTo;
      return G__9590
    }()
  };
  var juxt__4 = function() {
    var G__9593__delegate = function(f, g, h, fs) {
      var fs__9583 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9594 = null;
        var G__9594__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9564_SHARP_, p2__9565_SHARP_) {
            return cljs.core.conj.call(null, p1__9564_SHARP_, p2__9565_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9583)
        };
        var G__9594__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9566_SHARP_, p2__9567_SHARP_) {
            return cljs.core.conj.call(null, p1__9566_SHARP_, p2__9567_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9583)
        };
        var G__9594__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9568_SHARP_, p2__9569_SHARP_) {
            return cljs.core.conj.call(null, p1__9568_SHARP_, p2__9569_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9583)
        };
        var G__9594__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9570_SHARP_, p2__9571_SHARP_) {
            return cljs.core.conj.call(null, p1__9570_SHARP_, p2__9571_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9583)
        };
        var G__9594__4 = function() {
          var G__9595__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9572_SHARP_, p2__9573_SHARP_) {
              return cljs.core.conj.call(null, p1__9572_SHARP_, cljs.core.apply.call(null, p2__9573_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9583)
          };
          var G__9595 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9595__delegate.call(this, x, y, z, args)
          };
          G__9595.cljs$lang$maxFixedArity = 3;
          G__9595.cljs$lang$applyTo = function(arglist__9596) {
            var x = cljs.core.first(arglist__9596);
            var y = cljs.core.first(cljs.core.next(arglist__9596));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9596)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9596)));
            return G__9595__delegate(x, y, z, args)
          };
          G__9595.cljs$lang$arity$variadic = G__9595__delegate;
          return G__9595
        }();
        G__9594 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9594__0.call(this);
            case 1:
              return G__9594__1.call(this, x);
            case 2:
              return G__9594__2.call(this, x, y);
            case 3:
              return G__9594__3.call(this, x, y, z);
            default:
              return G__9594__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9594.cljs$lang$maxFixedArity = 3;
        G__9594.cljs$lang$applyTo = G__9594__4.cljs$lang$applyTo;
        return G__9594
      }()
    };
    var G__9593 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9593__delegate.call(this, f, g, h, fs)
    };
    G__9593.cljs$lang$maxFixedArity = 3;
    G__9593.cljs$lang$applyTo = function(arglist__9597) {
      var f = cljs.core.first(arglist__9597);
      var g = cljs.core.first(cljs.core.next(arglist__9597));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9597)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9597)));
      return G__9593__delegate(f, g, h, fs)
    };
    G__9593.cljs$lang$arity$variadic = G__9593__delegate;
    return G__9593
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9600 = cljs.core.next.call(null, coll);
        coll = G__9600;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9599 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9599) {
          return n > 0
        }else {
          return and__3822__auto____9599
        }
      }())) {
        var G__9601 = n - 1;
        var G__9602 = cljs.core.next.call(null, coll);
        n = G__9601;
        coll = G__9602;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9604 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9604), s)) {
    if(cljs.core.count.call(null, matches__9604) === 1) {
      return cljs.core.first.call(null, matches__9604)
    }else {
      return cljs.core.vec.call(null, matches__9604)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9606 = re.exec(s);
  if(matches__9606 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9606) === 1) {
      return cljs.core.first.call(null, matches__9606)
    }else {
      return cljs.core.vec.call(null, matches__9606)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9611 = cljs.core.re_find.call(null, re, s);
  var match_idx__9612 = s.search(re);
  var match_str__9613 = cljs.core.coll_QMARK_.call(null, match_data__9611) ? cljs.core.first.call(null, match_data__9611) : match_data__9611;
  var post_match__9614 = cljs.core.subs.call(null, s, match_idx__9612 + cljs.core.count.call(null, match_str__9613));
  if(cljs.core.truth_(match_data__9611)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9611, re_seq.call(null, re, post_match__9614))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9621__9622 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9623 = cljs.core.nth.call(null, vec__9621__9622, 0, null);
  var flags__9624 = cljs.core.nth.call(null, vec__9621__9622, 1, null);
  var pattern__9625 = cljs.core.nth.call(null, vec__9621__9622, 2, null);
  return new RegExp(pattern__9625, flags__9624)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9615_SHARP_) {
    return print_one.call(null, p1__9615_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9635 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9635)) {
            var and__3822__auto____9639 = function() {
              var G__9636__9637 = obj;
              if(G__9636__9637) {
                if(function() {
                  var or__3824__auto____9638 = G__9636__9637.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9638) {
                    return or__3824__auto____9638
                  }else {
                    return G__9636__9637.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9636__9637.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9636__9637)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9636__9637)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9639)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9639
            }
          }else {
            return and__3822__auto____9635
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9640 = !(obj == null);
          if(and__3822__auto____9640) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9640
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9641__9642 = obj;
          if(G__9641__9642) {
            if(function() {
              var or__3824__auto____9643 = G__9641__9642.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9643) {
                return or__3824__auto____9643
              }else {
                return G__9641__9642.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9641__9642.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9641__9642)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9641__9642)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9663 = new goog.string.StringBuffer;
  var G__9664__9665 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9664__9665) {
    var string__9666 = cljs.core.first.call(null, G__9664__9665);
    var G__9664__9667 = G__9664__9665;
    while(true) {
      sb__9663.append(string__9666);
      var temp__3974__auto____9668 = cljs.core.next.call(null, G__9664__9667);
      if(temp__3974__auto____9668) {
        var G__9664__9669 = temp__3974__auto____9668;
        var G__9682 = cljs.core.first.call(null, G__9664__9669);
        var G__9683 = G__9664__9669;
        string__9666 = G__9682;
        G__9664__9667 = G__9683;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9670__9671 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9670__9671) {
    var obj__9672 = cljs.core.first.call(null, G__9670__9671);
    var G__9670__9673 = G__9670__9671;
    while(true) {
      sb__9663.append(" ");
      var G__9674__9675 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9672, opts));
      if(G__9674__9675) {
        var string__9676 = cljs.core.first.call(null, G__9674__9675);
        var G__9674__9677 = G__9674__9675;
        while(true) {
          sb__9663.append(string__9676);
          var temp__3974__auto____9678 = cljs.core.next.call(null, G__9674__9677);
          if(temp__3974__auto____9678) {
            var G__9674__9679 = temp__3974__auto____9678;
            var G__9684 = cljs.core.first.call(null, G__9674__9679);
            var G__9685 = G__9674__9679;
            string__9676 = G__9684;
            G__9674__9677 = G__9685;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9680 = cljs.core.next.call(null, G__9670__9673);
      if(temp__3974__auto____9680) {
        var G__9670__9681 = temp__3974__auto____9680;
        var G__9686 = cljs.core.first.call(null, G__9670__9681);
        var G__9687 = G__9670__9681;
        obj__9672 = G__9686;
        G__9670__9673 = G__9687;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9663
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9689 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9689.append("\n");
  return[cljs.core.str(sb__9689)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9708__9709 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9708__9709) {
    var string__9710 = cljs.core.first.call(null, G__9708__9709);
    var G__9708__9711 = G__9708__9709;
    while(true) {
      cljs.core.string_print.call(null, string__9710);
      var temp__3974__auto____9712 = cljs.core.next.call(null, G__9708__9711);
      if(temp__3974__auto____9712) {
        var G__9708__9713 = temp__3974__auto____9712;
        var G__9726 = cljs.core.first.call(null, G__9708__9713);
        var G__9727 = G__9708__9713;
        string__9710 = G__9726;
        G__9708__9711 = G__9727;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9714__9715 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9714__9715) {
    var obj__9716 = cljs.core.first.call(null, G__9714__9715);
    var G__9714__9717 = G__9714__9715;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9718__9719 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9716, opts));
      if(G__9718__9719) {
        var string__9720 = cljs.core.first.call(null, G__9718__9719);
        var G__9718__9721 = G__9718__9719;
        while(true) {
          cljs.core.string_print.call(null, string__9720);
          var temp__3974__auto____9722 = cljs.core.next.call(null, G__9718__9721);
          if(temp__3974__auto____9722) {
            var G__9718__9723 = temp__3974__auto____9722;
            var G__9728 = cljs.core.first.call(null, G__9718__9723);
            var G__9729 = G__9718__9723;
            string__9720 = G__9728;
            G__9718__9721 = G__9729;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9724 = cljs.core.next.call(null, G__9714__9717);
      if(temp__3974__auto____9724) {
        var G__9714__9725 = temp__3974__auto____9724;
        var G__9730 = cljs.core.first.call(null, G__9714__9725);
        var G__9731 = G__9714__9725;
        obj__9716 = G__9730;
        G__9714__9717 = G__9731;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9732) {
    var objs = cljs.core.seq(arglist__9732);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9733) {
    var objs = cljs.core.seq(arglist__9733);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9734) {
    var objs = cljs.core.seq(arglist__9734);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9735) {
    var objs = cljs.core.seq(arglist__9735);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9736) {
    var objs = cljs.core.seq(arglist__9736);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9737) {
    var objs = cljs.core.seq(arglist__9737);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9738) {
    var objs = cljs.core.seq(arglist__9738);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9739) {
    var objs = cljs.core.seq(arglist__9739);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9740) {
    var fmt = cljs.core.first(arglist__9740);
    var args = cljs.core.rest(arglist__9740);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9741 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9741, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9742 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9742, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9743 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9743, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9744 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9744)) {
        var nspc__9745 = temp__3974__auto____9744;
        return[cljs.core.str(nspc__9745), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9746 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9746)) {
          var nspc__9747 = temp__3974__auto____9746;
          return[cljs.core.str(nspc__9747), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9748 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9748, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9750 = function(n, len) {
    var ns__9749 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9749) < len) {
        var G__9752 = [cljs.core.str("0"), cljs.core.str(ns__9749)].join("");
        ns__9749 = G__9752;
        continue
      }else {
        return ns__9749
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9750.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9750.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9750.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9750.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9750.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9750.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9751 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9751, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9753 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9754 = this;
  var G__9755__9756 = cljs.core.seq.call(null, this__9754.watches);
  if(G__9755__9756) {
    var G__9758__9760 = cljs.core.first.call(null, G__9755__9756);
    var vec__9759__9761 = G__9758__9760;
    var key__9762 = cljs.core.nth.call(null, vec__9759__9761, 0, null);
    var f__9763 = cljs.core.nth.call(null, vec__9759__9761, 1, null);
    var G__9755__9764 = G__9755__9756;
    var G__9758__9765 = G__9758__9760;
    var G__9755__9766 = G__9755__9764;
    while(true) {
      var vec__9767__9768 = G__9758__9765;
      var key__9769 = cljs.core.nth.call(null, vec__9767__9768, 0, null);
      var f__9770 = cljs.core.nth.call(null, vec__9767__9768, 1, null);
      var G__9755__9771 = G__9755__9766;
      f__9770.call(null, key__9769, this$, oldval, newval);
      var temp__3974__auto____9772 = cljs.core.next.call(null, G__9755__9771);
      if(temp__3974__auto____9772) {
        var G__9755__9773 = temp__3974__auto____9772;
        var G__9780 = cljs.core.first.call(null, G__9755__9773);
        var G__9781 = G__9755__9773;
        G__9758__9765 = G__9780;
        G__9755__9766 = G__9781;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9774 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9774.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9775 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9775.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9776 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9776.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9777 = this;
  return this__9777.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9778 = this;
  return this__9778.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9779 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9793__delegate = function(x, p__9782) {
      var map__9788__9789 = p__9782;
      var map__9788__9790 = cljs.core.seq_QMARK_.call(null, map__9788__9789) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9788__9789) : map__9788__9789;
      var validator__9791 = cljs.core._lookup.call(null, map__9788__9790, "\ufdd0'validator", null);
      var meta__9792 = cljs.core._lookup.call(null, map__9788__9790, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9792, validator__9791, null)
    };
    var G__9793 = function(x, var_args) {
      var p__9782 = null;
      if(goog.isDef(var_args)) {
        p__9782 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9793__delegate.call(this, x, p__9782)
    };
    G__9793.cljs$lang$maxFixedArity = 1;
    G__9793.cljs$lang$applyTo = function(arglist__9794) {
      var x = cljs.core.first(arglist__9794);
      var p__9782 = cljs.core.rest(arglist__9794);
      return G__9793__delegate(x, p__9782)
    };
    G__9793.cljs$lang$arity$variadic = G__9793__delegate;
    return G__9793
  }();
  atom = function(x, var_args) {
    var p__9782 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9798 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9798)) {
    var validate__9799 = temp__3974__auto____9798;
    if(cljs.core.truth_(validate__9799.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9800 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9800, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9801__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9801 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9801__delegate.call(this, a, f, x, y, z, more)
    };
    G__9801.cljs$lang$maxFixedArity = 5;
    G__9801.cljs$lang$applyTo = function(arglist__9802) {
      var a = cljs.core.first(arglist__9802);
      var f = cljs.core.first(cljs.core.next(arglist__9802));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9802)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9802))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9802)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9802)))));
      return G__9801__delegate(a, f, x, y, z, more)
    };
    G__9801.cljs$lang$arity$variadic = G__9801__delegate;
    return G__9801
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9803) {
    var iref = cljs.core.first(arglist__9803);
    var f = cljs.core.first(cljs.core.next(arglist__9803));
    var args = cljs.core.rest(cljs.core.next(arglist__9803));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9804 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9804.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9805 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9805.state, function(p__9806) {
    var map__9807__9808 = p__9806;
    var map__9807__9809 = cljs.core.seq_QMARK_.call(null, map__9807__9808) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9807__9808) : map__9807__9808;
    var curr_state__9810 = map__9807__9809;
    var done__9811 = cljs.core._lookup.call(null, map__9807__9809, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9811)) {
      return curr_state__9810
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9805.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9832__9833 = options;
    var map__9832__9834 = cljs.core.seq_QMARK_.call(null, map__9832__9833) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9832__9833) : map__9832__9833;
    var keywordize_keys__9835 = cljs.core._lookup.call(null, map__9832__9834, "\ufdd0'keywordize-keys", null);
    var keyfn__9836 = cljs.core.truth_(keywordize_keys__9835) ? cljs.core.keyword : cljs.core.str;
    var f__9851 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2458__auto____9850 = function iter__9844(s__9845) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9845__9848 = s__9845;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9845__9848)) {
                        var k__9849 = cljs.core.first.call(null, s__9845__9848);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9836.call(null, k__9849), thisfn.call(null, x[k__9849])], true), iter__9844.call(null, cljs.core.rest.call(null, s__9845__9848)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2458__auto____9850.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9851.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9852) {
    var x = cljs.core.first(arglist__9852);
    var options = cljs.core.rest(arglist__9852);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9857 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9861__delegate = function(args) {
      var temp__3971__auto____9858 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9857), args, null);
      if(cljs.core.truth_(temp__3971__auto____9858)) {
        var v__9859 = temp__3971__auto____9858;
        return v__9859
      }else {
        var ret__9860 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9857, cljs.core.assoc, args, ret__9860);
        return ret__9860
      }
    };
    var G__9861 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9861__delegate.call(this, args)
    };
    G__9861.cljs$lang$maxFixedArity = 0;
    G__9861.cljs$lang$applyTo = function(arglist__9862) {
      var args = cljs.core.seq(arglist__9862);
      return G__9861__delegate(args)
    };
    G__9861.cljs$lang$arity$variadic = G__9861__delegate;
    return G__9861
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9864 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9864)) {
        var G__9865 = ret__9864;
        f = G__9865;
        continue
      }else {
        return ret__9864
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9866__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9866 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9866__delegate.call(this, f, args)
    };
    G__9866.cljs$lang$maxFixedArity = 1;
    G__9866.cljs$lang$applyTo = function(arglist__9867) {
      var f = cljs.core.first(arglist__9867);
      var args = cljs.core.rest(arglist__9867);
      return G__9866__delegate(f, args)
    };
    G__9866.cljs$lang$arity$variadic = G__9866__delegate;
    return G__9866
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9869 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9869, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9869, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9878 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9878) {
      return or__3824__auto____9878
    }else {
      var or__3824__auto____9879 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9879) {
        return or__3824__auto____9879
      }else {
        var and__3822__auto____9880 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9880) {
          var and__3822__auto____9881 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9881) {
            var and__3822__auto____9882 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9882) {
              var ret__9883 = true;
              var i__9884 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9885 = cljs.core.not.call(null, ret__9883);
                  if(or__3824__auto____9885) {
                    return or__3824__auto____9885
                  }else {
                    return i__9884 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9883
                }else {
                  var G__9886 = isa_QMARK_.call(null, h, child.call(null, i__9884), parent.call(null, i__9884));
                  var G__9887 = i__9884 + 1;
                  ret__9883 = G__9886;
                  i__9884 = G__9887;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9882
            }
          }else {
            return and__3822__auto____9881
          }
        }else {
          return and__3822__auto____9880
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__9896 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9897 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9898 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9899 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9900 = cljs.core.contains_QMARK_.call(null, tp__9896.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9898.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9898.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9896, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9899.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9897, parent, ta__9898), "\ufdd0'descendants":tf__9899.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9898, tag, td__9897)})
    }();
    if(cljs.core.truth_(or__3824__auto____9900)) {
      return or__3824__auto____9900
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9905 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9906 = cljs.core.truth_(parentMap__9905.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9905.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9907 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9906)) ? cljs.core.assoc.call(null, parentMap__9905, tag, childsParents__9906) : cljs.core.dissoc.call(null, parentMap__9905, tag);
    var deriv_seq__9908 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9888_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9888_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9888_SHARP_), cljs.core.second.call(null, p1__9888_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9907)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9905.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9889_SHARP_, p2__9890_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9889_SHARP_, p2__9890_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9908))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9916 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9918 = cljs.core.truth_(function() {
    var and__3822__auto____9917 = xprefs__9916;
    if(cljs.core.truth_(and__3822__auto____9917)) {
      return xprefs__9916.call(null, y)
    }else {
      return and__3822__auto____9917
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9918)) {
    return or__3824__auto____9918
  }else {
    var or__3824__auto____9920 = function() {
      var ps__9919 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9919) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9919), prefer_table))) {
          }else {
          }
          var G__9923 = cljs.core.rest.call(null, ps__9919);
          ps__9919 = G__9923;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9920)) {
      return or__3824__auto____9920
    }else {
      var or__3824__auto____9922 = function() {
        var ps__9921 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9921) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9921), y, prefer_table))) {
            }else {
            }
            var G__9924 = cljs.core.rest.call(null, ps__9921);
            ps__9921 = G__9924;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9922)) {
        return or__3824__auto____9922
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9926 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9926)) {
    return or__3824__auto____9926
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9944 = cljs.core.reduce.call(null, function(be, p__9936) {
    var vec__9937__9938 = p__9936;
    var k__9939 = cljs.core.nth.call(null, vec__9937__9938, 0, null);
    var ___9940 = cljs.core.nth.call(null, vec__9937__9938, 1, null);
    var e__9941 = vec__9937__9938;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9939)) {
      var be2__9943 = cljs.core.truth_(function() {
        var or__3824__auto____9942 = be == null;
        if(or__3824__auto____9942) {
          return or__3824__auto____9942
        }else {
          return cljs.core.dominates.call(null, k__9939, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9941 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9943), k__9939, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9939), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9943)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9943
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9944)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9944));
      return cljs.core.second.call(null, best_entry__9944)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____9949 = mf;
    if(and__3822__auto____9949) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9949
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2359__auto____9950 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9951 = cljs.core._reset[goog.typeOf(x__2359__auto____9950)];
      if(or__3824__auto____9951) {
        return or__3824__auto____9951
      }else {
        var or__3824__auto____9952 = cljs.core._reset["_"];
        if(or__3824__auto____9952) {
          return or__3824__auto____9952
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9957 = mf;
    if(and__3822__auto____9957) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9957
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2359__auto____9958 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9959 = cljs.core._add_method[goog.typeOf(x__2359__auto____9958)];
      if(or__3824__auto____9959) {
        return or__3824__auto____9959
      }else {
        var or__3824__auto____9960 = cljs.core._add_method["_"];
        if(or__3824__auto____9960) {
          return or__3824__auto____9960
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9965 = mf;
    if(and__3822__auto____9965) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____9965
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2359__auto____9966 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9967 = cljs.core._remove_method[goog.typeOf(x__2359__auto____9966)];
      if(or__3824__auto____9967) {
        return or__3824__auto____9967
      }else {
        var or__3824__auto____9968 = cljs.core._remove_method["_"];
        if(or__3824__auto____9968) {
          return or__3824__auto____9968
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____9973 = mf;
    if(and__3822__auto____9973) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____9973
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2359__auto____9974 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9975 = cljs.core._prefer_method[goog.typeOf(x__2359__auto____9974)];
      if(or__3824__auto____9975) {
        return or__3824__auto____9975
      }else {
        var or__3824__auto____9976 = cljs.core._prefer_method["_"];
        if(or__3824__auto____9976) {
          return or__3824__auto____9976
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____9981 = mf;
    if(and__3822__auto____9981) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____9981
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2359__auto____9982 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9983 = cljs.core._get_method[goog.typeOf(x__2359__auto____9982)];
      if(or__3824__auto____9983) {
        return or__3824__auto____9983
      }else {
        var or__3824__auto____9984 = cljs.core._get_method["_"];
        if(or__3824__auto____9984) {
          return or__3824__auto____9984
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____9989 = mf;
    if(and__3822__auto____9989) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____9989
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2359__auto____9990 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9991 = cljs.core._methods[goog.typeOf(x__2359__auto____9990)];
      if(or__3824__auto____9991) {
        return or__3824__auto____9991
      }else {
        var or__3824__auto____9992 = cljs.core._methods["_"];
        if(or__3824__auto____9992) {
          return or__3824__auto____9992
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____9997 = mf;
    if(and__3822__auto____9997) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____9997
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2359__auto____9998 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9999 = cljs.core._prefers[goog.typeOf(x__2359__auto____9998)];
      if(or__3824__auto____9999) {
        return or__3824__auto____9999
      }else {
        var or__3824__auto____10000 = cljs.core._prefers["_"];
        if(or__3824__auto____10000) {
          return or__3824__auto____10000
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10005 = mf;
    if(and__3822__auto____10005) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10005
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2359__auto____10006 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10007 = cljs.core._dispatch[goog.typeOf(x__2359__auto____10006)];
      if(or__3824__auto____10007) {
        return or__3824__auto____10007
      }else {
        var or__3824__auto____10008 = cljs.core._dispatch["_"];
        if(or__3824__auto____10008) {
          return or__3824__auto____10008
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10011 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10012 = cljs.core._get_method.call(null, mf, dispatch_val__10011);
  if(cljs.core.truth_(target_fn__10012)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10011)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10012, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10013 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10014 = this;
  cljs.core.swap_BANG_.call(null, this__10014.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10014.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10014.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10014.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10015 = this;
  cljs.core.swap_BANG_.call(null, this__10015.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10015.method_cache, this__10015.method_table, this__10015.cached_hierarchy, this__10015.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10016 = this;
  cljs.core.swap_BANG_.call(null, this__10016.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10016.method_cache, this__10016.method_table, this__10016.cached_hierarchy, this__10016.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10017 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10017.cached_hierarchy), cljs.core.deref.call(null, this__10017.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10017.method_cache, this__10017.method_table, this__10017.cached_hierarchy, this__10017.hierarchy)
  }
  var temp__3971__auto____10018 = cljs.core.deref.call(null, this__10017.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10018)) {
    var target_fn__10019 = temp__3971__auto____10018;
    return target_fn__10019
  }else {
    var temp__3971__auto____10020 = cljs.core.find_and_cache_best_method.call(null, this__10017.name, dispatch_val, this__10017.hierarchy, this__10017.method_table, this__10017.prefer_table, this__10017.method_cache, this__10017.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10020)) {
      var target_fn__10021 = temp__3971__auto____10020;
      return target_fn__10021
    }else {
      return cljs.core.deref.call(null, this__10017.method_table).call(null, this__10017.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10022 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10022.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10022.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10022.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10022.method_cache, this__10022.method_table, this__10022.cached_hierarchy, this__10022.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10023 = this;
  return cljs.core.deref.call(null, this__10023.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10024 = this;
  return cljs.core.deref.call(null, this__10024.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10025 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10025.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10027__delegate = function(_, args) {
    var self__10026 = this;
    return cljs.core._dispatch.call(null, self__10026, args)
  };
  var G__10027 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10027__delegate.call(this, _, args)
  };
  G__10027.cljs$lang$maxFixedArity = 1;
  G__10027.cljs$lang$applyTo = function(arglist__10028) {
    var _ = cljs.core.first(arglist__10028);
    var args = cljs.core.rest(arglist__10028);
    return G__10027__delegate(_, args)
  };
  G__10027.cljs$lang$arity$variadic = G__10027__delegate;
  return G__10027
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10029 = this;
  return cljs.core._dispatch.call(null, self__10029, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10030 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10032, _) {
  var this__10031 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10031.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10033 = this;
  var and__3822__auto____10034 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10034) {
    return this__10033.uuid === other.uuid
  }else {
    return and__3822__auto____10034
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10035 = this;
  var this__10036 = this;
  return cljs.core.pr_str.call(null, this__10036)
};
cljs.core.UUID;
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__9691 = s;
      var limit__9692 = limit;
      var parts__9693 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__9692, 1)) {
          return cljs.core.conj.call(null, parts__9693, s__9691)
        }else {
          var temp__3971__auto____9694 = cljs.core.re_find.call(null, re, s__9691);
          if(cljs.core.truth_(temp__3971__auto____9694)) {
            var m__9695 = temp__3971__auto____9694;
            var index__9696 = s__9691.indexOf(m__9695);
            var G__9697 = s__9691.substring(index__9696 + cljs.core.count.call(null, m__9695));
            var G__9698 = limit__9692 - 1;
            var G__9699 = cljs.core.conj.call(null, parts__9693, s__9691.substring(0, index__9696));
            s__9691 = G__9697;
            limit__9692 = G__9698;
            parts__9693 = G__9699;
            continue
          }else {
            return cljs.core.conj.call(null, parts__9693, s__9691)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__9703 = s.length;
  while(true) {
    if(index__9703 === 0) {
      return""
    }else {
      var ch__9704 = cljs.core._lookup.call(null, s, index__9703 - 1, null);
      if(function() {
        var or__3824__auto____9705 = cljs.core._EQ_.call(null, ch__9704, "\n");
        if(or__3824__auto____9705) {
          return or__3824__auto____9705
        }else {
          return cljs.core._EQ_.call(null, ch__9704, "\r")
        }
      }()) {
        var G__9706 = index__9703 - 1;
        index__9703 = G__9706;
        continue
      }else {
        return s.substring(0, index__9703)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__9710 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____9711 = cljs.core.not.call(null, s__9710);
    if(or__3824__auto____9711) {
      return or__3824__auto____9711
    }else {
      var or__3824__auto____9712 = cljs.core._EQ_.call(null, "", s__9710);
      if(or__3824__auto____9712) {
        return or__3824__auto____9712
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__9710)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__9719 = new goog.string.StringBuffer;
  var length__9720 = s.length;
  var index__9721 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__9720, index__9721)) {
      return buffer__9719.toString()
    }else {
      var ch__9722 = s.charAt(index__9721);
      var temp__3971__auto____9723 = cljs.core._lookup.call(null, cmap, ch__9722, null);
      if(cljs.core.truth_(temp__3971__auto____9723)) {
        var replacement__9724 = temp__3971__auto____9723;
        buffer__9719.append([cljs.core.str(replacement__9724)].join(""))
      }else {
        buffer__9719.append(ch__9722)
      }
      var G__9725 = index__9721 + 1;
      index__9721 = G__9725;
      continue
    }
    break
  }
};
goog.provide("fract.shared.sentence");
goog.require("cljs.core");
goog.require("clojure.string");
fract.shared.sentence.parse = function parse(text) {
  return clojure.string.split.call(null, text, /\./)
};
fract.shared.sentence.decorate = function decorate(sentenceList) {
  return cljs.core.map.call(null, function(sentence) {
    return cljs.core.PersistentVector.fromArray(["\ufdd0'span", sentence], true)
  }, sentenceList)
};
fract.shared.sentence.transform = function transform(text) {
  return fract.shared.sentence.decorate.call(null, fract.shared.sentence.parse.call(null, text))
};
goog.provide("hiccups.runtime");
goog.require("cljs.core");
goog.require("clojure.string");
hiccups.runtime.re_tag = /([^\s\.#]+)(?:#([^s\.#]+))?(?:\.([^\s#]+))?/;
hiccups.runtime.character_escapes = cljs.core.PersistentArrayMap.fromArrays(["&", "<", ">", '"'], ["&amp;", "&lt;", "&gt;", "&quot;"]);
hiccups.runtime.container_tags = cljs.core.PersistentHashSet.fromArray(["dd", "head", "a", "b", "body", "pre", "form", "iframe", "dl", "em", "fieldset", "i", "h1", "h2", "span", "h3", "script", "html", "h4", "h5", "h6", "table", "dt", "div", "style", "label", "option", "ul", "strong", "canvas", "textarea", "li", "ol"]);
hiccups.runtime.as_str = function as_str(x) {
  if(function() {
    var or__3824__auto____69314 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____69314) {
      return or__3824__auto____69314
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    return cljs.core.name.call(null, x)
  }else {
    return[cljs.core.str(x)].join("")
  }
};
hiccups.runtime._STAR_html_mode_STAR_ = "\ufdd0'xml";
hiccups.runtime.xml_mode_QMARK_ = function xml_mode_QMARK_() {
  return cljs.core._EQ_.call(null, hiccups.runtime._STAR_html_mode_STAR_, "\ufdd0'xml")
};
hiccups.runtime.in_mode = function in_mode(mode, f) {
  var _STAR_html_mode_STAR_69318__69319 = hiccups.runtime._STAR_html_mode_STAR_;
  try {
    hiccups.runtime._STAR_html_mode_STAR_ = mode;
    return f.call(null)
  }finally {
    hiccups.runtime._STAR_html_mode_STAR_ = _STAR_html_mode_STAR_69318__69319
  }
};
hiccups.runtime.escape_html = function escape_html(text) {
  return clojure.string.escape.call(null, hiccups.runtime.as_str.call(null, text), hiccups.runtime.character_escapes)
};
hiccups.runtime.h = hiccups.runtime.escape_html;
hiccups.runtime.end_tag = function end_tag() {
  if(cljs.core.truth_(hiccups.runtime.xml_mode_QMARK_.call(null))) {
    return" />"
  }else {
    return">"
  }
};
hiccups.runtime.xml_attribute = function xml_attribute(name, value) {
  return[cljs.core.str(" "), cljs.core.str(hiccups.runtime.as_str.call(null, name)), cljs.core.str('="'), cljs.core.str(hiccups.runtime.escape_html.call(null, value)), cljs.core.str('"')].join("")
};
hiccups.runtime.render_attribute = function render_attribute(p__69321) {
  var vec__69326__69327 = p__69321;
  var name__69328 = cljs.core.nth.call(null, vec__69326__69327, 0, null);
  var value__69329 = cljs.core.nth.call(null, vec__69326__69327, 1, null);
  if(value__69329 === true) {
    if(cljs.core.truth_(hiccups.runtime.xml_mode_QMARK_.call(null))) {
      return hiccups.runtime.xml_attribute.call(null, name__69328, name__69328)
    }else {
      return[cljs.core.str(" "), cljs.core.str(hiccups.runtime.as_str.call(null, name__69328))].join("")
    }
  }else {
    if(cljs.core.not.call(null, value__69329)) {
      return""
    }else {
      if("\ufdd0'else") {
        return hiccups.runtime.xml_attribute.call(null, name__69328, value__69329)
      }else {
        return null
      }
    }
  }
};
hiccups.runtime.render_attr_map = function render_attr_map(attrs) {
  return cljs.core.apply.call(null, cljs.core.str, cljs.core.sort.call(null, cljs.core.map.call(null, hiccups.runtime.render_attribute, attrs)))
};
hiccups.runtime.normalize_element = function normalize_element(p__69330) {
  var vec__69345__69346 = p__69330;
  var tag__69347 = cljs.core.nth.call(null, vec__69345__69346, 0, null);
  var content__69348 = cljs.core.nthnext.call(null, vec__69345__69346, 1);
  if(!function() {
    var or__3824__auto____69349 = cljs.core.keyword_QMARK_.call(null, tag__69347);
    if(or__3824__auto____69349) {
      return or__3824__auto____69349
    }else {
      var or__3824__auto____69350 = cljs.core.symbol_QMARK_.call(null, tag__69347);
      if(or__3824__auto____69350) {
        return or__3824__auto____69350
      }else {
        return cljs.core.string_QMARK_.call(null, tag__69347)
      }
    }
  }()) {
    throw[cljs.core.str(tag__69347), cljs.core.str(" is not a valid tag name")].join("");
  }else {
  }
  var vec__69351__69352 = cljs.core.re_matches.call(null, hiccups.runtime.re_tag, hiccups.runtime.as_str.call(null, tag__69347));
  var ___69353 = cljs.core.nth.call(null, vec__69351__69352, 0, null);
  var tag__69354 = cljs.core.nth.call(null, vec__69351__69352, 1, null);
  var id__69355 = cljs.core.nth.call(null, vec__69351__69352, 2, null);
  var class__69356 = cljs.core.nth.call(null, vec__69351__69352, 3, null);
  var tag_attrs__69357 = cljs.core.ObjMap.fromObject(["\ufdd0'id", "\ufdd0'class"], {"\ufdd0'id":id__69355, "\ufdd0'class":cljs.core.truth_(class__69356) ? class__69356.replace(".", " ") : null});
  var map_attrs__69358 = cljs.core.first.call(null, content__69348);
  if(cljs.core.map_QMARK_.call(null, map_attrs__69358)) {
    return cljs.core.PersistentVector.fromArray([tag__69354, cljs.core.merge.call(null, tag_attrs__69357, map_attrs__69358), cljs.core.next.call(null, content__69348)], true)
  }else {
    return cljs.core.PersistentVector.fromArray([tag__69354, tag_attrs__69357, content__69348], true)
  }
};
hiccups.runtime.render_element = function render_element(element) {
  var vec__69365__69366 = hiccups.runtime.normalize_element.call(null, element);
  var tag__69367 = cljs.core.nth.call(null, vec__69365__69366, 0, null);
  var attrs__69368 = cljs.core.nth.call(null, vec__69365__69366, 1, null);
  var content__69369 = cljs.core.nth.call(null, vec__69365__69366, 2, null);
  if(cljs.core.truth_(function() {
    var or__3824__auto____69370 = content__69369;
    if(cljs.core.truth_(or__3824__auto____69370)) {
      return or__3824__auto____69370
    }else {
      return hiccups.runtime.container_tags.call(null, tag__69367)
    }
  }())) {
    return[cljs.core.str("<"), cljs.core.str(tag__69367), cljs.core.str(hiccups.runtime.render_attr_map.call(null, attrs__69368)), cljs.core.str(">"), cljs.core.str(hiccups.runtime.render_html.call(null, content__69369)), cljs.core.str("</"), cljs.core.str(tag__69367), cljs.core.str(">")].join("")
  }else {
    return[cljs.core.str("<"), cljs.core.str(tag__69367), cljs.core.str(hiccups.runtime.render_attr_map.call(null, attrs__69368)), cljs.core.str(hiccups.runtime.end_tag.call(null))].join("")
  }
};
hiccups.runtime.render_html = function render_html(x) {
  if(cljs.core.vector_QMARK_.call(null, x)) {
    return hiccups.runtime.render_element.call(null, x)
  }else {
    if(cljs.core.seq_QMARK_.call(null, x)) {
      return cljs.core.apply.call(null, cljs.core.str, cljs.core.map.call(null, render_html, x))
    }else {
      if("\ufdd0'else") {
        return hiccups.runtime.as_str.call(null, x)
      }else {
        return null
      }
    }
  }
};
goog.provide("jayq.util");
goog.require("cljs.core");
jayq.util.map__GT_js = function map__GT_js(m) {
  var out__6540 = {};
  var G__6541__6542 = cljs.core.seq.call(null, m);
  if(G__6541__6542) {
    var G__6544__6546 = cljs.core.first.call(null, G__6541__6542);
    var vec__6545__6547 = G__6544__6546;
    var k__6548 = cljs.core.nth.call(null, vec__6545__6547, 0, null);
    var v__6549 = cljs.core.nth.call(null, vec__6545__6547, 1, null);
    var G__6541__6550 = G__6541__6542;
    var G__6544__6551 = G__6544__6546;
    var G__6541__6552 = G__6541__6550;
    while(true) {
      var vec__6553__6554 = G__6544__6551;
      var k__6555 = cljs.core.nth.call(null, vec__6553__6554, 0, null);
      var v__6556 = cljs.core.nth.call(null, vec__6553__6554, 1, null);
      var G__6541__6557 = G__6541__6552;
      out__6540[cljs.core.name.call(null, k__6555)] = v__6556;
      var temp__3974__auto____6558 = cljs.core.next.call(null, G__6541__6557);
      if(temp__3974__auto____6558) {
        var G__6541__6559 = temp__3974__auto____6558;
        var G__6560 = cljs.core.first.call(null, G__6541__6559);
        var G__6561 = G__6541__6559;
        G__6544__6551 = G__6560;
        G__6541__6552 = G__6561;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return out__6540
};
jayq.util.wait = function wait(ms, func) {
  return setTimeout(func, ms)
};
jayq.util.log = function() {
  var log__delegate = function(v, text) {
    var vs__6563 = cljs.core.string_QMARK_.call(null, v) ? cljs.core.apply.call(null, cljs.core.str, v, text) : v;
    return console.log(vs__6563)
  };
  var log = function(v, var_args) {
    var text = null;
    if(goog.isDef(var_args)) {
      text = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return log__delegate.call(this, v, text)
  };
  log.cljs$lang$maxFixedArity = 1;
  log.cljs$lang$applyTo = function(arglist__6564) {
    var v = cljs.core.first(arglist__6564);
    var text = cljs.core.rest(arglist__6564);
    return log__delegate(v, text)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
jayq.util.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__6570) {
          var vec__6571__6572 = p__6570;
          var k__6573 = cljs.core.nth.call(null, vec__6571__6572, 0, null);
          var v__6574 = cljs.core.nth.call(null, vec__6571__6572, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__6573), clj__GT_js.call(null, v__6574))
        }, cljs.core.ObjMap.EMPTY, x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
goog.provide("jayq.core");
goog.require("cljs.core");
goog.require("jayq.util");
goog.require("jayq.util");
goog.require("clojure.string");
jayq.core.crate_meta = function crate_meta(func) {
  return func.prototype._crateGroup
};
jayq.core.__GT_selector = function __GT_selector(sel) {
  if(cljs.core.string_QMARK_.call(null, sel)) {
    return sel
  }else {
    if(cljs.core.fn_QMARK_.call(null, sel)) {
      var temp__3971__auto____6361 = jayq.core.crate_meta.call(null, sel);
      if(cljs.core.truth_(temp__3971__auto____6361)) {
        var cm__6362 = temp__3971__auto____6361;
        return[cljs.core.str("[crateGroup="), cljs.core.str(cm__6362), cljs.core.str("]")].join("")
      }else {
        return sel
      }
    }else {
      if(cljs.core.keyword_QMARK_.call(null, sel)) {
        return cljs.core.name.call(null, sel)
      }else {
        if("\ufdd0'else") {
          return sel
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.$ = function() {
  var $__delegate = function(sel, p__6363) {
    var vec__6367__6368 = p__6363;
    var context__6369 = cljs.core.nth.call(null, vec__6367__6368, 0, null);
    if(cljs.core.not.call(null, context__6369)) {
      return jQuery(jayq.core.__GT_selector.call(null, sel))
    }else {
      return jQuery(jayq.core.__GT_selector.call(null, sel), context__6369)
    }
  };
  var $ = function(sel, var_args) {
    var p__6363 = null;
    if(goog.isDef(var_args)) {
      p__6363 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return $__delegate.call(this, sel, p__6363)
  };
  $.cljs$lang$maxFixedArity = 1;
  $.cljs$lang$applyTo = function(arglist__6370) {
    var sel = cljs.core.first(arglist__6370);
    var p__6363 = cljs.core.rest(arglist__6370);
    return $__delegate(sel, p__6363)
  };
  $.cljs$lang$arity$variadic = $__delegate;
  return $
}();
jQuery.prototype.cljs$core$IReduce$ = true;
jQuery.prototype.cljs$core$IReduce$_reduce$arity$2 = function(this$, f) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, cljs.core.first.call(null, this$), cljs.core.count.call(null, this$))
};
jQuery.prototype.cljs$core$IReduce$_reduce$arity$3 = function(this$, f, start) {
  return cljs.core.ci_reduce.call(null, jayq.core.coll, f, start, jayq.core.i)
};
jQuery.prototype.cljs$core$ILookup$ = true;
jQuery.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this$, k) {
  var or__3824__auto____6371 = this$.slice(k, k + 1);
  if(cljs.core.truth_(or__3824__auto____6371)) {
    return or__3824__auto____6371
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this$, k, not_found) {
  return cljs.core._nth.call(null, this$, k, not_found)
};
jQuery.prototype.cljs$core$ISequential$ = true;
jQuery.prototype.cljs$core$IIndexed$ = true;
jQuery.prototype.cljs$core$IIndexed$_nth$arity$2 = function(this$, n) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    return null
  }
};
jQuery.prototype.cljs$core$IIndexed$_nth$arity$3 = function(this$, n, not_found) {
  if(n < cljs.core.count.call(null, this$)) {
    return this$.slice(n, n + 1)
  }else {
    if(void 0 === not_found) {
      return null
    }else {
      return not_found
    }
  }
};
jQuery.prototype.cljs$core$ICounted$ = true;
jQuery.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  return this$.size()
};
jQuery.prototype.cljs$core$ISeq$ = true;
jQuery.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  return this$.get(0)
};
jQuery.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  if(cljs.core.count.call(null, this$) > 1) {
    return this$.slice(1)
  }else {
    return cljs.core.list.call(null)
  }
};
jQuery.prototype.cljs$core$ISeqable$ = true;
jQuery.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  if(cljs.core.truth_(this$.get(0))) {
    return this$
  }else {
    return null
  }
};
jQuery.prototype.call = function() {
  var G__6372 = null;
  var G__6372__2 = function(_, k) {
    return cljs.core._lookup.call(null, this, k)
  };
  var G__6372__3 = function(_, k, not_found) {
    return cljs.core._lookup.call(null, this, k, not_found)
  };
  G__6372 = function(_, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6372__2.call(this, _, k);
      case 3:
        return G__6372__3.call(this, _, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6372
}();
jayq.core.anim = function anim(elem, props, dur) {
  return elem.animate(jayq.util.clj__GT_js.call(null, props), dur)
};
jayq.core.text = function text($elem, txt) {
  return $elem.text(txt)
};
jayq.core.css = function css($elem, opts) {
  if(cljs.core.keyword_QMARK_.call(null, opts)) {
    return $elem.css(cljs.core.name.call(null, opts))
  }else {
    return $elem.css(jayq.util.clj__GT_js.call(null, opts))
  }
};
jayq.core.attr = function() {
  var attr__delegate = function($elem, a, p__6373) {
    var vec__6378__6379 = p__6373;
    var v__6380 = cljs.core.nth.call(null, vec__6378__6379, 0, null);
    var a__6381 = cljs.core.name.call(null, a);
    if(cljs.core.not.call(null, v__6380)) {
      return $elem.attr(a__6381)
    }else {
      return $elem.attr(a__6381, v__6380)
    }
  };
  var attr = function($elem, a, var_args) {
    var p__6373 = null;
    if(goog.isDef(var_args)) {
      p__6373 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return attr__delegate.call(this, $elem, a, p__6373)
  };
  attr.cljs$lang$maxFixedArity = 2;
  attr.cljs$lang$applyTo = function(arglist__6382) {
    var $elem = cljs.core.first(arglist__6382);
    var a = cljs.core.first(cljs.core.next(arglist__6382));
    var p__6373 = cljs.core.rest(cljs.core.next(arglist__6382));
    return attr__delegate($elem, a, p__6373)
  };
  attr.cljs$lang$arity$variadic = attr__delegate;
  return attr
}();
jayq.core.data = function() {
  var data__delegate = function($elem, k, p__6383) {
    var vec__6388__6389 = p__6383;
    var v__6390 = cljs.core.nth.call(null, vec__6388__6389, 0, null);
    var k__6391 = cljs.core.name.call(null, k);
    if(cljs.core.not.call(null, v__6390)) {
      return $elem.data(k__6391)
    }else {
      return $elem.data(k__6391, v__6390)
    }
  };
  var data = function($elem, k, var_args) {
    var p__6383 = null;
    if(goog.isDef(var_args)) {
      p__6383 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return data__delegate.call(this, $elem, k, p__6383)
  };
  data.cljs$lang$maxFixedArity = 2;
  data.cljs$lang$applyTo = function(arglist__6392) {
    var $elem = cljs.core.first(arglist__6392);
    var k = cljs.core.first(cljs.core.next(arglist__6392));
    var p__6383 = cljs.core.rest(cljs.core.next(arglist__6392));
    return data__delegate($elem, k, p__6383)
  };
  data.cljs$lang$arity$variadic = data__delegate;
  return data
}();
jayq.core.add_class = function add_class($elem, cl) {
  var cl__6394 = cljs.core.name.call(null, cl);
  return $elem.addClass(cl__6394)
};
jayq.core.remove_class = function remove_class($elem, cl) {
  var cl__6396 = cljs.core.name.call(null, cl);
  return $elem.removeClass(cl__6396)
};
jayq.core.append = function append($elem, content) {
  return $elem.append(content)
};
jayq.core.prepend = function prepend($elem, content) {
  return $elem.prepend(content)
};
jayq.core.remove = function remove($elem) {
  return $elem.remove()
};
jayq.core.hide = function() {
  var hide__delegate = function($elem, p__6397) {
    var vec__6402__6403 = p__6397;
    var speed__6404 = cljs.core.nth.call(null, vec__6402__6403, 0, null);
    var on_finish__6405 = cljs.core.nth.call(null, vec__6402__6403, 1, null);
    return $elem.hide(speed__6404, on_finish__6405)
  };
  var hide = function($elem, var_args) {
    var p__6397 = null;
    if(goog.isDef(var_args)) {
      p__6397 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return hide__delegate.call(this, $elem, p__6397)
  };
  hide.cljs$lang$maxFixedArity = 1;
  hide.cljs$lang$applyTo = function(arglist__6406) {
    var $elem = cljs.core.first(arglist__6406);
    var p__6397 = cljs.core.rest(arglist__6406);
    return hide__delegate($elem, p__6397)
  };
  hide.cljs$lang$arity$variadic = hide__delegate;
  return hide
}();
jayq.core.show = function() {
  var show__delegate = function($elem, p__6407) {
    var vec__6412__6413 = p__6407;
    var speed__6414 = cljs.core.nth.call(null, vec__6412__6413, 0, null);
    var on_finish__6415 = cljs.core.nth.call(null, vec__6412__6413, 1, null);
    return $elem.show(speed__6414, on_finish__6415)
  };
  var show = function($elem, var_args) {
    var p__6407 = null;
    if(goog.isDef(var_args)) {
      p__6407 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return show__delegate.call(this, $elem, p__6407)
  };
  show.cljs$lang$maxFixedArity = 1;
  show.cljs$lang$applyTo = function(arglist__6416) {
    var $elem = cljs.core.first(arglist__6416);
    var p__6407 = cljs.core.rest(arglist__6416);
    return show__delegate($elem, p__6407)
  };
  show.cljs$lang$arity$variadic = show__delegate;
  return show
}();
jayq.core.toggle = function() {
  var toggle__delegate = function($elem, p__6417) {
    var vec__6422__6423 = p__6417;
    var speed__6424 = cljs.core.nth.call(null, vec__6422__6423, 0, null);
    var on_finish__6425 = cljs.core.nth.call(null, vec__6422__6423, 1, null);
    return $elem.toggle(speed__6424, on_finish__6425)
  };
  var toggle = function($elem, var_args) {
    var p__6417 = null;
    if(goog.isDef(var_args)) {
      p__6417 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return toggle__delegate.call(this, $elem, p__6417)
  };
  toggle.cljs$lang$maxFixedArity = 1;
  toggle.cljs$lang$applyTo = function(arglist__6426) {
    var $elem = cljs.core.first(arglist__6426);
    var p__6417 = cljs.core.rest(arglist__6426);
    return toggle__delegate($elem, p__6417)
  };
  toggle.cljs$lang$arity$variadic = toggle__delegate;
  return toggle
}();
jayq.core.fade_out = function() {
  var fade_out__delegate = function($elem, p__6427) {
    var vec__6432__6433 = p__6427;
    var speed__6434 = cljs.core.nth.call(null, vec__6432__6433, 0, null);
    var on_finish__6435 = cljs.core.nth.call(null, vec__6432__6433, 1, null);
    return $elem.fadeOut(speed__6434, on_finish__6435)
  };
  var fade_out = function($elem, var_args) {
    var p__6427 = null;
    if(goog.isDef(var_args)) {
      p__6427 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_out__delegate.call(this, $elem, p__6427)
  };
  fade_out.cljs$lang$maxFixedArity = 1;
  fade_out.cljs$lang$applyTo = function(arglist__6436) {
    var $elem = cljs.core.first(arglist__6436);
    var p__6427 = cljs.core.rest(arglist__6436);
    return fade_out__delegate($elem, p__6427)
  };
  fade_out.cljs$lang$arity$variadic = fade_out__delegate;
  return fade_out
}();
jayq.core.fade_in = function() {
  var fade_in__delegate = function($elem, p__6437) {
    var vec__6442__6443 = p__6437;
    var speed__6444 = cljs.core.nth.call(null, vec__6442__6443, 0, null);
    var on_finish__6445 = cljs.core.nth.call(null, vec__6442__6443, 1, null);
    return $elem.fadeIn(speed__6444, on_finish__6445)
  };
  var fade_in = function($elem, var_args) {
    var p__6437 = null;
    if(goog.isDef(var_args)) {
      p__6437 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return fade_in__delegate.call(this, $elem, p__6437)
  };
  fade_in.cljs$lang$maxFixedArity = 1;
  fade_in.cljs$lang$applyTo = function(arglist__6446) {
    var $elem = cljs.core.first(arglist__6446);
    var p__6437 = cljs.core.rest(arglist__6446);
    return fade_in__delegate($elem, p__6437)
  };
  fade_in.cljs$lang$arity$variadic = fade_in__delegate;
  return fade_in
}();
jayq.core.slide_up = function() {
  var slide_up__delegate = function($elem, p__6447) {
    var vec__6452__6453 = p__6447;
    var speed__6454 = cljs.core.nth.call(null, vec__6452__6453, 0, null);
    var on_finish__6455 = cljs.core.nth.call(null, vec__6452__6453, 1, null);
    return $elem.slideUp(speed__6454, on_finish__6455)
  };
  var slide_up = function($elem, var_args) {
    var p__6447 = null;
    if(goog.isDef(var_args)) {
      p__6447 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_up__delegate.call(this, $elem, p__6447)
  };
  slide_up.cljs$lang$maxFixedArity = 1;
  slide_up.cljs$lang$applyTo = function(arglist__6456) {
    var $elem = cljs.core.first(arglist__6456);
    var p__6447 = cljs.core.rest(arglist__6456);
    return slide_up__delegate($elem, p__6447)
  };
  slide_up.cljs$lang$arity$variadic = slide_up__delegate;
  return slide_up
}();
jayq.core.slide_down = function() {
  var slide_down__delegate = function($elem, p__6457) {
    var vec__6462__6463 = p__6457;
    var speed__6464 = cljs.core.nth.call(null, vec__6462__6463, 0, null);
    var on_finish__6465 = cljs.core.nth.call(null, vec__6462__6463, 1, null);
    return $elem.slideDown(speed__6464, on_finish__6465)
  };
  var slide_down = function($elem, var_args) {
    var p__6457 = null;
    if(goog.isDef(var_args)) {
      p__6457 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return slide_down__delegate.call(this, $elem, p__6457)
  };
  slide_down.cljs$lang$maxFixedArity = 1;
  slide_down.cljs$lang$applyTo = function(arglist__6466) {
    var $elem = cljs.core.first(arglist__6466);
    var p__6457 = cljs.core.rest(arglist__6466);
    return slide_down__delegate($elem, p__6457)
  };
  slide_down.cljs$lang$arity$variadic = slide_down__delegate;
  return slide_down
}();
jayq.core.parent = function parent($elem) {
  return $elem.parent()
};
jayq.core.find = function find($elem, selector) {
  return $elem.find(cljs.core.name.call(null, selector))
};
jayq.core.inner = function inner($elem, v) {
  return $elem.html(v)
};
jayq.core.empty = function empty($elem) {
  return $elem.empty()
};
jayq.core.val = function() {
  var val__delegate = function($elem, p__6467) {
    var vec__6471__6472 = p__6467;
    var v__6473 = cljs.core.nth.call(null, vec__6471__6472, 0, null);
    if(cljs.core.truth_(v__6473)) {
      return $elem.val(v__6473)
    }else {
      return $elem.val()
    }
  };
  var val = function($elem, var_args) {
    var p__6467 = null;
    if(goog.isDef(var_args)) {
      p__6467 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return val__delegate.call(this, $elem, p__6467)
  };
  val.cljs$lang$maxFixedArity = 1;
  val.cljs$lang$applyTo = function(arglist__6474) {
    var $elem = cljs.core.first(arglist__6474);
    var p__6467 = cljs.core.rest(arglist__6474);
    return val__delegate($elem, p__6467)
  };
  val.cljs$lang$arity$variadic = val__delegate;
  return val
}();
jayq.core.queue = function queue($elem, callback) {
  return $elem.queue(callback)
};
jayq.core.dequeue = function dequeue(elem) {
  return jayq.core.$.call(null, elem).dequeue()
};
jayq.core.document_ready = function document_ready(func) {
  return jayq.core.$.call(null, document).ready(func)
};
jayq.core.xhr = function xhr(p__6475, content, callback) {
  var vec__6481__6482 = p__6475;
  var method__6483 = cljs.core.nth.call(null, vec__6481__6482, 0, null);
  var uri__6484 = cljs.core.nth.call(null, vec__6481__6482, 1, null);
  var params__6485 = jayq.util.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'data", "\ufdd0'success"], {"\ufdd0'type":clojure.string.upper_case.call(null, cljs.core.name.call(null, method__6483)), "\ufdd0'data":jayq.util.clj__GT_js.call(null, content), "\ufdd0'success":callback}));
  return jQuery.ajax(uri__6484, params__6485)
};
jayq.core.bind = function bind($elem, ev, func) {
  return $elem.bind(cljs.core.name.call(null, ev), func)
};
jayq.core.trigger = function trigger($elem, ev) {
  return $elem.trigger(cljs.core.name.call(null, ev))
};
jayq.core.delegate = function delegate($elem, sel, ev, func) {
  return $elem.delegate(jayq.core.__GT_selector.call(null, sel), cljs.core.name.call(null, ev), func)
};
jayq.core.__GT_event = function __GT_event(e) {
  if(cljs.core.keyword_QMARK_.call(null, e)) {
    return cljs.core.name.call(null, e)
  }else {
    if(cljs.core.map_QMARK_.call(null, e)) {
      return jayq.util.clj__GT_js.call(null, e)
    }else {
      if(cljs.core.coll_QMARK_.call(null, e)) {
        return clojure.string.join.call(null, " ", cljs.core.map.call(null, cljs.core.name, e))
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Unknown event type: "), cljs.core.str(e)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
jayq.core.on = function() {
  var on__delegate = function($elem, events, p__6486) {
    var vec__6492__6493 = p__6486;
    var sel__6494 = cljs.core.nth.call(null, vec__6492__6493, 0, null);
    var data__6495 = cljs.core.nth.call(null, vec__6492__6493, 1, null);
    var handler__6496 = cljs.core.nth.call(null, vec__6492__6493, 2, null);
    return $elem.on(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6494), data__6495, handler__6496)
  };
  var on = function($elem, events, var_args) {
    var p__6486 = null;
    if(goog.isDef(var_args)) {
      p__6486 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return on__delegate.call(this, $elem, events, p__6486)
  };
  on.cljs$lang$maxFixedArity = 2;
  on.cljs$lang$applyTo = function(arglist__6497) {
    var $elem = cljs.core.first(arglist__6497);
    var events = cljs.core.first(cljs.core.next(arglist__6497));
    var p__6486 = cljs.core.rest(cljs.core.next(arglist__6497));
    return on__delegate($elem, events, p__6486)
  };
  on.cljs$lang$arity$variadic = on__delegate;
  return on
}();
jayq.core.one = function() {
  var one__delegate = function($elem, events, p__6498) {
    var vec__6504__6505 = p__6498;
    var sel__6506 = cljs.core.nth.call(null, vec__6504__6505, 0, null);
    var data__6507 = cljs.core.nth.call(null, vec__6504__6505, 1, null);
    var handler__6508 = cljs.core.nth.call(null, vec__6504__6505, 2, null);
    return $elem.one(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6506), data__6507, handler__6508)
  };
  var one = function($elem, events, var_args) {
    var p__6498 = null;
    if(goog.isDef(var_args)) {
      p__6498 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return one__delegate.call(this, $elem, events, p__6498)
  };
  one.cljs$lang$maxFixedArity = 2;
  one.cljs$lang$applyTo = function(arglist__6509) {
    var $elem = cljs.core.first(arglist__6509);
    var events = cljs.core.first(cljs.core.next(arglist__6509));
    var p__6498 = cljs.core.rest(cljs.core.next(arglist__6509));
    return one__delegate($elem, events, p__6498)
  };
  one.cljs$lang$arity$variadic = one__delegate;
  return one
}();
jayq.core.off = function() {
  var off__delegate = function($elem, events, p__6510) {
    var vec__6515__6516 = p__6510;
    var sel__6517 = cljs.core.nth.call(null, vec__6515__6516, 0, null);
    var handler__6518 = cljs.core.nth.call(null, vec__6515__6516, 1, null);
    return $elem.off(jayq.core.__GT_event.call(null, events), jayq.core.__GT_selector.call(null, sel__6517), handler__6518)
  };
  var off = function($elem, events, var_args) {
    var p__6510 = null;
    if(goog.isDef(var_args)) {
      p__6510 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return off__delegate.call(this, $elem, events, p__6510)
  };
  off.cljs$lang$maxFixedArity = 2;
  off.cljs$lang$applyTo = function(arglist__6519) {
    var $elem = cljs.core.first(arglist__6519);
    var events = cljs.core.first(cljs.core.next(arglist__6519));
    var p__6510 = cljs.core.rest(cljs.core.next(arglist__6519));
    return off__delegate($elem, events, p__6510)
  };
  off.cljs$lang$arity$variadic = off__delegate;
  return off
}();
goog.provide("fractjs.core");
goog.require("cljs.core");
goog.require("jayq.core");
goog.require("clojure.string");
goog.require("hiccups.runtime");
goog.require("fract.shared.sentence");
goog.require("jayq.core");
jayq.core.on.call(null, jayq.core.$.call(null, "\ufdd0'div.container"), "\ufdd0'keyup", "", function(evt) {
  var elem__284517 = jayq.core.$.call(null, "\ufdd0'div.container");
  window.getSelection().getRangeAt(0).insertNode(jayq.core.$.call(null, "<span id='selection'/>").get(0));
  elem__284517.html(cljs.core.apply.call(null, cljs.core.str, cljs.core.map.call(null, cljs.core.comp.call(null, fractjs.core.splitSentences, fractjs.core.spanify), elem__284517.contents().toArray())));
  var range__284518 = document.createRange();
  var mark__284519 = jayq.core.$.call(null, "\ufdd0'span#selection");
  var markEl__284520 = mark__284519.get(0);
  var sel__284521 = document.getSelection();
  range__284518.setStartAfter(markEl__284520);
  range__284518.setEndAfter(markEl__284520);
  sel__284521.removeAllRanges();
  sel__284521.addRange(range__284518);
  return mark__284519.remove()
});
fractjs.core.spanify = function spanify(elem) {
  var content__284526 = jayq.core.$.call(null, elem).html();
  var id__284527 = jayq.core.attr.call(null, jayq.core.$.call(null, elem), "id");
  var ntype__284528 = elem.nodeType;
  var nname__284529 = elem.nodeName;
  if(cljs.core._EQ_.call(null, ntype__284528, 1)) {
    if(cljs.core._EQ_.call(null, nname__284529, "BR")) {
      return"\n"
    }else {
      if(cljs.core._EQ_.call(null, nname__284529, "SPAN")) {
        return[cljs.core.str("<span id='"), cljs.core.str(id__284527), cljs.core.str("'>"), cljs.core.str(content__284526), cljs.core.str("</span>")].join("")
      }else {
        return null
      }
    }
  }else {
    if(cljs.core._EQ_.call(null, ntype__284528, 3)) {
      return[cljs.core.str("<span id='"), cljs.core.str(id__284527), cljs.core.str("'>"), cljs.core.str(content__284526), cljs.core.str("</span>")].join("")
    }else {
      if("\ufdd0'else") {
        return""
      }else {
        return null
      }
    }
  }
};
fractjs.core.splitSentences = function splitSentences(html) {
  return html
};
jayq.core.$.call(null, "\ufdd0'div.container").html("<span>test</span>");
