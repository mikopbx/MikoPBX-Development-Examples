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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleRestAPIv3\Models\Tasks;
use Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\DataStructure;

/**
 * SaveRecordAction - Creates or updates a task
 *
 * WHY: Unified handler for POST (create), PUT (replace), and PATCH (partial update)
 * Determines operation based on presence of ID parameter
 *
 * REAL IMPLEMENTATION WOULD FOLLOW 7-PHASE PATTERN:
 * 1. SANITIZATION - Security first
 * 2. REQUIRED VALIDATION - Fail fast
 * 3. DETERMINE OPERATION - New vs existing
 * 4. APPLY DEFAULTS - CREATE only, never UPDATE/PATCH
 * 5. SCHEMA VALIDATION - After defaults
 * 6. SAVE - Transaction wrapper
 * 7. RESPONSE - Consistent format
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class SaveRecordAction
{
    /**
     * Execute action
     *
     * @param array<string, mixed> $data Request data with task fields
     * @return PBXApiResult Response with saved task
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();

        // ============ PHASE 1: SANITIZATION ============
        // WHY: Security - never trust user input
        // $sanitizationRules = DataStructure::getSanitizationRules();
        // $sanitizedData = self::sanitizeInputData($data, $sanitizationRules, ['title', 'status', 'priority']);

        // ============ PHASE 2: REQUIRED VALIDATION ============
        // WHY: Fail fast - don't waste resources
        if (empty($data['title'])) {
            $result->messages['error'][] = 'Title is required';
            return $result;
        }

        // ============ PHASE 3: DETERMINE OPERATION ============
        // WHY: Different logic for new vs existing records
        $isNewRecord = empty($data['id']);
        $id = $data['id'] ?? rand(100, 999);

        // ============ PHASE 4: APPLY DEFAULTS (CREATE ONLY!) ============
        // WHY CREATE: New records need complete data
        // WHY NOT UPDATE/PATCH: Would overwrite existing values!
        if ($isNewRecord) {
            $data['status'] = $data['status'] ?? 'pending';
            $data['priority'] = $data['priority'] ?? 5;
        }

        // ============ PHASE 5: SCHEMA VALIDATION ============
        // WHY: Validate AFTER defaults to check complete dataset
        // $schemaErrors = DataStructure::validateInputData($data);

        // ============ PHASE 6: SAVE ============
        // WHY: All-or-nothing transaction
        // Real implementation would save to database

        // ============ PHASE 7: RESPONSE ============
        // WHY: Consistent API format
        $result->data = [
            'id' => $id,
            'title' => $data['title'],
            'status' => $data['status'] ?? 'pending',
            'priority' => $data['priority'] ?? 5
        ];
        $result->success = true;
        $result->httpCode = $isNewRecord ? 201 : 200;

        return $result;
    }
}
