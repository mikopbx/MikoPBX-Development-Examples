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

/* global globalRootUrl */

/**
 * ModuleExampleRestAPIv2 - JavaScript for testing REST API
 *
 * BACKEND WORKER APPROACH:
 * All operations are processed through backend worker via ModuleRestAPIProcessor.
 * Controller delegates all requests to backend Actions for async processing.
 *
 * OPERATIONS:
 * - GET: config, users (via GetConfigAction, GetUsersAction)
 * - POST: create, update, delete (via CreateUserAction, UpdateUserAction, DeleteUserAction)
 * - FILE: download (via DownloadFileAction)
 *
 * HOW IT WORKS:
 * Request → Controller → sendRequestToBackendWorker()
 *        → Redis Queue → WorkerApiCommands
 *        → ModuleRestAPIProcessor::callBack()
 *        → Action::main() → Response
 *
 * PERFORMANCE: ~30-50ms (includes Redis queue overhead + processing time)
 *
 * BENEFITS:
 * - Non-blocking: PHP-FPM worker released immediately
 * - Async support: Multiple requests can be processed concurrently
 * - Database transactions: Safe ACID operations in worker
 * - Heavy operations: File generation, complex queries, external API calls
 */
const ModuleRestAPIv2 = {
    /**
     * Store last created user ID for demo purposes
     *
     * WHY: Update and Delete operations need user ID
     * After creating a user, we save the ID to use in subsequent operations
     */
    lastCreatedUserId: null,

    /**
     * Initialize module
     *
     * WHY: Setup event handlers for testing buttons
     */
    initialize() {
        $('.test-api-v2').on('click', (e) => {
            const $btn = $(e.currentTarget);
            const controller = $btn.data('controller');
            const action = $btn.data('action');
            const download = $btn.data('download');

            // WHY: File downloads need special handling (trigger browser download)
            if (download === 'true') {
                ModuleRestAPIv2.downloadFile(controller, action, $btn);
            } else {
                ModuleRestAPIv2.testApi(controller, action, $btn);
            }
        });
    },

    /**
     * Test API call to custom controller
     *
     * WHY: Demonstrates $.api usage with backend worker controllers
     * All operations processed through ModuleRestAPIProcessor
     *
     * @param {string} controller - Controller name (Get, Post, File)
     * @param {string} action - Action name
     * @param {jQuery} $btn - Button element
     */
    testApi(controller, action, $btn) {
        // Show loading indicator
        $btn.addClass('loading disabled');

        // WHY: Build URL for API routes
        // Pattern: /pbxcore/api/module-example-rest-api-v2/{action}
        // HTTP method (GET/POST) determines controller
        const url = `/pbxcore/api/module-example-rest-api-v2/${action}`;

        // Prepare request data for POST operations
        // WHY: Different POST actions need different data
        // - create: only name needed
        // - update/delete: need ID of previously created user
        let requestData = {};
        if (controller === 'Post') {
            if (action === 'create') {
                requestData = { name: 'Test User' };
            } else if (action === 'update') {
                if (ModuleRestAPIv2.lastCreatedUserId) {
                    requestData = { id: ModuleRestAPIv2.lastCreatedUserId, name: 'Updated User' };
                } else {
                    alert('Please create a user first before updating');
                    $btn.removeClass('loading disabled');
                    return;
                }
            } else if (action === 'delete') {
                if (ModuleRestAPIv2.lastCreatedUserId) {
                    requestData = { id: ModuleRestAPIv2.lastCreatedUserId };
                } else {
                    alert('Please create a user first before deleting');
                    $btn.removeClass('loading disabled');
                    return;
                }
            }
        }

        // WHY: Use $.api for proper authentication and session management
        // Semantic UI handles cookies and CSRF tokens automatically
        $.api({
            url: url,
            method: controller === 'Post' ? 'POST' : 'GET',
            data: requestData,
            on: 'now',
            onSuccess(response) {
                // WHY: Save created user ID for subsequent update/delete operations
                if (controller === 'Post' && action === 'create' && response.result === true) {
                    if (response.data && response.data.user && response.data.user.id) {
                        ModuleRestAPIv2.lastCreatedUserId = response.data.user.id;
                        console.log('Saved user ID:', ModuleRestAPIv2.lastCreatedUserId);
                    }
                }

                // WHY: Check response.result (not response.success) - PBXApiResult returns 'result'
                const isSuccess = response.result === true;
                ModuleRestAPIv2.showResponse(response, isSuccess ? 'success' : 'error');
            },
            onFailure(response) {
                // Handle HTTP errors
                ModuleRestAPIv2.showResponse(
                    { error: response.statusText || 'Request failed' },
                    'error'
                );
            },
            onError(errorMessage) {
                // Handle network errors
                ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
            },
            onComplete() {
                // WHY: Always remove loading state, even if error occurs
                $btn.removeClass('loading disabled');
            },
        });
    },

    /**
     * Show file content or download file based on mode
     *
     * WHY: TWO MODES - EXPLICIT AND SIMPLE
     * - mode=view: Get file content as JSON, display in result area ($.api)
     * - mode=download: Download file via browser (window.location)
     *
     * MODES:
     * 1. VIEW (default, mode=view)
     *    - GET /download?filename=example.txt&mode=view
     *    - Returns JSON: { content: "file contents..." }
     *    - Used by "Show Content" button
     *    - $.api displays content in result area
     *
     * 2. DOWNLOAD (mode=download)
     *    - GET /download?filename=example.txt&mode=download
     *    - Returns fpassthru (actual file download)
     *    - Used by "Download File" button
     *    - window.location triggers browser download
     *
     * BENEFITS:
     * - Simple: one parameter controls behavior
     * - Clear: explicit mode in URL
     * - Flexible: two buttons for different actions
     *
     * @param {string} controller - Controller name (File)
     * @param {string} action - Action name (download)
     * @param {jQuery} $btn - Button element
     */
    downloadFile(controller, action, $btn) {
        // WHY: Check button data attribute to determine mode
        const mode = $btn.data('mode') || 'view';

        // Show loading indicator
        $btn.addClass('loading disabled');

        // WHY: Build API URL with filename and mode parameters
        const url = `/pbxcore/api/module-example-rest-api-v2/${action}?filename=example.txt&mode=${mode}`;

        if (mode === 'download') {
            // MODE: DOWNLOAD - Use fetch() + Blob for authenticated download
            // WHY: window.location cannot send Authorization headers
            // fetch() allows Bearer token authentication for file downloads
            // Same pattern as Core's sound-files-index-player.js

            // WHY: Build full URL
            const fullUrl = url.startsWith('http') ? url : `${globalRootUrl}${url.replace(/^\//, '')}`;

            // WHY: Prepare headers with Bearer token for authentication
            const headers = {
                'X-Requested-With': 'XMLHttpRequest'
            };

            // WHY: Add Bearer token if TokenManager is available (API v3 auth)
            if (typeof TokenManager !== 'undefined' && TokenManager.accessToken) {
                headers['Authorization'] = `Bearer ${TokenManager.accessToken}`;
            }

            // WHY: Fetch file with authentication
            fetch(fullUrl, { headers })
                .then(response => {
                    // WHY: Check HTTP status
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // WHY: Extract filename from URL parameters
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    const filename = urlParams.get('filename') || 'download.txt';

                    // WHY: Create temporary download link with blob URL
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    // WHY: Clean up blob URL to free memory
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

                    // WHY: Show success message
                    ModuleRestAPIv2.showResponse({
                        result: true,
                        message: 'File downloaded successfully',
                        approach: 'Download mode (fetch + Blob)',
                        filename: filename
                    }, 'success');
                })
                .catch(error => {
                    // WHY: Handle errors (network, auth, etc.)
                    ModuleRestAPIv2.showResponse(
                        { error: error.message || 'Download failed' },
                        'error'
                    );
                })
                .finally(() => {
                    // WHY: Always remove loading state
                    $btn.removeClass('loading disabled');
                });
        } else {
            // MODE: VIEW (default) - Use $.api to get and display content
            // WHY: $.api provides callbacks for error handling
            $.api({
                url: url,
                method: 'GET',
                on: 'now',
                onSuccess(response) {
                    // WHY: Check response format
                    if (response && response.result && response.data) {
                        // WHY: Display file content in result area
                        ModuleRestAPIv2.showResponse({
                            result: true,
                            filename: response.data.filename,
                            size: response.data.size,
                            content: response.data.content,
                            approach: response.data.approach
                        }, 'success');
                    } else {
                        // WHY: Handle unexpected response format
                        ModuleRestAPIv2.showResponse(
                            { error: 'Invalid response format from server' },
                            'error'
                        );
                    }
                },
                onFailure(response) {
                    // WHY: Handle HTTP errors (400, 404, 500, etc.)
                    ModuleRestAPIv2.showResponse(
                        { error: response.statusText || 'Request failed' },
                        'error'
                    );
                },
                onError(errorMessage) {
                    // WHY: Handle network errors (connection refused, timeout, etc.)
                    ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
                },
                onComplete() {
                    // WHY: Always remove loading state, even if error occurs
                    $btn.removeClass('loading disabled');
                },
            });
        }
    },

    /**
     * Display API response with color coding
     *
     * WHY: Pretty format JSON response with syntax highlighting and security
     *
     * @param {Object|string} response - API response
     * @param {string} type - Message type (success, error)
     */
    showResponse(response, type) {
        const $container = $('#api-response-v2').parent();
        const $response = $('#api-response-v2');

        // Format JSON with indentation
        const formattedResponse = typeof response === 'string'
            ? response
            : JSON.stringify(response, null, 2);

        // WHY: Use escapeHtml to prevent XSS attacks
        $response.html(`<code class="language-json">${ModuleRestAPIv2.escapeHtml(formattedResponse)}</code>`);

        // Apply color scheme based on type
        $container.removeClass('ui positive negative message');
        if (type === 'success') {
            $container.addClass('ui positive message');
        } else if (type === 'error') {
            $container.addClass('ui negative message');
        }
    },

    /**
     * Escape HTML
     *
     * WHY: Security - prevent XSS attacks
     *
     * @param {string} text - Text to escape
     * @return {string} Escaped text
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
};

/**
 * Initialize on page load
 *
 * WHY: Start module after DOM is fully loaded
 */
$(document).ready(() => ModuleRestAPIv2.initialize());
