<div class="ui segment">
    <h3 class="ui header">
        <i class="cloud icon"></i>
        {{ t._('module_rest_api_v1_api_testing') }}
    </h3>

    <div class="ui info message">
        <i class="info circle icon"></i>
        <div class="content">
            <p><strong>Pattern 1 (Simple Callback)</strong></p>
            <p>{{ t._('module_rest_api_v1_pattern_description') }}</p>
        </div>
    </div>

    <h4 class="ui dividing header">{{ t._('module_rest_api_v1_test_buttons') }}</h4>

    <button class="ui blue button test-api-button" data-action="check">
        <i class="check circle icon"></i>
        {{ t._('module_rest_api_v1_check_button') }}
    </button>

    <button class="ui teal button test-api-button" data-action="status">
        <i class="info icon"></i>
        {{ t._('module_rest_api_v1_status_button') }}
    </button>

    <button class="ui olive button test-api-button" data-action="reload">
        <i class="sync icon"></i>
        {{ t._('module_rest_api_v1_reload_button') }}
    </button>

    <button class="ui purple button test-api-button" data-action="stats">
        <i class="chart bar icon"></i>
        {{ t._('module_rest_api_v1_stats_button') }}
    </button>

    <div class="ui segment" style="margin-top: 20px;">
        <h4 class="ui header">
            <i class="terminal icon"></i>
            {{ t._('module_rest_api_v1_response') }}
        </h4>
        <div id="api-response-container">
            <pre id="api-response" class="language-json" style="max-height: 400px; overflow-y: auto;"><code>{{ t._('module_rest_api_v1_click_button') }}</code></pre>
        </div>
    </div>

    <div class="ui segment">
        <h4 class="ui header">
            <i class="list icon"></i>
            {{ t._('module_rest_api_v1_endpoints') }}
        </h4>
        <div class="ui list">
            {% for action, endpoint in apiEndpoints %}
            <div class="item endpoint-item" data-action="{{ action }}" data-endpoint="{{ endpoint }}">
                <i class="linkify icon"></i>
                <div class="content">
                    <strong>{{ action }}</strong>: <code>{{ endpoint }}</code>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</div>
