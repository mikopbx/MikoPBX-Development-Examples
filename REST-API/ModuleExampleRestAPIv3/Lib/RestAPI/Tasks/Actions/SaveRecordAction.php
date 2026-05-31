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
use MikoPBX\PBXCoreREST\Lib\Common\AbstractSaveRecordAction;
use Modules\ModuleExampleRestAPIv3\Models\Tasks;
use Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\DataStructure;

/**
 * SaveRecordAction - canonical 7-phase create / update / patch handler for Tasks.
 *
 * WHY THIS CLASS EXISTS
 * ---------------------
 * Every writable REST resource in MikoPBX funnels POST / PUT / PATCH through a
 * single `SaveRecordAction::main()`. Centralising create, full-replace and
 * partial-update in one method keeps the security pipeline (sanitize → validate →
 * persist) identical for all three verbs, so there is exactly one place to audit.
 *
 * WHY EXTEND AbstractSaveRecordAction
 * -----------------------------------
 * The base class (Core/src/PBXCoreREST/Lib/Common/AbstractSaveRecordAction.php)
 * provides the battle-tested helpers that every save action should reuse instead
 * of re-implementing:
 *   - createApiResult()    : builds a PBXApiResult already tagged with the processor.
 *   - sanitizeInputData()  : strips dangerous content from free-text fields.
 *   - executeInTransaction(): wraps the write in a DB transaction with rollback
 *                             and syslog on failure.
 *   - handleError()        : turns an exception into a consistent error response.
 * The schema-driven helpers `applyDefaults()` and `validateInputData()` live on
 * AbstractDataStructure and are called statically on this resource's DataStructure,
 * which is the Single Source of Truth for field metadata.
 *
 * THE 7 PHASES (mirrors ApiKeys/DialplanApplications reference actions in Core)
 * ----------------------------------------------------------------------------
 *   1. SANITIZE          — never trust raw input.
 *   2. VALIDATE REQUIRED — fail fast on missing mandatory fields.
 *   3. DETERMINE OP      — CREATE (no id) vs UPDATE/PATCH (existing id).
 *   4. APPLY DEFAULTS    — CREATE ONLY; defaults on update would clobber values.
 *   5. SCHEMA VALIDATE   — validate the complete dataset AFTER defaults.
 *   6. SAVE              — inside a transaction, writing only present fields.
 *   7. RESPONSE          — consistent PBXApiResult (201 create, 200 update).
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class SaveRecordAction extends AbstractSaveRecordAction
{
    /**
     * Create, replace or patch a single Task and persist it to the database.
     *
     * @param array<string, mixed> $data Request payload with task fields.
     * @return PBXApiResult Result carrying the persisted record or error messages.
     */
    public static function main(array $data): PBXApiResult
    {
        // PBXApiResult tagged with this processor for unified logging/tracing.
        $res = self::createApiResult(__METHOD__);

        // ============ PHASE 1: SANITIZATION ============
        // WHY: Security first. getSanitizationRules() is auto-generated from the
        // DataStructure field definitions (Single Source of Truth), so the rules
        // can never drift away from the documented schema. 'title' is a free-text
        // field, so it is passed in the textFields list for extra dangerous-content
        // checks (XSS / control characters).
        try {
            $clean = self::sanitizeInputData(
                $data,
                DataStructure::getSanitizationRules(),
                ['title']
            );
        } catch (\Exception $e) {
            // sanitizeInputData() throws when dangerous content is detected.
            $res->messages['error'][] = $e->getMessage();
            $res->httpCode = 422; // Unprocessable Entity
            return $res;
        }

        // WHY: The record id is an identifier, not a writable field, so it is not
        // part of the sanitization rules. Preserve it explicitly so PHASE 3 can
        // tell CREATE from UPDATE/PATCH.
        if (isset($data['id'])) {
            $clean['id'] = $data['id'];
        }

        // ============ PHASE 2: REQUIRED VALIDATION ============
        // WHY: Fail fast before touching the database. 'title' is the only
        // mandatory field on the Tasks model (NOT NULL column).
        if (empty($clean['title'])) {
            $res->messages['error'][] = 'module_rest_api_v3_task_title_required';
            $res->httpCode = 422;
            return $res;
        }

        // ============ PHASE 3: DETERMINE OPERATION ============
        // WHY: CREATE and UPDATE/PATCH diverge in two places — default application
        // (PHASE 4) and whether a missing record is an error. Lookup uses the
        // numeric primary key 'id', matching the DataStructure response schema and
        // the documented reference action.
        $recordId   = $clean['id'] ?? null;
        $httpMethod = $data['httpMethod'] ?? 'POST';
        $isNewRecord = empty($recordId);

        if ($isNewRecord) {
            $task = new Tasks();
        } else {
            $task = Tasks::findFirstById($recordId);
            if ($task === null) {
                // WHY: PUT/PATCH against a non-existent resource MUST return 404
                // (strict REST semantics); POST with a custom id MAY create it
                // (useful for migrations/imports). validateRecordExistence()
                // encodes exactly this rule.
                $error = self::validateRecordExistence($httpMethod, 'Task');
                if ($error !== null) {
                    $res->messages['error'][] = $error['message'];
                    $res->httpCode = $error['code'];
                    return $res;
                }
                // POST with custom id: fall back to creating a fresh record.
                $task = new Tasks();
                $isNewRecord = true;
            }
        }

        // ============ PHASE 4: APPLY DEFAULTS (CREATE ONLY!) ============
        // WHY CREATE: A brand-new record needs a complete dataset, so missing
        // optional fields (status, priority) get their schema defaults.
        // WHY NOT UPDATE/PATCH: Applying defaults would silently overwrite values
        // the caller intentionally left untouched in a partial update.
        if ($isNewRecord) {
            $clean = DataStructure::applyDefaults($clean);
        }

        // ============ PHASE 5: SCHEMA VALIDATION ============
        // WHY: Validate AFTER defaults so the whole dataset is checked against the
        // schema constraints (status enum, priority 0-10, title length). Returns a
        // list of human-readable errors; an empty list means the data is valid.
        $schemaErrors = DataStructure::validateInputData($clean);
        if (!empty($schemaErrors)) {
            $res->messages['error'] = $schemaErrors;
            $res->httpCode = 422;
            return $res;
        }

        // ============ PHASE 6: SAVE ============
        // WHY: All-or-nothing. executeInTransaction() commits on success and rolls
        // back + logs on any thrown exception. Inside the closure we write only the
        // fields actually present in the payload (array_key_exists), which makes
        // PATCH safe: a partial body never blanks out columns it did not mention.
        try {
            $savedTask = self::executeInTransaction(function () use ($task, $clean, $isNewRecord) {
                // WHY: The 'uniqid' column is NOT NULL and is NOT auto-populated by
                // ModelsBase (beforeValidationOnCreate only fills annotation
                // defaults, and uniqid has none). We therefore generate the public
                // identifier explicitly on CREATE — exactly as Core resources such
                // as DialplanApplications do. On UPDATE the existing uniqid is kept.
                if ($isNewRecord) {
                    $task->uniqid = Tasks::generateUniqueID('TASK');
                }

                // Persist only the columns that the Tasks model actually defines.
                // The file-related schema fields (attachment/filename/file) are
                // handled by the dedicated Upload/Download actions, not here.
                //
                // WHY the explicit (int) cast on 'priority':
                // The Tasks model declares `public ?int $priority`, and this file
                // runs under declare(strict_types=1). The sanitizer's 'integer'
                // schema type is NOT cast to a real int by BaseActionHelper (its
                // switch only handles the 'int' rule), so a form-encoded request
                // delivers priority as the string "7". Assigning a string to a
                // typed int property under strict types would raise a TypeError.
                // Casting here guarantees a real int reaches the typed column.
                // 'title' and 'status' map to string columns, so they pass through.
                foreach (['title', 'status', 'priority'] as $field) {
                    if (array_key_exists($field, $clean)) {
                        $task->$field = ($field === 'priority')
                            ? (int)$clean[$field]
                            : $clean[$field];
                    }
                }

                if (!$task->save()) {
                    // Surface ORM validation/SQL errors so handleError() can log them.
                    throw new \Exception(implode(', ', $task->getMessages()));
                }

                return $task;
            });
        } catch (\Exception $e) {
            // Consistent error envelope + syslog via the inherited helper.
            return self::handleError($e, $res);
        }

        // ============ PHASE 7: RESPONSE ============
        // WHY: Return a consistent, schema-true representation built ONLY from the
        // persisted model — never echo back fields the table does not store.
        $res->data = [
            'id'       => (int)$savedTask->id,
            'uniqid'   => $savedTask->uniqid,
            'title'    => $savedTask->title,
            'status'   => $savedTask->status,
            'priority' => (int)$savedTask->priority,
        ];
        $res->success  = true;
        $res->httpCode = $isNewRecord ? 201 : 200; // 201 Created, 200 OK

        // Reuse the base-class structured logger for a uniform audit trail.
        self::logSuccessfulSave('Task', $savedTask->title, $savedTask->uniqid, __METHOD__);

        return $res;
    }
}
