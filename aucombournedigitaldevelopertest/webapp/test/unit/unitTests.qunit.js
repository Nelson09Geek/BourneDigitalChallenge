/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"au/com/bournedigital/developertest/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
