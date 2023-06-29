<?php

/**
 * Abstract Content ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Content
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2021 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
 * @link       https://tollwerk.de
 */

/***********************************************************************************
 *  The MIT License (MIT)
 *
 *  Copyright © 2021 Kai Katzenleuchter <kai@tollwerk.de>
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

namespace Tollwerk\TwForms\ViewHelpers\Content;

use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Extbase\Configuration\ConfigurationManagerInterface;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Abstract Content ViewHelper, copied from VHS Extension
 *
 * @category   Tollwerk\TwForms\ViewHelper\Content
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelper\Content
 * @author     Kai Katzenleuchter <kai@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
abstract class AbstractContentViewHelper extends AbstractViewHelper
{
    /**
     * ContentObject
     *
     * @var ContentObjectRenderer
     */
    protected $contentObject;

    /**
     * ConfigurationManagerInterface
     *
     * @var ConfigurationManagerInterface
     */
    protected $configurationManager;

    /**
     * EscapeOutput
     *
     * @var boolean
     */
    protected $escapeOutput = false;

    /**
     * Inject ConfigurationManagerInterface
     *
     * @param ConfigurationManagerInterface $configurationManager ConfigurationManagerInterface
     *
     * @return void
     */
    public function injectConfigurationManager(ConfigurationManagerInterface $configurationManager)
    {
        $this->configurationManager = $configurationManager;
        $this->contentObject        = $configurationManager->getContentObject();
    }

    /**
     * Initialize
     *
     * @return void
     */
    public function initializeArguments()
    {
        $this->registerArgument('column', 'integer', 'Column position number (colPos) of the column to render');
        $this->registerArgument(
            'order',
            'string',
            'Optional sort field of content elements - RAND() supported. Note that when sliding is enabled, the ' .
            'sorting will be applied to records on a per-page basis and not to the total set of collected records.',
            false,
            'sorting'
        );
        $this->registerArgument('sortDirection', 'string', 'Optional sort direction of content elements', false, 'ASC');
        $this->registerArgument('pageUid', 'integer', 'If set, selects only content from this page UID', false, 0);
        $this->registerArgument('limit', 'integer', 'If set, set limit', false, 0);
        $this->registerArgument(
            'contentUids',
            'array',
            'If used, replaces all conditions with an "uid IN (1,2,3)" style condition using the UID values from ' .
            'this array'
        );
        $this->registerArgument(
            'sectionIndexOnly',
            'boolean',
            'If TRUE, only renders/gets content that is marked as "include in section index"',
            false,
            false
        );
        $this->registerArgument('loadRegister', 'array', 'List of LOAD_REGISTER variable');
        $this->registerArgument('render', 'boolean', 'Render result', false, true);
        $this->registerArgument(
            'hideUntranslated',
            'boolean',
            'If FALSE, will NOT include elements which have NOT been translated, if current language is NOT the ' .
            'default language. Default is to show untranslated elements but never display the original if there is ' .
            'a translated version',
            false,
            false
        );
    }

    /**
     * Get content records based on column and pid
     *
     * @return array
     */
    protected function getContentRecords()
    {
        $limit = $this->arguments['limit'];

        $pageUid = $this->getPageUid();

        $contentRecords = $this->getSlideRecordsFromPage($pageUid, $limit);

        if (true === (bool)$this->arguments['render']) {
            $contentRecords = $this->getRenderedRecords($contentRecords);
        }

        return $contentRecords;
    }

    /**
     * GetSlideRecordsFromPage
     *
     * @param integer $pageUid PageUid
     * @param integer $limit   Limit
     *
     * @return array[]
     *
     * @SuppressWarnings(PHPMD.Superglobals)
     * @codingStandardsIgnoreStart
     */

    protected function getSlideRecordsFromPage($pageUid, $limit)
    {
        $order = $this->arguments['order'];
        if (false === empty($order)) {
            $sortDirection = strtoupper(trim($this->arguments['sortDirection']));
            if ('ASC' !== $sortDirection && 'DESC' !== $sortDirection) {
                $sortDirection = 'ASC';
            }
            $order = $order . ' ' . $sortDirection;
        }

        $contentUids = $this->arguments['contentUids'];
        if (true === is_array($contentUids) && !empty($contentUids)) {
            return $GLOBALS['TSFE']->cObj->getRecords(
                'tt_content',
                [
                    'uidInList'                               => implode(',', $contentUids),
                    'orderBy'                                 => $order,
                    'max'                                     => $limit,
                    // Note: pidInList must not use $pageUid which defaults to current PID. Use argument-passed pageUid!
                    // A value of zero here removes the "pid" from the condition generated by ContentObjectRenderer.
                    'pidInList'                               => (int)$this->arguments['pageUid'],
                    'includeRecordsWithoutDefaultTranslation' => !$this->arguments['hideUntranslated']
                ]
            );
        }

        $conditions = '1=1';
        if (is_numeric($this->arguments['column'])) {
            $conditions = sprintf('colPos = %d', (int)$this->arguments['column']);
        }
        if (true === (bool)$this->arguments['sectionIndexOnly']) {
            $conditions .= ' AND sectionIndex = 1';
        }

        return $GLOBALS['TSFE']->cObj->getRecords(
            'tt_content',
            [
                'where'                                   => $conditions,
                'orderBy'                                 => $order,
                'max'                                     => $limit,
                'pidInList'                               => $pageUid,
                'includeRecordsWithoutDefaultTranslation' => !$this->arguments['hideUntranslated']
            ]
        );
    }

    /**
     * Gets the configured, or the current page UID if
     * none is configured in arguments and no content_from_pid
     * value exists in the current page record's attributes.
     *
     * @return integer
     *
     * @SuppressWarnings(PHPMD.Superglobals)
     * @codingStandardsIgnoreStart
     */
    protected function getPageUid()
    {
        $pageUid = (int)$this->arguments['pageUid'];
        if (1 > $pageUid) {
            $pageUid = (int)$GLOBALS['TSFE']->page['content_from_pid'];
        }
        if (1 > $pageUid) {
            $pageUid = (int)$GLOBALS['TSFE']->id;
        }

        return $pageUid;
    }

    /**
     * This function renders an array of tt_content record into an array of rendered content
     * it returns a list of elements rendered by typoscript RECORD function
     *
     * @param array $rows Database rows of records (each item is a tt_content table record)
     *
     * @return array
     */
    protected function getRenderedRecords(array $rows)
    {
        if (false === empty($this->arguments['loadRegister'])) {
            $this->contentObject->cObjGetSingle('LOAD_REGISTER', $this->arguments['loadRegister']);
        }
        $elements = [];
        foreach ($rows as $row) {
            array_push($elements, static::renderRecord($row));
        }
        if (false === empty($this->arguments['loadRegister'])) {
            $this->contentObject->cObjGetSingle('RESTORE_REGISTER', '');
        }

        return $elements;
    }

    /**
     * This function renders a raw tt_content record into the corresponding
     * element by typoscript RENDER function. We keep track of already
     * rendered records to avoid rendering the same record twice inside the
     * same nested stack of content elements.
     *
     * @param array $row RowData
     *
     * @return string|NULL
     *
     * @SuppressWarnings(PHPMD.Superglobals)
     * @codingStandardsIgnoreStart
    */
    protected static function renderRecord(array $row)
    {
        if (0 < $GLOBALS['TSFE']->recordRegister['tt_content:' . $row['uid']]) {
            return null;
        }
        $conf   = [
            'tables'       => 'tt_content',
            'source'       => $row['uid'],
            'dontCheckPid' => 1
        ];
        $parent = $GLOBALS['TSFE']->currentRecord;
        // If the currentRecord is set, we register, that this record has invoked this function.
        // It's should not be allowed to do this again then!!
        if (false === empty($parent)) {
            ++$GLOBALS['TSFE']->recordRegister[$parent];
        }
        $html = $GLOBALS['TSFE']->cObj->cObjGetSingle('RECORDS', $conf);

        $GLOBALS['TSFE']->currentRecord = $parent;
        if (false === empty($parent)) {
            --$GLOBALS['TSFE']->recordRegister[$parent];
        }

        return $html;
    }

    /**
     * ExecuteSelectQuery
     *
     * @param string  $fields    Fields
     * @param string  $condition Condition
     * @param string  $order     Order
     * @param integer $limit     Limit
     *
     * @return array
     */
    protected function executeSelectQuery($fields, $condition, $order, $limit)
    {
        $queryBuilder = (new ConnectionPool())->getConnectionForTable('tt_content')->createQueryBuilder();
        $queryBuilder->select($fields)->from('tt_content')->where($condition);
        if ($order) {
            $orderings = explode(' ', $order);
            $queryBuilder->orderBy($orderings[0], $orderings[1]);
        }
        if ($limit) {
            $queryBuilder->setMaxResults((int)$limit);
        }

        return $queryBuilder->execute()->fetchAll();
    }

    /**
     * GenerateSelectQuery
     *
     * @param string $fields    Fields
     * @param string $condition Condition
     *
     * @return string
     */
    protected function generateSelectQuery($fields, $condition)
    {
        $queryBuilder = (new ConnectionPool())->getConnectionForTable('tt_content')->createQueryBuilder();
        $queryBuilder->select($fields)->from('tt_content')->where($condition);

        return $queryBuilder->getSQL();
    }
}
