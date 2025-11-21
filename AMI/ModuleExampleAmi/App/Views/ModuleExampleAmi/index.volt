{# Tab menu #}
<div class="ui top attached tabular menu" id="ami-tab-menu">
    <a class="item active" data-tab="commands">
        <i class="code icon"></i>
        {{ t._('module_ami_TabCommands') }}
    </a>
    <a class="item" data-tab="events">
        <i class="feed icon"></i>
        {{ t._('module_ami_TabEvents') }}
    </a>
</div>

{# Commands Tab #}
<div class="ui bottom attached tab segment active" data-tab="commands">
    <div class="ui form">
        <div class="field">
            <label>{{ t._('module_ami_CommandLabel') }}</label>
            <textarea id="ami-command-input" rows="3" placeholder="{{ t._('module_ami_CommandPlaceholder') }}"></textarea>
        </div>

        <button id="send-ami-command" class="ui primary button">
            <i class="paper plane icon"></i>
            {{ t._('module_ami_SendButton') }}
        </button>
        <button id="clear-response" class="ui button">
            <i class="eraser icon"></i>
            {{ t._('module_ami_ClearResponseButton') }}
        </button>
    </div>

    {# Command Examples #}
    <div class="ui blue message" style="margin-top: 1em;">
        <div class="header">
            <i class="lightbulb outline icon"></i>
            {{ t._('module_ami_ExamplesHeader') }}
        </div>
        <div class="ui grid" style="margin-top: 0.5em;">
            <div class="eight wide column">
                <strong>{{ t._('module_ami_ExampleCLI') }}</strong>
                <div class="ui list">
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleCLI1') }}">
                            <code>{{ t._('module_ami_ExampleCLI1') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleCLI1Desc') }}</span>
                    </div>
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleCLI2') }}">
                            <code>{{ t._('module_ami_ExampleCLI2') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleCLI2Desc') }}</span>
                    </div>
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleCLI3') }}">
                            <code>{{ t._('module_ami_ExampleCLI3') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleCLI3Desc') }}</span>
                    </div>
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleCLI4') }}">
                            <code>{{ t._('module_ami_ExampleCLI4') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleCLI4Desc') }}</span>
                    </div>
                </div>
            </div>
            <div class="eight wide column">
                <strong>{{ t._('module_ami_ExampleActions') }}</strong>
                <div class="ui list">
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleAction1') }}">
                            <code>{{ t._('module_ami_ExampleAction1') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleAction1Desc') }}</span>
                    </div>
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleAction2') }}">
                            <code>{{ t._('module_ami_ExampleAction2') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleAction2Desc') }}</span>
                    </div>
                    <div class="item">
                        <a href="#" class="ami-example-link" data-command="{{ t._('module_ami_ExampleAction3') }}">
                            <code>{{ t._('module_ami_ExampleAction3') }}</code>
                        </a>
                        <span class="description">— {{ t._('module_ami_ExampleAction3Desc') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="ui segment" style="margin-top: 1em;">
        <h4>{{ t._('module_ami_ResponseLabel') }}</h4>
        <div class="ui form">
            <div class="field">
                <textarea id="ami-response-output" rows="20" readonly style="font-family: monospace; background-color: #f4f4f4; min-height: 300px; transition: height 0.3s ease;"></textarea>
            </div>
        </div>
    </div>
</div>

{# Events Tab #}
<div class="ui bottom attached tab segment" data-tab="events">
    <div class="ui form">
        <div class="field">
            <div class="ui toggle checkbox" id="ami-events-toggle">
                <input type="checkbox" checked>
                <label>{{ t._('module_ami_EventsToggle') }}</label>
            </div>
        </div>
    </div>

    <div class="ui form" style="margin-top: 1em;">
        <div class="field">
            <label>{{ t._('module_ami_EventsLogLabel') }}</label>
            <div id="ami-events-log-wrapper" style="position: relative; width: 100%;">
                <pre id="ami-events-log"></pre>
                <div style="position: absolute; top: 5px; right: 5px; display: flex; gap: 5px;">
                    <button id="clear-events" class="ui mini icon button" style="background: rgba(0,0,0,0.3); color: #fff;" title="{{ t._('module_ami_ClearEventsButton') }}">
                        <i class="eraser icon"></i>
                    </button>
                    <button id="ami-events-fullscreen-toggle" class="ui mini icon button" style="background: rgba(0,0,0,0.3); color: #fff;" title="{{ t._('module_ami_FullscreenToggle') }}">
                        <i class="expand icon"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

{# Educational information #}
<div class="ui info message">
    <div class="header">
        <i class="graduation cap icon"></i>
        {{ t._('module_ami_EducationalHeader') }}
    </div>
    <ul class="list">
        <li>{{ t._('module_ami_EducationalInfo1') }}</li>
        <li>{{ t._('module_ami_EducationalInfo2') }}</li>
        <li>{{ t._('module_ami_EducationalInfo3') }}</li>
        <li>{{ t._('module_ami_EducationalInfo4') }}</li>
        <li>{{ t._('module_ami_EducationalInfo5') }}</li>
    </ul>
</div>
