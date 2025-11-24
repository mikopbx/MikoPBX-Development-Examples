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

/* global globalRootUrl, $, FilesAPI, Resumable, Config, FileUploadEventHandler */

/**
 * ModuleRestAPIv3 - REST API v3 with Auto-Discovery (Recommended Pattern)
 *
 * WHY: Demonstrates the recommended approach for modern REST API modules
 * This is Pattern 3 in the MikoPBX REST API patterns:
 *
 * Pattern 1: Basic REST API
 * - Manual route registration in moduleRestAPICallback()
 * - Simple, direct approach for basic endpoints
 * - Good for learning and simple use cases
 *
 * Pattern 2: Extended REST API
 * - Namespace isolation with module prefix
 * - Manual registration but with better organization
 * - Prevents endpoint conflicts between modules
 *
 * Pattern 3: Modern Auto-Discovery (THIS MODULE)
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema auto-generation from DataStructure classes
 * - Processor + Actions architecture for clean code separation
 * - Recommended for all new development
 *
 * KEY FEATURES:
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema auto-generation from DataStructure classes
 * - RESTful HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Processor + Actions architecture for clean code separation
 * - Resource-level and collection-level custom methods
 * - Chunked file upload/download support
 *
 * @module ModuleRestAPIv3
 */
const ModuleRestAPIv3 = {
    /**
     * Base API path for all Tasks endpoints
     *
     * WHY: Follows REST API v3 naming convention with module namespace
     * Format: /pbxcore/api/v3/module-{module-slug}/{resource}
     * Example URLs:
     * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks (collection)
     * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks/1 (resource)
     * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks:getDefault (custom method)
     */
    basePath: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',

    /**
     * WHY: Store current task ID from Get List or Create operations
     * Used for resource-level operations (Get Record, Update, Patch, Delete)
     */
    currentTaskId: null,

    /**
     * Resumable.js instance for file uploads
     */
    resumable: null,

    /**
     * Initialize event handlers
     *
     * WHY: Attach click handlers to all test buttons on page load
     */
    initialize() {
        $('.test-v3').on('click', (e) => {
            const $btn = $(e.currentTarget);
            const method = $btn.data('method');
            const path = $btn.data('path');
            ModuleRestAPIv3.testApi(method, path, $btn);
        });

        // Initialize file upload using FilesAPI.attachToBtn (like sound files, modules, etc.)
        ModuleRestAPIv3.initializeFileUpload();

        // Initialize download handler
        $('#download-file-btn').on('click', () => {
            ModuleRestAPIv3.handleDownloadClick();
        });
    },

    /**
     * Initialize file upload using standard Core API
     *
     * WHY: Simpler and more reliable approach:
     * 1. Upload to Core's /pbxcore/api/files/uploadResumable
     * 2. On success, attach file to task via our API
     */
    initializeFileUpload() {
        // STEP 1: Use standard Core upload API
        // Correct endpoint: /pbxcore/api/v3/files:upload (REST API v3)
        const config = FilesAPI.configureResumable({
            target: `${Config.pbxUrl}/pbxcore/api/v3/files:upload`,
            fileType: ['mp3', 'wav', 'pdf', 'png', 'jpg', 'jpeg'],
            maxFileSize: 10 * 1024 * 1024,
            query: function(file) {
                const originalName = file.name || file.fileName;
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
                const extension = originalName.split('.').pop();
                const finalFilename = nameWithoutExt + '.' + extension;

                return {
                    resumableFilename: finalFilename,
                    category: 'task-attachment' // Core will use this in temp file naming
                };
            }
        });

        const resumable = new Resumable(config);

        if (!resumable.support) {
            console.error('Resumable.js is not supported');
            return;
        }

        // Assign to button
        const uploadBtn = document.getElementById('upload-file-btn');
        if (uploadBtn) {
            try {
                resumable.assignBrowse(uploadBtn);
            } catch (error) {
                console.error('Failed to assign browse:', error);
                return;
            }
        }

        // Setup event handlers with callback for successful upload
        FilesAPI.setupResumableEvents(resumable, (event, data) => {
            ModuleRestAPIv3.handleUploadEvent(event, data);
        }, true);

        ModuleRestAPIv3.resumable = resumable;
    },

    /**
     * Test API endpoint with given HTTP method and path
     *
     * WHY: Demonstrate RESTful API calls with different HTTP methods
     * Shows proper request body construction for POST/PUT/PATCH
     *
     * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
     * @param {string} path - Resource path (e.g., '/TASK-123' or ':getDefault')
     * @param {jQuery} $btn - Button element to show loading state
     */
    testApi(method, path, $btn) {
        $btn.addClass('loading disabled');

        // WHY: Replace :id placeholder with current task ID
        // Resource-level operations require an ID
        if (path.includes(':id')) {
            if (!ModuleRestAPIv3.currentTaskId) {
                ModuleRestAPIv3.showResponse(
                    { error: 'No task ID available. Please run "Get List" or "Create" first.' },
                    'error'
                );
                $btn.removeClass('loading disabled');
                return;
            }
            path = path.replace(':id', ModuleRestAPIv3.currentTaskId);
        }

        // WHY: Build full URL from base path + resource path
        const url = ModuleRestAPIv3.basePath + path;

        // WHY: Only POST/PUT/PATCH methods send request body
        // GET and DELETE requests have no body
        const requestData = method === 'POST' || method === 'PUT' || method === 'PATCH'
            ? { title: 'Test Task', status: 'pending', priority: 5 }
            : {};

        // WHY: Use $.api for proper authentication and session management
        // Semantic UI handles cookies and CSRF tokens automatically
        $.api({
            url: url,
            method: method,
            data: requestData,
            on: 'now',
            onSuccess(response) {
                // WHY: Check response.result (REST API v3 returns PBXApiResult with 'result' field)
                const isSuccess = response.result === true;

                // WHY: Save task ID from Get List or Create responses
                if (isSuccess && response.data) {
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        // Get List returns array - save first item ID
                        ModuleRestAPIv3.currentTaskId = response.data[0].id;
                        ModuleRestAPIv3.updateButtonLabels();
                        ModuleRestAPIv3.updateFileTaskId();
                    } else if (response.data.id) {
                        // Create/Get Record returns single object - save its ID
                        ModuleRestAPIv3.currentTaskId = response.data.id;
                        ModuleRestAPIv3.updateButtonLabels();
                        ModuleRestAPIv3.updateFileTaskId();
                    }
                }

                // WHY: Show response with color coding (green = success, red = error)
                ModuleRestAPIv3.showResponse(response, isSuccess ? 'success' : 'error');
            },
            onFailure(response) {
                // Handle HTTP errors (4xx, 5xx)
                ModuleRestAPIv3.showResponse(response, 'error');
            },
            onError(errorMessage) {
                // WHY: Handle network errors or JSON parse errors
                ModuleRestAPIv3.showResponse(
                    { error: errorMessage || 'Network error occurred' },
                    'error'
                );
            },
            onComplete() {
                $btn.removeClass('loading disabled');
            },
        });
    },

    /**
     * Display API response with color coding
     *
     * WHY: Provide visual feedback for success (green) vs error (red)
     * Use escapeHtml to prevent XSS attacks from API responses
     *
     * @param {Object} data - Response data to display
     * @param {string} type - Response type ('success' or 'error')
     */
    showResponse(data, type) {
        const color = type === 'success' ? 'green' : 'red';
        const jsonStr = JSON.stringify(data, null, 2);

        // WHY: Escape HTML to prevent XSS attacks
        const safeJson = ModuleRestAPIv3.escapeHtml(jsonStr);

        $('#api-response-v3').html(
            `<code style="color: ${color};">${safeJson}</code>`
        );
    },

    /**
     * Escape HTML special characters
     *
     * WHY: Prevent XSS (Cross-Site Scripting) attacks
     * API responses might contain malicious HTML/JavaScript that could execute
     * Always escape user-provided or external data before inserting into DOM
     *
     * @param {string} text - Text to escape
     * @returns {string} Escaped text safe for HTML insertion
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    },

    /**
     * Update button labels to show current task ID
     *
     * WHY: Provide visual feedback about which task will be affected
     * Shows real ID from Get List or Create operations
     */
    updateButtonLabels() {
        if (!ModuleRestAPIv3.currentTaskId) {
            return;
        }

        // WHY: Update buttons that use :id placeholder with actual ID
        $('.test-v3[data-path*=":id"]').each(function() {
            const $btn = $(this);
            const baseText = $btn.data('base-text');
            $btn.text(`${baseText} (${ModuleRestAPIv3.currentTaskId})`);
        });
    },

    /**
     * Update file operations Task ID field
     *
     * WHY: Sync file operations with currently selected task
     * When user clicks "Get Record" for Task 2, file upload should go to Task 2
     */
    updateFileTaskId() {
        if (!ModuleRestAPIv3.currentTaskId) {
            return;
        }

        const $fileTaskId = $('#file-task-id');
        $fileTaskId.val(ModuleRestAPIv3.currentTaskId);

        // Visual feedback - highlight the field briefly
        $fileTaskId.addClass('flash');
        setTimeout(() => {
            $fileTaskId.removeClass('flash');
        }, 500);
    },


    /**
     * Handle Resumable.js upload events
     *
     * WHY: Process upload lifecycle events from Resumable.js
     * Similar to sound-file-modify.js event handling
     */
    handleUploadEvent(event, data) {
        console.log('Upload event:', event, data);

        switch (event) {
            case 'fileAdded':
                ModuleRestAPIv3.updateProgress(0, 'File selected, starting upload...');
                console.log('File added:', data.file.fileName || data.file.name);
                break;

            case 'uploadStart':
                ModuleRestAPIv3.updateProgress(0, 'Uploading...');
                break;

            case 'fileProgress':
                const percent = Math.floor(data.file.progress() * 100);
                ModuleRestAPIv3.updateProgress(percent);
                break;

            case 'progress':
                ModuleRestAPIv3.updateProgress(Math.floor(data.percent));
                break;

            case 'fileSuccess':
                // STEP 2: Attach uploaded file to task
                try {
                    const uploadResponse = JSON.parse(data.response);
                    console.log('Upload response:', uploadResponse);

                    const status = uploadResponse.data?.d_status;
                    const filePath = uploadResponse.data?.filename || '';
                    const fileId = uploadResponse.data?.upload_id || '';

                    if (status === 'MERGING') {
                        // File is being merged in background - need to wait
                        ModuleRestAPIv3.updateProgress(95, 'Merging chunks...', false);
                        ModuleRestAPIv3.showResponse({
                            success: true,
                            message: 'File uploaded, waiting for merge to complete...',
                            status: status,
                            file_id: fileId
                        }, 'success');

                        // Poll for merge completion
                        ModuleRestAPIv3.waitForMergeAndAttach(fileId, filePath);

                    } else if (filePath) {
                        // File is ready, attach immediately
                        ModuleRestAPIv3.updateProgress(100, 'Upload complete! Attaching to task...', true);
                        ModuleRestAPIv3.attachFileToTask(filePath, fileId);

                    } else {
                        ModuleRestAPIv3.showResponse({
                            success: true,
                            message: 'File uploaded to Core successfully',
                            data: uploadResponse
                        }, 'success');
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                    ModuleRestAPIv3.showResponse({
                        success: true,
                        message: 'File uploaded successfully (parse error)'
                    }, 'success');
                }
                break;

            case 'fileError':
                ModuleRestAPIv3.updateProgress(0, 'Upload failed', false);

                // Try to parse error response
                let errorMessage = data.message || 'Unknown error';
                if (data.file && data.file.xhr && data.file.xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(data.file.xhr.responseText);
                        console.error('Server error response:', errorResponse);
                        errorMessage = errorResponse.messages?.error?.join(', ') || errorResponse.error || errorMessage;
                    } catch (e) {
                        console.error('Raw error response:', data.file.xhr.responseText);
                    }
                }

                ModuleRestAPIv3.showResponse({
                    error: `Upload error: ${errorMessage}`
                }, 'error');
                break;

            case 'error':
                ModuleRestAPIv3.updateProgress(0, 'Upload failed', false);

                // Try to parse error response
                let errMsg = data.message || 'Unknown error';
                if (data.file && data.file.xhr && data.file.xhr.responseText) {
                    try {
                        const errorResp = JSON.parse(data.file.xhr.responseText);
                        console.error('Server error response:', errorResp);
                        errMsg = errorResp.messages?.error?.join(', ') || errorResp.error || errMsg;
                    } catch (e) {
                        console.error('Raw error response:', data.file.xhr.responseText);
                    }
                }

                ModuleRestAPIv3.showResponse({
                    error: `Error: ${errMsg}`
                }, 'error');
                break;

            case 'complete':
                console.log('All uploads completed');
                break;
        }
    },

    /**
     * Update progress bar using direct DOM manipulation
     *
     * WHY: Avoid dependency on Semantic UI Progress API
     * Works with any progress bar HTML structure
     *
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} label - Optional label text
     * @param {boolean} success - Mark as success (green)
     */
    updateProgress(percent, label = null, success = false) {
        const $progress = $('#upload-progress');
        const $bar = $progress.find('.bar');
        const $label = $progress.find('.label');

        // Update percentage
        $progress.attr('data-percent', percent);
        $bar.css('width', `${percent}%`);

        // Update label if provided
        if (label !== null) {
            $label.text(label);
        } else if (percent > 0 && percent < 100) {
            $label.text(`Uploading ${percent}%`);
        }

        // Update state classes
        $progress.removeClass('success error');
        if (success) {
            $progress.addClass('success');
        } else if (percent === 0 && label && label.includes('failed')) {
            $progress.addClass('error');
        }
    },

    /**
     * Wait for file merge to complete using EventBus, then attach to task
     *
     * WHY: Core merges chunks asynchronously and publishes events to EventBus
     * Much more efficient than polling - we get real-time updates
     *
     * @param {string} fileId - File unique identifier (upload_id)
     * @param {string} initialPath - Initial file path from upload response
     */
    waitForMergeAndAttach(fileId, initialPath) {
        console.log('Subscribing to EventBus for upload:', fileId);

        // Subscribe to EventBus events for this upload
        FileUploadEventHandler.subscribe(fileId, {
            onMergeStarted: (data) => {
                console.log('Merge started:', data);
                ModuleRestAPIv3.updateProgress(90, 'Merging file chunks...', false);
            },

            onMergeProgress: (data) => {
                console.log('Merge progress:', data);
                const percent = data.percent || 90;
                ModuleRestAPIv3.updateProgress(Math.min(95, percent), 'Merging...', false);
            },

            onMergeComplete: (data) => {
                console.log('Merge complete:', data);
                const filePath = data.filePath || data.filename || initialPath;

                // Unsubscribe from events
                FileUploadEventHandler.unsubscribe(fileId);

                // Attach file to task
                ModuleRestAPIv3.updateProgress(100, 'Merge complete! Attaching to task...', true);
                ModuleRestAPIv3.attachFileToTask(filePath, fileId);
            },

            onError: (data) => {
                console.error('Upload error:', data);

                // Unsubscribe from events
                FileUploadEventHandler.unsubscribe(fileId);

                ModuleRestAPIv3.showResponse({
                    error: `Merge failed: ${data.message || 'Unknown error'}`
                }, 'error');
                ModuleRestAPIv3.updateProgress(0, 'Merge failed', false);
            }
        });

        // Fallback: If no event arrives within 30 seconds, timeout
        setTimeout(() => {
            if (FileUploadEventHandler.subscriptions.has(fileId)) {
                console.warn('EventBus timeout for upload:', fileId);
                FileUploadEventHandler.unsubscribe(fileId);

                ModuleRestAPIv3.showResponse({
                    error: 'Merge timeout. File may still be processing.'
                }, 'error');
                ModuleRestAPIv3.updateProgress(0, 'Timeout', false);
            }
        }, 30000);
    },

    /**
     * Attach uploaded file to task (STEP 2 of upload process)
     *
     * WHY: After Core successfully uploads file, we need to link it to a task
     * Uses resource-level custom method (like :download)
     *
     * @param {string} filePath - Path to uploaded file (from Core response)
     * @param {string} fileId - File unique identifier (resumableIdentifier)
     */
    attachFileToTask(filePath, fileId) {
        const taskId = $('#file-task-id').val() || 1;

        // Call our custom uploadFile endpoint to attach file to task
        // NOTE: Resource-level custom method: /tasks/{id}:uploadFile (not /tasks:uploadFile?id=1)
        $.api({
            url: `${ModuleRestAPIv3.basePath}/${taskId}:uploadFile`,
            method: 'POST',
            data: {
                file_path: filePath,
                file_id: fileId
            },
            on: 'now',
            onSuccess(response) {
                ModuleRestAPIv3.showResponse(response, 'success');
                ModuleRestAPIv3.updateProgress(100, 'File attached to task!', true);
            },
            onFailure(response) {
                ModuleRestAPIv3.showResponse(response, 'error');
                ModuleRestAPIv3.updateProgress(0, 'Failed to attach file', false);
            },
            onError(errorMessage) {
                ModuleRestAPIv3.showResponse(
                    { error: errorMessage || 'Network error while attaching file' },
                    'error'
                );
                ModuleRestAPIv3.updateProgress(0, 'Failed to attach file', false);
            }
        });
    },

    /**
     * Handle download button click
     *
     * WHY: Use fetch() with Bearer token for authenticated download
     * Same pattern as sound files and call recordings
     */
    handleDownloadClick() {
        const taskId = $('#file-task-id').val();

        if (!taskId || taskId <= 0) {
            ModuleRestAPIv3.showResponse({ error: 'Please enter a valid Task ID' }, 'error');
            return;
        }

        // Build download URL (resource-level custom method)
        // NOTE: Now works for modules too! Use /tasks/{id}:download syntax
        const downloadUrl = `${Config.pbxUrl}${ModuleRestAPIv3.basePath}/${taskId}:download`;

        // Prepare headers with Bearer token (from TokenManager)
        const headers = {
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (typeof TokenManager !== 'undefined' && TokenManager.accessToken) {
            headers['Authorization'] = `Bearer ${TokenManager.accessToken}`;
        }

        // Show loading message
        ModuleRestAPIv3.showResponse({
            success: true,
            message: `Downloading file for task ${taskId}...`
        }, 'success');

        // Fetch file with authentication
        fetch(downloadUrl, { headers })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Extract filename from Content-Disposition header
                let filename = `task-${taskId}-attachment.mp3`; // Default fallback

                const contentDisposition = response.headers.get('Content-Disposition');
                if (contentDisposition) {
                    // Try to extract filename from Content-Disposition header
                    // Formats: attachment; filename="file.pdf" or attachment; filename*=UTF-8''file.pdf
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                        // Decode URL-encoded filenames (for filename*=UTF-8''...)
                        if (filename.includes('%')) {
                            try {
                                filename = decodeURIComponent(filename.split("''")[1] || filename);
                            } catch (e) {
                                // Keep original if decode fails
                            }
                        }
                    }
                }

                return response.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
                // Create download link
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Clean up blob URL
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

                ModuleRestAPIv3.showResponse({
                    success: true,
                    message: `File "${filename}" downloaded successfully`
                }, 'success');
            })
            .catch(error => {
                console.error('Download error:', error);
                ModuleRestAPIv3.showResponse({
                    error: `Download failed: ${error.message}`
                }, 'error');
            });
    },
};

// WHY: Initialize on DOM ready
$(document).ready(() => ModuleRestAPIv3.initialize());
