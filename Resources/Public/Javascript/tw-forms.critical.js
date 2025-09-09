/**
 * Polyfills
 */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["s", "e"] }] */
(function iefe(w, e, s, svg) {
    // NodeList.forEach
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function foreEach(callback, thisArg) {
            for (let i = 0; i < this.length; ++i) {
                callback.call(thisArg || window, this[i], i, this);
            }
        };
    }

    // Element.matches
    if (!e.matches) {
        e.matches = e.matchesSelector || e.mozMatchesSelector || e.msMatchesSelector || e.oMatchesSelector || e.webkitMatchesSelector || ((str) => {
            const matches = (this.document || this.ownerDocument).querySelectorAll(str);
            let i = matches.length - 1;
            while ((i >= 0) && (matches.item(i) !== this)) {
                i -= 1;
            }
            return i > -1;
        });
    }

    // Element.closest
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

    // String.format
    if (!s.format) {
        s.format = function format(...args) {
            return this.replace(/{(\d+)}/g, (match, number) => (typeof args[number] !== 'undefined' ? args[number] : match));
        };
    }

    // classList support for IE11
    if (!('classList' in svg)) {
        Object.defineProperty(svg, 'classList', {
            get() {
                return {
                    contains: (className) => this.className.baseVal.split(' ').indexOf(className) !== -1,
                    add: (className) => this.setAttribute('class', `${this.getAttribute('class')} ${className}`),
                    remove: (className) => {
                        const removedClass = this.getAttribute('class')
                            .replace(new RegExp(`(\\s|^)${className}(\\s|$)`, 'g'), '$2');
                        if (this.classList.contains(className)) {
                            this.setAttribute('class', removedClass);
                        }
                    }
                };
            }
        });
    }
}(window, Element.prototype, String.prototype, SVGElement.prototype));

/**
 * Observer
 *
 * Watches DOM mutations and enhances matching nodes.
 *
 * @type {Object}
 */

// eslint-disable-next-line no-unused-vars
const tw_forms = window.tw_forms || { has: {} };
window.tw_forms = tw_forms;

(function mutationObserverSystem (window, document) {
    // Prevent duplicate initialization.
    if ((typeof exports !== "undefined" && exports.Observer) || window.tw_forms.Observer) {
        return;
    }

    /**
     * Observer constructor
     *
     * Sets up a MutationObserver to enhance added elements.
     *
     * @constructor
     *
     */
    function Observer() {
        // Registry of selectors and their corresponding enhancement callbacks
        this.observed = [["[data-mutate-recursive]", this.process.bind(this)]];
        const checkNode = this.checkNode.bind(this);

        // Create MutationObserver to handle added nodes.
        const observer = new MutationObserver((mutations) =>
            mutations.forEach((mutation) =>
                Array.prototype.slice
                    .call(mutation.addedNodes)
                    .filter((node) => node.nodeType === 1)
                    .forEach(checkNode)
            )
        );

        // Observe the whole document for changes.
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
 * Dirty/pristine handling
 * No live validation before first submit/next; enabled afterward.
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
 * Submit handler
 * Marks single-page forms as dirty on first submit.
 */
document.addEventListener('submit', function (e) {
    const form = e.target.closest('form');
    if (!form) return;

    // Multistep Powermail/native forms: always validate current step on client
    if (Array.isArray(form._stepPristine)) {
        // Determine current visible step index
        const fieldsets = Array.from(form.querySelectorAll('.powermail_fieldset'));
        let currentIndex = 0;
        for (let i = 0; i < fieldsets.length; i++) {
            if (fieldsets[i].style.display !== 'none') {
                currentIndex = i;
                break;
            }
        }

        // Mark the current step as not pristine and enable live validation for its fields
        form._stepPristine[currentIndex] = false;
        const currentFieldset = fieldsets[currentIndex];
        if (currentFieldset) {
            currentFieldset.querySelectorAll('input, select, textarea').forEach((el) => {
                if (el.enhancer && typeof el.enhancer.setPristine === 'function') {
                    el.enhancer.setPristine(false);
                }
            });
        }

        // Validate visible fields; prevent submit if there are errors
        let isValid = true;
        const elements = Array.from(form.elements);
        elements.forEach((el) => {
            if (window.isFieldVisible && window.isFieldVisible(el) && el.enhancer) {
                const errors = el.enhancer.validate(true, { force: true });
                if (errors && Object.keys(errors).length > 0) {
                    isValid = false;
                }
            }
        });

        if (!isValid) {
            if (form.enhancer && form.enhancer.errorNavigation) {
                form.enhancer.errorNavigation.removeAttribute('hidden');
                form.enhancer.errorNavigation.classList.add('Form__error-navigation--visible');
                form.enhancer.errorNavigation.focus();
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }

        // Allow submitting to continue for multistep when valid
        return;
    }

    // Single-page forms: set a dirty flag on the first submit
    form.dataset.dirty = '1';
}, true);



/**
 * Powermail validators for functionality not available in HTML5
 * Only includes validators that complement native HTML5 validation
 */
const PowermailValidators = {
    /**
     * Validate string length constraints with range syntax
     * @param {HTMLElement} field - Form field element to validate
     * @returns {boolean} True if validation fails
     */
    length: (field) => {
        if (!field.hasAttribute('data-powermail-length')) {
            return false;
        }

        if (field.value === '') {
            return false;
        }
        const lengthConfiguration = field.getAttribute('data-powermail-length');
        const length = lengthConfiguration
            .replace('[', '')
            .replace(']', '')
            .split(',');
        const minimum = length[0].trim();
        const maximum = length[1].trim();
        return parseInt(field.value.length) < parseInt(minimum) || parseInt(field.value.length) > parseInt(maximum);
    },

    /**
     * Validate that field value equals another field's value
     * @param {HTMLElement} field - Form field element to validate
     * @returns {boolean} True if validation fails
     */
    equalto: (field) => {
        if (!field.hasAttribute('data-powermail-equalto')) {
            return false;
        }

        const comparisonSelector = field.getAttribute('data-powermail-equalto');
        const comparisonField = field.closest('form').querySelector(comparisonSelector);
        if (comparisonField !== null) {
            return comparisonField.value !== field.value;
        }
        return false;
    },

    /**
     * Validate file size constraints
     * @param {HTMLElement} field - File input element to validate
     * @returns {boolean} True if validation fails
     */
    powermailfilesize: (field) => {
        if (field.type !== 'file' || !field.hasAttribute('data-powermail-powermailfilesize')) {
            return false;
        }

        if (field.value === '') {
            return false;
        }
        const files = field.files;
        const sizeConfiguration = field.getAttribute('data-powermail-powermailfilesize')
            .split(',');
        const maxSize = parseInt(sizeConfiguration[0]);
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > maxSize) {
                return true;
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
        if (field.type !== 'file' || !field.hasAttribute('accept')) {
            return false;
        }

        if (field.value === '') {
            return false;
        }
        const extension = field.value.split('.').pop().toLowerCase();
        const allowedExtensions = field
            .getAttribute('accept')
            .split(',')
            .map(e => e.trim().replace('.', '').toLowerCase());
        return allowedExtensions.includes(extension) === false;
    }
};

/**
 * FormField
 * Enhances inputs with validation, error messages, and group handling.
 */
(function formFields(w, d) {
    // Determine best scroll method available.
    let scrollIntoView = d.documentElement.scrollIntoView
        ? "scrollIntoView"
        : null;
    if (d.documentElement.scrollIntoViewIfNeeded) {
        scrollIntoView = "scrollIntoViewIfNeeded";
    }

    /**
     * FormField constructor
     * @param {HTMLElement} element - The input/textarea to enhance.
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
        "rangeUnderflow",
        "stepMismatch",
        "tooLong",
        "tooShort",
        "typeMismatch",
        "valueMissing",
        "customError"
    ];

    /**
     * Initialize group handling and link sibling enhancers.
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
     * Read per-constraint messages from data attributes.
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
     * Read initially rendered errors and store constraint bitmask.
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
     * Set pristine state (suppresses errors when true).
     * @param {boolean} pristine
     */
    FormField.prototype.setPristine = function (pristine) {
        this.pristine = pristine;
        if (pristine) {
            this.updateErrorMessageBag(0, {});
        }
    };

    /**
     * Validate a single field or field group.
     * @param {boolean} showErrors - Whether to display error messages.
     * @param {Object} options - Extra options (e.g., force).
     * @returns {Object} Map of constraint -> message.
     */
    FormField.prototype.validate = function (showErrors = false, options = {}) {
        // Skip validation for pristine fields unless forced
        if (this.pristine && !(options && options.force)) {
            return {};
        }

        // Prevent recursive validation calls to avoid infinite loops
        if (this.recursiveErrorMessages) {
            return this.recursiveErrorMessages;
        }

        // Initialize validation results
        const errorMessages = {};
        let constraints = 0;
        let validity;

        // Handle group fields (radio and checkbox groups)
        if (this.isGroup && !this.groupPrimaryEnhancer) {
            // Use custom group validation logic for field groups
            validity = this.validateGroup();

            // Check if required group has no selection
            if (validity.valueMissing) {
                // Try multiple sources for the required field error message
                errorMessages.valueMissing =
                    this.element.getAttribute('data-powermail-required-message') ||
                    this.element.getAttribute('data-errormsgvaluemissing') ||
                    this.errorMessages.valueMissing ||
                    this.element.validationMessage;

                // Add constraint to bitmask for tracking which validations failed
                constraints += 2 ** this.constraints.indexOf('valueMissing');
            }
        } else {
            // Handle single fields using native browser validation
            validity = this.element.validity;

            // Check if required field is empty
            if (validity.valueMissing) {
                // Try multiple sources for the required field error message
                errorMessages.valueMissing =
                    this.element.getAttribute('data-powermail-required-message') ||
                    this.element.getAttribute('data-errormsgvaluemissing') ||
                    this.errorMessages.valueMissing ||
                    this.element.validationMessage;

                // Add constraint to bitmask
                constraints += 2 ** this.constraints.indexOf('valueMissing');
            } else if (!this.element.checkValidity()) {
                // Field has content but fails other validation rules
                // Loop through all known constraints and check each one
                this.constraints.forEach((constraint) => {
                    if (constraint === 'valueMissing') return; // already handled above

                    // Check if this specific constraint is violated
                    if (validity[constraint]) {
                        // Build attribute name for constraint-specific error message
                        const attr = 'data-powermail-' + constraint.toLowerCase() + '-message';

                        // Try multiple sources for constraint-specific error messages
                        errorMessages[constraint] =
                            this.element.getAttribute(attr) ||
                            this.element.getAttribute('data-powermail-error-message') ||
                            this.element.getAttribute('data-errormsg' + constraint.charAt(0).toUpperCase() + constraint.slice(1)) ||
                            this.errorMessages[constraint] ||
                            this.element.validationMessage;

                        // Add constraint to bitmask for tracking
                        constraints += 2 ** this.constraints.indexOf(constraint);
                    }
                });
            }
        }

        // Additional Powermail validators for functionality not available in HTML5
        // Only run these if HTML5 validation passed or for specific custom validations
        if (!this.isGroup) {
            Object.keys(PowermailValidators).forEach((validatorName) => {
                if (PowermailValidators[validatorName](this.element)) {
                    const attr = 'data-powermail-' + validatorName.toLowerCase() + '-message';
                    errorMessages['customError'] =
                        // Powermail-specific message for this validator
                        this.element.getAttribute(attr) ||
                        // Generic Powermail fallback
                        this.element.getAttribute('data-powermail-error-message') ||
                        // Local in-memory fallback (if set via setupErrorMessages)
                        this.errorMessages['customError']
                    constraints += 2 ** this.constraints.indexOf('customError');
                }
            });
        }

        this.recursiveErrorMessages = errorMessages;
        this.updateErrorMessageBag(constraints, errorMessages);
        this.recursiveErrorMessages = null;

        return errorMessages;
    };

    /**
     * Validate a radio/checkbox group (at least one selected).
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
     * Build a ValidityState-like object with overrides.
     * @param {Object} override - Constraint overrides.
     * @returns {{valid: boolean}}
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
     * Render error messages and update ARIA/state.
     * @param {number} constraints - Constraint bitmask.
     * @param {Object} errorMessages - Map of constraint -> message.
     */
    FormField.prototype.updateErrorMessageBag = function (constraints, errorMessages) {
        // Early exit: if no target container is wired, there is nothing to update.
        if (!this.errorMessageBag) {
            return;
        }

        // Determine whether there are any errors to display.
        const hasErrors = Object.keys(errorMessages).length > 0;
        // Create a stable string snapshot of the error map for cheap deep-equality.
        // (Key order in `errorMessages` should be consistent across renders.)
        const errorString = JSON.stringify(errorMessages);

        // Only touch the DOM if something relevant actually changed since last time:
        // - the constraint bitmask,
        // - the serialized error map,
        // - or the pristine flag (affects whether we show/hide/scroll).
        if (
            constraints !== this.lastConstraints ||
            errorString !== this.lastErrorString ||
            this.pristine !== this.lastPristine
        ) {
            // Persist the new snapshot for the next change detection.
            this.lastConstraints = constraints;
            this.lastErrorString = errorString;
            this.lastPristine = this.pristine;

            if (hasErrors) {
                // Reveal the error container and mark the field as invalid for AT.
                this.errorMessageBag.removeAttribute('hidden');
                this.element.setAttribute('aria-invalid', 'true');
                // Add a CSS hook on the wrapper for visual styling.
                if (this.wrapper) this.wrapper.classList.add('FormField--has-error');
            } else {
                // Hide the error container and clear the invalid state.
                this.errorMessageBag.setAttribute('hidden', 'hidden');
                this.element.setAttribute('aria-invalid', 'false');
                // Remove the visual error hook if present.
                if (this.wrapper) this.wrapper.classList.remove('FormField--has-error');
            }

            // Remove all previously rendered error lines to avoid duplicates/stale entries.
            // We target only elements we created (`[data-constraint]`) to keep other content intact.
            this.errorMessageBag.querySelectorAll('[data-constraint]').forEach((el) => el.remove());


            // Rebuild the message list from the current `errorMessages` map.
            // Using `textContent` prevents HTML injection; messages are treated as plain text.
            for (const [key, msg] of Object.entries(errorMessages)) {
                const span = document.createElement('span');
                span.setAttribute('data-constraint', key); // useful for updates/removal later
                span.textContent = msg;
                this.errorMessageBag.appendChild(span);
            }

            // If the form has an enhancer with an `update` method, notify it after this render.
            // `queueMicrotask` batches the call after the current DOM mutations settle,
            // reducing layout thrash and avoiding re-entrancy issues.
            if (typeof this.element.form.enhancer?.update === 'function') {
                queueMicrotask(() => this.element.form.enhancer.update());
            }

            // Optionally scroll the wrapper into view on error (implementation handles pristine checks).
            this.focusWrapper();
        }
    };

    /**
     * Scrolls the wrapper into view
     */
    FormField.prototype.focusWrapper = function () {
        // Only scroll into view if the field has been interacted with (not pristine)
        // This prevents unwanted auto-scrolling during initial form validation on page load
        if (scrollIntoView && this.wrapper && !this.pristine) {
            this.wrapper[scrollIntoView]({
                block: 'center',
                inline: 'start',
                behavior: 'smooth'
            });
        }
    };

    /**
     * Focus the form field and bring its wrapper into the view
     */
    FormField.prototype.focus = function focus() {
        this.element.focus();
        this.focusWrapper();
    };

    // Register FormField enhancer with the Observer
    tw_forms.Observer.register('.FormField__input, .FormField__textarea', (field) => new FormField(field));
})(typeof global !== "undefined" ? global : window, document);
