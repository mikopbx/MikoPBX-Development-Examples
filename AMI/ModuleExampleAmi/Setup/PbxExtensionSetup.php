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

namespace Modules\ModuleExampleAmi\Setup;

use MikoPBX\Modules\Setup\PbxExtensionSetupBase;
use Modules\ModuleExampleAmi\Models\ModuleExampleAmi;

/**
 * Module installation and uninstallation handler
 *
 * Handles database setup and AMI credentials generation
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
    /**
     * Install module database and generate AMI credentials
     *
     * Creates database structure and generates random AMI username/password
     * for secure Asterisk Manager Interface access
     *
     * @return bool True on success, false on failure
     */
    public function installDB(): bool
    {
        if (!parent::installDB()) {
            return false;
        }

        $settings = ModuleExampleAmi::findFirst();
        if ($settings === null) {
            $settings = new ModuleExampleAmi();
        }

        // Generate unique AMI username: ami_example_XXXXXXXX
        $settings->ami_user = 'ami_example_' . substr(bin2hex(random_bytes(4)), 0, 8);

        // Generate secure 32-character password
        $settings->ami_password = bin2hex(random_bytes(16));

        return $settings->save();
    }
}