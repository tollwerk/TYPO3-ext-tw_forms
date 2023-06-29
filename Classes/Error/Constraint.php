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

/**
 * Extended error with JavaScript mapping
 *
 * @category   Tollwerk\TwForms\Domain\Provider
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Domain\Provider
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class Constraint extends Error
{
    /**
     * Type mismatch constraint
     *
     * @var string
     */
    const TYPE_MISMATCH = 'typeMismatch';
    /**
     * Value missing constraint
     *
     * @var string
     */
    const VALUE_MISSING = 'valueMissing';
    /**
     * Constraint codes
     *
     * @var int[]
     */
    const CODES = [
        self::TYPE_MISMATCH => 1580509080,
        self::VALUE_MISSING => 1580509091,
    ];
    /**
     * JavaScript constraint
     *
     * @var string
     */
    protected $constraint = '';

    /**
     * Constructs this error
     *
     * @param string $message    An english error message which is used if no other error message can be resolved
     * @param int    $code       A unique error code
     * @param array  $arguments  Array of arguments to be replaced in message
     * @param string $title      Optional title for the message
     * @param string $constraint JavaScript constraint
     */
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
     * Instantiate a Constraint from an Error
     *
     * @param Error $error Error
     *
     * @return Constraint Constraint
     */
    public static function fromError(Error $error): Constraint
    {
        $constraint = ValidationErrorMapper::mapErrorToConstraint($error);
        $code = $constraint ? self::CODES[$constraint] : $error->getCode();

        return new self($error->getMessage(), $code, $error->getArguments(), $error->getTitle(), $constraint ?? '');
    }

    /**
     * Returns the JavaScript constraint
     *
     * @return string The JavaScript constraint
     */
    public function getConstraint(): string
    {
        return $this->constraint;
    }
}
