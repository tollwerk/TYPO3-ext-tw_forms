import Utility from './Utility';

export default function MoreStepForm() {
  'use strict';

  let formClass = 'powermail_morestep';

  let fieldsetClass = 'powermail_fieldset';

  let buttonActiveClass = 'btn-primary';

  let that = this;

  this.initialize = function() {
    showListener();
    initializeForms();
  };

  this.showFieldset = function(index, form) {
    if (form.classList.contains(formClass)) {
      hideAllFieldsets(form);
      let fieldsets = getAllFieldsetsOfForm(form);
      Utility.showElement(fieldsets[index]);
      updateButtonStatus(form);
    }
  };

  /**
   * Helper function to check if a field is currently visible
   * @param {HTMLElement} field - The field element to check
   * @returns {boolean}
   */
  const isFieldVisible = function(field) {
    if (field.style.display === 'none' || field.hasAttribute('hidden')) {
      return false;
    }

    let parent = field.parentElement;
    while (parent && parent !== document.body) {
      if (parent.style.display === 'none' ||
          parent.hasAttribute('hidden') ||
          parent.classList.contains('hidden')) {
        return false;
      }

      if (parent.classList.contains('powermail_fieldset') &&
          parent.style.display === 'none') {
        return false;
      }

      parent = parent.parentElement;
    }

    return true;
  };


  let initializeForms = function() {
    let moreStepForms = document.querySelectorAll('form.' + formClass);
    for (let i = 0; i < moreStepForms.length; i++) {
      initializeForm(moreStepForms[i]);
    }
  };

  let initializeForm = function(form) {
    that.showFieldset(0, form);
  };

  let showListener = function () {
    let moreButtons = document.querySelectorAll('[data-powermail-morestep-show]');
    for (let i = 0; i < moreButtons.length; i++) {
      moreButtons[i].addEventListener('click', function (event) {
        event.preventDefault();

        let form = event.target.closest('form');
        let currentIndex = getActivePageIndex(form);
        let nextIndex = parseInt(event.target.getAttribute('data-powermail-morestep-show'), 10);

        if (nextIndex > currentIndex) {
          // Nur prüfen, wenn man vorwärts geht
          const visibleFields = Array.from(form.elements).filter((el) =>
              isFieldVisible(el) && el.enhancer
          );

          let isValid = true;
          visibleFields.forEach((field) => {
            const errors = field.enhancer.validate(true);
            if (Object.keys(errors).length > 0) {
              isValid = false;
            }
          });

          if (!isValid) {
            // Fehlernavigation sichtbar machen, wenn nötig
            if (form.enhancer && form.enhancer.errorNavigation) {
              form.enhancer.errorNavigation.removeAttribute('hidden');
              form.enhancer.errorNavigation.focus();
            }
            return false;
          }
        }

        that.showFieldset(nextIndex, form);
      });
    }
  };


  let hideAllFieldsets = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      Utility.hideElement(fieldsets[i]);
    }
  };

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
   *
   * @param form
   * @returns {number}
   */
  let getActivePageIndex = function(form) {
    let fieldsets = getAllFieldsetsOfForm(form);
    for (let i = 0; i < fieldsets.length; i++) {
      if (fieldsets[i].style.display !== 'none') {
        return i;
      }
    }
  }

  let getAllFieldsetsOfForm = function(form) {
    return form.querySelectorAll('.' + fieldsetClass);
  };
}

const moreStepForm = new MoreStepForm();
moreStepForm.initialize();
