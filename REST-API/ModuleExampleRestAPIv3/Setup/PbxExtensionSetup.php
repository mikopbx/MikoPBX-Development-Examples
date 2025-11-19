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

namespace Modules\ModuleExampleRestAPIv3\Setup;

use MikoPBX\Modules\Setup\PbxExtensionSetupBase;

/**
 * ModuleExampleRestAPIv3 installer and uninstaller
 *
 * WHY: Required class for module installation/uninstallation
 * Handles database table creation from Models automatically
 *
 * IMPORTANT: For Pattern 4 modules:
 * - Database tables auto-created from Models/Tasks.php
 * - No manual migration needed
 * - API routes auto-discovered from API/Controllers/
 *
 * @package Modules\ModuleExampleRestAPIv3\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
    // No custom installation logic needed
    // Database tables created automatically from Models/Tasks.php
    // API controllers discovered automatically from API/Controllers/Tasks/RestController.php
}
