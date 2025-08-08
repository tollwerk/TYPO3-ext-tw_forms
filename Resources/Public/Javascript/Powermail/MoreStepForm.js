import Utility from './Utility/Utility';

/**
 * Multi-step form handler that manages navigation between fieldsets,
 * validates fields before allowing forward navigation,
 * and visually updates progress navigation (status, tick, disable)
 *
 * Patched: Each step keeps its own pristine-flag (no error hints in new step
 * until "Next" has been tried at least once inside it).
 */
export default function MoreStepForm() {
  'use strict';

  // CSS class constants for form identification and styling
  let formClass = 'powermail_morestep';
  let fieldsetClass = 'powermail_fieldset';
  let buttonActiveClass = 'is-active';
  let buttonValidClass = 'is-valid';
  let buttonDisabledClass = 'is-disabled';

  // WeakMap to track validation progress for each form instance (index of last valid step)
  const formValidUntilMap = new WeakMap();
  let that = this;

  /**
   * Initialize the multi-step form functionality
   * Sets up event listeners and initializes all forms on the page
   */
  this.initialize = function() {
    // Initialize pristine-step flags for all multistep forms
    document.querySelectorAll('form.' + formClass).forEach(form => {
      const fieldsets = form.querySelectorAll('.' + fieldsetClass);
      // Pristine array, one value per step: true = untouched, false = ready for validation
      form._stepPristine = Array(fieldsets.length).fill(true);
    });

    showListener();
    initializeForms();
  };

  /**
   * Display a specific fieldset and update navigation state
   * @param {number} index - Index of the fieldset to show
   * @param {HTMLFormElement} form - The form element containing the fieldsets
   */
  this.showFieldset = function(index, form) {
    if (form.classList.contains(formClass)) {
      hideAllFieldsets(form);
      let fieldsets = getAllFieldsetsOfForm(form);
      Utility.showElement(fieldsets[index]);
      updateButtonStatus(form, index, formValidUntilMap.get(form) || -1);

      // Hide error navigation when switching steps to avoid confusion
      if (form.enhancer && form.enhancer.errorNavigation) {
        form.enhancer.errorNavigation.setAttribute('hidden', 'hidden');
        form.enhancer.errorNavigation.classList.remove('Form__error-navigation--visible');
      }

      const currentIndex = index;
      if (Array.isArray(form._stepPristine) && form._stepPristine[currentIndex]) {
        const fieldset = getAllFieldsetsOfForm(form)[currentIndex];
        fieldset.querySelectorAll('input, select, textarea').forEach(el => {
          if (el.enhancer && typeof el.enhancer.setPristine === 'function') {
            el.enhancer.setPristine(true); // korrekt!
          }
        });
      }
    }
  };

  /**
   * Initialize all multi-step forms found on the page
   * Searches for forms with the specified class and initializes each one
   */
  let initializeForms = function() {
    let moreStepForms = document.querySelectorAll('form.' + formClass);
    for (let i = 0; i < moreStepForms.length; i++) {
      initializeForm(moreStepForms[i]);
    }
  };

  /**
   * Initialize a single form instance
   * Sets initial validation state and shows the first fieldset
   * @param {HTMLFormElement} form - The form to initialize
   */
  let initializeForm = function(form) {
    formValidUntilMap.set(form, -1); // -1 means no steps validated yet
    that.showFieldset(0, form);
    // pristine flags array is already set in this.initialize()
  };

  /**
   * Validate all visible fields in the current step
   * @param {HTMLFormElement} form - The form to validate
   * @returns {boolean} True if all fields are valid, false otherwise
   */
  let validateCurrentStep = function(form, { showErrors = true } = {}) {
    if (typeof window.isFieldVisible !== 'function') return true;

    const visibleFields = Array.from(form.elements).filter((el) =>
        window.isFieldVisible(el) && el.enhancer
    );

    let isValid = true;
    visibleFields.forEach((field) => {
      // Only force validation if showErrors or field is not pristine
      const force = !field.enhancer.pristine || showErrors;
      const errors = field.enhancer.validate(true, { force });
      if (Object.keys(errors).length > 0) {
        isValid = false;
      }
    });

    return isValid;
  };



  /**
   * Set up event listeners for navigation buttons and progress indicators
   * Handles both step navigation buttons and progress bar clicks
   */
  let showListener = function () {
    // Handle step navigation buttons (Next/Previous)
    // Bind to generic data-powermail-morestep-show so both next and previous work
    let moreButtons = document.querySelectorAll('[data-powermail-morestep-show]');

    for (let i = 0; i < moreButtons.length; i++) {
      moreButtons[i].addEventListener('click', function (event) {
        event.preventDefault();
        let form = event.target.closest('form');
        if (!form) { return false; }
        let currentIndex = getActivePageIndex(form);
        let nextIndex = parseInt(event.target.getAttribute('data-powermail-morestep-show'), 10);

        // Backward navigation: always allowed without validation
        if (nextIndex < currentIndex) {
          that.showFieldset(nextIndex, form);
          const validUntil = formValidUntilMap.get(form) || -1;
          updateButtonStatus(form, nextIndex, validUntil);
          return false;
        }

        // Only validate when moving forward through the form
        if (nextIndex > currentIndex) {
          // Zuerst prüfen, ob valid
          const isValid = (() => {
            if (Array.isArray(form._stepPristine)) {
              form._stepPristine[currentIndex] = false;
              const fieldset = getAllFieldsetsOfForm(form)[currentIndex];
              fieldset.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.enhancer?.setPristine) {
                  el.enhancer.setPristine(false);
                }
              });
            }
            return validateCurrentStep(form, { showErrors: true });
          })();

          if (!isValid) {
            // Jetzt pristine auf false setzen → aktiviert Live-Validierung
            if (Array.isArray(form._stepPristine)) {
              form._stepPristine[currentIndex] = false;

              const fieldset = getAllFieldsetsOfForm(form)[currentIndex];
              fieldset.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.enhancer && typeof el.enhancer.setPristine === 'function') {
                  el.enhancer.setPristine(false);
                }
              });
            }

            // Fehlernavigation einblenden
            if (form.enhancer && form.enhancer.errorNavigation) {
              form.enhancer.errorNavigation.removeAttribute('hidden');
              form.enhancer.errorNavigation.classList.add('Form__error-navigation--visible');
              form.enhancer.errorNavigation.focus();
            }

            return false;
          }

          // Wenn alles ok → Step-Wechsel
          let newValidUntil = Math.max(currentIndex, formValidUntilMap.get(form) || -1);
          formValidUntilMap.set(form, newValidUntil);
          that.showFieldset(nextIndex, form);
          updateButtonStatus(form, nextIndex, newValidUntil);

          // Fehlernavigation ausblenden
          if (form.enhancer && form.enhancer.errorNavigation) {
            form.enhancer.errorNavigation.setAttribute('hidden', 'hidden');
            form.enhancer.errorNavigation.classList.remove('Form__error-navigation--visible');
          }
        }
      });
    }

    // Handle progress bar navigation (clicking on progress indicators)
    let progressNavs = document.querySelectorAll('nav.Progress');
    for (let pi = 0; pi < progressNavs.length; pi++) {
      let progressButtons = progressNavs[pi].querySelectorAll('.Progress__button');
      for (let j = 0; j < progressButtons.length; j++) {
        progressButtons[j].addEventListener('click', function(event) {
          event.preventDefault();
          let form = event.target.closest('form');
          let index = Array.from(progressButtons).indexOf(event.target);
          let validUntil = formValidUntilMap.get(form) || -1;
          let currentIndex = getActivePageIndex(form);

          // Only allow navigation to validate steps or the next immediate step
          if (index > validUntil) return false;

          // If moving forward to an unvalidated step, validate current step first
          if (index > currentIndex && index > validUntil) {
            // Mark the current step as dirty
            if (Array.isArray(form._stepPristine)) {
              form._stepPristine[currentIndex] = false;
            }

            if (!validateCurrentStep(form)) {
              if (form.enhancer && form.enhancer.errorNavigation) {
                form.enhancer.errorNavigation.removeAttribute('hidden');
                form.enhancer.errorNavigation.classList.add('Form__error-navigation--visible');
                form.enhancer.errorNavigation.focus();
              }
              return false;
            } else {
              // Update validation progress - this step is now validated
              formValidUntilMap.set(form, currentIndex);
            }
          }

          // Navigation successful - show fieldset
          that.showFieldset(index, form);
        });
      }
    }
  };

  /**
   * Hide all fieldsets in the given form
   * @param {HTMLFormElement} form - The form whose fieldsets should be hidden
   */
  let hideAllFieldsets = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      Utility.hideElement(fieldsets[i]);
    }
  };

  /**
   * Get the index of the currently active/visible fieldset
   * @param {HTMLFormElement} form - The form to check
   * @returns {number} Index of the active fieldset, or 0 if none found
   */
  let getActivePageIndex = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      if (fieldsets[i].style.display !== 'none') { return i; }
    }
    return 0;
  }

  /**
   * Get all fieldsets belonging to a specific form
   * @param {HTMLFormElement} form - The form to search within
   * @returns {NodeList} All fieldsets with the specified class
   */
  let getAllFieldsetsOfForm = function(form) {
    return form.querySelectorAll('.' + fieldsetClass);
  };

  /**
   * Update the visual state of navigation buttons based on current step and validation progress
   * @param {HTMLFormElement} form - The form containing the buttons
   * @param {number} activeIdx - Index of the currently active step
   * @param {number} validUntil - Highest step index that has been validated
   */
  let updateButtonStatus = function(form, activeIdx, validUntil) {
    let buttons = form.querySelectorAll('.Progress__button, [data-powermail-morestep-current]');
    validUntil = typeof validUntil === 'number' ? validUntil : -1;

    for (let i = 0; i < buttons.length; i++) {
      // Reset classes and ARIA
      buttons[i].classList.remove(buttonActiveClass, buttonValidClass, buttonDisabledClass, 'is-next');
      buttons[i].removeAttribute('disabled');
      buttons[i].removeAttribute('aria-disabled');
      buttons[i].removeAttribute('aria-current');

      let baseLabel = buttons[i].dataset.powermailDefaultLabel || buttons[i].textContent.trim();
      let successLabel = buttons[i].dataset.powermailMorestepSuccess || '';
      let progressStep = buttons[i].closest('.ProgressStep');

      // Reset ProgressStep state classes
      progressStep.classList.remove('ProgressStep--complete', 'ProgressStep--incomplete', 'ProgressStep--next');

      // Determine state based on active index and validation progress
      if (i === activeIdx) {
        // Active step
        buttons[i].classList.add(buttonActiveClass);
        buttons[i].textContent = baseLabel;
        buttons[i].setAttribute('aria-current', 'step');
        progressStep.classList.add('ProgressStep--incomplete');
      } else if (i <= validUntil) {
        // Completed/validated step
        buttons[i].classList.add(buttonValidClass);
        buttons[i].textContent = successLabel ? `${baseLabel} ${successLabel}` : baseLabel;
        progressStep.classList.add('ProgressStep--complete');
      } else if (i === activeIdx + 1) {
        // Immediate next step (not yet validated) – visually distinguishable but disabled
        buttons[i].classList.add('is-next');
        buttons[i].setAttribute('disabled', 'disabled');
        buttons[i].setAttribute('aria-disabled', 'true');
        buttons[i].textContent = baseLabel;
        progressStep.classList.add('ProgressStep--next');
      } else {
        // Future steps beyond the next – disabled
        buttons[i].classList.add(buttonDisabledClass);
        buttons[i].setAttribute('disabled', 'disabled');
        buttons[i].setAttribute('aria-disabled', 'true');
        buttons[i].textContent = baseLabel;
        progressStep.classList.add('ProgressStep--incomplete');
      }
    }
  };
}

// --- No change needed in DOMContentLoaded init logic ---
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
