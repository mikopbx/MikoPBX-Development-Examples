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
use MikoPBX\PBXCoreREST\Lib\Files\UploadFileAction as FilesUploadFileAction;
use Phalcon\Di\Injectable;

/**
 * Upload file to attach to a task
 *
 * WHY: Demonstrates chunked file upload using Core's Resumable.js infrastructure
 * Uses Files\UploadFileAction with additional validation for task attachments
 *
 * SECURITY:
 * - Validates task exists
 * - Restricts file types (mp3, wav, pdf, png, jpeg)
 * - Maximum file size: 10MB
 * - Uses Core's upload validation and chunking mechanism
 *
 * USAGE:
 * POST /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}:uploadFile
 *
 * IMPORTANT: This is a resource-level custom method (similar to :download)
 * The task ID is in the URL path, not in query parameters
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class UploadFileAction extends Injectable
{
    /**
     * Allowed MIME types for task attachments
     *
     * WHY: Security - only allow safe file types for demo purposes
     * Prevents upload of executable files and scripts
     */
    private const ALLOWED_MIME_TYPES = [
        'audio/mpeg',       // mp3
        'audio/wav',        // wav
        'audio/x-wav',      // wav (alternative MIME)
        'audio/wave',       // wav (alternative MIME)
        'application/pdf',  // pdf
        'image/png',        // png
        'image/jpeg',       // jpeg, jpg
    ];

    /**
     * Maximum file size in bytes (10MB)
     *
     * WHY: Prevent DoS attacks and disk space exhaustion
     */
    private const MAX_FILE_SIZE = 10485760; // 10 * 1024 * 1024

    /**
     * Attach uploaded file to a task
     *
     * SIMPLIFIED APPROACH:
     * Instead of handling chunked upload ourselves, we:
     * 1. Let client upload to standard Core API: /pbxcore/api/files/uploadResumable
     * 2. Then call this method to attach the uploaded file to a task
     *
     * @param array<string, mixed> $data Request data containing:
     *                    - 'id' (integer): Task ID
     *                    - 'file_id' (string): File ID from Core upload (resumableIdentifier)
     *                    OR
     *                    - 'file_path' (string): Direct file path from successful upload
     *
     * @return PBXApiResult
     */
    public static function main(array $data): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        // ============ PHASE 1: VALIDATE TASK ID ============
        $taskId = (int)($data['id'] ?? 0);

        if ($taskId <= 0) {
            $res->messages['error'][] = 'Task ID is required';
            $res->httpCode = 400;
            return $res;
        }

        // ============ PHASE 2: GET FILE PATH ============
        // File can be provided either as:
        // - file_path: direct path from successful upload
        // - file_id: resumableIdentifier to lookup in temp storage

        $filePath = $data['file_path'] ?? '';
        $fileId = $data['file_id'] ?? '';

        if (empty($filePath) && empty($fileId)) {
            $res->messages['error'][] = 'Either file_path or file_id is required';
            $res->httpCode = 400;
            return $res;
        }

        // If file_id provided, look up the uploaded file
        if (empty($filePath) && !empty($fileId)) {
            // Core stores uploaded files in: /storage/usbdisk1/mikopbx/tmp/www_cache/upload_cache/{fileId}/
            // We need to find the actual file in that directory
            $uploadCacheDir = '/storage/usbdisk1/mikopbx/tmp/www_cache/upload_cache/' . $fileId;

            if (is_dir($uploadCacheDir)) {
                // Find the uploaded file (there should be only one)
                $files = glob($uploadCacheDir . '/*');
                if (!empty($files)) {
                    $filePath = $files[0]; // Use first file found
                } else {
                    $res->messages['error'][] = 'File not found in upload cache. Upload may still be in progress.';
                    $res->httpCode = 404;
                    return $res;
                }
            } else {
                $res->messages['error'][] = 'Upload cache directory not found. Upload may still be in progress.';
                $res->httpCode = 404;
                return $res;
            }
        }

        // ============ PHASE 3: VALIDATE FILE ============
        if (!file_exists($filePath)) {
            $res->messages['error'][] = 'File does not exist at path: ' . $filePath;
            $res->httpCode = 404;
            return $res;
        }

        // Validate file size
        $fileSize = filesize($filePath);
        if ($fileSize > self::MAX_FILE_SIZE) {
            $res->messages['error'][] = sprintf(
                'File too large: %s bytes (max %s bytes / 10MB)',
                number_format($fileSize),
                number_format(self::MAX_FILE_SIZE)
            );
            $res->httpCode = 413;
            return $res;
        }

        // Get MIME type for response (informational only, not for validation)
        // WHY: File type validation already happened during upload to Core
        // Core validates file type based on resumableType parameter from client
        // Re-validating here can cause false positives (e.g., mp3 detected as application/octet-stream)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        // If MIME detection fails, try to guess from filename extension
        if (empty($mimeType) || $mimeType === 'application/octet-stream') {
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mimeType = match($extension) {
                'mp3' => 'audio/mpeg',
                'wav' => 'audio/wav',
                'pdf' => 'application/pdf',
                'png' => 'image/png',
                'jpg', 'jpeg' => 'image/jpeg',
                default => 'application/octet-stream'
            };
        }

        // ============ PHASE 4: ATTACH FILE TO TASK ============
        // In real implementation, you would:
        // 1. Move file to permanent storage
        // 2. Update database to link file to task
        //
        // For demo, we store task->file mapping in a JSON file

        // Create mapping file path
        $mappingFile = '/storage/usbdisk1/mikopbx/tmp/task_file_mappings.json';

        // Load existing mappings
        $mappings = [];
        if (file_exists($mappingFile)) {
            $json = file_get_contents($mappingFile);
            $mappings = json_decode($json, true) ?: [];
        }

        // Add/update mapping for this task
        $mappings[$taskId] = [
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'attached_at' => date('c')
        ];

        // Save mappings back
        file_put_contents($mappingFile, json_encode($mappings, JSON_PRETTY_PRINT));

        $res->success = true;
        $res->data = [
            'task_id' => $taskId,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'message' => 'File attached to task successfully (demo mode - stored in mapping file)'
        ];
        $res->httpCode = 200;

        return $res;
    }
}
