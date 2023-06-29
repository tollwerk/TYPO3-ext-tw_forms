// TODO: Migrate
/* global tw_forms */
/* eslint no-restricted-properties: [0, {"object": "Map", "property": "pow"}] */
(function formFields(w, d) {
    let scrollIntoView = d.documentElement.scrollIntoView ? 'scrollIntoView' : null;
    if (d.documentElement.scrollIntoViewIfNeeded) {
        scrollIntoView = 'scrollIntoViewIfNeeded';
    }

    /**
     * Form field constructor
     *
     * @param {Element} element Form element
     * @constructor
     */
    function FormField(element) {
        this.element = element;
        this.element.enhancer = this;
        this.wrapper = this.element.closest('.FormField');
        this.groupPrimaryEnhancer = null;
        this.groupEnhancers = [];

        // Check if this is a field group and determine the primary enhancer
        this.isGroup = this.element.classList.contains('FormMultiCheckbox');
        if (this.isGroup) {
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

        // If this field is part of a group but not the primary field: Link to the primary enhancer
        if (this.isGroup && this.groupPrimaryEnhancer) {
            this.groupPrimaryEnhancer.groupEnhancers.push(this);
            this.element.addEventListener('input', this.validate.bind(this.groupPrimaryEnhancer, true));
            return;
        }

        this.lastConstraints = 0;
        this.errorMessages = {};
        this.errorMessageBag = this.element.hasAttribute('aria-errormessage')
            ? d.getElementById(this.element.getAttribute('aria-errormessage')) : null;
        this.recursiveErrorMessages = null;

        // If there's an error message display
        if (this.errorMessageBag) {
            this.constraints.forEach((constraint) => {
                const errorMessageKey = `errormsg${constraint.substr(0, 1)
                    .toUpperCase()}${constraint.substr(1)
                    .toLowerCase()}`;
                if (this.element.dataset[errorMessageKey]) {
                    this.errorMessages[constraint] = this.element.dataset[errorMessageKey];
                }
            });
            this.errorMessageBag.querySelectorAll('[data-constraint]')
                .forEach((c) => {
                    const constraintIndex = this.constraints.indexOf(c.dataset.constraint);
                    if (constraintIndex >= 0) {
                        this.lastConstraints += Math.pow(2, constraintIndex);
                    }
                });
            this.element.addEventListener('input', this.validate.bind(this, true));
        }
    }

    /**
     * Constraints
     *
     * @type {string[]}
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
     * Validate the form field
     *
     * @param {boolean} includeMissing Include missing value errors
     * @return {array} errorMessages
     */
    FormField.prototype.validate = function validate(includeMissing) {
        // If there's already a validation process running: Return error messages
        if (this.recursiveErrorMessages) {
            return this.recursiveErrorMessages;
        }

        const errorMessages = {};
        let constraints = 0;
        const validity = (this.isGroup && !this.groupPrimaryEnhancer) ? this.validateGroup() : this.element.validity;

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
        this.recursiveErrorMessages = errorMessages;
        this.updateErrorMessageBag(constraints, errorMessages);
        this.recursiveErrorMessages = null;
        return errorMessages;
    };

    /**
     * Validate all fields of a group
     *
     * @return {Object} Pseudo validity state
     */
    FormField.prototype.validateGroup = function validateGroup() {
        if (this.element.validity.valueMissing) {
            for (let e = 0; e < this.groupEnhancers.length; ++e) {
                if (this.groupEnhancers[e].element.checked) {
                    return this.overrideValidityState({ valueMissing: false });
                }
            }
        }

        return this.element.validity;
    };

    /**
     * Override the validity state of this element
     *
     * @param {Object} override Override values
     * @return {Object} Pseudo validity state
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
     * Update the error message bag with a set of error messages
     *
     * @param {array} constraints Current constraints (bitmask)
     * @param {object} errorMessages Error messages
     */
    FormField.prototype.updateErrorMessageBag = function updateErrorMessageBag(constraints, errorMessages) {
        if (constraints !== this.lastConstraints) {
            if (constraints) {
                this.errorMessageBag.removeAttribute('hidden');
                this.element.setAttribute('aria-invalid', 'true');
                this.wrapper.classList.add('FormField--has-error');
            } else {
                this.errorMessageBag.setAttribute('hidden', 'hidden');
                this.element.setAttribute('aria-invalid', 'false');
                this.wrapper.classList.remove('FormField--has-error');
            }
            while (this.errorMessageBag.childNodes.length) {
                this.errorMessageBag.removeChild(this.errorMessageBag.lastChild);
            }
            for (const c in errorMessages) {
                if (Object.prototype.hasOwnProperty.call(errorMessages, c)) {
                    const errorMessage = d.createElement('span');
                    errorMessage.setAttribute('data-constraint', c);
                    errorMessage.textContent = errorMessages[c];
                    this.errorMessageBag.appendChild(errorMessage);
                }
            }
            this.lastConstraints = constraints;
            this.focusWrapper();

            // If this form field is part of an enhanced form: Update error summary
            if (this.element.form.enhancer) {
                this.element.form.enhancer.update();
            }
        }
    };

    /**
     * Scroll the fields wrapper into the view
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
     * Focus the form field and bring its wrapper into the view
     */
    FormField.prototype.focus = function focus() {
        this.element.focus();
        this.focusWrapper();
    };

    // Observing for form fields
    tw_forms.Observer.register('.FormField__input, .FormField__textarea', (field) => new FormField(field));

}(typeof global !== 'undefined' ? global : window, document));
