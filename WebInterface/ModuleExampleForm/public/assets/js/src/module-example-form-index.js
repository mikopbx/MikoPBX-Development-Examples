/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2023 Alexey Portnov and Nikolay Beketov
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

const ModuleExampleFormIndex = {
	var1:'foo',
	$var2: $('.foo'),
	$moduleStatus: $('#status'),
	$statusToggle: $('#module-status-toggle'),
	$disabilityFields: $('.disability'),
	initialize(){
		ModuleExampleFormIndex.cbOnChangeStatusToggle();
		window.addEventListener('ModuleStatusChanged', ModuleExampleFormIndex.cbOnChangeStatusToggle);
	},
	/**
	 * Change some form elements classes depends of module status
	 */
	cbOnChangeStatusToggle() {
		if (ModuleExampleFormIndex.$statusToggle.checkbox('is checked')) {
			ModuleExampleFormIndex.$disabilityFields.removeClass('disabled');
			ModuleExampleFormIndex.$moduleStatus.show();
		} else {
			ModuleExampleFormIndex.$disabilityFields.addClass('disabled');
			ModuleExampleFormIndex.$moduleStatus.hide();
		}
	},

};

$(document).ready(() => {
	ModuleExampleFormIndex.initialize();
});