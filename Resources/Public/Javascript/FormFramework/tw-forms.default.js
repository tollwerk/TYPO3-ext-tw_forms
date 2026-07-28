/**
 * Form validation module for enhanced client-side validation
 * Provides error summary, navigation, and dynamic page title updates
 */
(function formValidation(window, document) {

    // Store the original page title to restore it when errors are cleared
    const originalPageTitle = document.title;

    /**
     * Handle clicks on error summary links - focuses the corresponding field
     * @param {Event} event Click event on error link
     */
    const errorLinkHandler = function errorLinkHandler(event) {
        event.preventDefault();
        // Extract field ID from href fragment and focus that field
        this.fields[event.target.href.split('#')
            .pop()].focus();
        return false;
    };

    /**
     * Form validation constructor - sets up validation for a form element
     *
     * @param {Element} element Form element to enhance with validation
     * @constructor
     */
    function FormValidation(element) {
        this.element = element;
        this.element.enhancer = this;
        // Disable native HTML5 validation to use custom validation
        this.element.setAttribute('novalidate', 'novalidate');
        this.element.addEventListener('submit', this.validate.bind(this));
        this.errorNavigation = null;
        this.fields = {};

        // Collect all form fields that have enhancers (validation logic)
        for (let e = 0; e < this.element.elements.length; ++e) {
            const elementId = this.element.elements[e].id;
            if (elementId && this.element.elements[e].enhancer) {
                // Skip grouped fields that aren't the primary enhancer (e.g., radio buttons)
                if (!this.element.elements[e].enhancer.isGroup
                    || !this.element.elements[e].enhancer.groupPrimaryEnhancer
                ) {
                    this.fields[elementId] = this.element.elements[e].enhancer;
                }
            }
        }

        this.initializeErrorSummary(this.element.querySelector('.Form__error-summary'));
    }

    /**
     * Initialize error summary navigation and set up click handlers for error links
     *
     * @param {Element} summary Error summary element containing validation errors
     */
    FormValidation.prototype.initializeErrorSummary = function initializeErrorSummary(summary) {
        this.errorSummary = summary;
        if (this.errorSummary) {
            // Find the parent navigation container
            this.errorNavigation = this.errorSummary.closest('.Form__error-navigation');

            // Set up click handlers for existing error links to focus corresponding fields
            this.errorSummary.querySelectorAll('a.Form__error-link').forEach((link) => {
                const href = link.href.split('#');
                // Only add a handler if a link points to a valid field in our collection
                if ((href.length === 2) && (href[1] in this.fields)) {
                    link.addEventListener('click', errorLinkHandler.bind(this));
                }
            });
        }
    };

    /**
     * Validate form fields before submission and show/hide error navigation
     *
     * @param {Event} e Submit event (null when called for updates)
     */
    FormValidation.prototype.validate = function validate(e) {
        if (!this.errorNavigation) {
            return;
        }

        // Check if validation should be skipped (formnovalidate attribute)
        const novalidate = e && e.submitter && e.submitter.hasAttribute('formnovalidate');
        // Mark form as interacted with
        this.element.dataset.dirty = '1';

        if (!novalidate) {
            const errorMessages = {};

            // Validate all visible fields and collect error messages
            for (const f in this.fields) {
                if (Object.prototype.hasOwnProperty.call(this.fields, f)) {
                    // Only validate fields that are currently visible
                    if (window.isFieldVisible(this.fields[f].element)) {
                        const fieldErrors = this.fields[f].validate(true, null);
                        if (Object.keys(fieldErrors).length > 0) {
                            errorMessages[f] = fieldErrors;
                        }
                    }
                }
            }

            // If errors exist, show error navigation and prevent submission
            if (!this.updateErrorSummary(errorMessages)) {
                this.errorNavigation.removeAttribute('hidden');
                this.errorNavigation.classList.add('Form__error-navigation--visible');

                if (e) {
                    // Focus error navigation and prevent form submission
                    this.errorNavigation.focus();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                return false;
            }
        }

        // Hide error navigation when form is valid or validation is skipped
        this.errorNavigation.setAttribute('hidden', 'hidden');
        this.errorNavigation.classList.remove('Form__error-navigation--visible');
    };

    /**
     * Update the error summary by re-validating all fields (used for live updates)
     */
    FormValidation.prototype.update = function update() {
        this.validate(null);
    };

    /**
     * Update the error summary with current validation errors and manage UI state
     *
     * @param {Object} errorMessages Map of field IDs to their error messages
     * @return {boolean} True if no errors exist (form is valid), false otherwise
     */
    FormValidation.prototype.updateErrorSummary = function updateErrorSummary(errorMessages) {
        let errorCount = 0;

        // Clear existing error summary content
        if (!this.errorSummary) {
            return;
        }
        while (this.errorSummary.childNodes.length) {
            this.errorSummary.removeChild(this.errorSummary.firstChild);
        }

        // Create error links for each invalid field
        for (const f in errorMessages) {
            // Ensure the key is a direct property of errorMessages (not inherited)
            if (Object.prototype.hasOwnProperty.call(errorMessages, f)) {
                errorCount += 1;

                // Initialize a variable to store the field's human-readable title
                let fieldTitle = '';

                // Try to find the DOM element with an id matching the field name
                const fieldElement = this.element.querySelector(`#${f}`);
                if (fieldElement) {
                    // If found, read its data-title attribute if available
                    fieldTitle = fieldElement.getAttribute('data-title') || '';
                }

                // Create a clickable link that focuses the problematic field
                const errorLink = document.createElement('a');
                errorLink.className = 'Form__error-link';
                errorLink.href = `#${f}`;

                // Combine multiple error messages for the same field
                const errorTexts = Object.values(errorMessages[f]).join('; ');

                // Set the link text to "Field Title: error messages" if a title exists, else just the messages
                errorLink.textContent = fieldTitle ? `${fieldTitle}: ${errorTexts}` : errorTexts;

                // Attach an event handler so clicking focuses the field or performs other defined actions
                errorLink.addEventListener('click', errorLinkHandler.bind(this));

                // Wrap link in list item for proper semantic structure
                const errorListItem = document.createElement('li');
                errorListItem.className = 'Form__error-description';
                errorListItem.appendChild(errorLink);

                // Append the list item to the error summary container
                this.errorSummary.appendChild(errorListItem);
            }
        }

        // Update heading text based on error count (singular vs plural)
        const summaryHeading = this.errorNavigation.querySelector('.Form__error-heading');
        if (summaryHeading) {
            const templateAttribute = `data-heading-${(errorCount === 1) ? 'single' : 'multiple'}`;
            summaryHeading.textContent = summaryHeading.getAttribute(templateAttribute)
                .split('%s')
                .join(errorCount.toString());
        }

        // Update browser page title to indicate validation errors
        if (errorCount) {
            const errorPattern = this.errorNavigation.dataset.titleErrors;
            document.title = `${errorPattern} ${originalPageTitle}`.replace('{0}', errorCount.toString());
        }
        // Restore the original title when all errors are resolved
        if (!errorCount && document.title !== originalPageTitle) {
            document.title = originalPageTitle;
        }

        return !errorCount;
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('form.Form--custom-validation')
            .forEach((f) => new FormValidation(f));
    });
}(typeof global !== 'undefined' ? global : window, document));

