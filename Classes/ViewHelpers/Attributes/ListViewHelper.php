<?php

/**
 * List ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Attributes
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
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

namespace Tollwerk\TwForms\ViewHelpers\Attributes;

use Closure;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithRenderStatic;

/**
 * Render a list of HTML attributes to be added to an element
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Attributes
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Attributes
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class ListViewHelper extends AbstractViewHelper
{
    /**
     * Enable static rendering
     */
    use CompileWithRenderStatic;

    /**
     * Don't escape the output
     *
     * @var boolean
     */
    protected $escapeOutput = false;

    /**
     * Render
     *
     * @param array                     $arguments             Arguments
     * @param Closure                   $renderChildrenClosure Children rendering closure
     * @param RenderingContextInterface $renderingContext      Rendering context
     *
     * @return array|string Output
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @codingStandardsIgnoreStart
     */
    public static function renderStatic(
        array $arguments,
        Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ) {
        return self::renderAttributes(
            (array)$arguments['attributes'],
            (array)$arguments['nonEmptyAttributes'],
            $arguments['returnArray']
        );
    }

    /**
     * Render the list of attributes
     *
     * @param array   $stdAttributes      Attributes
     * @param array   $nonEmptyAttributes Non-empty attributes
     * @param boolean $returnArray        Return a list of attributes instead of an HTML string
     *
     * @return array|string List of attributes / HTML attribute string
     */
    protected static function renderAttributes(array $stdAttributes, array $nonEmptyAttributes, $returnArray)
    {
        $attributes = [];
        foreach (self::flatten($stdAttributes) as $name => $value) {
            $attributes[$name] = $returnArray ?
                (strlen(trim($value)) ? trim($value) : null) :
                self::renderAttribute($name, $value, false);
        }
        foreach (self::flatten($nonEmptyAttributes) as $name => $value) {
            $attributes[$name] = $returnArray ?
                (strlen(trim($value)) ? trim($value) : null) :
                self::renderAttribute($name, $value, true);
        }
        $attributes = array_filter($attributes);

        return $returnArray ? $attributes : ((count($attributes) ? ' ' : '') . implode(' ', $attributes));
    }

    /**
     * Recursively flatten an array
     *
     * @param array $array Array
     *
     * @return array Flattened array
     */
    protected static function flatten(array $array): array
    {
        $result = [];
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result = array_merge($result, self::flatten($value));
                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * Render a single attribute
     *
     * @param string $name        Attribute name
     * @param mixed  $value       Attribute value
     * @param bool   $skipIfEmpty Skip attribute if value is empty
     *
     * @return null|string Attribute string
     *
     * @SuppressWarnings(PHPMD.BooleanArgumentFlag)
     * @codingStandardsIgnoreStart
    */
    protected static function renderAttribute($name, $value, $skipIfEmpty = false): ?string
    {
        // Return if the value is empty and empty attributes should be skipped
        if (!strlen(trim($value)) && $skipIfEmpty) {
            return null;
        }
        $attribute = htmlspecialchars(trim($name));
        if (!is_bool($value)) {
            $attribute .= '="' . htmlspecialchars(trim($value)) . '"';
        }

        return $attribute;
    }

    /**
     * Initialize arguments
     *
     * @return void
     */
    public function initializeArguments()
    {
        parent::initializeArguments();
        $this->registerArgument('attributes', 'mixed', 'Arbitrary number of HTML tag attributes', false, []);
        $this->registerArgument(
            'nonEmptyAttributes',
            'array',
            'Arbitrary number of HTML tag attributes that only get rendered if they\'re not empty',
            false,
            []
        );
        $this->registerArgument('returnArray', 'boolean', 'Return an attribute list instead of string', false, false);
    }
}
