sap.ui.define([
    "au/com/bournedigital/developertest/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "au/com/bournedigital/developertest/model/formatter",
    "au/com/bournedigital/developertest/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, History, formatter, models, Filter, FilterOperator,Fragment) {
    "use strict";

    return BaseController.extend("au.com.bournedigital.developertest.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit : function () {
            var oViewModel,
                oEmployeeModel,
                iOriginalBusyDelay,
                oTable = this.byId("table");

            // Put down worklist table's original value for busy indicator delay,
            // so it can be restored later on. Busy handling on the table is
            // taken care of by the table itself.
            iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
            // keeps the search state
            this._aTableSearchState = [];

            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
                saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
                shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
                tableBusyDelay : 0
            });
            this.setModel(oViewModel, "worklistView");

            //Model for Employee-Responsible QuickView
            oEmployeeModel=models.createEmployeeModel();
            this.setModel(oEmployeeModel, "employeeModel");

            // Make sure, busy indication is showing immediately so there is no
            // break after the busy indication for loading the view's meta data is
            // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
            oTable.attachEventOnce("updateFinished", function(){
                // Restore original busy indicator delay for worklist's table
                oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
            });
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished : function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress : function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * When Employee Responsible is pressed,Below are the Handlers
         */
        handleEmployeeQuickViewPress: function (oEvent) {
            debugger;
            var _spath=oEvent.getSource().getBindingContext().getPath();
            var _employeeData=oEvent.getSource().getBindingContext().getModel().getProperty(_spath+"/Employee");
            this.getModel("employeeModel").setProperty("/pages/0/firstName",_employeeData.FirstName);
            this.getModel("employeeModel").setProperty("/pages/0/lastName",_employeeData.LastName);
            this.getModel("employeeModel").setProperty("/pages/0/title",_employeeData.Title);
            this.getModel("employeeModel").setProperty("/pages/0/photopath",_employeeData.PhotoPath);
            this.getModel("employeeModel").setProperty("/pages/0/group/0/elements/0/value",_employeeData.Address);
            this.getModel("employeeModel").setProperty("/pages/0/group/0/elements/1/value",_employeeData.City);
            this.getModel("employeeModel").setProperty("/pages/0/group/0/elements/2/value",_employeeData.PostalCode);
            this.getModel("employeeModel").setProperty("/pages/0/group/0/elements/3/value",_employeeData.HomePhone);
            this.getModel("employeeModel").refresh();          
            this.openQuickView(oEvent, this.getModel("employeeModel"));
        },
        openQuickView: function (oEvent, oModel) {
            var oButton = oEvent.getSource(),
                oView = this.getView();

            if (!this._empQuickView) {
                this._empQuickView = Fragment.load({
                    id: oView.getId(),
                    name: "au.com.bournedigital.developertest.view.fragment.EmployeeQuickView",
                    controller: this
                }).then(function (oQuickView) {
                    oView.addDependent(oQuickView);
                    return oQuickView;
                });
            }
            this._empQuickView.then(function (oQuickView){
                oQuickView.setModel(oModel);
                oQuickView.openBy(oButton);
            });
        },

        /**
         * Event handler when the share in JAM button has been clicked
         * @public
         */
        onShareInJamPress : function () {
            var oViewModel = this.getModel("worklistView"),
                oShareDialog = sap.ui.getCore().createComponent({
                    name: "sap.collaboration.components.fiori.sharing.dialog",
                    settings: {
                        object:{
                            id: location.href,
                            share: oViewModel.getProperty("/shareOnJamTitle")
                        }
                    }
                });
            oShareDialog.open();
        },

        onSearch : function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any master list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");
                var Query1,Query2,fullNameFilter;
                if (sQuery && sQuery.length > 0) {

                    //This logic is for finding space and applying full name search.
                    if(sQuery.indexOf(' ') >= 0)
                    {
                        sQuery = sQuery.replace(/  +/g, ' ');
                        Query1=sQuery.split(" ")[0];
                        Query2=sQuery.split(" ")[1];

                        //sameOrderFullNameFilter is for Full name search when firstname and lastname are searched as "Firstname LastName" in same order
                        var sameOrderFullNameFilter=new Filter({
                            filters:[
                                new Filter("Employee/FirstName", FilterOperator.Contains, Query1),
                                new Filter("Employee/LastName", FilterOperator.Contains, Query2)  
                            ],
                            and:true
                           
                        });

                        //reverseOrderFullNameFilter is for Full name search when firstname and lastname are searched as "LastName Firstname" in reverse order
                        var reverseOrderFullNameFilter=new Filter({
                            filters:[
                                new Filter("Employee/FirstName", FilterOperator.Contains, Query2),
                                new Filter("Employee/LastName", FilterOperator.Contains, Query1)  
                            ],
                            and:true
                           
                        });
                        aTableSearchState = new Filter({
                            filters: [
                                new Filter("CustomerID", FilterOperator.Contains, sQuery),
                                new Filter("Customer/CompanyName", FilterOperator.Contains, sQuery),
                                new Filter("Employee/FirstName", FilterOperator.Contains, sQuery),
                                new Filter("Employee/LastName", FilterOperator.Contains, sQuery),
                                sameOrderFullNameFilter,
                                reverseOrderFullNameFilter                                
                            ],
                            and: false
                        });

                    }
                    //This will work when single word has been typed including firstname and lastname
                    else{
                        aTableSearchState = new Filter({
                            filters: [
                                new Filter("CustomerID", FilterOperator.Contains, sQuery),
                                new Filter("Customer/CompanyName", FilterOperator.Contains, sQuery),
                                new Filter("Employee/FirstName", FilterOperator.Contains, sQuery),
                                new Filter("Employee/LastName", FilterOperator.Contains, sQuery)                                
                            ],
                            and: false
                        });
                    }                                            
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh : function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * On phones a additional history entry is created
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject : function (oItem) {
            this.getRouter().navTo("object",{
                objectId:oItem.getBindingContext() ? oItem.getBindingContext().getProperty("OrderID") : " "
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function(aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        }

    });
}
);