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
use Phalcon\Di\Injectable;

/**
 * Download file attached to a task
 *
 * WHY: Demonstrates file download functionality for module REST API
 * Based on DownloadRecordAction pattern from Core
 *
 * SECURITY:
 * - Validates task exists in database
 * - Checks file exists and is readable
 * - Only allows files within allowed directories
 * - Returns 404 if file not found
 *
 * USAGE:
 * GET /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}:download
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class DownloadFileAction extends Injectable
{
    /**
     * Allowed directories for file downloads (security whitelist)
     *
     * WHY: Prevents directory traversal attacks
     * Only files within these directories can be downloaded
     */
    private const ALLOWED_DIRECTORIES = [
        '/storage/usbdisk1/mikopbx/tmp/',
        '/storage/usbdisk1/mikopbx/tmp/www_cache/',
        '/var/spool/asterisk/monitor/',
    ];

    /**
     * Download file attached to a task
     *
     * @param array<string, mixed> $data Request data containing:
     *                    - 'id' (integer): Task ID to download file from
     *
     * @return PBXApiResult
     */
    public static function main(array $data): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        // ============ PHASE 1: VALIDATE TASK ID ============
        // WHY: Ensure task exists before attempting file download
        $taskId = (int)($data['id'] ?? 0);

        if ($taskId <= 0) {
            $res->messages['error'][] = 'Task ID is required';
            $res->httpCode = 400;
            return $res;
        }

        // ============ PHASE 2: GET TASK DATA ============
        // WHY: In real implementation, this would fetch from database
        // For demo purposes, we'll simulate task data
        $taskData = self::getTaskById($taskId);

        if ($taskData === null) {
            $res->messages['error'][] = 'Task not found';
            $res->httpCode = 404;
            return $res;
        }

        // ============ PHASE 3: VALIDATE ATTACHMENT ============
        // WHY: Check if task has an attached file
        $attachmentPath = $taskData['attachment'] ?? '';

        if (empty($attachmentPath)) {
            $res->messages['error'][] = 'No file attached to this task';
            $res->httpCode = 404;
            return $res;
        }

        // ============ PHASE 4: SECURITY VALIDATION ============
        // WHY: Prevent directory traversal and unauthorized file access
        if (!self::isFileAllowed($attachmentPath)) {
            $res->messages['error'][] = 'File access denied - file must be in allowed directory';
            $res->httpCode = 403;
            return $res;
        }

        // ============ PHASE 5: FILE EXISTENCE CHECK ============
        // WHY: Ensure file actually exists on filesystem
        if (!file_exists($attachmentPath) || !is_file($attachmentPath)) {
            $res->messages['error'][] = 'Attached file not found on filesystem';
            $res->httpCode = 404;
            return $res;
        }

        // ============ PHASE 6: READABILITY CHECK ============
        // WHY: Ensure we have permissions to read the file
        if (!is_readable($attachmentPath)) {
            $res->messages['error'][] = 'Attached file is not readable';
            $res->httpCode = 403;
            return $res;
        }

        // ============ PHASE 7: PREPARE FILE METADATA ============
        // WHY: Get file information for response headers
        $fileInfo = pathinfo($attachmentPath);
        $mimeType = self::getMimeType($fileInfo['extension'] ?? '');
        $fileSize = filesize($attachmentPath);

        // Generate download filename
        $downloadName = $data['filename'] ?? null;
        if (empty($downloadName)) {
            // Use task title to create meaningful filename
            $taskTitle = preg_replace('/[^\w\-]/', '_', $taskData['title'] ?? 'task');
            $downloadName = "task_{$taskId}_{$taskTitle}.{$fileInfo['extension']}";
        }

        // ============ PHASE 8: PREPARE FPASSTHRU RESPONSE ============
        // WHY: Uses Core's file streaming infrastructure
        // BaseController::handleFileStreaming() will handle the actual file transfer
        $res->data = [
            'fpassthru' => [
                'filename' => $attachmentPath,
                'content_type' => $mimeType,
                'download_name' => $downloadName,
                'need_delete' => false,  // Don't delete task attachments
                'additional_headers' => []
            ]
        ];

        // Add file size header
        if ($fileSize !== false) {
            $res->data['fpassthru']['additional_headers']['Content-Length'] = (string)$fileSize;
        }

        $res->success = true;
        return $res;
    }

    /**
     * Check if file path is within allowed directories
     *
     * WHY: Security - prevents directory traversal attacks
     * Ensures only files in whitelisted directories can be downloaded
     *
     * @param string $filePath File path to validate
     * @return bool True if file is in allowed directory
     */
    private static function isFileAllowed(string $filePath): bool
    {
        // Normalize path to resolve .. and symlinks
        $realPath = realpath($filePath);

        if ($realPath === false) {
            // File doesn't exist or path is invalid
            return false;
        }

        // Check if file is within any allowed directory
        foreach (self::ALLOWED_DIRECTORIES as $allowedDir) {
            if (str_starts_with($realPath, $allowedDir)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get MIME type based on file extension
     *
     * WHY: Provides correct Content-Type header for browser
     *
     * @param string $extension File extension
     * @return string MIME type
     */
    private static function getMimeType(string $extension): string
    {
        return match (strtolower($extension)) {
            // Documents
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt' => 'text/plain',
            'csv' => 'text/csv',

            // Images
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',

            // Audio
            'mp3' => 'audio/mpeg',
            'wav' => 'audio/wav',
            'webm' => 'audio/webm',
            'ogg' => 'audio/ogg',

            // Video
            'mp4' => 'video/mp4',
            'avi' => 'video/x-msvideo',

            // Archives
            'zip' => 'application/zip',
            'tar' => 'application/x-tar',
            'gz' => 'application/gzip',

            default => 'application/octet-stream'
        };
    }

    /**
     * Get task by ID (demo implementation)
     *
     * WHY: In real module, this would query the module's database table
     * For demo purposes, reads from task_file_mappings.json
     *
     * @param int $taskId Task ID
     * @return array<string, mixed>|null Task data or null if not found
     */
    private static function getTaskById(int $taskId): ?array
    {
        // ============ REAL IMPLEMENTATION (commented) ============
        // In real module, you would query your database:
        //
        // $di = \Phalcon\Di\Di::getDefault();
        // $db = $di->get('db');
        // $sql = 'SELECT * FROM m_ModuleExampleRestAPIv3_tasks WHERE id = :id';
        // $result = $db->fetchOne($sql, \Phalcon\Db\Enum::FETCH_ASSOC, ['id' => $taskId]);
        //
        // return $result ?: null;

        // ============ DEMO IMPLEMENTATION ============
        // For demo purposes, read from mapping file created by UploadFileAction
        // In real implementation, this would come from database

        $mappingFile = '/storage/usbdisk1/mikopbx/tmp/task_file_mappings.json';

        if (!file_exists($mappingFile)) {
            // No mappings file yet - no tasks with attachments
            return null;
        }

        // Load mappings
        $json = file_get_contents($mappingFile);
        $mappings = json_decode($json, true) ?: [];

        // Check if this task has an attachment
        if (!isset($mappings[$taskId])) {
            // Task exists but has no attachment
            return [
                'id' => $taskId,
                'title' => 'Demo Task without Attachment',
                'status' => 'pending',
                'priority' => 5,
                'attachment' => null,
                'created_at' => date('c'),
                'updated_at' => date('c')
            ];
        }

        // Return task with attachment from mapping
        $mapping = $mappings[$taskId];
        return [
            'id' => $taskId,
            'title' => 'Demo Task with File Attachment',
            'status' => 'in_progress',
            'priority' => 5,
            'attachment' => $mapping['file_path'],
            'created_at' => $mapping['attached_at'] ?? date('c'),
            'updated_at' => $mapping['attached_at'] ?? date('c')
        ];
    }
}
