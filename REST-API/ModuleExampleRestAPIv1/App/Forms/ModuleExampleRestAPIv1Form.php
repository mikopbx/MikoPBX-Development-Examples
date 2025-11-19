<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv1\App\Forms;

use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Form;

/**
 * Form for ModuleExampleRestAPIv1 settings
 *
 * WHY: Provides form rendering for module settings
 *
 * @package Modules\ModuleExampleRestAPIv1\App\Forms
 */
class ModuleExampleRestAPIv1Form extends Form
{
    /**
     * Initialize form elements
     *
     * @param object|null $entity The entity to bind to the form
     */
    public function initialize($entity = null): void
    {
        // Text parameter
        $this->add(new Text('textParameter', [
            'value' => $entity->textParameter ?? ''
        ]));

        // Checkbox parameter
        $this->addCheckBox('checkboxParameter', intval($entity->checkboxParameter ?? 0) === 1);

        // Boolean parameter
        $this->addCheckBox('booleanParameter', intval($entity->booleanParameter ?? 0) === 1);
    }

    /**
     * Adds a checkbox to the form field with the given name
     *
     * @param string $fieldName The name of the form field
     * @param bool $checked Indicates whether the checkbox is checked by default
     * @param string $checkedValue The value assigned to the checkbox when it is checked
     */
    private function addCheckBox(string $fieldName, bool $checked, string $checkedValue = 'on'): void
    {
        $checkAr = ['value' => null];
        if ($checked) {
            $checkAr = ['checked' => $checkedValue, 'value' => $checkedValue];
        }
        $this->add(new Check($fieldName, $checkAr));
    }
}
