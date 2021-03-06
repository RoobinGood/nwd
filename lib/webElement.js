'use strict';

var utils = require('./utils'),
	errors = require('./errors');


/**
 * Element constructor
 * @class WebElement
 * @param {String} id Element id (e.g. returned by {@link WebDriver#get})
 * @param {WebDriver} driver
 */
function WebElement(id, driver) {
	//TODO: remove `this.ELEMENT` if it is not required
	this.id = this.ELEMENT = id;
	this.driver = driver;
	this.logMethodCalls = this.driver.logMethodCalls;

	/**
	 * element object works like {@link WebDriver#element}.
	 * @name element
	 * @type {Object}
	 * @instance
	 * @memberOf WebElement
	 */
	this.driver._initElement.call(this);
}

function returnSelf(callback, self) {
	return function(err) {
		callback(err, self);
	};
}

// returns index of first function from `args`
function indexOfFunctionInArgs(args) {
	var index = 0;
	while (index < args.length && !utils.isFunction(args[index])) index++;
	return utils.isFunction(args[index]) ? index : -1;
}

// replace first function from `args` on `returnSelf`
function repalceArgsCallbackOnReturnSelf(args, self) {
	var index = indexOfFunctionInArgs(args);
	if (index !== -1) args[index] = returnSelf(args[index], self);
	return args;
}

/**
 * Send a sequence of key strokes to an element.
 * @param {String} value
 * @param {Object} [params]
 * @param {Boolean} [params.clear] If true then 'clear' will be called before
 * sending keys.
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebElement.prototype.sendKeys = function(value, params, callback) {
	var self = this;
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	function sendKeys() {
		self.driver._cmd({
			path: '/element/' + self.id + '/value',
			method: 'POST',
			data: {value: utils.replaceKeyStrokesWithCodes(value).split('')}
		}, returnSelf(callback, self));
	}
	if (params.clear) {
		self.clear(function(err) {
			if (err) return callback(err);
			sendKeys();
		});
	} else {
		sendKeys();
	}
};

/**
 * Clear a TEXTAREA or text INPUT element's value.
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebElement.prototype.clear = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/clear',
		method: 'POST'
	}, returnSelf(callback, this));
};

/**
 * Get value of current element (alias to getAttr('value')).
 * @param {Function} callback(err:Error,value:String)
 */
WebElement.prototype.getValue = function(callback) {
	this.getAttr('value', callback);
};

/**
 * Get the value of an element's attribute.
 * @param {String} name Attribute's name
 * @param {Function} callback(err:Error,value:String)
 */
WebElement.prototype.getAttr = function(name, callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/attribute/' + name,
		method: 'GET'
	}, callback);
};

/**
 * Get the visible text (if element is invisible the result will be empty
 * string) of the element.
 * @param {Function} callback(err:Error,text:String)
 */
WebElement.prototype.getText = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/text',
		method: 'GET'
	}, callback);
};

var createJqueryNameMethod = function(method, methodArgsCount) {
	return function() {
		/*
		 * Copy only known jquery method args and callback, don't use
		 * standart strategy (last parameter is callback) for correct
		 * support of nwd wrappers (e.g. co-nwd)
		 */
		var args = Array.prototype.slice.call(
			arguments,
			0,
			methodArgsCount + 1
		);
		var callback = args.pop();
		var methodParams = [];
		if (args.length) {
			for (var i in args) {
				var val = String(args[i]);
				if (typeof val === 'string') val = '"' + val + '"';
				methodParams.push(val);
			}
		}
		this.driver.execute(
			'return $(arguments[0]).' + method + '(' + methodParams.join(',') + ');',
			[{ELEMENT: this.id}],
			false,
			callback
		);
	}
};

/**
 * Get the value of an element's attribute via jQuery.attr method.
 * See also selenium {@link WebElement#getAttr} method.
 * @param {String} name Attribute's name
 * @param {Function} callback(err:Error,value:String)
 */
WebElement.prototype.attr = createJqueryNameMethod('attr', 1);

/**
 * Get the value of an element's property via jQuery.prop method.
 * @param {String} name Property name
 * @param {Function} callback(err:Error,value:String|Boolean)
 */
WebElement.prototype.prop = createJqueryNameMethod('prop', 1);

/**
 * Get the value of an element's css property via jQuery.css method.
 * See also selenium {@link WebElement#getCssProp} method.
 * @param {String} name Css property name
 * @param {Function} callback(err:Error,value:String)
 */
WebElement.prototype.css = createJqueryNameMethod('css', 1);

/**
 * Get the text of an element's attribute via jQuery.text method.
 * See also selenium {@link WebElement#getText} method.
 * @param {Function} callback(err:Error,text:String)
 */
WebElement.prototype.text = createJqueryNameMethod('text', 0);

/**
 * Get element's tag name.
 * @param {Function} callback(err:Error,tagName:String)
 */
WebElement.prototype.getTagName = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/name',
		method: 'GET'
	}, callback);
};

/**
 * Click on an element.
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebElement.prototype.click = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/click',
		method: 'POST'
	}, returnSelf(callback, this));
};

/**
 * Move the mouse by an offset of the current element.
 * If the element is not visible, it will be scrolled into view.
 * @param {Object} offset Object with x, y offsets (relative to the top-left 
 * corner of the element) keys. If offset is not set the mouse will be moved 
 * to the center of the element.
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebElement.prototype.moveTo = function(offset, callback) {
	callback = utils.isFunction(offset) ? offset : callback;
	offset = !utils.isFunction(offset) ? offset : {};
	this.driver._cmd({
		path: '/moveto',
		method: 'POST',
		data: {
			element: this.id,
			xoffset: offset.x,
			yoffset: offset.y
		}
	}, returnSelf(callback, this));
};

/**
 * Move to the current element and down mouse button. 
 * `button` accepts same values as at {@link WebDriver#mouseDown}.
 * @param {String} [button]
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebElement.prototype.mouseDown = function() {
	var self = this,
		args = repalceArgsCallbackOnReturnSelf(arguments, this),
		callback = arguments[arguments.length - 1];
	this.moveTo(function(err) {
		if (err) return callback(err);
		self.driver.mouseDown.apply(self.driver, args);
	});
};

/**
 * Move to the current element and up mouse button. 
 * `button` accepts same values as at {@link WebDriver#mouseDown}.
 * @param {String} [button]
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebElement.prototype.mouseUp = function() {
	var self = this,
		args = repalceArgsCallbackOnReturnSelf(arguments, this),
		callback = arguments[arguments.length - 1];
	this.moveTo(function(err) {
		if (err) return callback(err);
		self.driver.mouseUp.apply(self.driver, args);
	});
};

/**
 * Find element inside current element.
 * `selector` and `params` could accept same values as at {@link WebDriver#get}.
 * @param {String} selector
 * @param {Object} [params]
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebElement.prototype.get = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	params.parent = this;
	this.driver.get(selector, params, callback);
};

/**
 * Find elements inside current element.
 * `selector` and `params` could accept same values as at {@link WebDriver#get}.
 * @param {String} selector
 * @param {Object} [params]
 * @param {Function} callback(err:Error,element:WebElement[])
 */
WebElement.prototype.getList = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	params.parent = this;
	this.driver.getList(selector, params, callback);
};

/**
 * Wait for element appear inside current element.
 * `selector` and `params` could accept same values as
 * at {@link WebDriver#waitForElement}.
 * @param {String} selector
 * @param {Object} [params]
 * @param {Function} callback(err:Error,element:WebDriver)
 */
WebElement.prototype.waitForElement = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	params.parent = this;
	this.driver.waitForElement(selector, params, callback);
};

/**
 * Determine if an element is currently enabled.
 * This will generally return true for everything but disabled input elements.
 * NOTE: therefore that native selenium function works properly only for
 * inputs. See {@link WebElement#isDisabled} method which works properly for
 * all native controls.
 * @param {Function} callback(err:Error,enabled:Boolean)
 */
WebElement.prototype.isEnabled = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/enabled',
		method: 'GET'
	}, callback);
};

/**
 * Determine if an element is currently disabled using DOM Element 'disabled'
 * property (works properly for any native controls).
 * @param {Function} callback(err:Error,disabled:Boolean)
 */
WebElement.prototype.isDisabled = function(callback) {
	this.driver.execute(
		'return arguments[0].disabled;',
		[{ELEMENT: this.id}],
		false,
		callback
	);
};

/**
 * Describe the identified element.
 * This command is reserved for future use; its return type is currently undefined.
 * @param {Function} callback(err:Error,description:String)
 */
WebElement.prototype.describe = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id,
		method: 'GET'
	}, callback);
};

/**
 * Get the value of an element's computed CSS property.
 * @param {String} propName The CSS property name, not the JavaScript property
 * name (e.g. background-color instead of backgroundColor).
 * @param {Function} callback(err:Error,value:String)
 */
WebElement.prototype.getCssProp = function(propName, callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/css/' + propName,
		method: 'GET'
	}, callback);
};

/**
 * Determine if an element is currently displayed.
 * This method avoids the problem of having to parse an element's 'style'
 * attribute.
 * @param {Function} callback(err:Error,displayed:Boolean)
 */
WebElement.prototype.isDisplayed = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/displayed',
		method: 'GET'
	}, callback);
};

/**
 * Determine if a checkbox or radiobutton is currently selected.
 * @param {Function} callback(err:Error,selected:Boolean)
 */
WebElement.prototype.isSelected = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/selected',
		method: 'GET'
	}, callback);
};

var isVisibleInjection = utils.getInjectionSource(function() {
	function ___nwdIsVisible(element) {
		if (!element) return false;
		return (
			element.style.display !== 'none'
				? (element.offsetWidth > 0 || element.offsetHeight > 0)
				: false
		);
	}
});

/*
 * Possible should be removed coz isDisplayed do the job right. 
 */
WebElement.prototype.isVisible = function(callback) {
	var self = this;
	function execute(withFunc) {
		self.driver.execute(
			(withFunc ? isVisibleInjection : '') + utils.getInjectionSource(function() {
				if (typeof window.___nwdIsVisible !== 'function') {
					if (typeof ___nwdIsVisible !== 'function') return 'needFunc';
					window.___nwdIsVisible = ___nwdIsVisible;
				}
				return ___nwdIsVisible(arguments[0]);
			}),
			[{ELEMENT: self.id}],
			false,
			function(err, result) {
				if (err) return callback(err);
				result === 'needFunc' ? execute(true) : callback(null, result);
			}
		);
	}
	execute();
};

/**
 * Wait for element disappear from the page.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebElement.prototype.waitForDisappear = function(callback) {
	var self = this;
	self.driver.waitFor(
		function(waitCallback) {
			self.isVisible(function(err, isVisible) {
				// Stale error is ok because it will occur when element is removed
				if (err && err instanceof errors.StaleElementReferenceError) err = null;
				waitCallback(err, !isVisible);
			});
		}, {
			errorMessage: 'waiting for element ' + self.id + ' disappear',
			timeout: self.driver.timeouts.waitForElementDisappear
		},
		returnSelf(callback, self.driver)
	);
};

/**
 * Wait untill element will be detached from page.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebElement.prototype.waitForDetach = function(callback) {
	var self = this;
	self.driver.waitFor(
		function(waitCallback) {
			self.getTagName(function(err) {
				waitCallback(null, err instanceof errors.StaleElementReferenceError);
			});
		}, {
			errorMessage: 'waiting for element ' + self.id + ' detach',
			timeout: self.driver.timeouts.waitForDetach
		},
		returnSelf(callback, self.driver)
	);
};

utils.loggify(WebElement.prototype, 'WebElement');

exports.WebElement = WebElement;
