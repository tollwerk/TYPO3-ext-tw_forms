/**
 * Polyfills for older browsers to ensure compatibility
 * Provides missing methods for NodeList, Element, String, and SVGElement
 */
(function iefe(w, e, s, svg) {
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
  if (!Element.prototype.matches) {
    Element.prototype.matches = function (selector) {
      const matches = (this.document || this.ownerDocument).querySelectorAll(
        selector
      );
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
  if (!e.closest) {
    e.closest = function closest(str) {
      let el = this;
      do {
        if (el.matches(str)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  /**
   * Polyfill for String.format method
   * Provides string formatting with placeholder replacement
   */
  if (!s.format) {
    s.format = function format(...args) {
      return this.replace(/{(\d+)}/g, (match, number) =>
        typeof args[number] !== "undefined" ? args[number] : match
      );
    };
  }

  /**
   * Polyfill for classList support on SVG elements in IE11
   * Provides classList functionality for SVG elements
   */
  if (!("classList" in svg)) {
    Object.defineProperty(svg, "classList", {
      get() {
        return {
          /**
           * Check if SVG element contains a specific class
           * @param {string} className - Class name to check
           * @returns {boolean} True if class exists
           */
          contains: (className) =>
            this.className.baseVal.split(" ").indexOf(className) !== -1,
          /**
           * Add a class to SVG element
           * @param {string} className - Class name to add
           */
          add: (className) =>
            this.setAttribute(
              "class",
              `${this.getAttribute("class")} ${className}`
            ),
          /**
           * Remove a class from SVG element
           * @param {string} className - Class name to remove
           */
          remove: (className) => {
            const removedClass = this.getAttribute("class").replace(
              new RegExp(`(\\s|^)${className}(\\s|$)`, "g"),
              "$2"
            );
            if (this.classList.contains(className)) {
              this.setAttribute("class", removedClass);
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

(function (w, d) {
  // Prevent duplicate initialization
  if (
    (typeof exports !== "undefined" && exports.Observer) ||
    w.tw_forms.Observer
  ) {
    return;
  }

  /**
   * Observer constructor
   * Creates a MutationObserver to watch for DOM changes and enhance new form fields
   */
  function Observer() {
    this.observed = [["[data-mutate-recursive]", this.process.bind(this)]];
    const checkNode = this.checkNode.bind(this);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        Array.prototype.slice
          .call(mutation.addedNodes)
          .filter((node) => node.nodeType === 1)
          .forEach(checkNode)
      )
    );
    observer.observe(d.documentElement, {
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
      .filter((observer) => node.matches(observer[0]))
      .forEach((observer) => observer[1](node));
  };

  /**
   * Process a node and all its descendants for matching selectors
   * @param {Node} node - DOM node to process
   */
  Observer.prototype.process = function (node) {
    if (node.nodeType === 1) {
      this.observed.forEach((observer) =>
        node
          .querySelectorAll(observer[0])
          .forEach((subnode) => observer[1](subnode))
      );
    }
  };

  // Export Observer instance
  if (typeof exports !== "undefined") {
    exports.Observer = new Observer();
  } else {
    w.tw_forms.Observer = new Observer();
  }
})(typeof global !== "undefined" ? global : window, document);

/**
 * Global dirty flag handling
 * Used for all forms: no validation before first submit/next, live after
 */

// Set all forms to pristine ("not dirty") when loaded
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form').forEach(form => {
    const fieldsets = form.querySelectorAll('.powermail_fieldset');
    if (fieldsets.length > 1 && form.classList.contains('powermail_morestep')) {
      // MultiStep: pristine array for each step
      form._stepPristine = Array(fieldsets.length).fill(true);
    } else {
      // Single-page/Classic: just one global dirty flag
      form.dataset.dirty = "0";
    }
  });
});

// Trigger dirty after first submit (single-page/global only!)
document.addEventListener('submit', function(e) {
  const form = e.target.closest('form');
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
   * FormField constructor
   * Initializes form field enhancement with validation and error handling
   * @param {HTMLElement} element - Form field element to enhance
   */
  function FormField(element) {
    this.element = element;
    this.element.enhancer = this;
    this.wrapper = this.element.closest(".FormField");
    this.groupPrimaryEnhancer = null;
    this.groupEnhancers = [];
    this.lastErrorString = "";

    this.element.addEventListener("input", (e) => {
      const form = e.target.form;

      // Multistep powermail form: use pristine array if present
      if (Array.isArray(form._stepPristine)) {
        const fieldset = e.target.closest('.powermail_fieldset');
        const fieldsets = Array.from(form.querySelectorAll('.powermail_fieldset'));
        const stepIdx = fieldsets.indexOf(fieldset);
        if (form._stepPristine[stepIdx]) return; // pristine: suppress error!

        // Single page form: global dirty (after first submit)
      } else if (form.dataset.dirty !== "1") {
        return;
      }

      this.validate(true); // Now run validation
    });


    // Handle group validation
    this.isGroup = this.element.classList.contains("FormField__multi");
    if (this.isGroup) {
      // Find primary enhancer for this group
      for (let e = 0; e < this.element.form.elements.length; ++e) {
        const elementId = this.element.form.elements[e].id;
        const elementName = this.element.form.elements[e].name;
        if (
          elementId &&
          elementName &&
          this.element.name === elementName &&
          this.element.id !== elementId
        ) {
          this.groupPrimaryEnhancer = this.element.form.elements[e].enhancer;
          break;
        }
      }
    }

    // Initialize validation properties
    this.lastConstraints = 0;
    this.errorMessages = {};
    this.errorMessageBag = this.element.hasAttribute("aria-errormessage")
      ? d.getElementById(this.element.getAttribute("aria-errormessage"))
      : null;
    this.recursiveErrorMessages = null;

    // Setup error messages and validation
    if (this.errorMessageBag) {
      this.setupErrorMessages();
      this.setupInitialConstraints();
    }
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
   * Setup error messages for each constraint
   * Reads error messages from data attributes and stores them
   */
  FormField.prototype.setupErrorMessages = function () {
    this.constraints.forEach((constraint) => {
      let errorMessage = null;
      if (constraint === "valueMissing") {
        errorMessage = this.element.getAttribute(
          "data-powermail-required-message"
        );
      } else if (constraint === "patternMismatch") {
        errorMessage = this.element.getAttribute(
          "data-powermail-error-message"
        );
      }
      if (!errorMessage) {
        const errorMessageKey = `errormsg${constraint
          .substring(0, 1)
          .toUpperCase()}${constraint.substring(1).toLowerCase()}`;
        if (this.element.dataset[errorMessageKey]) {
          this.errorMessages[constraint] =
            this.element.dataset[errorMessageKey];
        }
      }
      if (errorMessage) {
        this.errorMessages[constraint] = errorMessage;
      }
    });
  };

  /**
   * Setup initial constraint flags from existing error messages
   * Calculates constraint bitmask from existing error message elements
   */
  FormField.prototype.setupInitialConstraints = function () {
    this.errorMessageBag.querySelectorAll("[data-constraint]").forEach((c) => {
      const constraintIndex = this.constraints.indexOf(c.dataset.constraint);
      if (constraintIndex >= 0) {
        this.lastConstraints += Math.pow(2, constraintIndex);
      }
    });
  };

  /**
   * Validate form field and return error messages
   * Performs comprehensive validation including native HTML5 and custom Powermail validators
   * @param {boolean} includeMissing - Whether to include missing value validation
   * @returns {Object} Object containing validation error messages
   */
  FormField.prototype.validate = function validate(includeMissing) {
    // Prevent recursive validation calls
    if (this.recursiveErrorMessages) {
      return this.recursiveErrorMessages;
    }

    const errorMessages = {};
    let constraints = 0;

    // Determine validity state (group vs individual field)
    let validity;
    if (this.isGroup && !this.groupPrimaryEnhancer) {
      validity = this.validateGroup();
    } else {
      validity = this.element.validity;
    }

    // Handle group validation separately
    if (this.isGroup && !this.groupPrimaryEnhancer) {
      if (validity.valueMissing) {
        let msg =
          this.element.getAttribute("data-powermail-required-message") ||
          this.element.getAttribute("data-powermail-error-message") ||
          "Bitte wählen Sie mindestens eine Option aus.";
        errorMessages.valueMissing = msg;
        constraints += Math.pow(2, this.constraints.indexOf("valueMissing"));
      }
    } else {
      // Prioritize required field validation
      if (validity.valueMissing) {
        let msg =
          this.element.getAttribute("data-powermail-required-message") ||
          this.element.getAttribute("data-powermail-error-message") ||
          this.errorMessages.valueMissing ||
          this.element.validationMessage;
        errorMessages.valueMissing = msg;
        constraints += Math.pow(2, this.constraints.indexOf("valueMissing"));
      } else if (!this.element.checkValidity()) {
        // Check other validation constraints only if field is not missing
        this.constraints.forEach((constraint) => {
          if (constraint === "valueMissing") return; // Already handled
          if (validity[constraint]) {
            let msg =
              this.element.getAttribute(
                `data-powermail-${constraint.toLowerCase()}-message`
              ) ||
              this.element.getAttribute("data-powermail-error-message") ||
              this.errorMessages[constraint] ||
              this.element.validationMessage;
            errorMessages[constraint] = msg;
            constraints += Math.pow(2, this.constraints.indexOf(constraint));
          }
        });
      }
    }

    // Run custom Powermail validators (skip if native validation already failed for same type)
    for (const [validator, fn] of Object.entries(PowermailValidators)) {
      if (
        (validator === "pattern" && validity.patternMismatch) ||
        (validator === "email" &&
          validity.typeMismatch &&
          this.element.type === "email") ||
        (validator === "url" &&
          validity.typeMismatch &&
          this.element.type === "url") ||
        (validator === "maximum" && validity.rangeOverflow) ||
        (validator === "minimum" && validity.rangeUnderflow) ||
        (validator === "length" && (validity.tooLong || validity.tooShort)) ||
        (validator === "number" && validity.badInput) ||
        (validator === "required" && validity.valueMissing && !this.isGroup)
      ) {
        continue; // Skip custom validator if native validation already failed
      }
      if (fn(this.element)) {
        let msg =
          this.element.getAttribute(`data-powermail-${validator}-message`) ||
          this.element.getAttribute("data-powermail-error-message");
        errorMessages[validator] = msg;
      }
    }

    // Update error display and trigger form update
    this.recursiveErrorMessages = errorMessages;
    this.updateErrorMessageBag(constraints, errorMessages);
    this.recursiveErrorMessages = null;
    return errorMessages;
  };

  /**
   * Validate checkbox group
   * Checks if at least one checkbox in the group is selected
   * @returns {Object} Validity state object with valueMissing property
   */
  FormField.prototype.validateGroup = function validateGroup() {
    let checked = this.element.checked;
    for (let e = 0; e < this.groupEnhancers.length; ++e) {
      if (this.groupEnhancers[e].element.checked) {
        checked = true;
        break;
      }
    }
    return this.overrideValidityState({ valueMissing: !checked });
  };

  /**
   * Override validity state with custom values
   * Creates a new validity state object with overridden properties
   * @param {Object} override - Properties to override in validity state
   * @returns {Object} New validity state object
   */
  FormField.prototype.overrideValidityState = function overrideValidityState(
    override
  ) {
    const clonedValidityState = { valid: true };
    this.constraints.forEach((c) => {
      clonedValidityState[c] =
        c in override ? override[c] : this.element.validity[c];
      clonedValidityState.valid =
        clonedValidityState.valid && !clonedValidityState[c];
    });
    return clonedValidityState;
  };

  /**
   * Update error message display bag
   * Updates the error message container with current validation errors
   * @param {number} constraints - Bitmask of active constraints
   * @param {Object} errorMessages - Object containing error messages
   */
  FormField.prototype.updateErrorMessageBag = function updateErrorMessageBag(
    constraints,
    errorMessages
  ) {
    const hasErrors = Object.keys(errorMessages).length > 0;
    const errorString = JSON.stringify(errorMessages);

    // Only update if there are actual changes
    if (
      constraints !== this.lastConstraints ||
      hasErrors !== this.lastHadErrors ||
      errorString !== this.lastErrorString
    ) {
      // Update field and wrapper states
      if (hasErrors) {
        this.errorMessageBag.removeAttribute("hidden");
        this.element.setAttribute("aria-invalid", "true");
        this.wrapper.classList.add("FormField--has-error");
      } else {
        this.errorMessageBag.setAttribute("hidden", "hidden");
        this.element.setAttribute("aria-invalid", "false");
        this.wrapper.classList.remove("FormField--has-error");
      }

      // Clear existing error messages
      while (this.errorMessageBag.childNodes.length) {
        this.errorMessageBag.removeChild(this.errorMessageBag.lastChild);
      }

      // Add new error messages
      for (const constraintKey in errorMessages) {
        if (
          Object.prototype.hasOwnProperty.call(errorMessages, constraintKey)
        ) {
          const errorMessage = document.createElement("span");
          errorMessage.setAttribute("data-constraint", constraintKey);
          errorMessage.textContent = errorMessages[constraintKey];
          this.errorMessageBag.appendChild(errorMessage);
        }
      }

      // Update tracking properties
      this.lastConstraints = constraints;
      this.lastHadErrors = hasErrors;
      this.lastErrorString = errorString;
      this.focusWrapper();

      // Trigger form update asynchronously
      if (typeof Promise !== "undefined" && Promise.resolve) {
        Promise.resolve().then(() => {
          this.element.form.enhancer.update();
        });
      } else {
        setTimeout(() => {
          this.element.form.enhancer.update();
        }, 0);
      }
    }
  };

  /**
   * Scroll field wrapper into view
   * Smoothly scrolls the field wrapper into the viewport
   */
  FormField.prototype.focusWrapper = function focusWrapper() {
    if (scrollIntoView) {
      this.wrapper[scrollIntoView]({
        block: "center",
        inline: "start",
        behavior: "smooth",
      });
    }
  };

  /**
   * Focus the form field and scroll into view
   * Sets focus to the field element and ensures it's visible
   */
  FormField.prototype.focus = function focus() {
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
