/**
 * Polyfills for older browsers to ensure compatibility
 * Provide missing methods for NodeList, Element, String, and SVGElement
 */
(function browserPolyfills(window, elementProto, stringProto, svgElementProto) {
  /**
   * Polyfill for NodeList.forEach method
   * Adds forEach functionality to NodeList objects in browsers that don't support it
   */
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function foreEach(callback, thisArg) {
      for (let i = 0; i < this.length; ++i) {
        callback.call(thisArg || window, this[i], i, this);
      }
    };
  }

  /**
   * Polyfill for Element.matches method
   * Provides cross-browser support for element matching using CSS selectors
   */
  if (!elementProto.matches) {
    elementProto.matches = function (selector) {
      const matches = (this.document || this.ownerDocument).querySelectorAll(selector);
      let i = matches.length - 1;
      while (i >= 0 && matches.item(i) !== this) {
        i -= 1;
      }
      return i > -1;
    };
  }

  /**
   * Polyfill for Element.closest method
   * Traverses up the DOM tree to find the closest ancestor matching a selector
   */
  if (!elementProto.closest) {
    elementProto.closest = function closest(selector) {
      let element = this;
      do {
        if (element.matches(selector)) return element;
        element = element.parentElement || element.parentNode;
      } while (element !== null && element.nodeType === 1);
      return null;
    };
  }

  /**
   * Polyfill for String.format method
   * Provides string formatting with placeholder replacement
   */
  if (!stringProto.format) {
    stringProto.format = function format(...args) {
      return this.replace(/{(\d+)}/g, (match, number) =>
        typeof args[number] !== "undefined" ? args[number] : match
      );
    };
  }

  /**
   * Polyfill for classList support on SVG elements in IE11
   * Provides classList functionality for SVG elements
   */
  if (svgElementProto && !('classList' in svgElementProto)) {
    Object.defineProperty(svgElementProto, "classList", {
      get() {
        return {
          /**
           * Check if an SVG element contains a specific class
           * @param {string} className - Class name to check
           * @returns {boolean} True if class exists
           */
          contains: (className) => {
            const classAttr = this.getAttribute('class');
            return classAttr ? classAttr.split(/\s+/).includes(className) : false;
          },

          /**
           * Add a class to SVG element
           * @param {string} className - Class name to add
           */
          add: (className) => {
            const currentClass = this.getAttribute('class') || '';
            if (!this.classList.contains(className)) {
              const newClass = currentClass ? `${currentClass} ${className}` : className;
              this.setAttribute('class', newClass.trim());
            }
          },

          /**
           * Remove a class from SVG element
           * @param {string} className - Class name to remove
           */
          remove: (className) => {
            const currentClass = this.getAttribute('class');
            if (currentClass && this.classList.contains(className)) {
              const newClass = currentClass
                  .split(/\s+/)
                  .filter(cls => cls !== className)
                  .join(' ');
              this.setAttribute('class', newClass);
            }
          },
        };
      },
    });
  }
})(window, Element.prototype, String.prototype, SVGElement.prototype);

/**
 * Observer system for DOM mutations and form field enhancement
 * Manages automatic enhancement of form fields when they are added to the DOM
 */
const tw_forms = window.tw_forms || { has: {} };
window.tw_forms = tw_forms;

(function mutationObserverSystem (window, document) {
  // Prevent duplicate initialization
  if (
    (typeof exports !== "undefined" && exports.Observer) || window.tw_forms.Observer
  ) {
    return;
  }

  /**
   * Observer constructor
   * Creates a MutationObserver to watch for DOM changes and enhance new form fields
   */
  function Observer() {
    // Registry of selectors and their corresponding enhancement callbacks
    this.observed = [["[data-mutate-recursive]", this.process.bind(this)]];
    const checkNode = this.checkNode.bind(this);

    // Create MutationObserver to watch for new DOM nodes
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        Array.prototype.slice
          .call(mutation.addedNodes)
          .filter((node) => node.nodeType === 1)
          .forEach(checkNode)
      )
    );

    // Observe the entire document for changes
    observer.observe(document.documentElement, {
      characterData: true,
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  /**
   * Register a new observer for specific selectors
   * @param {string} selectors - CSS selectors to watch for
   * @param {function} callback - Callback function to execute when selector matches
   */
  Observer.prototype.register = function (selectors, callback) {
    this.observed.push([selectors, callback]);
  };

  /**
   * Check if a node matches any registered selectors and execute callbacks
   * @param {Node} node - DOM node to check
   */
  Observer.prototype.checkNode = function (node) {
    this.observed
      .filter((observer) => node.matches && node.matches(observer[0]))
      .forEach((observer) => observer[1](node));
  };

  /**
   * Process a node and all its descendants for matching selectors
   * @param {Node} node - DOM node to process
   */
  Observer.prototype.process = function (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      this.observed.forEach((observer) =>
        node.querySelectorAll(observer[0])
          .forEach((subnode) => observer[1](subnode))
      );
    }
  };

  // Export Observer instance to global scope
  if (typeof exports !== "undefined") {
    exports.Observer = new Observer();
  } else {
    window.tw_forms.Observer = new Observer();
  }
})(typeof global !== "undefined" ? global : window, document);

/**
 * Global dirty flag handling
 * Used for all forms: no validation before first submit/next, live after
 */
document.addEventListener('DOMContentLoaded', function initializeFormStates () {
  document.querySelectorAll('form').forEach(form => {
    const fieldsets = form.querySelectorAll('.powermail_fieldset');

    if (fieldsets.length > 1 && form.classList.contains('powermail_morestep')) {
      // Multistep form: maintain the pristine state for each step individually
      form._stepPristine = Array(fieldsets.length).fill(true);
    } else {
      // Single-page form: use a global dirty flag for the entire form
      form.dataset.dirty = "0";
    }
  });
});

/**
 * Global Form Submission Handler
 * Triggers dirty state for single-page forms after the first submit attempt
 * Multi-step forms handle their pristine state independently
 */
document.addEventListener('submit', function(e) {
  const form = e.target.closest('form');

  // Only set a dirty flag for single-page forms (not multistep)
  if (form && !Array.isArray(form._stepPristine)) {
    form.dataset.dirty = "1";
  }
}, true);


/**
 * Powermail custom validators
 * Additional validation functions for Powermail form fields beyond native HTML5 validation
 */
const PowermailValidators = {
  /**
   * Validate email format using custom regex pattern
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  email: (field) => {
    if (!field.value) return false;
    if (
      field.type === "email" ||
      field.getAttribute("data-powermail-type") === "email"
    ) {
      const pattern =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
      return !pattern.test(field.value);
    }
    return false;
  },

  /**
   * Validate URL format using regex pattern
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  url: (field) => {
    if (!field.value) return false;
    if (
      field.type === "url" ||
      field.getAttribute("data-powermail-type") === "url"
    ) {
      const pattern = new RegExp(
        "^(https?:\\/\\/)?" +
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
          "((\\d{1,3}\\.){3}\\d{1,3}))" +
          "(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*" +
          "(\\?[;&a-zA-Z\\d%_.~+=-]*)?" +
          "(\\#[-a-zA-Z\\d_]*)?$",
        "i"
      );
      return !pattern.test(field.value);
    }
    return false;
  },

  /**
   * Validate field against custom pattern attribute
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  pattern: (field) => {
    if (!field.value) return false;
    const pattern =
      field.getAttribute("data-powermail-pattern") ||
      field.getAttribute("pattern");
    if (pattern) {
      try {
        const regex = new RegExp(pattern);
        return !regex.test(field.value);
      } catch (e) {
        return false;
      }
    }
    return false;
  },

  /**
   * Validate numeric input
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  number: (field) => {
    if (!field.value) return false;
    if (
      field.type === "number" ||
      field.getAttribute("data-powermail-type") === "integer"
    ) {
      return isNaN(field.value);
    }
    return false;
  },

  /**
   * Validate minimum value constraint
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  minimum: (field) => {
    if (!field.value) return false;
    const min =
      field.getAttribute("min") || field.getAttribute("data-powermail-min");
    if (min !== null) {
      return parseFloat(field.value) < parseFloat(min);
    }
    return false;
  },

  /**
   * Validate maximum value constraint
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  maximum: (field) => {
    if (!field.value) return false;
    const max =
      field.getAttribute("max") || field.getAttribute("data-powermail-max");
    if (max !== null) {
      return parseFloat(field.value) > parseFloat(max);
    }
    return false;
  },

  /**
   * Validate string length constraints
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  length: (field) => {
    if (!field.value) return false;
    const lengthConfig = field.getAttribute("data-powermail-length");
    if (lengthConfig) {
      const [min, max] = lengthConfig
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map(Number);
      return field.value.length < min || field.value.length > max;
    }
    return false;
  },

  /**
   * Validate that field value equals another field's value
   * @param {HTMLElement} field - Form field element to validate
   * @returns {boolean} True if validation fails
   */
  equalto: (field) => {
    const selector = field.getAttribute("data-powermail-equalto");
    if (selector) {
      const form = field.closest("form");
      const compareField = form.querySelector(selector);
      if (compareField) {
        return compareField.value !== field.value;
      }
    }
    return false;
  },

  /**
   * Validate file size constraints
   * @param {HTMLElement} field - File input element to validate
   * @returns {boolean} True if validation fails
   */
  powermailfilesize: (field) => {
    if (field.type !== "file" || !field.files || !field.files.length)
      return false;
    const sizeConfig = field.getAttribute("data-powermail-powermailfilesize");
    if (sizeConfig) {
      const maxSize = parseInt(sizeConfig.split(",")[0], 10);
      for (let i = 0; i < field.files.length; i++) {
        if (field.files[i].size > maxSize) return true;
      }
    }
    return false;
  },

  /**
   * Validate file extension constraints
   * @param {HTMLElement} field - File input element to validate
   * @returns {boolean} True if validation fails
   */
  powermailfileextensions: (field) => {
    if (field.type !== "file" || !field.files || !field.files.length)
      return false;
    const accept = field.getAttribute("accept");
    if (accept) {
      const allowed = accept
        .split(",")
        .map((ext) => ext.trim().replace(".", "").toLowerCase());
      for (let i = 0; i < field.files.length; i++) {
        const ext = field.files[i].name.split(".").pop().toLowerCase();
        if (!allowed.includes(ext)) return true;
      }
    }
    return false;
  },
};

/**
 * FormField class for enhanced form field validation and error handling
 * Provides real-time validation, error message display, and group validation
 */
(function formFields(w, d) {
  // Determine best scroll method available
  let scrollIntoView = d.documentElement.scrollIntoView
    ? "scrollIntoView"
    : null;
  if (d.documentElement.scrollIntoViewIfNeeded) {
    scrollIntoView = "scrollIntoViewIfNeeded";
  }

  /**
   * FormField: Enhances single form fields or field groups with validation logic and error display.
   *
   * Used for both native TYPO3 and Powermail-specific validations.
   *
   * @param {HTMLElement} element - The form element to enhance
   */
  function FormField(element) {
    this.element = element;
    this.element.enhancer = this;
    this.wrapper = this.element.closest('.FormField');
    this.groupPrimaryEnhancer = null;
    this.groupEnhancers = [];
    this.lastConstraints = 0;
    this.errorMessages = {};
    this.lastErrorString = '';
    this.lastPristine = null;
    this.pristine = false;
    this.recursiveErrorMessages = null;

    // Initialize group
    this.isGroup = element.classList.contains('FormField__group-element');
    if (this.isGroup) {
      this.initGroupContext();
    }

    // Initialize error messages
    this.errorMessageBag = element.hasAttribute('aria-errormessage')
        ? document.getElementById(element.getAttribute('aria-errormessage'))
        : null;

    if (this.errorMessageBag) {
      this.setupErrorMessages();
      this.setupInitialConstraints();
    }

    // Add event based on element type
    const eventType = (element.type === 'radio' || element.type === 'checkbox') ? 'change' : 'input';

    element.addEventListener(eventType, (e) => {
      const form = e.target.form;
      if (Array.isArray(form._stepPristine)) {
        const fieldset = e.target.closest('.powermail_fieldset');
        const stepIdx = [...form.querySelectorAll('.powermail_fieldset')].indexOf(fieldset);
        if (form._stepPristine[stepIdx]) return;
      } else if (form.dataset.dirty !== '1') {
        return;
      }

      // Group: validate primary enhancer
      if (this.isGroup && this.groupPrimaryEnhancer) {
        this.groupPrimaryEnhancer.validate(true);
      } else {
        this.validate(true);
      }
    });
  }

  /**
   * Available validation constraints
   * @type {string[]}
   */
  FormField.prototype.constraints = [
    "badInput",
    "patternMismatch",
    "rangeOverflow",
    "rangeUndeflow",
    "stepMismatch",
    "tooLong",
    "tooShort",
    "typeMismatch",
    "valueMissing",
  ];

  /**
   * Initializes group logic by finding primary enhancer and linking related elements
   */
  FormField.prototype.initGroupContext = function () {
    const groupName = this.element.name;
    const formElements = Array.from(this.element.form.elements);
    const groupElements = formElements.filter(
        (el) => el.name === groupName && el.classList.contains('FormField__group-element')
    );
    const primary = groupElements[0];

    if (this.element === primary) {
      this.groupEnhancers = [this];
      groupElements.forEach((el) => {
        if (el !== this.element) {
          if (el.enhancer) {
            this.groupEnhancers.push(el.enhancer);
            el.enhancer.groupPrimaryEnhancer = this;
          } else {
            Object.defineProperty(el, '_primaryEnhancer', {
              value: this,
              writable: true
            });
          }
        }
      });
    } else {
      if (this.element._primaryEnhancer) {
        this.groupPrimaryEnhancer = this.element._primaryEnhancer;
        this.groupPrimaryEnhancer.groupEnhancers.push(this);
      }
    }
  };

  /**
   * Collects all error messages defined as data attributes for known constraints
   */
  FormField.prototype.setupErrorMessages = function () {
    this.constraints.forEach((c) => {
      const attr = 'data-errormsg' + c.charAt(0).toUpperCase() + c.slice(1);
      if (this.element.dataset[attr]) {
        this.errorMessages[c] = this.element.dataset[attr];
      }
    });
  };

  /**
   * Collects all currently rendered errors and stores constraint bitmask
   */
  FormField.prototype.setupInitialConstraints = function () {
    this.errorMessageBag.querySelectorAll('[data-constraint]').forEach((el) => {
      const c = el.dataset.constraint;
      const i = this.constraints.indexOf(c);
      if (i >= 0) {
        this.lastConstraints += 2 ** i;
      }
    });
  };

  /**
   * Returns whether the field is pristine and suppresses errors if so
   * @param {boolean} pristine
   */
  FormField.prototype.setPristine = function (pristine) {
    this.pristine = pristine;
    if (pristine) {
      this.updateErrorMessageBag(0, {});
    }
  };

  /**
   * Validates a single field or field group
   * @param {boolean} showErrors - Whether to display error messages
   * @param {Object} options - Extra options, e.g., force validation
   * @returns {Object} Constraint key -> error message
   */
  FormField.prototype.validate = function (showErrors = false, options = {}) {
    if (this.pristine && !(options && options.force)) return {};

    if (this.recursiveErrorMessages) return this.recursiveErrorMessages;

    const errorMessages = {};
    let constraints = 0;
    let validity;

    // Handle group fields
    if (this.isGroup && !this.groupPrimaryEnhancer) {
      validity = this.validateGroup();
      if (validity.valueMissing) {
        errorMessages.valueMissing =
            this.element.getAttribute('data-powermail-required-message') ||
            this.element.getAttribute('data-powermail-error-message') ||
            'Bitte wählen Sie mindestens eine Option aus.';
        constraints += 2 ** this.constraints.indexOf('valueMissing');
      }
    } else {
      validity = this.element.validity;
      if (validity.valueMissing) {
        errorMessages.valueMissing =
            this.element.getAttribute('data-powermail-required-message') ||
            this.element.getAttribute('data-powermail-error-message') ||
            this.errorMessages.valueMissing ||
            this.element.validationMessage;
        constraints += 2 ** this.constraints.indexOf('valueMissing');
      } else if (!this.element.checkValidity()) {
        this.constraints.forEach((c) => {
          if (c === 'valueMissing') return;
          if (validity[c]) {
            const attr = 'data-powermail-' + c.toLowerCase() + '-message';
            errorMessages[c] =
                this.element.getAttribute(attr) ||
                this.element.getAttribute('data-powermail-error-message') ||
                this.errorMessages[c] ||
                this.element.validationMessage;
            constraints += 2 ** this.constraints.indexOf(c);
          }
        });
      }
    }

    this.recursiveErrorMessages = errorMessages;
    this.updateErrorMessageBag(constraints, errorMessages);
    this.recursiveErrorMessages = null;
    return errorMessages;
  };

  /**
   * Validates a group of radio/checkboxes by checking if at least one is selected
   * @returns {ValidityState}
   */
  FormField.prototype.validateGroup = function () {
    let checked = this.element.checked;
    for (let i = 0; i < this.groupEnhancers.length; ++i) {
      if (this.groupEnhancers[i].element.checked) {
        checked = true;
        break;
      }
    }
    return this.overrideValidityState({ valueMissing: !checked });
  };

  /**
   * Builds a validity object with overrides for testing custom group constraints
   * @param {Object} override - Constraint values to override
   * @returns {ValidityState}
   */
  FormField.prototype.overrideValidityState = function (override) {
    const validity = { valid: true };
    this.constraints.forEach((c) => {
      validity[c] = override[c] ?? this.element.validity[c];
      if (validity[c]) validity.valid = false;
    });
    return validity;
  };

  /**
   * Applies error messages to the DOM
   * @param {number} constraints - Constraint bitmask
   * @param {Object} errorMessages - Key -> message map
   */
  FormField.prototype.updateErrorMessageBag = function (constraints, errorMessages) {
    const hasErrors = Object.keys(errorMessages).length > 0;
    const errorString = JSON.stringify(errorMessages);

    if (
        constraints !== this.lastConstraints ||
        errorString !== this.lastErrorString ||
        this.pristine !== this.lastPristine
    ) {
      this.lastConstraints = constraints;
      this.lastErrorString = errorString;
      this.lastPristine = this.pristine;

      if (hasErrors) {
        this.errorMessageBag.removeAttribute('hidden');
        this.element.setAttribute('aria-invalid', 'true');
        this.wrapper.classList.add('FormField--has-error');
      } else {
        this.errorMessageBag.setAttribute('hidden', 'hidden');
        this.element.setAttribute('aria-invalid', 'false');
        this.wrapper.classList.remove('FormField--has-error');
      }

      this.errorMessageBag.querySelectorAll('[data-constraint]').forEach((el) => el.remove());

      for (const [key, msg] of Object.entries(errorMessages)) {
        const span = document.createElement('span');
        span.setAttribute('data-constraint', key);
        span.textContent = msg;
        this.errorMessageBag.appendChild(span);
      }

      if (typeof this.element.form.enhancer?.update === 'function') {
        queueMicrotask(() => this.element.form.enhancer.update());
      }

      this.focusWrapper();
    }
  };

  /**
   * Scrolls the wrapper into view
   */
  FormField.prototype.focusWrapper = function () {
    if ('scrollIntoView' in this.wrapper) {
      this.wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /**
   * Focuses the field and scrolls it into view
   */
  FormField.prototype.focus = function () {
    this.element.focus();
    this.focusWrapper();
  };

  // Register FormField enhancer with the Observer
  tw_forms.Observer.register(
    ".FormField__input, .FormField__textarea",
    (field) => {
      return new FormField(field);
    }
  );
})(typeof global !== "undefined" ? global : window, document);
