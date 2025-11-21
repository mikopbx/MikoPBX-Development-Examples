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

/* global globalRootUrl, PbxApi, EventBus, $ */

/**
 * AMI Terminal Example Module
 * WHY: Educational module demonstrating AMI events streaming and command execution
 * ARCHITECTURE: EventBus subscription + REST API Pattern 1
 *
 * @module ModuleExampleAmi
 */
const ModuleExampleAmi = {
    /**
     * Events monitoring enabled flag
     * WHY: Toggle for event subscription
     */
    eventsEnabled: true,

    /**
     * Maximum lines in events log
     * WHY: Prevent memory overflow from unlimited events
     */
    maxEventsLogLines: 200,

    /**
     * Initialize module
     * WHY: Entry point - setup event handlers and EventBus subscription
     * EDUCATIONAL: Shows complete initialization pattern
     */
    initialize() {
        // WHY: Initialize Fomantic UI tabs
        $('#ami-tab-menu .item').tab();

        // WHY: Initialize Fomantic UI components
        ModuleExampleAmi.initializeUI();

        // WHY: Setup button handlers
        ModuleExampleAmi.setupEventHandlers();

        // WHY: Subscribe to AMI events via EventBus
        // CRITICAL: EventBus is the ONLY way to receive real-time events
        // Backend publishes to 'ami-events' channel via EventBusProvider
        console.log('[AMI] Subscribing to EventBus channel: ami-events');
        EventBus.subscribe('ami-events', (data) => {
            ModuleExampleAmi.onAmiEvent(data);
        });

        console.log(globalTranslate.module_ami_Initialized);
        console.log('[AMI] Events monitoring enabled:', ModuleExampleAmi.eventsEnabled);
    },

    /**
     * Initialize Fomantic UI components
     * WHY: Setup UI controls (checkboxes, etc.)
     */
    initializeUI() {
        // WHY: Initialize toggle checkbox for events monitoring
        $('#ami-events-toggle').checkbox({
            onChecked() {
                ModuleExampleAmi.eventsEnabled = true;
                console.log(globalTranslate.module_ami_EventsEnabled);
            },
            onUnchecked() {
                ModuleExampleAmi.eventsEnabled = false;
                console.log(globalTranslate.module_ami_EventsDisabled);
            }
        });
    },

    /**
     * Setup event handlers for buttons
     * WHY: Attach click handlers to UI controls
     */
    setupEventHandlers() {
        // WHY: Send AMI command button
        $('#send-ami-command').on('click', () => {
            ModuleExampleAmi.sendCommand();
        });

        // WHY: Allow Enter key in textarea to send command (with Ctrl/Cmd)
        $('#ami-command-input').on('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                ModuleExampleAmi.sendCommand();
            }
        });

        // WHY: Clear response button
        $('#clear-response').on('click', () => {
            $('#ami-response-output').val('');
        });

        // WHY: Clear events log button
        $('#clear-events').on('click', () => {
            $('#ami-events-log').html('');
        });

        // WHY: Click on example command links
        $(document).on('click', '.ami-example-link', (e) => {
            e.preventDefault();
            const command = $(e.currentTarget).data('command');
            $('#ami-command-input').val(command);
            // WHY: Auto-send command on example click
            ModuleExampleAmi.sendCommand();
        });

        // WHY: Fullscreen toggle for events log
        $('#ami-events-fullscreen-toggle').on('click', () => {
            ModuleExampleAmi.toggleFullscreen();
        });
    },

    /**
     * Send AMI command to Asterisk
     * WHY: Execute AMI command via REST API and display response
     * ENDPOINT: POST /pbxcore/api/modules/ModuleExampleAmi/sendCommand
     * PATTERN: REST API Pattern 1 (moduleRestAPICallback)
     */
    sendCommand() {
        const command = $('#ami-command-input').val().trim();

        if (!command) {
            ModuleExampleAmi.showError(globalTranslate.module_ami_ErrorNoCommand);
            return;
        }

        // WHY: Show loading state
        $('#send-ami-command').addClass('loading');
        $('#ami-response-output').val(`${globalTranslate.module_ami_SendingCommand}\n`);

        // WHY: Make API request using Fomantic UI $.api
        // NOTE: Use absolute path for API endpoints (not globalRootUrl which includes /admin-cabinet/)
        $.api({
            url: '/pbxcore/api/modules/ModuleExampleAmi/sendCommand',
            on: 'now',
            method: 'POST',
            data: { command },
            successTest: PbxApi.successTest,

            /**
             * Success callback
             * WHY: Handle successful API response
             */
            onSuccess(response) {
                $('#send-ami-command').removeClass('loading');

                // WHY: Format response for display
                const output = ModuleExampleAmi.formatCommandResponse(response);
                const $output = $('#ami-response-output');
                $output.val(output);

                // WHY: Auto-adjust height based on content
                ModuleExampleAmi.autoResizeTextarea($output);
            },

            /**
             * Failure callback
             * WHY: Handle API errors
             */
            onFailure(response) {
                $('#send-ami-command').removeClass('loading');

                const errorMsg = response.messages?.error?.join('\n') || globalTranslate.module_ami_UnknownError;
                $('#ami-response-output').val(`${globalTranslate.module_ami_ErrorPrefix}${errorMsg}`);
                ModuleExampleAmi.showError(errorMsg);
            },

            /**
             * Error callback
             * WHY: Handle network/HTTP errors
             */
            onError() {
                $('#send-ami-command').removeClass('loading');
                $('#ami-response-output').val(globalTranslate.module_ami_NetworkError);
            }
        });
    },

    /**
     * Format AMI command response for display
     * WHY: Convert API response to readable format
     *
     * @param {object} response - API response object
     * @returns {string} Formatted response text
     */
    formatCommandResponse(response) {
        const timestamp = response.data?.timestamp || new Date().toLocaleString();
        const command = response.data?.command || '';
        const result = response.data?.response || {};

        let output = `[${timestamp}] Command: ${command}\n`;
        output += '─'.repeat(80) + '\n';

        // WHY: Handle different response formats
        if (result.data && Array.isArray(result.data)) {
            // WHY: Extract actual data, skip "Command output follows" header
            const cleanData = result.data.filter(line => {
                return line.trim() !== '' &&
                       !line.includes('Privilege: Command') &&
                       !line.includes('--END COMMAND--');
            });
            output += cleanData.join('\n');
        } else if (typeof result === 'object') {
            // WHY: Format AMI Action responses (CoreStatus, Ping, etc.)
            if (result.Response || result.Message || result.Ping) {
                // WHY: Native AMI Action response
                for (const [key, value] of Object.entries(result)) {
                    if (key !== 'data' && value) {
                        output += `${key}: ${value}\n`;
                    }
                }
            } else {
                // WHY: Fallback to JSON for unknown formats
                output += JSON.stringify(result, null, 2);
            }
        } else {
            output += result;
        }

        return output;
    },

    /**
     * Handle incoming AMI event from EventBus
     * WHY: Process real-time AMI events and display in log
     * EDUCATIONAL: Demonstrates EventBus.subscribe() callback pattern
     *
     * @param {object} data - Event data from EventBus
     * @param {string} data.event - Event type (e.g., "Newchannel", "Hangup")
     * @param {object} data.data - Full AMI event parameters
     * @param {string} data.timestamp - Event timestamp
     */
    onAmiEvent(data) {
        // DEBUG: Log all received events
        console.log('[AMI Event]', data);

        // WHY: Skip if events monitoring is disabled
        if (!ModuleExampleAmi.eventsEnabled) {
            console.log('[AMI Event] Skipped - monitoring disabled');
            return;
        }

        // WHY: Skip internal ping events from worker
        if (data.event === 'UserEvent' && data.data?.UserEvent?.includes('Ping')) {
            return;
        }

        // WHY: Format event for display
        const eventLine = ModuleExampleAmi.formatEventLine(data);

        // WHY: Append to events log
        ModuleExampleAmi.appendToEventsLog(eventLine);
    },

    /**
     * Format AMI event as multi-line block with syntax highlighting
     * WHY: Show complete AMI event data from Asterisk with colors
     *
     * @param {object} data - Event data
     * @returns {string} Formatted event block with HTML
     */
    formatEventLine(data) {
        const timestamp = data.timestamp || new Date().toLocaleString();
        const event = data.event || 'Unknown';
        const params = data.data || {};

        // WHY: Escape HTML to prevent XSS
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        // WHY: Start with event header with syntax highlighting
        let output = `<div class="ami-event-block">`;
        output += `<span class="ami-timestamp">[${escapeHtml(timestamp)}]</span> <span class="ami-event-name">Event: ${escapeHtml(event)}</span>\n`;

        // WHY: Add all parameters from AMI event with syntax highlighting
        for (const [key, value] of Object.entries(params)) {
            if (key !== 'Event') { // WHY: Skip Event key (already in header)
                // WHY: Handle nested objects (like ChanVariable)
                if (typeof value === 'object' && value !== null) {
                    output += `  <span class="ami-key">${escapeHtml(key)}</span><span class="ami-separator">:</span>\n`;
                    for (const [subKey, subValue] of Object.entries(value)) {
                        output += `    <span class="ami-key">${escapeHtml(subKey)}</span><span class="ami-separator">:</span> <span class="ami-value">${escapeHtml(String(subValue))}</span>\n`;
                    }
                } else {
                    output += `  <span class="ami-key">${escapeHtml(key)}</span><span class="ami-separator">:</span> <span class="ami-value">${escapeHtml(String(value))}</span>\n`;
                }
            }
        }

        // WHY: Add separator for readability
        output += '\n</div>';

        return output;
    },

    /**
     * Append HTML to events log with line limit
     * WHY: Add event to log and prevent memory overflow
     *
     * @param {string} html - HTML to append
     */
    appendToEventsLog(html) {
        const $log = $('#ami-events-log');

        // WHY: Append HTML directly (already escaped in formatEventLine)
        $log.append(html);

        // WHY: Limit number of event blocks to prevent memory overflow
        const $events = $log.children();
        if ($events.length > ModuleExampleAmi.maxEventsLogLines) {
            // WHY: Remove oldest events
            $events.slice(0, $events.length - ModuleExampleAmi.maxEventsLogLines).remove();
        }

        // WHY: Auto-scroll to bottom to show latest events
        $log.scrollTop($log[0].scrollHeight);
    },

    /**
     * Auto-resize textarea to fit content
     * WHY: Improve UX by showing full response without scrolling
     *
     * @param {jQuery} $textarea - jQuery textarea element
     */
    autoResizeTextarea($textarea) {
        const minHeight = 300; // WHY: Match min-height from CSS
        const maxHeight = 800; // WHY: Prevent extremely tall textareas

        // WHY: Reset height to recalculate scrollHeight
        $textarea.css('height', 'auto');

        // WHY: Calculate required height based on content
        const scrollHeight = $textarea[0].scrollHeight;
        const newHeight = Math.max(minHeight, Math.min(scrollHeight + 20, maxHeight));

        // WHY: Apply new height with smooth transition
        $textarea.css('height', `${newHeight}px`);
    },

    /**
     * Toggle fullscreen mode for events log
     * WHY: Allow users to view events in fullscreen for better visibility
     */
    toggleFullscreen() {
        const $log = $('#ami-events-log');
        const $wrapper = $log.parent();
        const $button = $('#ami-events-fullscreen-toggle');
        const $icon = $button.find('i');

        // WHY: Check if already in fullscreen
        if ($wrapper.hasClass('fullscreen-mode')) {
            // WHY: Exit fullscreen
            $wrapper.removeClass('fullscreen-mode');
            $icon.removeClass('compress').addClass('expand');
        } else {
            // WHY: Enter fullscreen
            $wrapper.addClass('fullscreen-mode');
            $icon.removeClass('expand').addClass('compress');
        }
    },

    /**
     * Show error message
     * WHY: User feedback for errors
     *
     * @param {string} message - Error message
     */
    showError(message) {
        // WHY: Use Fomantic UI toast for non-blocking notification
        if (typeof UserMessage !== 'undefined') {
            UserMessage.showError(message);
        } else {
            console.error(message);
        }
    }
};

/**
 * Initialize on document ready
 * WHY: Start module after DOM is loaded
 */
$(document).ready(() => {
    ModuleExampleAmi.initialize();
});
