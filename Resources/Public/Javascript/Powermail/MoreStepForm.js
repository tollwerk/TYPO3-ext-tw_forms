import Utility from './Utility';

/**
 * Multi-step form handler that manages navigation between fieldsets
 * and validates fields before allowing forward navigation
 */

export default function MoreStepForm() {
  'use strict';

  // CSS class names for form elements
  let formClass = 'powermail_morestep';
  let fieldsetClass = 'powermail_fieldset';
  let buttonActiveClass = 'btn-primary';

  let that = this;

  /**
   * Initialize the multi-step form functionality
   */
  this.initialize = function() {
    showListener();
    initializeForms();
  };

  /**
   * Show a specific fieldset by index and hide all others
   * @param {number} index - The index of the fieldset to show
   * @param {HTMLElement} form - The form element containing the fieldsets
   */
  this.showFieldset = function(index, form) {
    if (form.classList.contains(formClass)) {
      hideAllFieldsets(form);
      let fieldsets = getAllFieldsetsOfForm(form);
      Utility.showElement(fieldsets[index]);
      updateButtonStatus(form);
    }
  };

  /**
   * Initialize all multi-step forms found on the page
   */
  let initializeForms = function() {
    let moreStepForms = document.querySelectorAll('form.' + formClass);
    for (let i = 0; i < moreStepForms.length; i++) {
      initializeForm(moreStepForms[i]);
    }
  };

  /**
   * Initialize a single form by showing the first fieldset
   * @param {HTMLElement} form - The form element to initialize
   */
  let initializeForm = function(form) {
    that.showFieldset(0, form);
  };

  /**
   * Add event listeners to all navigation buttons
   */
  let showListener = function () {
    let moreButtons = document.querySelectorAll('[data-powermail-morestep-show]');
    for (let i = 0; i < moreButtons.length; i++) {
      moreButtons[i].addEventListener('click', function (event) {
        event.preventDefault();

        let form = event.target.closest('form');
        let currentIndex = getActivePageIndex(form);
        let nextIndex = parseInt(event.target.getAttribute('data-powermail-morestep-show'), 10);

        // Only validate when moving forward through the form
        if (nextIndex > currentIndex) {
          // Get all visible fields that have an enhancer (validation)
          const visibleFields = Array.from(form.elements).filter((el) =>
              window.isFieldVisible(el) && el.enhancer
          );

          let isValid = true;
          // Validate all visible fields
          visibleFields.forEach((field) => {
            const errors = field.enhancer.validate(true);
            if (Object.keys(errors).length > 0) {
              isValid = false;
            }
          });

          // If validation fails, show error navigation and stop
          if (!isValid) {
            // Make error navigation visible if it exists
            if (form.enhancer && form.enhancer.errorNavigation) {
              form.enhancer.errorNavigation.removeAttribute('hidden');
              form.enhancer.errorNavigation.focus();
            }
            return false;
          }
        }

        // Navigate to the requested fieldset
        that.showFieldset(nextIndex, form);
      });
    }
  };

  /**
   * Hide all fieldsets in the given form
   * @param {HTMLElement} form - The form containing the fieldsets
   */
  let hideAllFieldsets = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      Utility.hideElement(fieldsets[i]);
    }
  };

  /**
   * Update the visual status of navigation buttons
   * Adds active class to the current step button
   * @param {HTMLElement} form - The form containing the buttons
   */
  let updateButtonStatus = function(form) {
    let buttons = form.querySelectorAll('[data-powermail-morestep-current]');
    let activePageIndex = getActivePageIndex(form);
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove(buttonActiveClass);
      if (i === activePageIndex) {
        buttons[i].classList.add(buttonActiveClass);
      }
    }
  };

  /**
   * Get index of current visible fieldset
   * @param {HTMLElement} form - The form to check
   * @returns {number} The index of the currently visible fieldset
   */
  let getActivePageIndex = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      if (fieldsets[i].style.display !== 'none') {
        return i;
      }
    }
  }

  /**
   * Get all fieldsets within a form
   * @param {HTMLElement} form - The form to search in
   * @returns {NodeList} All fieldsets found in the form
   */
  let getAllFieldsetsOfForm = function(form) {
    return form.querySelectorAll('.' + fieldsetClass);
  };
}

// Initialize the multi-step form functionality
const moreStepForm = new MoreStepForm();
moreStepForm.initialize();
