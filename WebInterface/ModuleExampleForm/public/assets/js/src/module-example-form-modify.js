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

/* global globalRootUrl, globalTranslate, Form */

const ModuleExampleFormModify = {

    /**
     * jQuery cached DOM elements.
     */
    $formObj: $('#module-example-form-form'),
    $checkBoxes: $('#module-example-form-form .ui.checkbox'),
    $dropDowns: $('#module-example-form-form .ui.dropdown'),
    $accordion: $('#module-example-form-form .ui.accordion'),
    $tabMenu: $('#module-example-form-menu .item'),

    /**
     * Form validation rules.
     * Demonstrates different rule types available in Fomantic UI.
     *
     * @see https://fomantic-ui.com/behaviors/form.html
     */
    validateRules: {
        textField: {
            identifier: 'text_field',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_template_ValidateValueIsEmpty,
                },
                {
                    type: 'minLength[3]',
                    prompt: globalTranslate.module_template_ValidateMinLength,
                },
            ],
        },
        areaField: {
            identifier: 'text_area_field',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_template_ValidateValueIsEmpty,
                },
            ],
        },
        passwordField: {
            identifier: 'password_field',
            rules: [
                {
                    type: 'empty',
                    prompt: globalTranslate.module_template_ValidateValueIsEmpty,
                },
                {
                    type: 'minLength[5]',
                    prompt: globalTranslate.module_template_ValidatePasswordMinLength,
                },
            ],
        },
        integerField: {
            identifier: 'integer_field',
            rules: [
                {
                    type: 'integer[1..9999]',
                    prompt: globalTranslate.module_template_ValidateIntegerRange,
                },
            ],
        },
    },

    /**
     * Initializes all Fomantic UI components and form handling.
     */
    initialize() {
        // Initialize Fomantic UI components
        ModuleExampleFormModify.$checkBoxes.checkbox();
        ModuleExampleFormModify.$dropDowns.dropdown();
        ModuleExampleFormModify.$accordion.accordion();
        ModuleExampleFormModify.$tabMenu.tab();

        // Initialize info popup tooltips on icons with data-content attribute
        $('#module-example-form-form i[data-content]').popup();

        // Set hidden field value from JavaScript (demonstrates Hidden field usage)
        const now = new Date().toISOString();
        $('#hidden_field').val(now);
        $('#hidden-field-display').text(now);

        // Initialize form validation and AJAX submission
        ModuleExampleFormModify.initializeForm();
    },

    /**
     * Callback before form submission — collects all form values.
     *
     * @param {object} settings Ajax request settings.
     * @returns {object} Modified settings with form data.
     */
    cbBeforeSendForm(settings) {
        const result = settings;
        result.data = ModuleExampleFormModify.$formObj.form('get values');
        return result;
    },

    /**
     * Callback after successful form submission.
     */
    cbAfterSendForm() {
        // Refresh hidden field display after save
        $('#hidden-field-display').text($('#hidden_field').val());
    },

    /**
     * Initializes form validation and AJAX submission via the global Form object.
     */
    initializeForm() {
        Form.$formObj = ModuleExampleFormModify.$formObj;
        Form.url = `${globalRootUrl}module-example-form/module-example-form/save`;
        Form.validateRules = ModuleExampleFormModify.validateRules;
        Form.cbBeforeSendForm = ModuleExampleFormModify.cbBeforeSendForm;
        Form.cbAfterSendForm = ModuleExampleFormModify.cbAfterSendForm;
        Form.initialize();
    },
};

$(document).ready(() => {
    ModuleExampleFormModify.initialize();
});
