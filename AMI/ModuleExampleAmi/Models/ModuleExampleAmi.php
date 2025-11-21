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

namespace Modules\ModuleExampleAmi\Models;

use MikoPBX\Modules\Models\ModulesModelsBase;

/**
 * Database model for AMI Example Module settings
 *
 * Stores automatically generated AMI credentials
 *
 * @property int $id
 * @property string $ami_user
 * @property string $ami_password
 */
class ModuleExampleAmi extends ModulesModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * AMI username (auto-generated during installation)
     *
     * @Column(type="string", nullable=true)
     */
    public $ami_user;

    /**
     * AMI password (auto-generated during installation)
     *
     * @Column(type="string", nullable=true)
     */
    public $ami_password;

    /**
     * Initialize model and set database table
     */
    public function initialize(): void
    {
        $this->setSource('m_ModuleExampleAmi');
        parent::initialize();
    }
}