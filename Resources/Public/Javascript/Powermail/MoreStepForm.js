import Utility from './Utility/Utility';

/**
 * Multi-step form handler:
 * - Manages navigation between fieldsets
 * - Validates fields before allowing forward navigation
 * - Updates progress navigation (active, complete, incomplete states)
 */
export default function MoreStepForm() {
    'use strict';

    // CSS class constants for form identification and styling
    let formClass = 'powermail_morestep';
    let fieldsetClass = 'powermail_fieldset';

    // Persist validation progress per form (robust against DOM re-selects)
    const getValidUntil = (form) => {
        if (typeof form._validUntil === 'number') return form._validUntil;
        const ds = parseInt(form.dataset.morestepValidUntil || '-1', 10);
        return Number.isNaN(ds) ? -1 : ds;
    };
    const setValidUntil = (form, value) => {
        form._validUntil = value;
        // Optional but handy for debugging:
        form.dataset.morestepValidUntil = String(value);
    };

    let that = this;

    /**
     * Initialize multi-step forms on the page
     * - Sets up pristine tracking arrays
     * - Binds event listeners
     * - Shows the first step
     */
    this.initialize = function() {
        initializePristineTracking();
        bindNavigationEvents();
        initializeForms();
    };

    /**
     * Display a specific step and update UI state
     * @param {number} index - Zero-based step index
     * @param {HTMLFormElement} form - Parent form element
     */
    this.showFieldset = function(index, form) {
        if (!form.classList.contains(formClass)) return;

        hideAllFieldsets(form);
        showFieldsetAtIndex(form, index);

        // Persist the active step to avoid brittle DOM heuristics
        form._activeStep = index;

        updateNavigationState(form, index);
        hideErrorNavigation(form);
        resetPristineStateForStep(form, index);
    };

    /**
     * Create pristine tracking arrays for all forms
     * Each form gets an array marking untouched steps
     */
    let initializePristineTracking = function() {
        document.querySelectorAll('form.' + formClass).forEach(form => {
            const fieldsets = form.querySelectorAll('.' + fieldsetClass);
            // true = untouched, false = ready for live validation
            form._stepPristine = Array(fieldsets.length).fill(true);
        });
    };

    /**
     * Initialize all forms found on the page
     */
    let initializeForms = function() {
        let moreStepForms = document.querySelectorAll('form.' + formClass);
        for (let i = 0; i < moreStepForms.length; i++) {
            initializeForm(moreStepForms[i]);
        }
    };

    /**
     * Initialize a single form
     * - Reset validation state
     * - Show the first step
     * @param {HTMLFormElement} form
     */
    let initializeForm = function(form) {
        setValidUntil(form, -1);
        that.showFieldset(0, form);
    };

    /**
     * Validate all visible fields in the current step
     * @param {HTMLFormElement} form
     * @param {Object} options
     * @param {boolean} options.showErrors - Show validation errors
     * @returns {boolean} True if all fields are valid
     */
    let validateCurrentStep = function(form, { showErrors = true } = {}) {
        if (typeof window.isFieldVisible !== 'function') return true;

        const visibleFields = Array.from(form.elements).filter((el) =>
            window.isFieldVisible(el) && el.enhancer
        );

        let isValid = true;
        visibleFields.forEach((field) => {
            // Validate if showing errors or field already touched
            const force = !field.enhancer.pristine || showErrors;
            const errors = field.enhancer.validate(true, { force });
            if (Object.keys(errors).length > 0) {
                isValid = false;
            }
        });

        return isValid;
    };

    /**
     * Bind click handlers for navigation buttons and progress indicators
     */
    let bindNavigationEvents = function () {
        bindStepNavigationButtons();
        bindProgressBarNavigation();
    };

    /**
     * Bind handlers for next/previous step buttons
     */
    let bindStepNavigationButtons = function() {
        let moreButtons = document.querySelectorAll('[data-powermail-morestep-show]');

        for (let i = 0; i < moreButtons.length; i++) {
            moreButtons[i].addEventListener('click', function (event) {
                event.preventDefault();
                handleStepNavigation(event.currentTarget);
            });
        }
    };

    /**
     * Bind handlers for progress bar buttons
     */
    let bindProgressBarNavigation = function() {
        let progressNavs = document.querySelectorAll('nav.Progress');
        for (let pi = 0; pi < progressNavs.length; pi++) {
            let progressButtons = progressNavs[pi].querySelectorAll('.Progress__button');
            for (let j = 0; j < progressButtons.length; j++) {
                progressButtons[j].addEventListener('click', function(event) {
                    event.preventDefault();
                    handleProgressNavigation(event.currentTarget, progressButtons);
                });
            }
        }
    };

    /**
     * Handle step navigation via next/previous buttons
     * @param {HTMLElement} button
     */
    let handleStepNavigation = function(button) {
        let form = button.closest('form');
        if (!form) return false;

        let currentIndex = getActivePageIndex(form);
        let targetIndex = parseInt(button.getAttribute('data-powermail-morestep-show'), 10);

        // Backward navigation: always allowed
        if (targetIndex < currentIndex) {
            that.showFieldset(targetIndex, form);
            return false;
        }

        // Forward navigation: requires validation
        if (targetIndex > currentIndex) {
            if (attemptForwardNavigation(form, currentIndex, targetIndex)) {
                that.showFieldset(targetIndex, form);
            }
        }
    };

    /**
     * Handle navigation via progress bar buttons
     * @param {HTMLElement} button
     * @param {NodeList} allButtons
     */
    let handleProgressNavigation = function(button, allButtons) {
        let form = button.closest('form');
        let targetIndex = Array.from(allButtons).indexOf(button);
        let validUntil = getValidUntil(form);
        let currentIndex = getActivePageIndex(form);

        // Allow navigating to any validated step and the immediate next one
        if (targetIndex > validUntil + 1) return false;

        // Validate current step if moving forward to an unvalidated step
        if (targetIndex > currentIndex && targetIndex > validUntil) {
            markStepAsDirty(form, currentIndex);

            if (!validateCurrentStep(form)) {
                showErrorNavigation(form);
                return false;
            } else {
                setValidUntil(form, currentIndex);
            }
        }

        that.showFieldset(targetIndex, form);
    };

    /**
     * Attempt forward navigation with validation
     * @param {HTMLFormElement} form
     * @param {number} currentIndex
     * @param {number} targetIndex
     * @returns {boolean}
     */
    let attemptForwardNavigation = function(form, currentIndex, targetIndex) {
        markStepAsDirty(form, currentIndex);
        const isValid = validateCurrentStep(form, { showErrors: true });

        if (!isValid) {
            showErrorNavigation(form);
            return false;
        }

        // Mark everything up to the step before the target as validated
        let newValidUntil = Math.max(targetIndex - 1, getValidUntil(form));
        setValidUntil(form, newValidUntil);
        hideErrorNavigation(form);
        return true;
    };

    /**
     * Mark a step as touched (not pristine) to trigger live validation
     * @param {HTMLFormElement} form
     * @param {number} stepIndex
     */
    let markStepAsDirty = function(form, stepIndex) {
        if (Array.isArray(form._stepPristine)) {
            form._stepPristine[stepIndex] = false;

            const fieldset = getAllFieldsetsOfForm(form)[stepIndex];
            fieldset.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.enhancer?.setPristine) {
                    el.enhancer.setPristine(false);
                }
            });
        }
    };

    /**
     * Hide all fieldsets of a form
     * @param {HTMLFormElement} form
     */
    let hideAllFieldsets = function(form) {
        let fieldsets = getAllFieldsetsOfForm(form);
        for (let i = 0; i < fieldsets.length; i++) {
            Utility.hideElement(fieldsets[i]);
        }
    };

    /**
     * Show the fieldset at the given index
     * @param {HTMLFormElement} form
     * @param {number} index
     */
    let showFieldsetAtIndex = function(form, index) {
        let fieldsets = getAllFieldsetsOfForm(form);
        Utility.showElement(fieldsets[index]);
    };

    /**
     * Update navigation and progress indicators
     * @param {HTMLFormElement} form
     * @param {number} activeIndex
     */
    let updateNavigationState = function(form, activeIndex) {
        // Derive a safe 'validUntil': everything before activeIndex must be complete
        const persisted = getValidUntil(form);
        const derived = Math.max(activeIndex - 1, -1);
        const effective = Math.max(persisted, derived);
        updateButtonStatus(form, activeIndex, effective);
    };

    /**
     * Reset pristine state for a step
     * @param {HTMLFormElement} form
     * @param {number} stepIndex
     */
    let resetPristineStateForStep = function(form, stepIndex) {
        if (Array.isArray(form._stepPristine) && form._stepPristine[stepIndex]) {
            const fieldset = getAllFieldsetsOfForm(form)[stepIndex];
            fieldset.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.enhancer?.setPristine) {
                    el.enhancer.setPristine(true);
                }
            });
        }
    };

    /**
     * Show error navigation UI
     * @param {HTMLFormElement} form
     */
    let showErrorNavigation = function(form) {
        if (form.enhancer?.errorNavigation) {
            form.enhancer.errorNavigation.removeAttribute('hidden');
            form.enhancer.errorNavigation.classList.add('Form__error-navigation--visible');
            form.enhancer.errorNavigation.focus();
        }
    };

    /**
     * Hide error navigation UI
     * @param {HTMLFormElement} form
     */
    let hideErrorNavigation = function(form) {
        if (form.enhancer?.errorNavigation) {
            form.enhancer.errorNavigation.setAttribute('hidden', 'hidden');
            form.enhancer.errorNavigation.classList.remove('Form__error-navigation--visible');
        }
    };

    /**
     * Get index of the currently visible fieldset
     * @param {HTMLFormElement} form
     * @returns {number}
     */
    let getActivePageIndex = function(form) {
        if (typeof form._activeStep === 'number') return form._activeStep;

        const fieldsets = getAllFieldsetsOfForm(form);
        for (let i = 0; i < fieldsets.length; i++) {
            const fs = fieldsets[i];
            const isHidden = fs.hasAttribute('hidden') || fs.style.display === 'none';
            if (!isHidden) return i;
        }
        return 0;
    };

    /**
     * Get all fieldsets within a form
     * @param {HTMLFormElement} form
     * @returns {NodeList}
     */
    let getAllFieldsetsOfForm = function(form) {
        return form.querySelectorAll('.' + fieldsetClass);
    };

    /**
     * Update visual state of navigation buttons and indicators
     * @param {HTMLFormElement} form
     * @param {number} activeIndex
     * @param {number} validUntil
     */
    let updateButtonStatus = function(form, activeIndex, validUntil) {
        const safeValidUntil = typeof validUntil === 'number' ? validUntil : -1;

        // Iterate per progress nav to keep indices aligned with steps
        const navs = form.querySelectorAll('nav.Progress');
        navs.forEach(nav => {
            const buttons = nav.querySelectorAll('.Progress__button[data-powermail-morestep-current]');
            buttons.forEach((button) => {
                const idx = parseInt(button.dataset.powermailMorestepCurrent, 10);
                if (Number.isNaN(idx)) return;

                const state = determineButtonState(idx, activeIndex, safeValidUntil);
                applyButtonState(button, state);
            });
        });
    };

    /**
     * Determine state for a navigation button
     * @param {number} buttonIndex
     * @param {number} activeIndex
     * @param {number} validUntil
     * @returns {Object}
     */
    let determineButtonState = function(buttonIndex, activeIndex, validUntil) {
        if (buttonIndex === activeIndex) {
            return {
                type: 'active',
                ariaAttributes: { 'aria-current': 'page' },
                progressStepClass: 'ProgressStep--active',
                progressItemClass: 'Progress__item--sibling-active'
            };
        }

        if (buttonIndex <= validUntil) {
            return {
                type: 'complete',
                ariaAttributes: {},
                progressStepClass: 'ProgressStep--complete',
                progressItemClass: 'Progress__item--sibling-complete',
                useSuccessLabel: true
            };
        }

        return {
            type: 'incomplete',
            ariaAttributes: {},
            progressStepClass: 'ProgressStep--incomplete',
            progressItemClass: 'Progress__item--sibling-incomplete'
        };
    };

    /**
     * Apply a given state to a navigation button
     *
     * - Resets lingering attributes/classes
     * - Sets ARIA attributes and text
     * - Updates ProgressStep + Progress__item classes
     *
     * @param {HTMLElement} button
     * @param {Object} state
     */
    let applyButtonState = function(button, state) {
        resetButtonState(button);

        // Apply ARIA attributes
        Object.entries(state.ariaAttributes).forEach(([attr, value]) => {
            button.setAttribute(attr, value);
        });

        updateButtonText(button, state.useSuccessLabel);
        updateProgressStep(button, state.progressStepClass);
        updateProgressItem(button, state.progressItemClass);
    };

    /**
     * Update list item of a progress button
     * @param {HTMLElement} button
     * @param {string} className
     */
    let updateProgressItem = function(button, className) {
        const li = button.closest('.Progress__item');
        if (!li) return;

        const allClasses = [
            'Progress__item--sibling-complete',
            'Progress__item--sibling-active',
            'Progress__item--sibling-incomplete'
        ];
        allClasses.forEach(c => li.classList.remove(c));
        li.classList.add(className);
    };

    /**
     * Reset a navigation button to default state
     * @param {HTMLElement} button
     */
    let resetButtonState = function(button) {
        const attributesToRemove = ['disabled', 'aria-disabled', 'aria-current'];
        attributesToRemove.forEach(attr => {
            button.removeAttribute(attr);
        });

        // Defensive cleanup: remove legacy state classes
        button.classList.remove('is-active', 'is-disabled', 'is-valid');
    };

    /**
     * Update button text depending on its state
     * @param {HTMLElement} button
     * @param {boolean} useSuccessLabel
     */
    let updateButtonText = function(button, useSuccessLabel) {
        const baseLabel = button.dataset.powermailDefaultLabel || button.textContent.trim();
        const successLabel = button.dataset.powermailMorestepSuccess || '';

        button.textContent = useSuccessLabel && successLabel
            ? `${baseLabel} ${successLabel}`
            : baseLabel;
    };

    /**
     * Update CSS classes for the surrounding progress step
     * @param {HTMLElement} button
     * @param {string} className
     */
    let updateProgressStep = function(button, className) {
        const progressStep = button.closest('.ProgressStep');
        if (!progressStep) return;

        const progressClasses = [
            'ProgressStep--active',
            'ProgressStep--complete',
            'ProgressStep--incomplete',
            'ProgressStep--next'
        ];
        progressClasses.forEach(cls => progressStep.classList.remove(cls));
        progressStep.classList.add(className);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWhenReady);
    } else {
        initializeWhenReady();
    }
    function initializeWhenReady() {
        setTimeout(function() {
            const moreStepForm = new MoreStepForm();
            moreStepForm.initialize();
        }, 10);
    }
});
