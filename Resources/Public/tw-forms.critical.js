/**
 * Polyfills
 */
(function iefe(w, e, s, svg) {
    // NodeList.forEach
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function foreEach(callback, thisArg) {
            for (let i = 0; i < this.length; ++i) {
                callback.call(thisArg || window, this[i], i, this);
            }
        };
    }

    // Element.matches
    if (!e.matches) {
        e.matches = e.matchesSelector
            || e.mozMatchesSelector
            || e.msMatchesSelector
            || e.oMatchesSelector
            || e.webkitMatchesSelector
            || ((str) => {
                const matches = (this.document || this.ownerDocument).querySelectorAll(str);
                let i = matches.length - 1;
                while ((i >= 0) && (matches.item(i) !== this)) {
                    i -= 1;
                }
                return i > -1;
            });
    }

    // Element.closest
    if (!e.closest) {
        e.closest = function closest(str) {
            let el = this;
            do {
                if (el.matches(str)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }

    // String.format
    if (!s.format) {
        s.format = function format(...args) {
            return this.replace(
                /{(\d+)}/g,
                (match, number) => (typeof args[number] !== 'undefined' ? args[number] : match)
            );
        };
    }

    // classList support for IE11
    if (!('classList' in svg)) {
        Object.defineProperty(svg, 'classList', {
            get() {
                return {
                    contains: (className) => this.className.baseVal.split(' ').indexOf(className) !== -1,
                    add: (className) => this.setAttribute(
                        'class',
                        `${this.getAttribute('class')} ${className}`
                    ),
                    remove: (className) => {
                        const removedClass = this.getAttribute('class')
                            .replace(new RegExp(`(\\s|^)${className}(\\s|$)`, 'g'), '$2');
                        if (this.classList.contains(className)) {
                            this.setAttribute('class', removedClass);
                        }
                    }
                };
            }
        });
    }
}(window, Element.prototype, String.prototype, SVGElement.prototype));

/**
 * Observer
 */
const tw_forms = window.tw_forms || { has: {} };
window.tw_forms = tw_forms;

(function (w, d) {
    if (((typeof exports !== 'undefined') && exports.Observer) || w.tw_forms.Observer) {
        return;
    }

    function Observer() {
        this.observed = [['[data-mutate-recursive]', this.process.bind(this)]];
        const checkNode = this.checkNode.bind(this);
        const observer = new MutationObserver((mutations) => mutations
            .forEach((mutation) => Array.prototype.slice.call(mutation.addedNodes)
                .filter((node) => node.nodeType === 1).forEach(checkNode)));
        observer.observe(d.documentElement, {
            characterData: true, attributes: false, childList: true, subtree: true
        });
    }

    Observer.prototype.register = function (selectors, callback) {
        this.observed.push([selectors, callback]);
    };

    Observer.prototype.checkNode = function (node) {
        this.observed.filter((observer) => node.matches(observer[0]))
            .forEach((observer) => observer[1](node));
    };

    Observer.prototype.process = function (node) {
        if (node.nodeType === 1) {
            this.observed.forEach((observer) => node.querySelectorAll(observer[0])
                .forEach((subnode) => observer[1](subnode)));
        }
    };

    if (typeof exports !== 'undefined') {
        exports.Observer = new Observer();
    } else {
        w.tw_forms.Observer = new Observer();
    }
}(typeof global !== 'undefined' ? global : window, document));

/**
 * Powermail-Validatoren ZUSÄTZLICH zu deiner bestehenden Logik
 */
const PowermailValidators = {
    email: (field) => {
        if (!field.value) return false;
        if (field.type === 'email' || field.getAttribute('data-powermail-type') === 'email') {
            const pattern = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            return !pattern.test(field.value);
        }
        return false;
    },
    url: (field) => {
        if (!field.value) return false;
        if (field.type === 'url' || field.getAttribute('data-powermail-type') === 'url') {
            const pattern = new RegExp('^(https?:\\/\\/)?'+
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
                '((\\d{1,3}\\.){3}\\d{1,3}))'+
                '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*'+
                '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+
                '(\\#[-a-zA-Z\\d_]*)?$','i');
            return !pattern.test(field.value);
        }
        return false;
    },
    pattern: (field) => {
        if (!field.value) return false;
        const pattern = field.getAttribute('data-powermail-pattern') || field.getAttribute('pattern');
        if (pattern) {
            try {
                const regex = new RegExp(pattern);
                return !regex.test(field.value);
            } catch (e) { return false; }
        }
        return false;
    },
    number: (field) => {
        if (!field.value) return false;
        if (field.type === 'number' || field.getAttribute('data-powermail-type') === 'integer') {
            return isNaN(field.value);
        }
        return false;
    },
    minimum: (field) => {
        if (!field.value) return false;
        const min = field.getAttribute('min') || field.getAttribute('data-powermail-min');
        if (min !== null) {
            return parseFloat(field.value) < parseFloat(min);
        }
        return false;
    },
    maximum: (field) => {
        if (!field.value) return false;
        const max = field.getAttribute('max') || field.getAttribute('data-powermail-max');
        if (max !== null) {
            return parseFloat(field.value) > parseFloat(max);
        }
        return false;
    },
    length: (field) => {
        if (!field.value) return false;
        const lengthConfig = field.getAttribute('data-powermail-length');
        if (lengthConfig) {
            const [min, max] = lengthConfig.replace('[', '').replace(']', '').split(',').map(Number);
            return field.value.length < min || field.value.length > max;
        }
        return false;
    },
    equalto: (field) => {
        const selector = field.getAttribute('data-powermail-equalto');
        if (selector) {
            const form = field.closest('form');
            const compareField = form.querySelector(selector);
            if (compareField) {
                return compareField.value !== field.value;
            }
        }
        return false;
    },
    powermailfilesize: (field) => {
        if (field.type !== 'file' || !field.files || !field.files.length) return false;
        const sizeConfig = field.getAttribute('data-powermail-powermailfilesize');
        if (sizeConfig) {
            const maxSize = parseInt(sizeConfig.split(',')[0], 10);
            for (let i = 0; i < field.files.length; i++) {
                if (field.files[i].size > maxSize) return true;
            }
        }
        return false;
    },
    powermailfileextensions: (field) => {
        if (field.type !== 'file' || !field.files || !field.files.length) return false;
        const accept = field.getAttribute('accept');
        if (accept) {
            const allowed = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());
            for (let i = 0; i < field.files.length; i++) {
                const ext = field.files[i].name.split('.').pop().toLowerCase();
                if (!allowed.includes(ext)) return true;
            }
        }
        return false;
    }
};

/**
 * Formfield
 */
(function formFields(w, d) {
    let scrollIntoView = d.documentElement.scrollIntoView ? 'scrollIntoView' : null;
    if (d.documentElement.scrollIntoViewIfNeeded) {
        scrollIntoView = 'scrollIntoViewIfNeeded';
    }

    function FormField(element) {
        this.element = element;
        this.element.enhancer = this;
        this.wrapper = this.element.closest('.FormField');
        this.groupPrimaryEnhancer = null;
        this.groupEnhancers = [];
        this.lastErrorString = '';

        // Gruppenvalidierung wie gehabt
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

        if (this.errorMessageBag) {
            this.constraints.forEach((constraint) => {
                let errorMessage = null;
                if (constraint === 'valueMissing') {
                    errorMessage = this.element.getAttribute('data-powermail-required-message');
                } else if (constraint === 'patternMismatch') {
                    errorMessage = this.element.getAttribute('data-powermail-error-message');
                }
                if(!errorMessage) {
                    const errorMessageKey = `errormsg${constraint.substr(0, 1)
                        .toUpperCase()}${constraint.substr(1)
                        .toLowerCase()}`;
                    if (this.element.dataset[errorMessageKey]) {
                        this.errorMessages[constraint] = this.element.dataset[errorMessageKey];
                    }
                }
                if (errorMessage) {
                    this.errorMessages[constraint] = errorMessage;
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

FormField.prototype.validate = function validate(includeMissing) {
    if (this.recursiveErrorMessages) {
        return this.recursiveErrorMessages;
    }

    const errorMessages = {};
    let constraints = 0;

    // 1. Für Checkbox-Gruppen: eigene Logik
    let validity;
    if (this.isGroup && !this.groupPrimaryEnhancer) {
        validity = this.validateGroup();
    } else {
        validity = this.element.validity;
    }

    // 2. Für Gruppen: KEIN checkValidity(), sondern nur valueMissing aus validity prüfen!
    if (this.isGroup && !this.groupPrimaryEnhancer) {
        if (validity.valueMissing) {
            let msg = this.element.getAttribute('data-powermail-required-message')
                || this.element.getAttribute('data-powermail-error-message')
                || 'Bitte wählen Sie mindestens eine Option aus.';
            errorMessages['valueMissing'] = msg;
            constraints += Math.pow(2, this.constraints.indexOf('valueMissing'));
        }
    } else {
        // *** NEU: Wenn valueMissing gilt, NUR diese Meldung anzeigen ***
        if (validity.valueMissing) {
            let msg =
                this.element.getAttribute('data-powermail-required-message') ||
                this.element.getAttribute('data-powermail-error-message') ||
                this.errorMessages['valueMissing'] ||
                this.element.validationMessage ||
                'Ungültige Eingabe';
            errorMessages['valueMissing'] = msg;
            constraints += Math.pow(2, this.constraints.indexOf('valueMissing'));
        } else if (!this.element.checkValidity()) {
            // Jetzt NUR andere Fehler prüfen, wenn valueMissing NICHT zutrifft!
            this.constraints.forEach((constraint) => {
                if (constraint === 'valueMissing') return; // Schon behandelt
                if (validity[constraint]) {
                    let msg =
                        this.element.getAttribute(`data-powermail-${constraint.toLowerCase()}-message`) ||
                        this.element.getAttribute('data-powermail-error-message') ||
                        this.errorMessages[constraint] ||
                        this.element.validationMessage ||
                        'Ungültige Eingabe';
                    errorMessages[constraint] = msg;
                    constraints += Math.pow(2, this.constraints.indexOf(constraint));
                }
            });
        }
    }

    // 3. Powermail-Validatoren prüfen (nur, wenn kein nativer Fehler für diesen Typ)
    for (const [validator, fn] of Object.entries(PowermailValidators)) {
        if (
            (validator === "pattern" && validity.patternMismatch) ||
            (validator === "email" && validity.typeMismatch && this.element.type === "email") ||
            (validator === "url" && validity.typeMismatch && this.element.type === "url") ||
            (validator === "maximum" && validity.rangeOverflow) ||
            (validator === "minimum" && validity.rangeUnderflow) ||
            (validator === "length" && (validity.tooLong || validity.tooShort)) ||
            (validator === "number" && validity.badInput) ||
            (validator === "required" && validity.valueMissing && !this.isGroup)
        ) {
            continue;
        }
        if (fn(this.element)) {
            let msg = this.element.getAttribute(`data-powermail-${validator}-message`)
                || this.element.getAttribute('data-powermail-error-message')
                || `Ungültige Eingabe (${validator})`;
            errorMessages[validator] = msg;
        }
    }

    this.recursiveErrorMessages = errorMessages;
    this.updateErrorMessageBag(constraints, errorMessages);
    this.recursiveErrorMessages = null;
    return errorMessages;
};


    FormField.prototype.validateGroup = function validateGroup() {
        let checked = this.element.checked;
        for (let e = 0; e < this.groupEnhancers.length; ++e) {
            if (this.groupEnhancers[e].element.checked) {
                checked = true;
                break;
            }
        }
        return this.overrideValidityState({ valueMissing: !checked });
    };

    FormField.prototype.overrideValidityState = function overrideValidityState(override) {
        const clonedValidityState = { valid: true };
        this.constraints.forEach((c) => {
            clonedValidityState[c] = (c in override) ? override[c] : this.element.validity[c];
            clonedValidityState.valid = clonedValidityState.valid && !clonedValidityState[c];
        });
        return clonedValidityState;
    };

    FormField.prototype.updateErrorMessageBag = function updateErrorMessageBag(constraints, errorMessages) {
        const hasErrors = Object.keys(errorMessages).length > 0;
    const errorString = JSON.stringify(errorMessages);

    if (constraints !== this.lastConstraints || hasErrors !== this.lastHadErrors ||
        errorString !== this.lastErrorString) {
        
        if (hasErrors) {
            this.errorMessageBag.removeAttribute('hidden');
            this.element.setAttribute('aria-invalid', 'true');
            this.wrapper.classList.add('FormField--has-error');
        } else {
            this.errorMessageBag.setAttribute('hidden', 'hidden');
            this.element.setAttribute('aria-invalid', 'false');
            this.wrapper.classList.remove('FormField--has-error');
        }

        // Alle vorhandenen Fehlermeldungen entfernen
        while (this.errorMessageBag.childNodes.length) {
            this.errorMessageBag.removeChild(this.errorMessageBag.lastChild);
        }

        // Neue Fehlermeldungen hinzufügen
        for (const constraintKey in errorMessages) {
            if (Object.prototype.hasOwnProperty.call(errorMessages, constraintKey)) {
                const errorMessage = document.createElement('span');
                errorMessage.setAttribute('data-constraint', constraintKey);
                errorMessage.textContent = errorMessages[constraintKey];
                this.errorMessageBag.appendChild(errorMessage);
            }
        }

        this.lastConstraints = constraints;
        this.lastHadErrors = hasErrors;
        this.lastErrorString = errorString;
        this.focusWrapper();

        // Form-Update auslösen
        if (typeof Promise !== 'undefined' && Promise.resolve) {
            Promise.resolve().then(() => {
                this.element.form.enhancer.update();
            });
        } else {
            setTimeout(() => {
                this.element.form.enhancer.update();
            }, 0);
        }
    }}

    FormField.prototype.focusWrapper = function focusWrapper() {
        if (scrollIntoView) {
            this.wrapper[scrollIntoView]({
                block: 'center',
                inline: 'start',
                behavior: 'smooth'
            });
        }
    };

    FormField.prototype.focus = function focus() {
        this.element.focus();
        this.focusWrapper();
    };

    tw_forms.Observer.register('.FormField__input, .FormField__textarea', (field) => {
        return new FormField(field);
    });

}(typeof global !== 'undefined' ? global : window, document));