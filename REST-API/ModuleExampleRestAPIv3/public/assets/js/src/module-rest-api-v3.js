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
 * ModuleRestAPIv3 - Pattern 3 (Modern Auto-Discovery)
 *
 * WHY: Demonstrates the recommended Pattern 3 approach for modern REST API modules
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema generation
 * - RESTful HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Processor + Actions architecture
 *
 * @module ModuleRestAPIv3
 */
const ModuleRestAPIv3 = {
    /**
     * WHY: Base path follows Pattern 3 structure with API versioning
     * Format: /pbxcore/api/{version}/module-{module-slug}/{resource}
     */
    basePath: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',

    /**
     * WHY: Store current task ID from Get List or Create operations
     * Used for resource-level operations (Get Record, Update, Patch, Delete)
     */
    currentTaskId: null,

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
                    } else if (response.data.id) {
                        // Create/Get Record returns single object - save its ID
                        ModuleRestAPIv3.currentTaskId = response.data.id;
                        ModuleRestAPIv3.updateButtonLabels();
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
};

// WHY: Initialize on DOM ready
$(document).ready(() => ModuleRestAPIv3.initialize());
