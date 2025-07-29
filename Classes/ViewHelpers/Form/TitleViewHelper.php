<?php

/**
 * Element Title Viewhelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
 * @link       https://tollwerk.de
 */

namespace Tollwerk\TwForms\ViewHelpers\Form;

use Closure;
use Exception;
use In2code\Powermail\Domain\Model\Form as PowermailForm;
use Tollwerk\TwForms\Utility\PageTitleUtility;
use TYPO3\CMS\Core\Configuration\SiteConfiguration;
use TYPO3\CMS\Core\Http\Request;
use TYPO3\CMS\Core\PageTitle\RecordPageTitleProvider;
use TYPO3\CMS\Core\Site\Entity\Site;
use TYPO3\CMS\Core\Site\Entity\SiteLanguage;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Utility\DebuggerUtility;
use TYPO3\CMS\Extbase\Utility\LocalizationUtility;
use TYPO3\CMS\Form\Domain\Runtime\FormRuntime;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Element Title ViewHelper
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Form
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @author     Klaus Fiedler <klaus@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class TitleViewHelper extends AbstractViewHelper
{
    /**
     * Initialize all arguments. You need to override this method and call
     * $this->registerArgument(...) inside this method, to register all your arguments.
     *
     * @return void
     * @api
     */
    public function initializeArguments(): void
    {
        parent::initializeArguments();
        // Accept both FormRuntime (TYPO3) and PowermailForm (Powermail) as form argument
        $this->registerArgument('form', 'mixed', 'Form runtime or Powermail form', true);
        $this->registerArgument('pattern', 'string', 'Page title pattern when form errors occurred', true);
        $this->registerArgument('errors', 'int', 'Number of form errors', true);
    }

    /**
     * Get website name
     *
     * @param RenderingContextInterface $renderingContext RenderContext
     *
     * @return string
     */
    public static function getWebsiteName(RenderingContextInterface $renderingContext): string
    {
        /** @var Request $request */
        $request = $renderingContext->getRequest();
        /** @var Site $site */
        $site = $request->getAttribute('site');
        /** @var SiteLanguage $siteLanguage */
        $siteLanguage = $request->getAttribute('language');
        /** @var SiteConfiguration $siteConfiguration */
        $siteConfiguration = $site->getConfiguration();

        // Get website name.
        $websiteName = $siteConfiguration['websiteTitle'];
        if (!empty($siteConfiguration['languages'][$siteLanguage->getLanguageId()]['websiteTitle'])) {
            $websiteName = $siteConfiguration['languages'][$siteLanguage->getLanguageId()]['websiteTitle'];
        }

        return $websiteName;
    }

    /**
     * Default implementation of static rendering; useful API method if your ViewHelper
     * when compiled is able to render itself statically to increase performance. This
     * default implementation will simply delegate to the ViewHelperInvoker.
     *
     * @param array                     $arguments             Arguments
     * @param Closure                   $renderChildrenClosure Render Children Closure
     * @param RenderingContextInterface $renderingContext      Rendering Context
     *
     * @return array
     * @throws Exception
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public static function renderStatic(
        array $arguments,
        Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ): array {
        DebuggerUtility::var_dump($arguments, 'TitleViewHelper arguments');

        // Get website name.
        $websiteName = self::getWebsiteName($renderingContext);
        $pageTitle = GeneralUtility::makeInstance(RecordPageTitleProvider::class)->getTitle();

        /**
         * Get the form argument, which can be either a TYPO3 FormRuntime or a Powermail Form
         *
         * @var FormRuntime|PowermailForm $form
         */
        $form = $arguments['form'];
        $defaultTitle = PageTitleUtility::getPageTitle();

        // TYPO3 Form Framework: Handle status display and page steps
        if ($form instanceof FormRuntime) {
            $renderingOptions = $form->getFormDefinition()->getRenderingOptions();
            // Check if status display is enabled and current page index is set
            if (!empty($renderingOptions['enableStatusDisplay']) && $form->getCurrentPage()->getIndex()) {
                $stepsPattern = LocalizationUtility::translate(
                    'LLL:EXT:tw_tollwerk/Resources/Private/Language/locallang_forms.xlf:form.steps.pattern',
                    'TwTollwerk'
                );
                $totalPages = count($form->getPages());
                $statusTitle = sprintf(
                    $stepsPattern,
                    $form->getCurrentPage()->getIndex() + 1,
                    $totalPages,
                    '%s'
                );
                PageTitleUtility::setPageTitle($statusTitle, ['flex', 'record']);
            }
        }
        // Powermail: Set a simple title using the form's title property
        elseif ($form instanceof PowermailForm) {
            // Powermail does not have steps/pages like TYPO3 Form Framework,
            // so we just use the form's title if available
            $formTitle = $form->getTitle();
            if (!empty($formTitle)) {
                PageTitleUtility::setPageTitle($formTitle, ['flex', 'record']);
            }
        }

        // Add error information to the page title if there are errors
        $count = 0;
        if ($arguments['errors']) {
            $errorTitle = sprintf($arguments['pattern'], $arguments['errors'], '%s') . ' ' . $pageTitle;
            PageTitleUtility::setPageTitle($errorTitle, ['flex', 'record']);
        }

        $pattern = preg_replace_callback(
            '/%s/',
            function ($matches) use (&$count) {
                return '{' . ($count++) . '}';
            },
            $arguments['pattern']
        );

        DebuggerUtility::var_dump([
            'pattern' => $pattern,
            'default' => $defaultTitle,
        ]);

        // Return the pattern with placeholders and the default title
        return [
            'pattern' => $pattern,
            'default' => $defaultTitle
        ];
    }
}
