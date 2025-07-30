/**
 * Form
 */
(function formValidation(w, d) {

    // Get the original, unmodified page title as base for the error page title.
    const originalPageTitle = document.title;

    const errorLinkHandler = function errorLinkHandler(e) {
        e.preventDefault();
        this.fields[e.target.href.split('#')
            .pop()].focus();
        return false;
    };

    /**
     * Form validation constructor
     *
     * @param {Element} element Form element
     * @constructor
     */
    function FormValidation(element) {
        this.element = element;
        this.element.enhancer = this;
        this.element.setAttribute('novalidate', 'novalidate');
        this.element.addEventListener('submit', this.validate.bind(this));
        this.errorNavigation = null;
        this.fields = {};

        for (let e = 0; e < this.element.elements.length; ++e) {
            const elementId = this.element.elements[e].id;
            if (elementId && this.element.elements[e].enhancer) {
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
     * Initialize an error summary
     *
     * @param {Element} summary
     */
    FormValidation.prototype.initializeErrorSummary = function initializeErrorSummary(summary) {
        this.errorSummary = summary;
        if (this.errorSummary) {
            this.errorNavigation = this.errorSummary.closest('.Form__error-navigation');
            this.errorSummary.querySelectorAll('a.Form__error-link').forEach((l) => {
                const href = l.href.split('#');
                if ((href.length === 2) && (href[1] in this.fields)) {
                    l.addEventListener('click', errorLinkHandler.bind(this));
                }
            });
        }
    };

    /**
     * Validate before submission
     *
     * @param {Event} e Submit event
     */
    FormValidation.prototype.validate = function validate(e) {
        const novalidate = e && e.submitter && e.submitter.hasAttribute('formnovalidate');

        if (!novalidate) {
            const errorMessages = {};

            for (const f in this.fields) {
                if (Object.prototype.hasOwnProperty.call(this.fields, f)) {
                    if (window.isFieldVisible(this.fields[f].element)) {
                        const fieldErrors = this.fields[f].validate(true, null);
                        if (Object.keys(fieldErrors).length > 0) {
                            errorMessages[f] = fieldErrors;
                        }
                    }
                }
            }
            if (!this.updateErrorSummary(errorMessages)) {
                this.errorNavigation.removeAttribute('hidden');
                this.errorNavigation.classList.add('Form__error-navigation--visible');
                if (e) {
                    this.errorNavigation.focus();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                return false;
            }
        }

        this.errorNavigation.setAttribute('hidden', 'hidden');
        this.errorNavigation.classList.remove('Form__error-navigation--visible');
    };

    /**
     * Update the error summary if it's currently visible
     */
    FormValidation.prototype.update = function update() {
        this.validate(null);
    };

    /**
     * Update the error summary
     *
     * @param {object} errorMessages Error messages
     * @return {boolean} No errors / form is valid
     */
    FormValidation.prototype.updateErrorSummary = function updateErrorSummary(errorMessages) {
        let errorCount = 0;

        // Remove all present errors
        while (this.errorSummary.childNodes.length) {
            this.errorSummary.removeChild(this.errorSummary.firstChild);
        }

        // Run through all invalid fields and create error descriptions & links
        for (const f in errorMessages) {
            if (Object.prototype.hasOwnProperty.call(errorMessages, f)) {
                errorCount += 1;
                const errorLink = d.createElement('a');
                errorLink.className = 'Form__error-link';
                errorLink.href = `#${f}`;
                errorLink.textContent = Object.values(errorMessages[f])
                    .join('; ');
                errorLink.addEventListener('click', errorLinkHandler.bind(this));
                const errorListItem = d.createElement('li');
                errorListItem.className = 'Form__error-description';
                errorListItem.appendChild(errorLink);
                this.errorSummary.appendChild(errorListItem);
            }
        }

        // Update the summary heading
        const summaryHeading = this.errorNavigation.querySelector('.Form__error-heading');
        if (summaryHeading) {
            const templateAttribute = `data-heading-${(errorCount === 1) ? 'single' : 'multiple'}`;
            summaryHeading.textContent = summaryHeading.getAttribute(templateAttribute)
                .split('%s')
                .join(errorCount);
        }

        // Update the page title when there are errors.
        if (errorCount) {
            const errorPattern = this.errorNavigation.dataset.titleErrors;
            const newTitle = `${errorPattern} ${originalPageTitle}`.replace('{0}', errorCount);
            document.title = newTitle;
        }
        if (!errorCount && document.title !== originalPageTitle) {
            document.title = originalPageTitle;
        }

        return !errorCount;
    };

    d.addEventListener('DOMContentLoaded', () => {
        d.querySelectorAll('form.Form--custom-validation')
            .forEach((f) => new FormValidation(f));
    });
}(typeof global !== 'undefined' ? global : window, document));

