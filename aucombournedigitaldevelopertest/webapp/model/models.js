sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device"
	], function (JSONModel, Device) {
		"use strict";

		return {

			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},

			createFLPModel : function () {
				var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
					bIsShareInJamActive = fnGetUser ? fnGetUser().isJamActive() : false,
					oModel = new JSONModel({
						isShareInJamActive: bIsShareInJamActive
					});
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},            
            createEmployeeModel:function()
            {
                var oModel=new JSONModel({
                    "pages":[
                        {
                            "header":"Employee Details",
                            "firstName":'',
                            "lastName":'',
                            "title":'',
                            "photopath":'',
                            "displayShape":"Square",
                            "group":[
                                {
                                    "heading": "Contact Details",
                                    "elements":[
                                        {
                                            "label":"Address",
                                            "value":'',
                                            "elementType": "text"
                                            
                                        },
                                        {
                                            "label":"City",
                                            "value":'',
                                            "elementType": "text"
                                        },
                                        {
                                            "label":"Post Code",
                                            "value":'',
                                            "elementType": "text"
                                            
                                        },
                                        {
                                            "label":"Phone",
                                            "value":'',
                                            "elementType": "phone"
                                        }
                                    ]                           
                                }
                            ]
                        }
                    ]               
                });

                return oModel;
            }

		};

	}
);