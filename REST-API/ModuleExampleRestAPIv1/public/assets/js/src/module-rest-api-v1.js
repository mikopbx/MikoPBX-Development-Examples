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
 * ModuleExampleRestAPIv1 - JavaScript for testing REST API Pattern 1
 *
 * WHY: Demonstrates direct API calls using Semantic UI $.api
 */
const ModuleRestAPIv1 = {
    /**
     * API endpoints passed from controller
     */
    endpoints: {},

    /**
     * Initialize module
     *
     * WHY: Setup event handlers for testing buttons
     */
    initialize() {
        // Load API endpoints from data attributes
        ModuleRestAPIv1.loadEndpoints();

        // Setup event handlers for test buttons
        $('.test-api-button').on('click', (e) => {
            e.preventDefault();
            const $button = $(e.currentTarget);
            const action = $button.data('action');
            ModuleRestAPIv1.testApiCall(action, $button);
        });
    },

    /**
     * Load API endpoints from DOM
     *
     * WHY: Get endpoint URLs from View
     */
    loadEndpoints() {
        $('.endpoint-item').each(function() {
            const action = $(this).data('action');
            const endpoint = $(this).data('endpoint');
            ModuleRestAPIv1.endpoints[action] = endpoint;
        });
    },

    /**
     * Test API call
     *
     * WHY: Demonstrates direct $.api usage without PbxApi wrapper
     *
     * @param {string} action - Action name (check, status, reload, stats)
     * @param {jQuery} $button - Button that triggered the action
     */
    testApiCall(action, $button) {
        // Show loading indicator
        $button.addClass('loading disabled');
        ModuleRestAPIv1.showResponse('Loading...', 'info');

        // Get endpoint URL
        const url = ModuleRestAPIv1.endpoints[action];
        if (!url) {
            ModuleRestAPIv1.showResponse({ error: `No endpoint for action: ${action}` }, 'error');
            $button.removeClass('loading disabled');
            return;
        }

        // Prepare request data
        const requestData = {};

        // For reload add force parameter
        if (action === 'reload') {
            requestData.force = false;
        }

        // For stats add period parameter
        if (action === 'stats') {
            requestData.period = 'today';
        }

        // WHY: Direct $.api call - no external dependencies
        // Uses Semantic UI's API module for clean HTTP requests
        $.api({
            url: url,
            method: 'POST',
            data: requestData,
            on: 'now',
            onSuccess(response) {
                // Display success result
                if (response.result === true) {
                    ModuleRestAPIv1.showResponse(response, 'success');
                } else {
                    ModuleRestAPIv1.showResponse(response, 'error');
                }
            },
            onFailure(response) {
                // Display error
                ModuleRestAPIv1.showResponse(
                    { error: response.statusText || 'Request failed' },
                    'error'
                );
            },
            onError(errorMessage) {
                // Display error message
                ModuleRestAPIv1.showResponse({ error: errorMessage }, 'error');
            },
            onComplete() {
                // Remove loading indicator
                $button.removeClass('loading disabled');
            },
        });
    },

    /**
     * Display API response
     *
     * WHY: Pretty format JSON response with syntax highlighting
     *
     * @param {Object|string} response - API response
     * @param {string} type - Message type (success, error, info)
     */
    showResponse(response, type) {
        const $container = $('#api-response-container');
        const $response = $('#api-response');

        // Format JSON with indentation
        let formattedResponse;
        if (typeof response === 'string') {
            formattedResponse = response;
        } else {
            formattedResponse = JSON.stringify(response, null, 2);
        }

        // Update content
        $response.html(`<code class="language-json">${ModuleRestAPIv1.escapeHtml(formattedResponse)}</code>`);

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
     * WHY: Security - prevent XSS
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
$(document).ready(() => {
    ModuleRestAPIv1.initialize();
});
