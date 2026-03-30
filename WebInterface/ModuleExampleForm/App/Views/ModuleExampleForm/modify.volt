<form method="post" action="module-example-form/module-example-form/save" role="form"
      class="ui large form" id="module-example-form-form">

    {{ form.render('id') }}
    {{ form.render('hidden_field') }}

    {# ===== Tabbed interface ===== #}
    <div class="ui top attached tabular menu" id="module-example-form-menu">
        <a class="item active" data-tab="basic">{{ t._('module_template_TabBasicFields') }}</a>
        <a class="item" data-tab="selection">{{ t._('module_template_TabSelectionFields') }}</a>
    </div>

    {# ===== Tab 1: Basic text input fields ===== #}
    <div class="ui bottom attached tab segment active" data-tab="basic">

        {# --- Text field with info tooltip icon --- #}
        <div class="ten wide field disability">
            <label>{{ t._('module_template_TextFieldLabel') }}
                <i class="small info circle icon popup"
                   data-content="{{ t._('module_template_TextFieldInfo') }}"
                   data-variation="wide"></i>
            </label>
            {{ form.render('text_field') }}
        </div>

        {# --- TextArea with placeholder and auto-height --- #}
        <div class="ten wide field disability">
            <label>{{ t._('module_template_TextAreaFieldLabel') }}</label>
            {{ form.render('text_area_field') }}
        </div>

        {# --- Password field --- #}
        <div class="ten wide field disability">
            <label>{{ t._('module_template_PasswordFieldLabel') }}</label>
            {{ form.render('password_field') }}
        </div>

        {# --- Numeric field (narrow width via class) --- #}
        <div class="four wide field disability">
            <label>{{ t._('module_template_IntegerFieldLabel') }}</label>
            {{ form.render('integer_field') }}
        </div>

    </div>

    {# ===== Tab 2: Selection and toggle elements ===== #}
    <div class="ui bottom attached tab segment" data-tab="selection">

        {# --- Standard checkbox in a segment --- #}
        <div class="field disability">
            <div class="ui segment">
                <div class="ui checkbox">
                    {{ form.render('checkbox_field') }}
                    <label>{{ t._('module_template_CheckBoxFieldLabel') }}</label>
                </div>
            </div>
        </div>

        {# --- Toggle switch (same Check element, different CSS class) --- #}
        <div class="field disability">
            <div class="ui segment">
                <div class="ui toggle checkbox">
                    {{ form.render('toggle_field') }}
                    <label>{{ t._('module_template_ToggleFieldLabel') }}</label>
                </div>
            </div>
        </div>

        {# --- SemanticUIDropdown with static options --- #}
        <div class="ten wide field disability">
            <label>{{ t._('module_template_SelectFieldLabel') }}
                <i class="small info circle icon popup"
                   data-content="{{ t._('module_template_SelectFieldInfo') }}"
                   data-variation="wide"></i>
            </label>
            {{ form.render('select_field') }}
        </div>

        {# --- SemanticUIDropdown populated from database --- #}
        <div class="ten wide field disability">
            <label>{{ t._('module_template_ProviderFieldLabel') }}</label>
            {{ form.render('provider_field') }}
        </div>

        {# --- Accordion for advanced / rarely used options --- #}
        <div class="ui accordion field">
            <div class="title">
                <i class="icon dropdown"></i>
                {{ t._('module_template_AdvancedOptions') }}
            </div>
            <div class="content">
                <div class="ten wide field disability">
                    <label>{{ t._('module_template_HiddenFieldInfo') }}</label>
                    <div class="ui info message">
                        <p>{{ t._('module_template_HiddenFieldDescription') }}</p>
                        <code>hidden_field</code> = <span id="hidden-field-display">{{ form.getValue('hidden_field') }}</span>
                    </div>
                </div>
            </div>
        </div>

    </div>

    {{ partial("partials/submitbutton", ['indexurl': 'module-example-form/module-example-form/index']) }}
</form>
