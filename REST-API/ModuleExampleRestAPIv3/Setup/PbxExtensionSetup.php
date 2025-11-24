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
 * HOW IT WORKS:
 * 1. During module installation, PbxExtensionSetupBase scans Models/ folder
 * 2. Reads Phalcon annotations from model classes (Tasks.php)
 * 3. Auto-generates CREATE TABLE SQL statements
 * 4. Executes SQL to create m_ModuleExampleRestAPIv3_Tasks table
 *
 * WHAT THIS MODULE CREATES:
 * - Database tables: m_ModuleExampleRestAPIv3_Tasks (from Models/Tasks.php)
 * - REST API routes: auto-discovered from Lib/RestAPI/Tasks/Controller.php
 * - No manual database migrations needed
 *
 * REST API AUTO-DISCOVERY:
 * - ControllerDiscovery scans Lib/RestAPI for files ending with *Controller.php
 * - Finds Controller.php with #[ApiResource] attribute
 * - RouterProvider registers routes automatically
 *
 * @package Modules\ModuleExampleRestAPIv3\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
    // No custom installation logic needed
    // Everything is automatic:
    // - Database tables created from Models/Tasks.php annotations
    // - API routes discovered from Lib/RestAPI/Tasks/Controller.php attributes
}
