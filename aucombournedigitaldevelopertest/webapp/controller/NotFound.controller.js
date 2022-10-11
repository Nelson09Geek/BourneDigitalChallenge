sap.ui.define([
		"au/com/bournedigital/developertest/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("au.com.bournedigital.developertest.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);