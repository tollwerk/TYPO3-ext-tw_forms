<?php

/**
 * Validation Error Mapper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Domain\Validator
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */

/***********************************************************************************
 *  The MIT License (MIT)
 *
 *  Copyright © 2020 Joschi Kuphal <joschi@tollwerk.de>
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

namespace Tollwerk\TwForms\Domain\Validator;

use Tollwerk\TwForms\Error\Constraint;
use TYPO3\CMS\Extbase\Error\Error;
use TYPO3\CMS\Extbase\Validation\Validator\EmailAddressValidator;
use TYPO3\CMS\Extbase\Validation\Validator\NotEmptyValidator;
use TYPO3\CMS\Extbase\Validation\Validator\NumberRangeValidator;
use TYPO3\CMS\Extbase\Validation\Validator\RegularExpressionValidator;
use TYPO3\CMS\Extbase\Validation\Validator\StringLengthValidator;
use TYPO3\CMS\Extbase\Validation\Validator\UrlValidator;

/**
 * Extbase validation error mapper
 *
 * @category   Tollwerk\TwForms\Domain\Validator
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Domain\Validator
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class ValidationErrorMapper
{
    /**
     * Error map (Extbase to JavaScript)
     *
     * @var string[]
     */
    const ERROR_MAP = [
        NotEmptyValidator::class => [
            1221560910 => Constraint::VALUE_MISSING,
            1221560718 => Constraint::VALUE_MISSING,
            1347992400 => Constraint::VALUE_MISSING,
            1347992453 => Constraint::VALUE_MISSING,
        ],
        EmailAddressValidator::class => [
            1221559976 => Constraint::TYPE_MISMATCH,
        ],
        UrlValidator::class => [
            1238108078 => Constraint::TYPE_MISMATCH,
        ],
        StringLengthValidator::class => [
            1238108067 => Constraint::TOO_SHORT,
            1238110957 => Constraint::TOO_LONG,
        ],
        NumberRangeValidator::class => [
            1234567890 => Constraint::RANGE_UNDERFLOW,
            1234567891 => Constraint::RANGE_OVERFLOW,
        ],
        RegularExpressionValidator::class => [
            1453211235 => Constraint::PATTERN_MISMATCH,
        ],
    ];

    /**
     * Return an inverse error map (JavaScript to Extbase error codes) for a particular validator
     *
     * @param string $validatorClass Validator class
     *
     * @return array[]                              Inverse error map (JavaScript to Extbase error codes)
     *
     * @SuppressWarnings(PHPMD.UnusedLocalVariable)
     * @codingStandardsIgnoreStart
     */
    public static function getInverseMap(string $validatorClass): array
    {
        $inverseMap = [];

        if (!empty(self::ERROR_MAP[$validatorClass])) {
            foreach (self::ERROR_MAP[$validatorClass] as $errorCode => $constraint) {
                if (!isset($inverseMap[$constraint])) {
                    $inverseMap[$constraint] = [];
                }
                $inverseMap[$constraint][] = $errorCode;
            }
        }

        return $inverseMap;
    }

    /**
     * Map an Extbase error code to a JavaScript constraint
     *
     * @param int $errorCode Extbase error code
     *
     * @return string|null JavaScript constraint
     */
    public static function mapErrorCodeToConstraint(int $errorCode): ?string
    {
        foreach(self::ERROR_MAP as $errorTypeCodes) {
            foreach($errorTypeCodes as $errorTypeCode => $constraint) {
                if ($errorCode === $errorTypeCode) {
                    return $constraint;
                }
            }
        }

        return null;
    }
}
