/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["s", "e"] }] */
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
