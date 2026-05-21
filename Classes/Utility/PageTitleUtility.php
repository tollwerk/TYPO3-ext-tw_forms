<?php

/**
 * Page title Utility
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Utility
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
 * @link       https://tollwerk.de
 */

/***********************************************************************************
 *  The MIT License (MIT)
 *
 *  2021 Jolanta Dworczyk <jolanta@tollwerk.de>
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

namespace Tollwerk\TwForms\Utility;

use Psr\Http\Message\ServerRequestInterface;
use Tollwerk\TwForms\PageTitle\FormErrorTitleProvider;
use TYPO3\CMS\Core\PageTitle\PageTitleProviderInterface;
use TYPO3\CMS\Core\PageTitle\PageTitleProviderManager;
use TYPO3\CMS\Core\TypoScript\TypoScriptService;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use \Exception;
use TYPO3\CMS\Extbase\Utility\DebuggerUtility;

/**
 * Page title utility
 *
 * @category   Tollwerk\TwForms\Utility
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\Utility
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class PageTitleUtility
{
    /**
     * Title providers
     *
     * @var string[]
     */
    protected static $titleProviders = null;

    /**
     * Set the page title via the custom page title provider
     *
     * @param string $title               New page title (may contain placeholder)
     * @param array  $replacementProvider List of page title provider keys to use as replacement
     *
     * @return string New page title (with replacements)
     * @throws Exception
     */
    public static function setPageTitle(string $title, array $replacementProvider = [])
    {
        return GeneralUtility::makeInstance(FormErrorTitleProvider::class)->setTitle($title);
    }

    /**
     * Return the current page title (considering all providers)
     *
     * @return string Page title
     */
    public static function getPageTitle(?ServerRequestInterface $request): string
    {
        if (!$request) {
            return '';
        }

        $pageTitleProviderManager = GeneralUtility::makeInstance(PageTitleProviderManager::class);
        return $pageTitleProviderManager->getTitle($request);
    }
}
