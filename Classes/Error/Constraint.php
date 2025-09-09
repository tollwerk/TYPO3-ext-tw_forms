<?php

/**
 * Error Constraint
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Error
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */

/***********************************************************************************
 *  The MIT License (MIT)
 *
 *  Copyright © 2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of
 *  this software and associated documentation files (the "Software"), to deal in
 *  the Software without restriction, including without limitation the rights to
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 *  the Software, and to permit persons to whom the Software is furnished to do so,
 *  subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 *  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 *  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 *  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 *  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ***********************************************************************************/

namespace Tollwerk\TwForms\Error;

use Tollwerk\TwForms\Domain\Validator\ValidationErrorMapper;
use TYPO3\CMS\Extbase\Error\Error;

class Constraint extends Error
{
    public const string TYPE_MISMATCH     = 'typeMismatch';
    public const string VALUE_MISSING     = 'valueMissing';
    public const string TOO_SHORT         = 'tooShort';
    public const string TOO_LONG          = 'tooLong';
    public const string RANGE_UNDERFLOW   = 'rangeUnderflow';
    public const string RANGE_OVERFLOW    = 'rangeOverflow';
    public const string PATTERN_MISMATCH  = 'patternMismatch';
    public const string TOO_FEW_ITEMS = 'tooFewItems';

    /**
     * JavaScript constraint name
     */
    protected string $constraint = '';

    public function __construct(
        string $message,
        int $code,
        array $arguments = [],
        string $title = '',
        string $constraint = ''
    ) {
        parent::__construct($message, $code, $arguments, $title);
        $this->constraint = $constraint;
    }

    /**
     * Create a Constraint from a generic Extbase Error
     */
    public static function fromError(Error $error, array $validationErrorMessages = []): self
    {
        $constraint = ValidationErrorMapper::mapErrorCodeToConstraint($error->getCode());
        $code = $error->getCode();
        $message = $error->getMessage();

        foreach ($validationErrorMessages as $validationErrorMessage) {
            if ($validationErrorMessage['code'] === $code && !empty($validationErrorMessage['message'])) {
                $message = $validationErrorMessage['message'];
                break;
            }
        }

        return new self($message, $code, $error->getArguments(), $error->getTitle(), $constraint ?? '');
    }

    /**
     * Return the JavaScript constraint name
     */
    public function getConstraint(): string
    {
        return $this->constraint;
    }
}
