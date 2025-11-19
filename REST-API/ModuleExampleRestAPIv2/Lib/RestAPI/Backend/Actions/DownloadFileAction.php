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

namespace Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Phalcon\Di\Injectable;

/**
 * DownloadFileAction - Generate and download file via worker
 *
 * BACKEND (Worker via Processor):
 * This action is called by backend worker to generate files asynchronously.
 *
 * WHY BACKEND:
 * - File generation can be slow (compression, encryption)
 * - Non-blocking: PHP-FPM worker released immediately
 * - Can handle large files without timeout
 * - Supports async file generation (backups, exports)
 *
 * WHAT THIS ACTION DOES:
 * - Generates file based on request parameters
 * - Returns special 'fpassthru' format
 * - BaseController.handleFilePassThrough() streams file to client
 * - Optionally deletes temporary file after sending
 *
 * PERFORMANCE: Variable (depends on file size and generation complexity)
 * - Small file: ~50-100ms
 * - Large backup: 1-30 seconds
 *
 * REAL WORLD USE CASES:
 * - Module backup generation (tar.gz with settings + data)
 * - CDR export to CSV/Excel
 * - Call recording zip archives
 * - System configuration dumps
 *
 * FPASSTHRU FORMAT:
 * [
 *     'filename' => '/tmp/generated_file.tar.gz',      // Full path to file
 *     'fpassthru' => true,                             // Enable file streaming
 *     'content_type' => 'application/x-gzip',          // MIME type
 *     'download_name' => 'backup.tar.gz',              // Download filename
 *     'need_delete' => true,                           // Delete after sending
 *     'additional_headers' => ['X-Custom' => 'value'], // Optional headers
 * ]
 *
 * HOW IT'S CALLED:
 * Controller → sendRequestToBackendWorker(ModuleRestAPIProcessor::class, 'downloadFile', ...)
 *          → Redis queue → WorkerApiCommands
 *          → ModuleRestAPIProcessor::callBack(['action' => 'downloadFile'])
 *          → DownloadFileAction::main()
 *          → Returns fpassthru format
 *          → BaseController.handleFilePassThrough() streams to client
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class DownloadFileAction extends Injectable
{
    /**
     * Generate and download file
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions
     * - No state needed, just generate file and return fpassthru format
     *
     * REQUEST STRUCTURE:
     * [
     *     'action' => 'downloadFile',
     *     'data' => [
     *         'filename' => 'example.txt',  // Requested filename
     *     ]
     * ]
     *
     * RESPONSE:
     * PBXApiResult with:
     * - success: true/false
     * - data: fpassthru format for file streaming
     * - processor: __METHOD__ for debugging
     *
     * FPASSTHRU RESPONSE STRUCTURE:
     * [
     *     'data' => [
     *         'filename' => '/tmp/generated_file.txt',
     *         'fpassthru' => true,
     *         'content_type' => 'text/plain',
     *         'download_name' => 'example.txt',
     *         'need_delete' => true,
     *         'additional_headers' => [...]
     *     ]
     * ]
     *
     * @param array $request Request data from processor
     * @return PBXApiResult An object containing the result of the API call
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            // WHY: Extract request data
            $data = $request['data'] ?? [];

            // WHY: Get requested filename from data
            $requestedFile = $data['filename'] ?? 'example.txt';

            // WHY: Security - validate filename (prevent path traversal)
            $requestedFile = basename($requestedFile);

            // WHY: Use module's downloads directory
            $modulePath = '/storage/usbdisk1/mikopbx/custom_modules/ModuleExampleRestAPIv2';
            $sourceFile = $modulePath . '/downloads/' . $requestedFile;

            // WHY: Check if source file exists
            if (!file_exists($sourceFile)) {
                $res->success = false;
                $res->messages['error'][] = 'Source file not found: ' . $requestedFile;
                return $res;
            }

            // WHY: Generate temporary file for demonstration
            // Real workers would:
            // - Generate backup archives (tar.gz)
            // - Export database to CSV
            // - Compress multiple files
            // - Encrypt sensitive data
            $tempFile = '/tmp/mikopbx_v2_' . uniqid() . '_' . $requestedFile;

            // WHY: For demonstration, we'll copy source file to temp
            // Real implementation would generate content here
            copy($sourceFile, $tempFile);

            // WHY: Add header to show this is worker-generated
            $content = "WORKER-GENERATED FILE - Backend (Worker via Processor + Action)\n";
            $content .= "Generated at: " . date('Y-m-d H:i:s') . "\n";
            $content .= "Processor: ModuleRestAPIProcessor\n";
            $content .= "Action: " . __CLASS__ . '::' . __FUNCTION__ . "\n";
            $content .= "Original file: {$requestedFile}\n";
            $content .= str_repeat('=', 70) . "\n\n";
            $content .= file_get_contents($tempFile);
            file_put_contents($tempFile, $content);

            // WHY: Detect MIME type for proper Content-Type header
            $contentType = 'text/plain';
            if (function_exists('mime_content_type')) {
                $detectedType = mime_content_type($tempFile);
                if ($detectedType) {
                    $contentType = $detectedType;
                }
            }

            // WHY: TWO MODES - SIMPLE AND CLEAR
            // Use URL parameter to control behavior (explicit, not auto-detection)
            //
            // MODE 1: VIEW (default, mode=view or no mode parameter)
            // - GET /download?filename=example.txt&mode=view
            // - Returns JSON: { content: "file contents..." }
            // - Used by "Show Content" button
            // - $.api displays content in result area
            //
            // MODE 2: DOWNLOAD (mode=download)
            // - GET /download?filename=example.txt&mode=download
            // - Returns fpassthru (actual file download)
            // - Used by "Download File" button
            // - window.location triggers browser download
            //
            // BENEFITS:
            // - Explicit mode parameter (no auto-detection needed)
            // - Simple: one parameter controls behavior
            // - Clear: mode=view or mode=download
            // - Two buttons: "Show Content" and "Download File"

            // WHY: Extract mode parameter (default to 'view')
            $mode = $data['mode'] ?? 'view';

            if ($mode === 'download') {
                // MODE: DOWNLOAD - Return file via fpassthru
                $res->success = true;
                $res->data = [
                    'filename' => $tempFile,               // WHY: Path to file on server
                    'fpassthru' => true,                   // WHY: Enable file streaming
                    'content_type' => $contentType,        // WHY: MIME type
                    'download_name' => $requestedFile,     // WHY: Client-side filename
                    'need_delete' => true,                 // WHY: Delete after sending

                    // WHY: Optional additional headers
                    'additional_headers' => [
                        'X-Generated-By' => 'ModuleExampleRestAPIv2 Worker',
                        'X-Approach' => 'Download mode (fpassthru)',
                        'X-Processor-Class' => 'ModuleRestAPIProcessor',
                        'X-Action-Class' => __CLASS__,
                    ],
                ];
            } else {
                // MODE: VIEW (default) - Return JSON with file content
                $res->success = true;
                $res->data['content'] = file_get_contents($tempFile);
                $res->data['filename'] = $requestedFile;
                $res->data['size'] = filesize($tempFile);
                $res->data['mode'] = 'view';
                $res->data['approach'] = 'View mode (JSON with content)';

                // WHY: Clean up temp file after reading content
                unlink($tempFile);
            }

        } catch (\Throwable $e) {
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to generate file: ' . $e->getMessage();
        }

        return $res;
    }
}
