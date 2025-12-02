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
 * ModuleExampleRestAPIv2 - JavaScript for testing REST API.
 *
 * All operations processed via backend worker (ModuleRestAPIProcessor).
 */
const ModuleRestAPIv2 = {
    /**
     * Last created user ID for demo update/delete operations.
     */
    lastCreatedUserId: null,

    /**
     * Initialize module.
     */
    initialize() {
        $('.test-api-v2').on('click', (e) => {
            const $btn = $(e.currentTarget);
            const controller = $btn.data('controller');
            const action = $btn.data('action');
            const download = $btn.data('download');

            // jQuery .data() auto-converts "true" string to boolean
            if (download === true || download === 'true') {
                ModuleRestAPIv2.downloadFile(controller, action, $btn);
            } else {
                ModuleRestAPIv2.testApi(controller, action, $btn);
            }
        });

        // Public endpoint test button
        $('.test-public-status').on('click', (e) => {
            const $btn = $(e.currentTarget);
            ModuleRestAPIv2.testPublicEndpoint($btn);
        });
    },

    /**
     * Test PUBLIC endpoint (no authentication required).
     *
     * @param {jQuery} $btn - Button element
     */
    testPublicEndpoint($btn) {
        $btn.addClass('loading disabled');

        const url = '/pbxcore/api/module-example-rest-api-v2/public/status';

        $.api({
            url: url,
            method: 'GET',
            on: 'now',
            onSuccess(response) {
                const isSuccess = response.result === true;
                ModuleRestAPIv2.showResponse(response, isSuccess ? 'success' : 'error');
            },
            onFailure(response) {
                ModuleRestAPIv2.showResponse(
                    { error: response.statusText || 'Request failed' },
                    'error'
                );
            },
            onError(errorMessage) {
                ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
            },
            onComplete() {
                $btn.removeClass('loading disabled');
            },
        });
    },

    /**
     * Test API call.
     *
     * @param {string} controller - Controller name (Get, Post)
     * @param {string} action - Action name
     * @param {jQuery} $btn - Button element
     */
    testApi(controller, action, $btn) {
        $btn.addClass('loading disabled');

        const url = `/pbxcore/api/module-example-rest-api-v2/${action}`;

        // Prepare request data for POST operations
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

        $.api({
            url: url,
            method: controller === 'Post' ? 'POST' : 'GET',
            data: requestData,
            on: 'now',
            onSuccess(response) {
                // Save created user ID for subsequent operations
                if (controller === 'Post' && action === 'create' && response.result === true) {
                    if (response.data && response.data.user && response.data.user.id) {
                        ModuleRestAPIv2.lastCreatedUserId = response.data.user.id;
                    }
                }

                const isSuccess = response.result === true;
                ModuleRestAPIv2.showResponse(response, isSuccess ? 'success' : 'error');
            },
            onFailure(response) {
                ModuleRestAPIv2.showResponse(
                    { error: response.statusText || 'Request failed' },
                    'error'
                );
            },
            onError(errorMessage) {
                ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
            },
            onComplete() {
                $btn.removeClass('loading disabled');
            },
        });
    },

    /**
     * Download or view file content.
     *
     * @param {string} controller - Controller name
     * @param {string} action - Action name
     * @param {jQuery} $btn - Button element
     */
    downloadFile(controller, action, $btn) {
        const mode = $btn.data('mode') || 'view';
        $btn.addClass('loading disabled');

        const url = `/pbxcore/api/module-example-rest-api-v2/${action}?filename=example.txt&mode=${mode}`;

        if (mode === 'download') {
            // Get download URL from backend, then redirect browser
            $.api({
                url: url,
                method: 'GET',
                on: 'now',
                onSuccess(response) {
                    if (response && response.result && response.data && response.data.filename) {
                        window.location.href = response.data.filename;
                        ModuleRestAPIv2.showResponse({
                            result: true,
                            message: 'File download started',
                            downloadUrl: response.data.filename
                        }, 'success');
                    } else {
                        ModuleRestAPIv2.showResponse(
                            { error: 'Invalid response: missing download URL' },
                            'error'
                        );
                    }
                },
                onFailure(response) {
                    ModuleRestAPIv2.showResponse(
                        { error: response.statusText || 'Request failed' },
                        'error'
                    );
                },
                onError(errorMessage) {
                    ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
                },
                onComplete() {
                    $btn.removeClass('loading disabled');
                },
            });
        } else {
            // View mode: display file content as JSON
            $.api({
                url: url,
                method: 'GET',
                on: 'now',
                onSuccess(response) {
                    if (response && response.result && response.data) {
                        ModuleRestAPIv2.showResponse({
                            result: true,
                            filename: response.data.filename,
                            size: response.data.size,
                            content: response.data.content
                        }, 'success');
                    } else {
                        ModuleRestAPIv2.showResponse(
                            { error: 'Invalid response format' },
                            'error'
                        );
                    }
                },
                onFailure(response) {
                    ModuleRestAPIv2.showResponse(
                        { error: response.statusText || 'Request failed' },
                        'error'
                    );
                },
                onError(errorMessage) {
                    ModuleRestAPIv2.showResponse({ error: errorMessage }, 'error');
                },
                onComplete() {
                    $btn.removeClass('loading disabled');
                },
            });
        }
    },

    /**
     * Display API response.
     *
     * @param {Object|string} response - API response
     * @param {string} type - Message type (success, error)
     */
    showResponse(response, type) {
        const $container = $('#api-response-v2').parent();
        const $response = $('#api-response-v2');

        const formattedResponse = typeof response === 'string'
            ? response
            : JSON.stringify(response, null, 2);

        $response.html(`<code class="language-json">${ModuleRestAPIv2.escapeHtml(formattedResponse)}</code>`);

        $container.removeClass('ui positive negative message');
        if (type === 'success') {
            $container.addClass('ui positive message');
        } else if (type === 'error') {
            $container.addClass('ui negative message');
        }
    },

    /**
     * Escape HTML to prevent XSS.
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

$(document).ready(() => ModuleRestAPIv2.initialize());
