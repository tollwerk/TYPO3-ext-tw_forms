/**
 * Form Validation Script with Powermail Integration
 *
 * This script provides comprehensive form validation functionality including:
 * - Browser compatibility polyfills
 * - DOM mutation observer for dynamic form fields
 * - Native HTML5 validation enhanced with custom Powermail validators
 * - Real-time error message display and field state management
 */

/**
 * Polyfills for older browser compatibility
 * Provides essential missing functionality for IE11 and other legacy browsers
 */
(function iefe(w, e, s, svg) {
    // NodeList.forEach - Enables forEach method on NodeList collections
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function foreEach(callback, thisArg) {
            for (let i = 0; i < this.length; ++i) {
                callback.call(thisArg || window, this[i], i, this);
            }
        };
    }

    // Element.matches - Provides CSS selector matching functionality
    if (!e.matches) {
        e.matches = e.matchesSelector
            || e.mozMatchesSelector
            || e.msMatchesSelector
            || e.oMatchesSelector
            || e.webkitMatchesSelector
            || ((str) => {
                const matches = (this.document || this.ownerDocument).querySelectorAll(str);
                let i = matches.length - 1;
                while ((i >= 0) && (matches.item(i) !== this)) {
                    i -= 1;
                }
                return i > -1;
            });
    }

    // Element.closest - Finds the closest ancestor element matching a selector
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

    // String.format - Custom string formatting utility with placeholder replacement
    if (!s.format) {
        s.format = function format(...args) {
            return this.replace(
                /{(\d+)}/g,
                (match, number) => (typeof args[number] !== 'undefined' ? args[number] : match)
            );
        };
    }

    // classList support for SVG elements in IE11
    if (!('classList' in svg)) {
        Object.defineProperty(svg, 'classList', {
            get() {
                return {
                    contains: (className) => this.className.baseVal.split(' ').indexOf(className) !== -1,
                    add: (className) => this.setAttribute(
                        'class',
                        `${this.getAttribute('class')} ${className}`
                    ),
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
 * DOM Mutation Observer
 *
 * Watches for DOM changes and automatically initializes form field enhancers
 * when new form elements are added to the page dynamically
 */
const tw_forms = window.tw_forms || { has: {} };
window.tw_forms = tw_forms;

(function (w, d) {
    // Prevent multiple initializations
    if (((typeof exports !== 'undefined') && exports.Observer) || w.tw_forms.Observer) {
        return;
    }

    /**
     * Observer class for monitoring DOM mutations and registering field enhancers
     */
    function Observer() {
        // Array of [selector, callback] pairs for elements to observe
        this.observed = [['[data-mutate-recursive]', this.process.bind(this)]];
        const checkNode = this.checkNode.bind(this);

        // Create MutationObserver to watch for added DOM nodes
        const observer = new MutationObserver((mutations) => mutations
            .forEach((mutation) => Array.prototype.slice.call(mutation.addedNodes)
                .filter((node) => node.nodeType === 1).forEach(checkNode)));

        // Start observing the entire document
        observer.observe(d.documentElement, {
            characterData: true, attributes: false, childList: true, subtree: true
        });
    }

    /**
     * Register a new selector and callback for observation
     * @param {string} selectors - CSS selector to match elements
     * @param {function} callback - Function to call when matching elements are found
     */
    Observer.prototype.register = function (selectors, callback) {
        this.observed.push([selectors, callback]);
    };

    /**
     * Check if a node matches any registered selectors and execute callbacks
     * @param {Element} node - DOM node to check
     */
    Observer.prototype.checkNode = function (node) {
        this.observed.filter((observer) => node.matches(observer[0]))
            .forEach((observer) => observer[1](node));
    };

    /**
     * Process a node and all its descendants for matching elements
     * @param {Element} node - DOM node to process recursively
     */
    Observer.prototype.process = function (node) {
        if (node.nodeType === 1) {
            this.observed.forEach((observer) => node.querySelectorAll(observer[0])
                .forEach((subnode) => observer[1](subnode)));
        }
    };

    // Export or attach to global scope
    if (typeof exports !== 'undefined') {
        exports.Observer = new Observer();
    } else {
        w.tw_forms.Observer = new Observer();
    }
}(typeof global !== 'undefined' ? global : window, document));

/**
 * Powermail Validators
 *
 * Custom validation functions for Powermail form fields
 * These validators extend the native HTML5 validation with additional rules
 */
const PowermailValidators = {
    /**
     * Validates email addresses using a comprehensive regex pattern
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    email: (field) => {
        if (!field.value) return false;
        if (field.type === 'email' || field.getAttribute('data-powermail-type') === 'email') {
            const pattern = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            return !pattern.test(field.value);
        }
        return false;
    },

    /**
     * Validates URL format with optional protocol
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    url: (field) => {
        if (!field.value) return false;
        if (field.type === 'url' || field.getAttribute('data-powermail-type') === 'url') {
            const pattern = new RegExp('^(https?:\\/\\/)?'+
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
                '((\\d{1,3}\\.){3}\\d{1,3}))'+
                '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*'+
                '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+
                '(\\#[-a-zA-Z\\d_]*)?$','i');
            return !pattern.test(field.value);
        }
        return false;
    },

    /**
     * Validates input against a custom regex pattern
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    pattern: (field) => {
        if (!field.value) return false;
        const pattern = field.getAttribute('data-powermail-pattern') || field.getAttribute('pattern');
        if (pattern) {
            try {
                const regex = new RegExp(pattern);
                return !regex.test(field.value);
            } catch (e) { return false; }
        }
        return false;
    },

    /**
     * Validates numeric input for integer fields
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    number: (field) => {
        if (!field.value) return false;
        if (field.type === 'number' || field.getAttribute('data-powermail-type') === 'integer') {
            return isNaN(field.value);
        }
        return false;
    },

    /**
     * Validates minimum value constraints
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    minimum: (field) => {
        if (!field.value) return false;
        const min = field.getAttribute('min') || field.getAttribute('data-powermail-min');
        if (min !== null) {
            return parseFloat(field.value) < parseFloat(min);
        }
        return false;
    },

    /**
     * Validates maximum value constraints
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    maximum: (field) => {
        if (!field.value) return false;
        const max = field.getAttribute('max') || field.getAttribute('data-powermail-max');
        if (max !== null) {
            return parseFloat(field.value) > parseFloat(max);
        }
        return false;
    },

    /**
     * Validates string length constraints with min/max range
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    length: (field) => {
        if (!field.value) return false;
        const lengthConfig = field.getAttribute('data-powermail-length');
        if (lengthConfig) {
            const [min, max] = lengthConfig.replace('[', '').replace(']', '').split(',').map(Number);
            return field.value.length < min || field.value.length > max;
        }
        return false;
    },

    /**
     * Validates that field value equals another field's value
     * @param {HTMLElement} field - The input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    equalto: (field) => {
        const selector = field.getAttribute('data-powermail-equalto');
        if (selector) {
            const form = field.closest('form');
            const compareField = form.querySelector(selector);
            if (compareField) {
                return compareField.value !== field.value;
            }
        }
        return false;
    },

    /**
     * Validates file size constraints for upload fields
     * @param {HTMLElement} field - The file input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    powermailfilesize: (field) => {
        if (field.type !== 'file' || !field.files || !field.files.length) return false;
        const sizeConfig = field.getAttribute('data-powermail-powermailfilesize');
        if (sizeConfig) {
            const maxSize = parseInt(sizeConfig.split(',')[0], 10);
            for (let i = 0; i < field.files.length; i++) {
                if (field.files[i].size > maxSize) return true;
            }
        }
        return false;
    },

    /**
     * Validates file extensions for upload fields
     * @param {HTMLElement} field - The file input field to validate
     * @returns {boolean} - True if validation fails, false if valid
     */
    powermailfileextensions: (field) => {
        if (field.type !== 'file' || !field.files || !field.files.length) return false;
        const accept = field.getAttribute('accept');
        if (accept) {
            const allowed = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());
            for (let i = 0; i < field.files.length; i++) {
                const ext = field.files[i].name.split('.').pop().toLowerCase();
                if (!allowed.includes(ext)) return true;
            }
        }
        return false;
    }
};

/**
 * Determines whether a Powermail validator should be skipped based on native validation state
 * @param {string} validator - Name of the validator
 * @param {ValidityState} validity - Native HTML5 validity state
 * @param {HTMLElement} element - The form element being validated
 * @returns {boolean} - True if validator should be skipped
 */
const shouldSkipPowermailValidator = (validator, validity, element) => {
    if (validator === 'email' && element.type === 'email' && validity.typeMismatch) return true;
    if (validator === 'url' && element.type === 'url' && validity.typeMismatch) return true;
    if (validator === 'pattern' && validity.patternMismatch) return true;
    if (validator === 'maximum' && validity.rangeOverflow) return true;
    if (validator === 'minimum' && validity.rangeUnderflow) return true;
    if (validator === 'length' && (validity.tooLong || validity.tooShort)) return true;
    return validator === 'number' && element.type === 'number' && validity.badInput;
};


/**
 * Gets the appropriate error message for a Powermail validator
 * @param {HTMLElement} element - The form element
 * @param {string} validator - Name of the validator
 * @returns {string} - Error message to display
 */
const getPowermailErrorMessage = (element, validator) => {
    return element.getAttribute(`data-powermail-${validator}-message`) ||
        element.getAttribute('data-powermail-error-message') ||
        `Invalid input (${validator})`;
};

/**
 * FormField Enhancement Class
 *
 * Enhances form fields with real-time validation, error messaging,
 * and accessibility features. Supports both individual fields and
 * grouped fields (like radio buttons and checkboxes).
 */
(function formFields(w, d) {
    // Determine the best available scroll method for focusing invalid fields
    let scrollIntoView = d.documentElement.scrollIntoView ? 'scrollIntoView' : null;
    if (d.documentElement.scrollIntoViewIfNeeded) {
        scrollIntoView = 'scrollIntoViewIfNeeded';
    }

    /**
     * FormField constructor - Initializes form field validation and enhancement
     * @param {HTMLElement} element - The form input element to enhance
     */
    function FormField(element) {
        this.element = element;
        this.element.enhancer = this;
        this.wrapper = this.element.closest('.FormField');
        this.groupPrimaryEnhancer = null;
        this.groupEnhancers = [];
        this.lastErrorString = '';

        // Handle grouped form fields (checkboxes, radio buttons)
        this.isGroup = this.element.classList.contains('FormMultiCheckbox');
        if (this.isGroup) {
            // Find the primary enhancer for this group
            for (let e = 0; e < this.element.form.elements.length; ++e) {
                const elementId = this.element.form.elements[e].id;
                const elementName = this.element.form.elements[e].name;
                if (elementId && elementName
                    && (this.element.name === elementName)
                    && (this.element.id !== elementId)
                ) {
                    this.groupPrimaryEnhancer = this.element.form.elements[e].enhancer;
                    break;
                }
            }
        }

        // If this is a secondary group element, register with primary and return
        if (this.isGroup && this.groupPrimaryEnhancer) {
            this.groupPrimaryEnhancer.groupEnhancers.push(this);
            this.element.addEventListener('input', this.validate.bind(this.groupPrimaryEnhancer, true));
            return;
        }

        // Initialize validation state and error messaging
        this.lastConstraints = 0;
        this.errorMessages = {};
        this.errorMessageBag = this.element.hasAttribute('aria-errormessage')
            ? d.getElementById(this.element.getAttribute('aria-errormessage')) : null;
        this.recursiveErrorMessages = null;

        // Set up error message handling if error message container exists
        if (this.errorMessageBag) {
            // Extract error messages from data attributes
            this.constraints.forEach((constraint) => {
                let errorMessage = null;
                if (constraint === 'valueMissing') {
                    errorMessage = this.element.getAttribute('data-powermail-required-message');
                } else if (constraint === 'patternMismatch') {
                    errorMessage = this.element.getAttribute('data-powermail-error-message');
                }
                if(!errorMessage) {
                    const errorMessageKey = `errormsg${constraint.substr(0, 1)
                        .toUpperCase()}${constraint.substr(1)
                        .toLowerCase()}`;
                    if (this.element.dataset[errorMessageKey]) {
                        this.errorMessages[constraint] = this.element.dataset[errorMessageKey];
                    }
                }
                if (errorMessage) {
                    this.errorMessages[constraint] = errorMessage;
                }
            });

            // Calculate initial constraint state from existing error messages
            this.errorMessageBag.querySelectorAll('[data-constraint]')
                .forEach((c) => {
                    const constraintIndex = this.constraints.indexOf(c.dataset.constraint);
                    if (constraintIndex >= 0) {
                        this.lastConstraints += Math.pow(2, constraintIndex);
                    }
                });

            // Attach input event listener for real-time validation
            this.element.addEventListener('input', this.validate.bind(this, true));
        }
    }

    /**
     * Array of HTML5 constraint validation types
     */
    FormField.prototype.constraints = [
        'badInput',
        'patternMismatch',
        'rangeOverflow',
        'rangeUndeflow',
        'stepMismatch',
        'tooLong',
        'tooShort',
        'typeMismatch',
        'valueMissing'
    ];

    /**
     * Validates the form field using both native HTML5 validation and Powermail validators
     * @param {boolean} includeMissing - Whether to include required field validation
     * @returns {Object} - Object containing validation error messages
     */
    FormField.prototype.validate = function validate(includeMissing) {
        // Prevent recursive validation calls
        if (this.recursiveErrorMessages) {
            return this.recursiveErrorMessages;
        }

        const errorMessages = {};
        let constraints = 0;

        // Get validity state (either from group validation or individual element)
        const validity = (this.isGroup && !this.groupPrimaryEnhancer) ? this.validateGroup() : this.element.validity;

        // Process native HTML5 validation constraints
        if (includeMissing || !validity.valueMissing) {
            for (const constraint in this.errorMessages) {
                if (
                    Object.prototype.hasOwnProperty.call(this.errorMessages, constraint)
                    && (constraint in validity)
                    && validity[constraint]
                ) {
                    errorMessages[constraint] = this.errorMessages[constraint];
                    constraints += Math.pow(2, this.constraints.indexOf(constraint));
                }
            }
        }

        // Process Powermail custom validators
        for (const [validatorName, validatorFunction] of Object.entries(PowermailValidators)) {
            // Skip if native validation already covers this case
            if (shouldSkipPowermailValidator(validatorName, validity, this.element)) {
                continue;
            }

            // Run the validator function
            if (validatorFunction(this.element)) {
                errorMessages[validatorName] = getPowermailErrorMessage(this.element, validatorName);
            }
        }

        // Store current validation state and update UI
        this.recursiveErrorMessages = errorMessages;
        this.updateErrorMessageBag(constraints, errorMessages);
        this.recursiveErrorMessages = null;

        return errorMessages;
    };

    /**
     * Validates grouped form fields (checkboxes, radio buttons)
     * @returns {Object} - Validity state object for the group
     */
    FormField.prototype.validateGroup = function validateGroup() {
        let checked = this.element.checked;
        // Check if any element in the group is checked
        for (let e = 0; e < this.groupEnhancers.length; ++e) {
            if (this.groupEnhancers[e].element.checked) {
                checked = true;
                break;
            }
        }
        return this.overrideValidityState({ valueMissing: !checked });
    };

    /**
     * Creates a custom validity state object with overridden values
     * @param {Object} override - Properties to override in the validity state
     * @returns {Object} - Custom validity state object
     */
    FormField.prototype.overrideValidityState = function overrideValidityState(override) {
        const clonedValidityState = { valid: true };
        this.constraints.forEach((c) => {
            clonedValidityState[c] = (c in override) ? override[c] : this.element.validity[c];
            clonedValidityState.valid = clonedValidityState.valid && !clonedValidityState[c];
        });
        return clonedValidityState;
    };

    /**
     * Updates the error message container and field styling based on validation results
     * @param {number} constraints - Bitmask of active constraints
     * @param {Object} errorMessages - Object containing error messages to display
     */
    FormField.prototype.updateErrorMessageBag = function updateErrorMessageBag(constraints, errorMessages) {
        const hasErrors = Object.keys(errorMessages).length > 0;
        const errorString = JSON.stringify(errorMessages);

        // Only update if the error state has changed
        if (constraints !== this.lastConstraints || hasErrors !== this.lastHadErrors ||
            errorString !== this.lastErrorString) {

            // Update field and wrapper styling
            if (hasErrors) {
                this.errorMessageBag.removeAttribute('hidden');
                this.element.setAttribute('aria-invalid', 'true');
                this.wrapper.classList.add('FormField--has-error');
            } else {
                this.errorMessageBag.setAttribute('hidden', 'hidden');
                this.element.setAttribute('aria-invalid', 'false');
                this.wrapper.classList.remove('FormField--has-error');
            }

            // Clear existing error messages
            while (this.errorMessageBag.childNodes.length) {
                this.errorMessageBag.removeChild(this.errorMessageBag.lastChild);
            }

            // Add new error messages
            for (const c in errorMessages) {
                if (Object.prototype.hasOwnProperty.call(errorMessages, c)) {
                    const errorMessage = d.createElement('span');
                    errorMessage.setAttribute('data-constraint', c);
                    errorMessage.textContent = errorMessages[c];
                    this.errorMessageBag.appendChild(errorMessage);
                }
            }

            // Update state tracking
            this.lastConstraints = constraints;
            this.lastHadErrors = hasErrors;
            this.lastErrorString = errorString;
            this.focusWrapper();

            // Trigger form-level update asynchronously
            if (typeof Promise !== 'undefined' && Promise.resolve) {
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
     * Smoothly scrolls the form field wrapper into view
     */
    FormField.prototype.focusWrapper = function focusWrapper() {
        if (scrollIntoView) {
            this.wrapper[scrollIntoView]({
                block: 'center',
                inline: 'start',
                behavior: 'smooth'
            });
        }
    };

    /**
     * Focuses the form field and scrolls it into view
     */
    FormField.prototype.focus = function focus() {
        this.element.focus();
        this.focusWrapper();
    };

    // Register FormField enhancer with the DOM observer
    tw_forms.Observer.register('.FormField__input, .FormField__textarea', (field) => {
        return new FormField(field);
    });

}(typeof global !== 'undefined' ? global : window, document));
