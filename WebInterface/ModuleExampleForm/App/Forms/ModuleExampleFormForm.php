<?php

declare(strict_types=1);

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

namespace Modules\ModuleExampleForm\App\Forms;

use MikoPBX\AdminCabinet\Forms\BaseForm;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Numeric;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Text;

/**
 * ModuleExampleFormForm — demonstrates all available form element types.
 *
 * Available elements from BaseForm:
 *   - Text                — simple text input
 *   - Password            — masked input
 *   - Numeric             — number-only input
 *   - Hidden              — invisible field for JS-managed data
 *   - addTextArea()       — multi-line text with auto-height
 *   - addCheckBox()       — checkbox / toggle switch
 *   - addSemanticUIDropdown() — dropdown with static or API-loaded options
 *
 * @package Modules\ModuleExampleForm\App\Forms
 */
class ModuleExampleFormForm extends BaseForm
{
    public function initialize($entity = null, $options = null): void
    {
        parent::initialize($entity, $options);

        // Hidden primary key — always present, never shown to the user
        $this->add(new Hidden('id', ['value' => $entity->id]));

        // --- Text input ---
        $this->add(new Text('text_field'));

        // --- TextArea with placeholder and auto-height calculation ---
        $this->addTextArea(
            'text_area_field',
            $entity->text_area_field ?? '',
            90,
            ['placeholder' => "Line 1 of placeholder\nLine 2 shows auto-height"]
        );

        // --- Password input ---
        $this->add(new Password('password_field'));

        // --- Numeric input with maxlength and fixed width ---
        $this->add(new Numeric('integer_field', [
            'maxlength'    => 4,
            'style'        => 'width: 100px;',
            'defaultValue' => 3,
        ]));

        // --- Checkbox (standard) ---
        // Rendered in Volt as <div class="ui checkbox"> ... </div>
        $this->addCheckBox('checkbox_field', intval($entity->checkbox_field) === 1);

        // --- Toggle (same PHP element, different Volt CSS class) ---
        // Rendered in Volt as <div class="ui toggle checkbox"> ... </div>
        $this->addCheckBox('toggle_field', intval($entity->toggle_field) === 1);

        // --- SemanticUIDropdown with static options ---
        // Options array passed from controller: ['value' => 'Display Text', ...]
        $this->addSemanticUIDropdown(
            'select_field',
            $options['priorities'] ?? [],
            $entity->select_field ?? 'medium',
            ['placeholder' => $options['selectPlaceholder'] ?? '']
        );

        // --- SemanticUIDropdown populated from database ---
        // Provider list built in controller via Providers::find()
        $this->addSemanticUIDropdown(
            'provider_field',
            $options['providers'] ?? [],
            $entity->provider_field ?? '',
            ['placeholder' => $options['providerPlaceholder'] ?? '']
        );

        // --- Hidden field — value set by JavaScript ---
        $this->add(new Hidden('hidden_field', ['value' => $entity->hidden_field ?? '']));
    }
}
