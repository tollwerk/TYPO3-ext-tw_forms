/**
 * Debug helper for the browser's native constraint validation
 * Logs the `invalid` events the browser fires when a form submission is
 * blocked because one or more fields don't satisfy their constraints
 */
(function nativeValidationDebug(window, document) {

    /**
     * Log a native `invalid` event and the state of the field that caused it
     *
     * @param {Event} event Invalid event fired by the browser
     */
    const invalidHandler = function invalidHandler(event) {
        const field = event.target;

        // Collect the constraint flags that are currently violated
        const violated = [];
        for (const flag in field.validity) {
            if (flag !== 'valid' && field.validity[flag]) {
                violated.push(flag);
            }
        }

        console.debug('[tw-forms] native validation failed', {
            event: event,
            type: event.type,
            field: field,
            name: field.name,
            id: field.id,
            value: field.value,
            validity: field.validity,
            violated: violated,
            validationMessage: field.validationMessage,
            form: field.form
        });
    };

    // `invalid` doesn't bubble, so listen during the capture phase on the document
    document.addEventListener('invalid', invalidHandler, true);

})(window, document);
