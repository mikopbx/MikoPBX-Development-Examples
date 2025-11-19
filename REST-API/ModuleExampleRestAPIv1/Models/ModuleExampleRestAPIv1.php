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

namespace Modules\ModuleExampleRestAPIv1\Models;

use MikoPBX\Common\Models\ModelsBase;

/**
 * Settings model for ModuleExampleRestAPIv1
 *
 * WHY: Store module configuration in database
 * Table is created automatically on module installation based on this model
 *
 * @package Modules\ModuleExampleRestAPIv1\Models
 */
class ModuleExampleRestAPIv1 extends ModelsBase
{
    /**
     * Primary key
     *
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public int $id;

    /**
     * Text parameter example
     *
     * @Column(type="string", nullable=true)
     */
    public ?string $textParameter = null;

    /**

     * Checkbox parameter example
     *
     * @Column(type="string", length=1, nullable=true, default="0")
     */
    public ?string $checkboxParameter = '0';

    /**
     * Boolean parameter example
     *
     * @Column(type="string", length=1, nullable=true, default="0")
     */
    public ?string $booleanParameter = '0';

    /**
     * Initialize model
     *
     * WHY: Set table name and relationships
     */
    public function initialize(): void
    {
        $this->setSource('m_ModuleExampleRestAPIv1');
        parent::initialize();
    }
}
