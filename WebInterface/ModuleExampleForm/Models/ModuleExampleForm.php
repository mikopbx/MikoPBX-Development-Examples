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

namespace Modules\ModuleExampleForm\Models;

use MikoPBX\Common\Models\Providers;
use MikoPBX\Modules\Models\ModulesModelsBase;
use Phalcon\Mvc\Model\Relation;

/**
 * ModuleExampleForm — example model demonstrating all common column types.
 *
 * Each property maps to a column in the m_ModuleExampleForm SQLite table.
 * Phalcon model properties follow Phalcon/SQLite conventions:
 *   - Primary key is always untyped: public $id;
 *   - String columns: public ?string $name = '';
 *   - Integer columns stored as string: public ?string $enabled = '0';
 *
 * @package Modules\ModuleExampleForm\Models
 */
class ModuleExampleForm extends ModulesModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * Text input field example.
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $text_field = '';

    /**
     * TextArea field example.
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $text_area_field = '';

    /**
     * Password field example.
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $password_field = '';

    /**
     * Numeric (integer) field example.
     *
     * @Column(type="integer", default="3", nullable=true)
     */
    public ?string $integer_field = '3';

    /**
     * Checkbox field example (stored as '0' or '1').
     *
     * @Column(type="integer", default="1", nullable=true)
     */
    public ?string $checkbox_field = '1';

    /**
     * Toggle field example (stored as '0' or '1').
     *
     * @Column(type="integer", default="1", nullable=true)
     */
    public ?string $toggle_field = '1';

    /**
     * Static dropdown — stores selected option value.
     * Rendered as SemanticUIDropdown with hardcoded options (priority levels).
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $select_field = 'medium';

    /**
     * Provider dropdown — foreign key to Providers table.
     * Rendered as SemanticUIDropdown populated from database query.
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $provider_field = '';

    /**
     * Hidden field — stores data set programmatically via JavaScript.
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $hidden_field = '';

    /**
     * Returns dynamic relations between module models and common models.
     * MikoPBX checks it in ModelsBase after every call to keep data consistent.
     *
     * Uncomment to enforce referential integrity: if a Provider is deleted,
     * MikoPBX will block deletion when this module references it.
     *
     * @param mixed $calledModelObject
     * @return void
     */
    public static function getDynamicRelations(&$calledModelObject): void
    {
        // if (is_a($calledModelObject, Providers::class)) {
        //     $calledModelObject->belongsTo(
        //         'id',
        //         ModuleExampleForm::class,
        //         'provider_field',
        //         [
        //             'alias'      => 'ModuleExampleFormProvider',
        //             'foreignKey' => [
        //                 'allowNulls' => 0,
        //                 'message'    => 'Models\ModuleExampleFormProvider',
        //                 'action'     => Relation::ACTION_RESTRICT,
        //             ],
        //         ]
        //     );
        // }
    }

    public function initialize(): void
    {
        $this->setSource('m_ModuleExampleForm');
        $this->hasOne(
            'provider_field',
            Providers::class,
            'id',
            [
                'alias'      => 'Providers',
                'foreignKey' => [
                    'allowNulls' => true,
                    'action'     => Relation::NO_ACTION,
                ],
            ]
        );
        parent::initialize();
    }
}
