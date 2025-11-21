"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
var ModuleExampleAmi = {
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
  initialize: function initialize() {
    // WHY: Initialize Fomantic UI tabs
    $('#ami-tab-menu .item').tab(); // WHY: Initialize Fomantic UI components

    ModuleExampleAmi.initializeUI(); // WHY: Setup button handlers

    ModuleExampleAmi.setupEventHandlers(); // WHY: Subscribe to AMI events via EventBus
    // CRITICAL: EventBus is the ONLY way to receive real-time events
    // Backend publishes to 'ami-events' channel via EventBusProvider

    console.log('[AMI] Subscribing to EventBus channel: ami-events');
    EventBus.subscribe('ami-events', function (data) {
      ModuleExampleAmi.onAmiEvent(data);
    });
    console.log(globalTranslate.module_ami_Initialized);
    console.log('[AMI] Events monitoring enabled:', ModuleExampleAmi.eventsEnabled);
  },

  /**
   * Initialize Fomantic UI components
   * WHY: Setup UI controls (checkboxes, etc.)
   */
  initializeUI: function initializeUI() {
    // WHY: Initialize toggle checkbox for events monitoring
    $('#ami-events-toggle').checkbox({
      onChecked: function onChecked() {
        ModuleExampleAmi.eventsEnabled = true;
        console.log(globalTranslate.module_ami_EventsEnabled);
      },
      onUnchecked: function onUnchecked() {
        ModuleExampleAmi.eventsEnabled = false;
        console.log(globalTranslate.module_ami_EventsDisabled);
      }
    });
  },

  /**
   * Setup event handlers for buttons
   * WHY: Attach click handlers to UI controls
   */
  setupEventHandlers: function setupEventHandlers() {
    // WHY: Send AMI command button
    $('#send-ami-command').on('click', function () {
      ModuleExampleAmi.sendCommand();
    }); // WHY: Allow Enter key in textarea to send command (with Ctrl/Cmd)

    $('#ami-command-input').on('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        ModuleExampleAmi.sendCommand();
      }
    }); // WHY: Clear response button

    $('#clear-response').on('click', function () {
      $('#ami-response-output').val('');
    }); // WHY: Clear events log button

    $('#clear-events').on('click', function () {
      $('#ami-events-log').html('');
    }); // WHY: Click on example command links

    $(document).on('click', '.ami-example-link', function (e) {
      e.preventDefault();
      var command = $(e.currentTarget).data('command');
      $('#ami-command-input').val(command); // WHY: Auto-send command on example click

      ModuleExampleAmi.sendCommand();
    }); // WHY: Fullscreen toggle for events log

    $('#ami-events-fullscreen-toggle').on('click', function () {
      ModuleExampleAmi.toggleFullscreen();
    });
  },

  /**
   * Send AMI command to Asterisk
   * WHY: Execute AMI command via REST API and display response
   * ENDPOINT: POST /pbxcore/api/modules/ModuleExampleAmi/sendCommand
   * PATTERN: REST API Pattern 1 (moduleRestAPICallback)
   */
  sendCommand: function sendCommand() {
    var command = $('#ami-command-input').val().trim();

    if (!command) {
      ModuleExampleAmi.showError(globalTranslate.module_ami_ErrorNoCommand);
      return;
    } // WHY: Show loading state


    $('#send-ami-command').addClass('loading');
    $('#ami-response-output').val("".concat(globalTranslate.module_ami_SendingCommand, "\n")); // WHY: Make API request using Fomantic UI $.api
    // NOTE: Use absolute path for API endpoints (not globalRootUrl which includes /admin-cabinet/)

    $.api({
      url: '/pbxcore/api/modules/ModuleExampleAmi/sendCommand',
      on: 'now',
      method: 'POST',
      data: {
        command: command
      },
      successTest: PbxApi.successTest,

      /**
       * Success callback
       * WHY: Handle successful API response
       */
      onSuccess: function onSuccess(response) {
        $('#send-ami-command').removeClass('loading'); // WHY: Format response for display

        var output = ModuleExampleAmi.formatCommandResponse(response);
        var $output = $('#ami-response-output');
        $output.val(output); // WHY: Auto-adjust height based on content

        ModuleExampleAmi.autoResizeTextarea($output);
      },

      /**
       * Failure callback
       * WHY: Handle API errors
       */
      onFailure: function onFailure(response) {
        var _response$messages, _response$messages$er;

        $('#send-ami-command').removeClass('loading');
        var errorMsg = ((_response$messages = response.messages) === null || _response$messages === void 0 ? void 0 : (_response$messages$er = _response$messages.error) === null || _response$messages$er === void 0 ? void 0 : _response$messages$er.join('\n')) || globalTranslate.module_ami_UnknownError;
        $('#ami-response-output').val("".concat(globalTranslate.module_ami_ErrorPrefix).concat(errorMsg));
        ModuleExampleAmi.showError(errorMsg);
      },

      /**
       * Error callback
       * WHY: Handle network/HTTP errors
       */
      onError: function onError() {
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
  formatCommandResponse: function formatCommandResponse(response) {
    var _response$data, _response$data2, _response$data3;

    var timestamp = ((_response$data = response.data) === null || _response$data === void 0 ? void 0 : _response$data.timestamp) || new Date().toLocaleString();
    var command = ((_response$data2 = response.data) === null || _response$data2 === void 0 ? void 0 : _response$data2.command) || '';
    var result = ((_response$data3 = response.data) === null || _response$data3 === void 0 ? void 0 : _response$data3.response) || {};
    var output = "[".concat(timestamp, "] Command: ").concat(command, "\n");
    output += '─'.repeat(80) + '\n'; // WHY: Handle different response formats

    if (result.data && Array.isArray(result.data)) {
      // WHY: Extract actual data, skip "Command output follows" header
      var cleanData = result.data.filter(function (line) {
        return line.trim() !== '' && !line.includes('Privilege: Command') && !line.includes('--END COMMAND--');
      });
      output += cleanData.join('\n');
    } else if (_typeof(result) === 'object') {
      // WHY: Format AMI Action responses (CoreStatus, Ping, etc.)
      if (result.Response || result.Message || result.Ping) {
        // WHY: Native AMI Action response
        for (var _i = 0, _Object$entries = Object.entries(result); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
              key = _Object$entries$_i[0],
              value = _Object$entries$_i[1];

          if (key !== 'data' && value) {
            output += "".concat(key, ": ").concat(value, "\n");
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
  onAmiEvent: function onAmiEvent(data) {
    var _data$data, _data$data$UserEvent;

    // DEBUG: Log all received events
    console.log('[AMI Event]', data); // WHY: Skip if events monitoring is disabled

    if (!ModuleExampleAmi.eventsEnabled) {
      console.log('[AMI Event] Skipped - monitoring disabled');
      return;
    } // WHY: Skip internal ping events from worker


    if (data.event === 'UserEvent' && (_data$data = data.data) !== null && _data$data !== void 0 && (_data$data$UserEvent = _data$data.UserEvent) !== null && _data$data$UserEvent !== void 0 && _data$data$UserEvent.includes('Ping')) {
      return;
    } // WHY: Format event for display


    var eventLine = ModuleExampleAmi.formatEventLine(data); // WHY: Append to events log

    ModuleExampleAmi.appendToEventsLog(eventLine);
  },

  /**
   * Format AMI event as multi-line block with syntax highlighting
   * WHY: Show complete AMI event data from Asterisk with colors
   *
   * @param {object} data - Event data
   * @returns {string} Formatted event block with HTML
   */
  formatEventLine: function formatEventLine(data) {
    var timestamp = data.timestamp || new Date().toLocaleString();
    var event = data.event || 'Unknown';
    var params = data.data || {}; // WHY: Escape HTML to prevent XSS

    var escapeHtml = function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }; // WHY: Start with event header with syntax highlighting


    var output = "<div class=\"ami-event-block\">";
    output += "<span class=\"ami-timestamp\">[".concat(escapeHtml(timestamp), "]</span> <span class=\"ami-event-name\">Event: ").concat(escapeHtml(event), "</span>\n"); // WHY: Add all parameters from AMI event with syntax highlighting

    for (var _i2 = 0, _Object$entries2 = Object.entries(params); _i2 < _Object$entries2.length; _i2++) {
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
          key = _Object$entries2$_i[0],
          value = _Object$entries2$_i[1];

      if (key !== 'Event') {
        // WHY: Skip Event key (already in header)
        // WHY: Handle nested objects (like ChanVariable)
        if (_typeof(value) === 'object' && value !== null) {
          output += "  <span class=\"ami-key\">".concat(escapeHtml(key), "</span><span class=\"ami-separator\">:</span>\n");

          for (var _i3 = 0, _Object$entries3 = Object.entries(value); _i3 < _Object$entries3.length; _i3++) {
            var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i3], 2),
                subKey = _Object$entries3$_i[0],
                subValue = _Object$entries3$_i[1];

            output += "    <span class=\"ami-key\">".concat(escapeHtml(subKey), "</span><span class=\"ami-separator\">:</span> <span class=\"ami-value\">").concat(escapeHtml(String(subValue)), "</span>\n");
          }
        } else {
          output += "  <span class=\"ami-key\">".concat(escapeHtml(key), "</span><span class=\"ami-separator\">:</span> <span class=\"ami-value\">").concat(escapeHtml(String(value)), "</span>\n");
        }
      }
    } // WHY: Add separator for readability


    output += '\n</div>';
    return output;
  },

  /**
   * Append HTML to events log with line limit
   * WHY: Add event to log and prevent memory overflow
   *
   * @param {string} html - HTML to append
   */
  appendToEventsLog: function appendToEventsLog(html) {
    var $log = $('#ami-events-log'); // WHY: Append HTML directly (already escaped in formatEventLine)

    $log.append(html); // WHY: Limit number of event blocks to prevent memory overflow

    var $events = $log.children();

    if ($events.length > ModuleExampleAmi.maxEventsLogLines) {
      // WHY: Remove oldest events
      $events.slice(0, $events.length - ModuleExampleAmi.maxEventsLogLines).remove();
    } // WHY: Auto-scroll to bottom to show latest events


    $log.scrollTop($log[0].scrollHeight);
  },

  /**
   * Auto-resize textarea to fit content
   * WHY: Improve UX by showing full response without scrolling
   *
   * @param {jQuery} $textarea - jQuery textarea element
   */
  autoResizeTextarea: function autoResizeTextarea($textarea) {
    var minHeight = 300; // WHY: Match min-height from CSS

    var maxHeight = 800; // WHY: Prevent extremely tall textareas
    // WHY: Reset height to recalculate scrollHeight

    $textarea.css('height', 'auto'); // WHY: Calculate required height based on content

    var scrollHeight = $textarea[0].scrollHeight;
    var newHeight = Math.max(minHeight, Math.min(scrollHeight + 20, maxHeight)); // WHY: Apply new height with smooth transition

    $textarea.css('height', "".concat(newHeight, "px"));
  },

  /**
   * Toggle fullscreen mode for events log
   * WHY: Allow users to view events in fullscreen for better visibility
   */
  toggleFullscreen: function toggleFullscreen() {
    var $log = $('#ami-events-log');
    var $wrapper = $log.parent();
    var $button = $('#ami-events-fullscreen-toggle');
    var $icon = $button.find('i'); // WHY: Check if already in fullscreen

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
  showError: function showError(message) {
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

$(document).ready(function () {
  ModuleExampleAmi.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtZXhhbXBsZS1hbWktaW5kZXguanMiXSwibmFtZXMiOlsiTW9kdWxlRXhhbXBsZUFtaSIsImV2ZW50c0VuYWJsZWQiLCJtYXhFdmVudHNMb2dMaW5lcyIsImluaXRpYWxpemUiLCIkIiwidGFiIiwiaW5pdGlhbGl6ZVVJIiwic2V0dXBFdmVudEhhbmRsZXJzIiwiY29uc29sZSIsImxvZyIsIkV2ZW50QnVzIiwic3Vic2NyaWJlIiwiZGF0YSIsIm9uQW1pRXZlbnQiLCJnbG9iYWxUcmFuc2xhdGUiLCJtb2R1bGVfYW1pX0luaXRpYWxpemVkIiwiY2hlY2tib3giLCJvbkNoZWNrZWQiLCJtb2R1bGVfYW1pX0V2ZW50c0VuYWJsZWQiLCJvblVuY2hlY2tlZCIsIm1vZHVsZV9hbWlfRXZlbnRzRGlzYWJsZWQiLCJvbiIsInNlbmRDb21tYW5kIiwiZSIsImtleSIsImN0cmxLZXkiLCJtZXRhS2V5IiwicHJldmVudERlZmF1bHQiLCJ2YWwiLCJodG1sIiwiZG9jdW1lbnQiLCJjb21tYW5kIiwiY3VycmVudFRhcmdldCIsInRvZ2dsZUZ1bGxzY3JlZW4iLCJ0cmltIiwic2hvd0Vycm9yIiwibW9kdWxlX2FtaV9FcnJvck5vQ29tbWFuZCIsImFkZENsYXNzIiwibW9kdWxlX2FtaV9TZW5kaW5nQ29tbWFuZCIsImFwaSIsInVybCIsIm1ldGhvZCIsInN1Y2Nlc3NUZXN0IiwiUGJ4QXBpIiwib25TdWNjZXNzIiwicmVzcG9uc2UiLCJyZW1vdmVDbGFzcyIsIm91dHB1dCIsImZvcm1hdENvbW1hbmRSZXNwb25zZSIsIiRvdXRwdXQiLCJhdXRvUmVzaXplVGV4dGFyZWEiLCJvbkZhaWx1cmUiLCJlcnJvck1zZyIsIm1lc3NhZ2VzIiwiZXJyb3IiLCJqb2luIiwibW9kdWxlX2FtaV9Vbmtub3duRXJyb3IiLCJtb2R1bGVfYW1pX0Vycm9yUHJlZml4Iiwib25FcnJvciIsIm1vZHVsZV9hbWlfTmV0d29ya0Vycm9yIiwidGltZXN0YW1wIiwiRGF0ZSIsInRvTG9jYWxlU3RyaW5nIiwicmVzdWx0IiwicmVwZWF0IiwiQXJyYXkiLCJpc0FycmF5IiwiY2xlYW5EYXRhIiwiZmlsdGVyIiwibGluZSIsImluY2x1ZGVzIiwiUmVzcG9uc2UiLCJNZXNzYWdlIiwiUGluZyIsIk9iamVjdCIsImVudHJpZXMiLCJ2YWx1ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJldmVudCIsIlVzZXJFdmVudCIsImV2ZW50TGluZSIsImZvcm1hdEV2ZW50TGluZSIsImFwcGVuZFRvRXZlbnRzTG9nIiwicGFyYW1zIiwiZXNjYXBlSHRtbCIsInRleHQiLCJkaXYiLCJjcmVhdGVFbGVtZW50IiwidGV4dENvbnRlbnQiLCJpbm5lckhUTUwiLCJzdWJLZXkiLCJzdWJWYWx1ZSIsIlN0cmluZyIsIiRsb2ciLCJhcHBlbmQiLCIkZXZlbnRzIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJzbGljZSIsInJlbW92ZSIsInNjcm9sbFRvcCIsInNjcm9sbEhlaWdodCIsIiR0ZXh0YXJlYSIsIm1pbkhlaWdodCIsIm1heEhlaWdodCIsImNzcyIsIm5ld0hlaWdodCIsIk1hdGgiLCJtYXgiLCJtaW4iLCIkd3JhcHBlciIsInBhcmVudCIsIiRidXR0b24iLCIkaWNvbiIsImZpbmQiLCJoYXNDbGFzcyIsIm1lc3NhZ2UiLCJVc2VyTWVzc2FnZSIsInJlYWR5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQU1BLGdCQUFnQixHQUFHO0FBQ3JCO0FBQ0o7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLGFBQWEsRUFBRSxJQUxNOztBQU9yQjtBQUNKO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxpQkFBaUIsRUFBRSxHQVhFOztBQWFyQjtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0lD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QXJCO0FBQ0FvRSxNQUFBQSxLQUFLLENBQUNwRSxXQUFOLENBQWtCLFVBQWxCLEVBQThCVCxRQUE5QixDQUF1QyxRQUF2QztBQUNILEtBSkQsTUFJTztBQUNIO0FBQ0EwRSxNQUFBQSxRQUFRLENBQUMxRSxRQUFULENBQWtCLGlCQUFsQjtBQUNBNkUsTUFBQUEsS0FBSyxDQUFDcEUsV0FBTixDQUFrQixRQUFsQixFQUE0QlQsUUFBNUIsQ0FBcUMsVUFBckM7QUFDSDtBQUNKLEdBL1ZvQjs7QUFpV3JCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNJRixFQUFBQSxTQXZXcUIscUJBdVdYa0YsT0F2V1csRUF1V0Y7QUFDZjtBQUNBLFFBQUksT0FBT0MsV0FBUCxLQUF1QixXQUEzQixFQUF3QztBQUNwQ0EsTUFBQUEsV0FBVyxDQUFDbkYsU0FBWixDQUFzQmtGLE9BQXRCO0FBQ0gsS0FGRCxNQUVPO0FBQ0g3RyxNQUFBQSxPQUFPLENBQUM4QyxLQUFSLENBQWMrRCxPQUFkO0FBQ0g7QUFDSjtBQTlXb0IsQ0FBekI7QUFpWEE7QUFDQTtBQUNBO0FBQ0E7O0FBQ0FqSCxDQUFDLENBQUMwQixRQUFELENBQUQsQ0FBWXlGLEtBQVosQ0FBa0IsWUFBTTtBQUNwQnZILEVBQUFBLGdCQUFnQixDQUFDRyxVQUFqQjtBQUNILENBRkQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogTWlrb1BCWCAtIGZyZWUgcGhvbmUgc3lzdGVtIGZvciBzbWFsbCBidXNpbmVzc1xuICogQ29weXJpZ2h0IMKpIDIwMTctMjAyNSBBbGV4ZXkgUG9ydG5vdiBhbmQgTmlrb2xheSBCZWtldG92XG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbiAqIGl0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG4gKiB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uOyBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuICogKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIFlvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFsb25nIHdpdGggdGhpcyBwcm9ncmFtLlxuICogSWYgbm90LCBzZWUgPGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiAqL1xuXG4vKiBnbG9iYWwgZ2xvYmFsUm9vdFVybCwgUGJ4QXBpLCBFdmVudEJ1cywgJCAqL1xuXG4vKipcbiAqIEFNSSBUZXJtaW5hbCBFeGFtcGxlIE1vZHVsZVxuICogV0hZOiBFZHVjYXRpb25hbCBtb2R1bGUgZGVtb25zdHJhdGluZyBBTUkgZXZlbnRzIHN0cmVhbWluZyBhbmQgY29tbWFuZCBleGVjdXRpb25cbiAqIEFSQ0hJVEVDVFVSRTogRXZlbnRCdXMgc3Vic2NyaXB0aW9uICsgUkVTVCBBUEkgUGF0dGVybiAxXG4gKlxuICogQG1vZHVsZSBNb2R1bGVFeGFtcGxlQW1pXG4gKi9cbmNvbnN0IE1vZHVsZUV4YW1wbGVBbWkgPSB7XG4gICAgLyoqXG4gICAgICogRXZlbnRzIG1vbml0b3JpbmcgZW5hYmxlZCBmbGFnXG4gICAgICogV0hZOiBUb2dnbGUgZm9yIGV2ZW50IHN1YnNjcmlwdGlvblxuICAgICAqL1xuICAgIGV2ZW50c0VuYWJsZWQ6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBNYXhpbXVtIGxpbmVzIGluIGV2ZW50cyBsb2dcbiAgICAgKiBXSFk6IFByZXZlbnQgbWVtb3J5IG92ZXJmbG93IGZyb20gdW5saW1pdGVkIGV2ZW50c1xuICAgICAqL1xuICAgIG1heEV2ZW50c0xvZ0xpbmVzOiAyMDAsXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIG1vZHVsZVxuICAgICAqIFdIWTogRW50cnkgcG9pbnQgLSBzZXR1cCBldmVudCBoYW5kbGVycyBhbmQgRXZlbnRCdXMgc3Vic2NyaXB0aW9uXG4gICAgICogRURVQ0FUSU9OQUw6IFNob3dzIGNvbXBsZXRlIGluaXRpYWxpemF0aW9uIHBhdHRlcm5cbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICAvLyBXSFk6IEluaXRpYWxpemUgRm9tYW50aWMgVUkgdGFic1xuICAgICAgICAkKCcjYW1pLXRhYi1tZW51IC5pdGVtJykudGFiKCk7XG5cbiAgICAgICAgLy8gV0hZOiBJbml0aWFsaXplIEZvbWFudGljIFVJIGNvbXBvbmVudHNcbiAgICAgICAgTW9kdWxlRXhhbXBsZUFtaS5pbml0aWFsaXplVUkoKTtcblxuICAgICAgICAvLyBXSFk6IFNldHVwIGJ1dHRvbiBoYW5kbGVyc1xuICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLnNldHVwRXZlbnRIYW5kbGVycygpO1xuXG4gICAgICAgIC8vIFdIWTogU3Vic2NyaWJlIHRvIEFNSSBldmVudHMgdmlhIEV2ZW50QnVzXG4gICAgICAgIC8vIENSSVRJQ0FMOiBFdmVudEJ1cyBpcyB0aGUgT05MWSB3YXkgdG8gcmVjZWl2ZSByZWFsLXRpbWUgZXZlbnRzXG4gICAgICAgIC8vIEJhY2tlbmQgcHVibGlzaGVzIHRvICdhbWktZXZlbnRzJyBjaGFubmVsIHZpYSBFdmVudEJ1c1Byb3ZpZGVyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbQU1JXSBTdWJzY3JpYmluZyB0byBFdmVudEJ1cyBjaGFubmVsOiBhbWktZXZlbnRzJyk7XG4gICAgICAgIEV2ZW50QnVzLnN1YnNjcmliZSgnYW1pLWV2ZW50cycsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLm9uQW1pRXZlbnQoZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfYW1pX0luaXRpYWxpemVkKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1tBTUldIEV2ZW50cyBtb25pdG9yaW5nIGVuYWJsZWQ6JywgTW9kdWxlRXhhbXBsZUFtaS5ldmVudHNFbmFibGVkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBGb21hbnRpYyBVSSBjb21wb25lbnRzXG4gICAgICogV0hZOiBTZXR1cCBVSSBjb250cm9scyAoY2hlY2tib3hlcywgZXRjLilcbiAgICAgKi9cbiAgICBpbml0aWFsaXplVUkoKSB7XG4gICAgICAgIC8vIFdIWTogSW5pdGlhbGl6ZSB0b2dnbGUgY2hlY2tib3ggZm9yIGV2ZW50cyBtb25pdG9yaW5nXG4gICAgICAgICQoJyNhbWktZXZlbnRzLXRvZ2dsZScpLmNoZWNrYm94KHtcbiAgICAgICAgICAgIG9uQ2hlY2tlZCgpIHtcbiAgICAgICAgICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLmV2ZW50c0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfYW1pX0V2ZW50c0VuYWJsZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uVW5jaGVja2VkKCkge1xuICAgICAgICAgICAgICAgIE1vZHVsZUV4YW1wbGVBbWkuZXZlbnRzRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfYW1pX0V2ZW50c0Rpc2FibGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldHVwIGV2ZW50IGhhbmRsZXJzIGZvciBidXR0b25zXG4gICAgICogV0hZOiBBdHRhY2ggY2xpY2sgaGFuZGxlcnMgdG8gVUkgY29udHJvbHNcbiAgICAgKi9cbiAgICBzZXR1cEV2ZW50SGFuZGxlcnMoKSB7XG4gICAgICAgIC8vIFdIWTogU2VuZCBBTUkgY29tbWFuZCBidXR0b25cbiAgICAgICAgJCgnI3NlbmQtYW1pLWNvbW1hbmQnKS5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLnNlbmRDb21tYW5kKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdIWTogQWxsb3cgRW50ZXIga2V5IGluIHRleHRhcmVhIHRvIHNlbmQgY29tbWFuZCAod2l0aCBDdHJsL0NtZClcbiAgICAgICAgJCgnI2FtaS1jb21tYW5kLWlucHV0Jykub24oJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLnNlbmRDb21tYW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdIWTogQ2xlYXIgcmVzcG9uc2UgYnV0dG9uXG4gICAgICAgICQoJyNjbGVhci1yZXNwb25zZScpLm9uKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICQoJyNhbWktcmVzcG9uc2Utb3V0cHV0JykudmFsKCcnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV0hZOiBDbGVhciBldmVudHMgbG9nIGJ1dHRvblxuICAgICAgICAkKCcjY2xlYXItZXZlbnRzJykub24oJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgJCgnI2FtaS1ldmVudHMtbG9nJykuaHRtbCgnJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdIWTogQ2xpY2sgb24gZXhhbXBsZSBjb21tYW5kIGxpbmtzXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuYW1pLWV4YW1wbGUtbGluaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2NvbW1hbmQnKTtcbiAgICAgICAgICAgICQoJyNhbWktY29tbWFuZC1pbnB1dCcpLnZhbChjb21tYW5kKTtcbiAgICAgICAgICAgIC8vIFdIWTogQXV0by1zZW5kIGNvbW1hbmQgb24gZXhhbXBsZSBjbGlja1xuICAgICAgICAgICAgTW9kdWxlRXhhbXBsZUFtaS5zZW5kQ29tbWFuZCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBXSFk6IEZ1bGxzY3JlZW4gdG9nZ2xlIGZvciBldmVudHMgbG9nXG4gICAgICAgICQoJyNhbWktZXZlbnRzLWZ1bGxzY3JlZW4tdG9nZ2xlJykub24oJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgTW9kdWxlRXhhbXBsZUFtaS50b2dnbGVGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZW5kIEFNSSBjb21tYW5kIHRvIEFzdGVyaXNrXG4gICAgICogV0hZOiBFeGVjdXRlIEFNSSBjb21tYW5kIHZpYSBSRVNUIEFQSSBhbmQgZGlzcGxheSByZXNwb25zZVxuICAgICAqIEVORFBPSU5UOiBQT1NUIC9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUV4YW1wbGVBbWkvc2VuZENvbW1hbmRcbiAgICAgKiBQQVRURVJOOiBSRVNUIEFQSSBQYXR0ZXJuIDEgKG1vZHVsZVJlc3RBUElDYWxsYmFjaylcbiAgICAgKi9cbiAgICBzZW5kQ29tbWFuZCgpIHtcbiAgICAgICAgY29uc3QgY29tbWFuZCA9ICQoJyNhbWktY29tbWFuZC1pbnB1dCcpLnZhbCgpLnRyaW0oKTtcblxuICAgICAgICBpZiAoIWNvbW1hbmQpIHtcbiAgICAgICAgICAgIE1vZHVsZUV4YW1wbGVBbWkuc2hvd0Vycm9yKGdsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfYW1pX0Vycm9yTm9Db21tYW5kKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdIWTogU2hvdyBsb2FkaW5nIHN0YXRlXG4gICAgICAgICQoJyNzZW5kLWFtaS1jb21tYW5kJykuYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcbiAgICAgICAgJCgnI2FtaS1yZXNwb25zZS1vdXRwdXQnKS52YWwoYCR7Z2xvYmFsVHJhbnNsYXRlLm1vZHVsZV9hbWlfU2VuZGluZ0NvbW1hbmR9XFxuYCk7XG5cbiAgICAgICAgLy8gV0hZOiBNYWtlIEFQSSByZXF1ZXN0IHVzaW5nIEZvbWFudGljIFVJICQuYXBpXG4gICAgICAgIC8vIE5PVEU6IFVzZSBhYnNvbHV0ZSBwYXRoIGZvciBBUEkgZW5kcG9pbnRzIChub3QgZ2xvYmFsUm9vdFVybCB3aGljaCBpbmNsdWRlcyAvYWRtaW4tY2FiaW5ldC8pXG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogJy9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUV4YW1wbGVBbWkvc2VuZENvbW1hbmQnLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBkYXRhOiB7IGNvbW1hbmQgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3NUZXN0OiBQYnhBcGkuc3VjY2Vzc1Rlc3QsXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3VjY2VzcyBjYWxsYmFja1xuICAgICAgICAgICAgICogV0hZOiBIYW5kbGUgc3VjY2Vzc2Z1bCBBUEkgcmVzcG9uc2VcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJCgnI3NlbmQtYW1pLWNvbW1hbmQnKS5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXG4gICAgICAgICAgICAgICAgLy8gV0hZOiBGb3JtYXQgcmVzcG9uc2UgZm9yIGRpc3BsYXlcbiAgICAgICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBNb2R1bGVFeGFtcGxlQW1pLmZvcm1hdENvbW1hbmRSZXNwb25zZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgJG91dHB1dCA9ICQoJyNhbWktcmVzcG9uc2Utb3V0cHV0Jyk7XG4gICAgICAgICAgICAgICAgJG91dHB1dC52YWwob3V0cHV0KTtcblxuICAgICAgICAgICAgICAgIC8vIFdIWTogQXV0by1hZGp1c3QgaGVpZ2h0IGJhc2VkIG9uIGNvbnRlbnRcbiAgICAgICAgICAgICAgICBNb2R1bGVFeGFtcGxlQW1pLmF1dG9SZXNpemVUZXh0YXJlYSgkb3V0cHV0KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogRmFpbHVyZSBjYWxsYmFja1xuICAgICAgICAgICAgICogV0hZOiBIYW5kbGUgQVBJIGVycm9yc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkKCcjc2VuZC1hbWktY29tbWFuZCcpLnJlbW92ZUNsYXNzKCdsb2FkaW5nJyk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBlcnJvck1zZyA9IHJlc3BvbnNlLm1lc3NhZ2VzPy5lcnJvcj8uam9pbignXFxuJykgfHwgZ2xvYmFsVHJhbnNsYXRlLm1vZHVsZV9hbWlfVW5rbm93bkVycm9yO1xuICAgICAgICAgICAgICAgICQoJyNhbWktcmVzcG9uc2Utb3V0cHV0JykudmFsKGAke2dsb2JhbFRyYW5zbGF0ZS5tb2R1bGVfYW1pX0Vycm9yUHJlZml4fSR7ZXJyb3JNc2d9YCk7XG4gICAgICAgICAgICAgICAgTW9kdWxlRXhhbXBsZUFtaS5zaG93RXJyb3IoZXJyb3JNc2cpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFcnJvciBjYWxsYmFja1xuICAgICAgICAgICAgICogV0hZOiBIYW5kbGUgbmV0d29yay9IVFRQIGVycm9yc1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBvbkVycm9yKCkge1xuICAgICAgICAgICAgICAgICQoJyNzZW5kLWFtaS1jb21tYW5kJykucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgICAgICAkKCcjYW1pLXJlc3BvbnNlLW91dHB1dCcpLnZhbChnbG9iYWxUcmFuc2xhdGUubW9kdWxlX2FtaV9OZXR3b3JrRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRm9ybWF0IEFNSSBjb21tYW5kIHJlc3BvbnNlIGZvciBkaXNwbGF5XG4gICAgICogV0hZOiBDb252ZXJ0IEFQSSByZXNwb25zZSB0byByZWFkYWJsZSBmb3JtYXRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSByZXNwb25zZSAtIEFQSSByZXNwb25zZSBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGb3JtYXR0ZWQgcmVzcG9uc2UgdGV4dFxuICAgICAqL1xuICAgIGZvcm1hdENvbW1hbmRSZXNwb25zZShyZXNwb25zZSkge1xuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSByZXNwb25zZS5kYXRhPy50aW1lc3RhbXAgfHwgbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpO1xuICAgICAgICBjb25zdCBjb21tYW5kID0gcmVzcG9uc2UuZGF0YT8uY29tbWFuZCB8fCAnJztcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzcG9uc2UuZGF0YT8ucmVzcG9uc2UgfHwge307XG5cbiAgICAgICAgbGV0IG91dHB1dCA9IGBbJHt0aW1lc3RhbXB9XSBDb21tYW5kOiAke2NvbW1hbmR9XFxuYDtcbiAgICAgICAgb3V0cHV0ICs9ICfilIAnLnJlcGVhdCg4MCkgKyAnXFxuJztcblxuICAgICAgICAvLyBXSFk6IEhhbmRsZSBkaWZmZXJlbnQgcmVzcG9uc2UgZm9ybWF0c1xuICAgICAgICBpZiAocmVzdWx0LmRhdGEgJiYgQXJyYXkuaXNBcnJheShyZXN1bHQuZGF0YSkpIHtcbiAgICAgICAgICAgIC8vIFdIWTogRXh0cmFjdCBhY3R1YWwgZGF0YSwgc2tpcCBcIkNvbW1hbmQgb3V0cHV0IGZvbGxvd3NcIiBoZWFkZXJcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuRGF0YSA9IHJlc3VsdC5kYXRhLmZpbHRlcihsaW5lID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZS50cmltKCkgIT09ICcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICFsaW5lLmluY2x1ZGVzKCdQcml2aWxlZ2U6IENvbW1hbmQnKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAhbGluZS5pbmNsdWRlcygnLS1FTkQgQ09NTUFORC0tJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG91dHB1dCArPSBjbGVhbkRhdGEuam9pbignXFxuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIC8vIFdIWTogRm9ybWF0IEFNSSBBY3Rpb24gcmVzcG9uc2VzIChDb3JlU3RhdHVzLCBQaW5nLCBldGMuKVxuICAgICAgICAgICAgaWYgKHJlc3VsdC5SZXNwb25zZSB8fCByZXN1bHQuTWVzc2FnZSB8fCByZXN1bHQuUGluZykge1xuICAgICAgICAgICAgICAgIC8vIFdIWTogTmF0aXZlIEFNSSBBY3Rpb24gcmVzcG9uc2VcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgIT09ICdkYXRhJyAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0ICs9IGAke2tleX06ICR7dmFsdWV9XFxuYDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV0hZOiBGYWxsYmFjayB0byBKU09OIGZvciB1bmtub3duIGZvcm1hdHNcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dCArPSByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgaW5jb21pbmcgQU1JIGV2ZW50IGZyb20gRXZlbnRCdXNcbiAgICAgKiBXSFk6IFByb2Nlc3MgcmVhbC10aW1lIEFNSSBldmVudHMgYW5kIGRpc3BsYXkgaW4gbG9nXG4gICAgICogRURVQ0FUSU9OQUw6IERlbW9uc3RyYXRlcyBFdmVudEJ1cy5zdWJzY3JpYmUoKSBjYWxsYmFjayBwYXR0ZXJuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIEV2ZW50IGRhdGEgZnJvbSBFdmVudEJ1c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhLmV2ZW50IC0gRXZlbnQgdHlwZSAoZS5nLiwgXCJOZXdjaGFubmVsXCIsIFwiSGFuZ3VwXCIpXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEuZGF0YSAtIEZ1bGwgQU1JIGV2ZW50IHBhcmFtZXRlcnNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YS50aW1lc3RhbXAgLSBFdmVudCB0aW1lc3RhbXBcbiAgICAgKi9cbiAgICBvbkFtaUV2ZW50KGRhdGEpIHtcbiAgICAgICAgLy8gREVCVUc6IExvZyBhbGwgcmVjZWl2ZWQgZXZlbnRzXG4gICAgICAgIGNvbnNvbGUubG9nKCdbQU1JIEV2ZW50XScsIGRhdGEpO1xuXG4gICAgICAgIC8vIFdIWTogU2tpcCBpZiBldmVudHMgbW9uaXRvcmluZyBpcyBkaXNhYmxlZFxuICAgICAgICBpZiAoIU1vZHVsZUV4YW1wbGVBbWkuZXZlbnRzRW5hYmxlZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tBTUkgRXZlbnRdIFNraXBwZWQgLSBtb25pdG9yaW5nIGRpc2FibGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IFNraXAgaW50ZXJuYWwgcGluZyBldmVudHMgZnJvbSB3b3JrZXJcbiAgICAgICAgaWYgKGRhdGEuZXZlbnQgPT09ICdVc2VyRXZlbnQnICYmIGRhdGEuZGF0YT8uVXNlckV2ZW50Py5pbmNsdWRlcygnUGluZycpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IEZvcm1hdCBldmVudCBmb3IgZGlzcGxheVxuICAgICAgICBjb25zdCBldmVudExpbmUgPSBNb2R1bGVFeGFtcGxlQW1pLmZvcm1hdEV2ZW50TGluZShkYXRhKTtcblxuICAgICAgICAvLyBXSFk6IEFwcGVuZCB0byBldmVudHMgbG9nXG4gICAgICAgIE1vZHVsZUV4YW1wbGVBbWkuYXBwZW5kVG9FdmVudHNMb2coZXZlbnRMaW5lKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRm9ybWF0IEFNSSBldmVudCBhcyBtdWx0aS1saW5lIGJsb2NrIHdpdGggc3ludGF4IGhpZ2hsaWdodGluZ1xuICAgICAqIFdIWTogU2hvdyBjb21wbGV0ZSBBTUkgZXZlbnQgZGF0YSBmcm9tIEFzdGVyaXNrIHdpdGggY29sb3JzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSAtIEV2ZW50IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBGb3JtYXR0ZWQgZXZlbnQgYmxvY2sgd2l0aCBIVE1MXG4gICAgICovXG4gICAgZm9ybWF0RXZlbnRMaW5lKGRhdGEpIHtcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gZGF0YS50aW1lc3RhbXAgfHwgbmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpO1xuICAgICAgICBjb25zdCBldmVudCA9IGRhdGEuZXZlbnQgfHwgJ1Vua25vd24nO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBkYXRhLmRhdGEgfHwge307XG5cbiAgICAgICAgLy8gV0hZOiBFc2NhcGUgSFRNTCB0byBwcmV2ZW50IFhTU1xuICAgICAgICBjb25zdCBlc2NhcGVIdG1sID0gKHRleHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgZGl2LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICAgIHJldHVybiBkaXYuaW5uZXJIVE1MO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFdIWTogU3RhcnQgd2l0aCBldmVudCBoZWFkZXIgd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nXG4gICAgICAgIGxldCBvdXRwdXQgPSBgPGRpdiBjbGFzcz1cImFtaS1ldmVudC1ibG9ja1wiPmA7XG4gICAgICAgIG91dHB1dCArPSBgPHNwYW4gY2xhc3M9XCJhbWktdGltZXN0YW1wXCI+WyR7ZXNjYXBlSHRtbCh0aW1lc3RhbXApfV08L3NwYW4+IDxzcGFuIGNsYXNzPVwiYW1pLWV2ZW50LW5hbWVcIj5FdmVudDogJHtlc2NhcGVIdG1sKGV2ZW50KX08L3NwYW4+XFxuYDtcblxuICAgICAgICAvLyBXSFk6IEFkZCBhbGwgcGFyYW1ldGVycyBmcm9tIEFNSSBldmVudCB3aXRoIHN5bnRheCBoaWdobGlnaHRpbmdcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocGFyYW1zKSkge1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gJ0V2ZW50JykgeyAvLyBXSFk6IFNraXAgRXZlbnQga2V5IChhbHJlYWR5IGluIGhlYWRlcilcbiAgICAgICAgICAgICAgICAvLyBXSFk6IEhhbmRsZSBuZXN0ZWQgb2JqZWN0cyAobGlrZSBDaGFuVmFyaWFibGUpXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ICs9IGAgIDxzcGFuIGNsYXNzPVwiYW1pLWtleVwiPiR7ZXNjYXBlSHRtbChrZXkpfTwvc3Bhbj48c3BhbiBjbGFzcz1cImFtaS1zZXBhcmF0b3JcIj46PC9zcGFuPlxcbmA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW3N1YktleSwgc3ViVmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0ICs9IGAgICAgPHNwYW4gY2xhc3M9XCJhbWkta2V5XCI+JHtlc2NhcGVIdG1sKHN1YktleSl9PC9zcGFuPjxzcGFuIGNsYXNzPVwiYW1pLXNlcGFyYXRvclwiPjo8L3NwYW4+IDxzcGFuIGNsYXNzPVwiYW1pLXZhbHVlXCI+JHtlc2NhcGVIdG1sKFN0cmluZyhzdWJWYWx1ZSkpfTwvc3Bhbj5cXG5gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0ICs9IGAgIDxzcGFuIGNsYXNzPVwiYW1pLWtleVwiPiR7ZXNjYXBlSHRtbChrZXkpfTwvc3Bhbj48c3BhbiBjbGFzcz1cImFtaS1zZXBhcmF0b3JcIj46PC9zcGFuPiA8c3BhbiBjbGFzcz1cImFtaS12YWx1ZVwiPiR7ZXNjYXBlSHRtbChTdHJpbmcodmFsdWUpKX08L3NwYW4+XFxuYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IEFkZCBzZXBhcmF0b3IgZm9yIHJlYWRhYmlsaXR5XG4gICAgICAgIG91dHB1dCArPSAnXFxuPC9kaXY+JztcblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmQgSFRNTCB0byBldmVudHMgbG9nIHdpdGggbGluZSBsaW1pdFxuICAgICAqIFdIWTogQWRkIGV2ZW50IHRvIGxvZyBhbmQgcHJldmVudCBtZW1vcnkgb3ZlcmZsb3dcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBodG1sIC0gSFRNTCB0byBhcHBlbmRcbiAgICAgKi9cbiAgICBhcHBlbmRUb0V2ZW50c0xvZyhodG1sKSB7XG4gICAgICAgIGNvbnN0ICRsb2cgPSAkKCcjYW1pLWV2ZW50cy1sb2cnKTtcblxuICAgICAgICAvLyBXSFk6IEFwcGVuZCBIVE1MIGRpcmVjdGx5IChhbHJlYWR5IGVzY2FwZWQgaW4gZm9ybWF0RXZlbnRMaW5lKVxuICAgICAgICAkbG9nLmFwcGVuZChodG1sKTtcblxuICAgICAgICAvLyBXSFk6IExpbWl0IG51bWJlciBvZiBldmVudCBibG9ja3MgdG8gcHJldmVudCBtZW1vcnkgb3ZlcmZsb3dcbiAgICAgICAgY29uc3QgJGV2ZW50cyA9ICRsb2cuY2hpbGRyZW4oKTtcbiAgICAgICAgaWYgKCRldmVudHMubGVuZ3RoID4gTW9kdWxlRXhhbXBsZUFtaS5tYXhFdmVudHNMb2dMaW5lcykge1xuICAgICAgICAgICAgLy8gV0hZOiBSZW1vdmUgb2xkZXN0IGV2ZW50c1xuICAgICAgICAgICAgJGV2ZW50cy5zbGljZSgwLCAkZXZlbnRzLmxlbmd0aCAtIE1vZHVsZUV4YW1wbGVBbWkubWF4RXZlbnRzTG9nTGluZXMpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV0hZOiBBdXRvLXNjcm9sbCB0byBib3R0b20gdG8gc2hvdyBsYXRlc3QgZXZlbnRzXG4gICAgICAgICRsb2cuc2Nyb2xsVG9wKCRsb2dbMF0uc2Nyb2xsSGVpZ2h0KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXV0by1yZXNpemUgdGV4dGFyZWEgdG8gZml0IGNvbnRlbnRcbiAgICAgKiBXSFk6IEltcHJvdmUgVVggYnkgc2hvd2luZyBmdWxsIHJlc3BvbnNlIHdpdGhvdXQgc2Nyb2xsaW5nXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRleHRhcmVhIC0galF1ZXJ5IHRleHRhcmVhIGVsZW1lbnRcbiAgICAgKi9cbiAgICBhdXRvUmVzaXplVGV4dGFyZWEoJHRleHRhcmVhKSB7XG4gICAgICAgIGNvbnN0IG1pbkhlaWdodCA9IDMwMDsgLy8gV0hZOiBNYXRjaCBtaW4taGVpZ2h0IGZyb20gQ1NTXG4gICAgICAgIGNvbnN0IG1heEhlaWdodCA9IDgwMDsgLy8gV0hZOiBQcmV2ZW50IGV4dHJlbWVseSB0YWxsIHRleHRhcmVhc1xuXG4gICAgICAgIC8vIFdIWTogUmVzZXQgaGVpZ2h0IHRvIHJlY2FsY3VsYXRlIHNjcm9sbEhlaWdodFxuICAgICAgICAkdGV4dGFyZWEuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuXG4gICAgICAgIC8vIFdIWTogQ2FsY3VsYXRlIHJlcXVpcmVkIGhlaWdodCBiYXNlZCBvbiBjb250ZW50XG4gICAgICAgIGNvbnN0IHNjcm9sbEhlaWdodCA9ICR0ZXh0YXJlYVswXS5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIGNvbnN0IG5ld0hlaWdodCA9IE1hdGgubWF4KG1pbkhlaWdodCwgTWF0aC5taW4oc2Nyb2xsSGVpZ2h0ICsgMjAsIG1heEhlaWdodCkpO1xuXG4gICAgICAgIC8vIFdIWTogQXBwbHkgbmV3IGhlaWdodCB3aXRoIHNtb290aCB0cmFuc2l0aW9uXG4gICAgICAgICR0ZXh0YXJlYS5jc3MoJ2hlaWdodCcsIGAke25ld0hlaWdodH1weGApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgZnVsbHNjcmVlbiBtb2RlIGZvciBldmVudHMgbG9nXG4gICAgICogV0hZOiBBbGxvdyB1c2VycyB0byB2aWV3IGV2ZW50cyBpbiBmdWxsc2NyZWVuIGZvciBiZXR0ZXIgdmlzaWJpbGl0eVxuICAgICAqL1xuICAgIHRvZ2dsZUZ1bGxzY3JlZW4oKSB7XG4gICAgICAgIGNvbnN0ICRsb2cgPSAkKCcjYW1pLWV2ZW50cy1sb2cnKTtcbiAgICAgICAgY29uc3QgJHdyYXBwZXIgPSAkbG9nLnBhcmVudCgpO1xuICAgICAgICBjb25zdCAkYnV0dG9uID0gJCgnI2FtaS1ldmVudHMtZnVsbHNjcmVlbi10b2dnbGUnKTtcbiAgICAgICAgY29uc3QgJGljb24gPSAkYnV0dG9uLmZpbmQoJ2knKTtcblxuICAgICAgICAvLyBXSFk6IENoZWNrIGlmIGFscmVhZHkgaW4gZnVsbHNjcmVlblxuICAgICAgICBpZiAoJHdyYXBwZXIuaGFzQ2xhc3MoJ2Z1bGxzY3JlZW4tbW9kZScpKSB7XG4gICAgICAgICAgICAvLyBXSFk6IEV4aXQgZnVsbHNjcmVlblxuICAgICAgICAgICAgJHdyYXBwZXIucmVtb3ZlQ2xhc3MoJ2Z1bGxzY3JlZW4tbW9kZScpO1xuICAgICAgICAgICAgJGljb24ucmVtb3ZlQ2xhc3MoJ2NvbXByZXNzJykuYWRkQ2xhc3MoJ2V4cGFuZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV0hZOiBFbnRlciBmdWxsc2NyZWVuXG4gICAgICAgICAgICAkd3JhcHBlci5hZGRDbGFzcygnZnVsbHNjcmVlbi1tb2RlJyk7XG4gICAgICAgICAgICAkaWNvbi5yZW1vdmVDbGFzcygnZXhwYW5kJykuYWRkQ2xhc3MoJ2NvbXByZXNzJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2hvdyBlcnJvciBtZXNzYWdlXG4gICAgICogV0hZOiBVc2VyIGZlZWRiYWNrIGZvciBlcnJvcnNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gRXJyb3IgbWVzc2FnZVxuICAgICAqL1xuICAgIHNob3dFcnJvcihtZXNzYWdlKSB7XG4gICAgICAgIC8vIFdIWTogVXNlIEZvbWFudGljIFVJIHRvYXN0IGZvciBub24tYmxvY2tpbmcgbm90aWZpY2F0aW9uXG4gICAgICAgIGlmICh0eXBlb2YgVXNlck1lc3NhZ2UgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBVc2VyTWVzc2FnZS5zaG93RXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIG9uIGRvY3VtZW50IHJlYWR5XG4gKiBXSFk6IFN0YXJ0IG1vZHVsZSBhZnRlciBET00gaXMgbG9hZGVkXG4gKi9cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBNb2R1bGVFeGFtcGxlQW1pLmluaXRpYWxpemUoKTtcbn0pO1xuIl19