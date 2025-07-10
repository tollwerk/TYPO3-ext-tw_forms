/**
 * Form
 */
(function formValidation(w, d) {
  /**
   * Handles clicks on error links in the summary.
   * Focuses the corresponding field.
   * @param {Event} e Click event
   */
  const errorLinkHandler = function errorLinkHandler(e) {
    e.preventDefault();
    this.fields[e.target.href.split("#").pop()].focus();
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
    this.element.enhancer = this; // Reference for external access
    this.element.setAttribute("novalidate", "novalidate"); // Disable native browser validation
    this.element.addEventListener("submit", this.validate.bind(this)); // Custom validation on submit
    this.errorNavigation = null;
    this.fields = {};

    // Collect all primary fields with an enhancer
    for (let e = 0; e < this.element.elements.length; ++e) {
      const elementId = this.element.elements[e].id;
      if (elementId && this.element.elements[e].enhancer) {
        // Only primary fields, not group children
        if (
          !this.element.elements[e].enhancer.isGroup ||
          !this.element.elements[e].enhancer.groupPrimaryEnhancer
        ) {
          this.fields[elementId] = this.element.elements[e].enhancer;
        }
      }
    }
    // Initialize error summary if present
    this.initializeErrorSummary(
      this.element.querySelector(".Form__error-summary")
    );
  }

  /**
   * Initialize error summary and attach click handlers to error links.
   *
   * @param {Element} summary Error summary element
   */
  FormValidation.prototype.initializeErrorSummary =
    function initializeErrorSummary(summary) {
      this.errorSummary = summary;
      if (this.errorSummary) {
        this.errorNavigation = this.errorSummary.closest(
          ".Form__error-navigation"
        );
        // Attach click handler to each error link
        this.errorSummary
          .querySelectorAll("a.Form__error-link")
          .forEach((l) => {
            const href = l.href.split("#");
            if (href.length === 2 && href[1] in this.fields) {
              l.addEventListener("click", errorLinkHandler.bind(this));
            }
          });
      }
    };

  /**
   * Validate all fields before form submission.
   * Show error summary and prevent submission if there are errors.
   *
   * @param {Event} e Submit event
   */
  FormValidation.prototype.validate = function validate(e) {
    const novalidate =
      e && e.submitter && e.submitter.hasAttribute("formnovalidate");

    if (!novalidate) {
      const errorMessages = {};
      // Validate each field and collect errors
      for (const f in this.fields) {
        if (Object.prototype.hasOwnProperty.call(this.fields, f)) {
          const fieldErrors = this.fields[f].validate(true, null);
          if (Object.keys(fieldErrors).length > 0) {
            errorMessages[f] = fieldErrors;
          }
        }
      }
      // If there are errors, update summary and prevent submission
      if (!this.updateErrorSummary(errorMessages)) {
        this.errorNavigation.removeAttribute("hidden");
        if (e) {
          this.errorNavigation.focus();
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return false;
      }
    }

    // Hide error navigation if no errors
    this.errorNavigation.setAttribute("hidden", "hidden");
  };

  /**
   * Re-validate and update error summary (e.g. after field changes).
   */
  FormValidation.prototype.update = function update() {
    this.validate(null);
  };

  /**
   * Update the error summary UI.
   *
   * @param {object} errorMessages Error messages by field
   * @return {boolean} True if no errors (form is valid)
   */
  FormValidation.prototype.updateErrorSummary = function updateErrorSummary(
    errorMessages
  ) {
    let errorCount = 0;

    // Remove all current error messages from summary
    while (this.errorSummary.childNodes.length) {
      this.errorSummary.removeChild(this.errorSummary.firstChild);
    }

    // Add each error as a link in the summary
    for (const f in errorMessages) {
      if (Object.prototype.hasOwnProperty.call(errorMessages, f)) {
        errorCount += 1;
        const errorLink = d.createElement("a");
        errorLink.className = "Form__error-link";
        errorLink.href = `#${f}`;

        // Combine unique messages for this field
        const uniqueMessages = [...new Set(Object.values(errorMessages[f]))];
        errorLink.textContent = uniqueMessages.join("; ");

        errorLink.addEventListener("click", errorLinkHandler.bind(this));
        const errorListItem = d.createElement("li");
        errorListItem.className = "Form__error-description";
        errorListItem.appendChild(errorLink);
        this.errorSummary.appendChild(errorListItem);
      }
    }

    // Update the summary heading based on error count
    const summaryHeading = this.errorNavigation.querySelector(".Heading");
    if (summaryHeading) {
      const templateAttribute = `data-heading-${
        errorCount === 1 ? "single" : "multiple"
      }`;
      summaryHeading.textContent = summaryHeading
        .getAttribute(templateAttribute)
        .split("%s")
        .join(errorCount);
    }

    // Update the page title to reflect error state
    let title = this.errorNavigation.getAttribute("data-title");
    if (errorCount) {
      title = this.errorNavigation
        .getAttribute("data-title-errors")
        .format(errorCount, title);
    }
    document.title = title;
    return !errorCount;
  };

  // Auto-initialize for all forms with custom validation class on DOM ready
  d.addEventListener("DOMContentLoaded", () => {
    d.querySelectorAll("form.Form--custom-validation").forEach(
      (f) => new FormValidation(f)
    );
  });
})(typeof global !== "undefined" ? global : window, document);
