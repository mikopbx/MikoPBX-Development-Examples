<div class="ui container">
    <div class="ui info message">
        <i class="server icon"></i>
        <strong>{{ t._('mod_restapi2_InfoTitle') }}:</strong> {{ t._('mod_restapi2_InfoDescription') }}
    </div>

    <div class="ui segment">
        <h3>{{ t._('mod_restapi2_GetOperations') }}</h3>
        <button class="ui blue button test-api-v2" data-controller="Get" data-action="config">{{ t._('mod_restapi2_BtnGetConfig') }}</button>
        <button class="ui teal button test-api-v2" data-controller="Get" data-action="users">{{ t._('mod_restapi2_BtnGetUsers') }}</button>
    </div>

    <div class="ui segment">
        <h3>{{ t._('mod_restapi2_PostOperations') }}</h3>
        <button class="ui green button test-api-v2" data-controller="Post" data-action="create">{{ t._('mod_restapi2_BtnCreateUser') }}</button>
        <button class="ui orange button test-api-v2" data-controller="Post" data-action="update">{{ t._('mod_restapi2_BtnUpdateUser') }}</button>
        <button class="ui red button test-api-v2" data-controller="Post" data-action="delete">{{ t._('mod_restapi2_BtnDeleteUser') }}</button>
    </div>

    <div class="ui segment">
        <h3>{{ t._('mod_restapi2_FileOperations') }}</h3>
        <button class="ui violet button test-api-v2" data-controller="File" data-action="download" data-download="true" data-mode="view">{{ t._('mod_restapi2_BtnShowContent') }}</button>
        <button class="ui purple button test-api-v2" data-controller="File" data-action="download" data-download="true" data-mode="download">{{ t._('mod_restapi2_BtnDownloadFile') }}</button>
    </div>

    <div class="ui segment">
        <h4>{{ t._('mod_restapi2_ApiResponse') }}</h4>
        <pre id="api-response-v2"><code>{{ t._('mod_restapi2_ClickToTest') }}</code></pre>
    </div>
</div>
