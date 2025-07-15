/**
 * Helper function to check if a field is currently visible
 * @param {HTMLElement} field - The field element to check
 * @returns {boolean}
 */
window.isFieldVisible = function(field) {
    // Check if field itself is hidden
    if (field.style.display === 'none' || field.hasAttribute('hidden')) return false;

    // Traverse up the DOM tree to check parent visibility
    let parent = field.parentElement;
    while (parent && parent !== document.body) {
        if (parent.style.display === 'none' ||
            parent.hasAttribute('hidden') ||
            parent.classList.contains('hidden')) return false;


        // Special check for powermail fieldsets
        if (parent.classList.contains('powermail_fieldset') &&
            parent.style.display === 'none') return false;

        parent = parent.parentElement;
    }

    return true;
};
