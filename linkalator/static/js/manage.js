CONFAB.manage = CONFAB.manage || {};

CONFAB.manage.Page = function() {
    this.confirmDeleteHtml = "";
    this.fiscalYearStart = null;
    this.fiscalYearEnd = null;
    this.allFiscalYears = null;
    this.timeStamp = new Date().getTime();
};

CONFAB.manage.Page.prototype = (function() {
    var self = this;
    self.selectedFiscalYearId = 0;
    self.accounts = [];
    //private members
    var initiateFiscalYearsTab = function() {
        if (this.fiscalYearStart === undefined || this.fiscalYearEnd === undefined) {
            getFiscalYearStartEndClient();
        }
        if ($('#uxFiscalYearList').get(0).value === "") {
            populateFiscalYearList();
        }
        var fyStart = addYearToDateString(self.fiscalYearStart);
        var fyEnd = addYearToDateString(self.fiscalYearEnd);
        $('#uxFiscalYearStartDate').datepicker();
        $('#uxFiscalYearStartDate').datepicker('setDate', fyStart);
        $('#uxFiscalYearEndDate').datepicker();
        $('#uxFiscalYearEndDate').datepicker('setDate', fyEnd);
        $('#uxEditFiscalYearDialog').dialog({
            autoOpen: false,
            width: 500,
            buttons: {
                "Make active": function() { activateExistingFiscalYear(); },
                "Add new fiscal year": function() { addFiscalYearFromEdit(); },
                "Cancel": function() { $(this).dialog('close'); }
            }
        });
        $('#uxCloseFiscalYearDialog').dialog({
            autoOpen: false,
            buttons: {
                "Cancel": function() { $(this).dialog('close'); }
            }
        });
        $('#uxAddFiscalYearDialog').dialog({
            width: 800,
            autoOpen: false,
            buttons: {
                "Add fiscal year": function() {
                    addFiscalYear();
                    $(this).dialog('close');
                },
                "Cancel": function() { $(this).dialog('close'); }
            }
        });
        $('#uxAddFiscalYearCmd').button().click(function() {
            $('#uxAddFiscalYearDialog').dialog('open');
        });
        $('#uxEditFiscalYearCmd').button().click(function() {
            requestEditFiscalYear($('#uxFiscalYearList option:selected').val());
            $('#uxEditFiscalYearDialog').dialog('open');
        });
        $('#uxCloseFiscalYearCmd').button().click(function() { $('#uxCloseFiscalYearDialog').dialog('open'); });
    };

    var findSelectedAccount = function() {
        $('#uxAjaxDeleteAccountDiv').html("");

        if ($('#uxActiveAccountsListBox').val() !== "") {
            var acctName = $('#uxActiveAccountsListBox option:selected').text();
            $('#uxAjaxDeleteAccountDiv').html("Do you really want to delete the " + acctName + " account?");
            $('#uxConfirmDeleteInstructionsLbl').html("Do you want to move all " + acctName + " account entries to another account or delete them?<br/>" + this.confirmDeleteHtml);
            $('#uxAjaxDeleteAccountDiv').dialog('open');
        }
        else {
            returnNoAcctDivToInitialState();
            $('#uxNoSelectionAlert').dialog("open");
        }
    };

    var deleteAccountWithMove = function() {
        var deletedAcctId = $('#uxActiveAccountsListBox').val();
        var deletedAcctName = $('#uxActiveAccountsListBox option:selected').text();
        var targetAcctId = $('#uxTargetMoveAccountDropDown').val();
        var targetAcctName = $('#uxTargetMoveAccountDropDown option:selected').text();

        $.ajax({
            type: "delete",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts/" + deletedAcctId + "/" + targetAcctId,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function() {
                returnNoAcctDivToInitialState();
                $("#uxActiveAccountsListBox option[value='" + deletedAcctId + "']").remove();
                $("#uxTargetMoveAccountDropDown option[value='" + deletedAcctId + "']").remove();
                CONFAB.openDialog('#uxNoSelectionAlert', deletedAcctName + ' account deleted and all entries moved to ' + targetAcctName + ' account.', 'Success');
            }
        });
    };

    var deleteAccountNoMove = function() {
        var deletedAcctId = $('#uxActiveAccountsListBox').val();
        var deletedAcctName = $('#uxActiveAccountsListBox option:selected').text();

        $.ajax({
            type: "delete",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts/" + deletedAcctId,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function() {
                returnNoAcctDivToInitialState();
                $("#uxActiveAccountsListBox option[value='" + deletedAcctId + "']").remove();
                $("#uxTargetMoveAccountDropDown option[value='" + deletedAcctId + "']").remove();
                CONFAB.openDialog('#uxNoSelectionAlert', deletedAcctName + ' account deleted successfully.', 'Success');
            }
        });
    };

    var addAcctAjax = function() {

        var newAccountIncome = $('#uxAjaxAddAcctIncomeChk').is(':checked');
        var newAccount = {
            AccountName: $('#uxAjaxAddAcctNameTxt').val(),
            Income: newAccountIncome,
            ProjectedIncome: newAccountIncome ? $('#uxAjaxAddAcctStartBalTxt').val() : undefined,
            StartingBalance: newAccountIncome ? undefined : $('#uxAjaxAddAcctStartBalTxt').val()
        };


        $.ajax({
            type: "post",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts",
            data: JSON.stringify(newAccount),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                if (msg !== "") {
                    $('#uxActiveAccountsListBox').append("<option value='" + msg + "'>" + newAccount.AccountName + "</option>");
                    $('#uxTargetMoveAccountDropDown').append("<option value='" + msg + "'>" + newAccount.AccountName + "</option>");
                    $('#uxNoSelectionAlert').html(newAccount.AccountName + " account added successfully.");
                    $('#uxNoSelectionAlert').dialog('option', 'title', 'Info');
                    $('#uxNoSelectionAlert').dialog("open");
                }
                else {
                    $('#uxNoSelectionAlert').html("Account name cannot be blank or the same as an existing account.");
                    $('#uxNoSelectionAlert').dialog('option', 'title', 'Error adding account');
                    $('#uxNoSelectionAlert').dialog("open");
                }
                $('#uxAjaxAddAcctNameTxt').val("");
                $('#uxAjaxAddAcctIncomeChk').attr('checked', false);
                changeStartingBalanceLbl($('#uxAjaxAddAcctIncomeChk'), '#tdBalanceTitle');
                $('#uxAjaxAddAcctStartBalTxt').val("");
            }
        });
    };

    var getUsers = function() {
        $.ajax({
            type: "get",
            url: "http://" + CONFAB.hostnameAndPort + "/api/users",
            success: function(msg) {
                if (typeof msg === 'object' && msg !== null) {
                    haveUsers(msg);
                }
            }
        });
    };

    var getCurrentUser = function() {
        $.ajax({
            type: "get",
            url: "ManageService.svc/GetCurrentUserAjax",
            data: "{}",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                if (typeof msg === 'string' && msg !== "") {
                    haveCurrentUser(msg);
                }
            }
        });
    };

    var getAccounts = function() {
        $.ajax({
            type: "get",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts/" + self.selectedFiscalYearId,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                getAccountsSuccess(msg);
            },
            error: function(msg) { alert(msg); }
        });
    };

    var getAccountsSuccess = function(msg) {
        if (typeof msg === 'object' && msg !== null) {
            self.accounts = msg;
            haveAccounts(msg);
        }
    };

    var addNewUserAjax = function() {
        var firstName = $('#uxNewUserFirstNameTxt').val();
        var lastName = $('#uxNewUserLastNameTxt').val();
        var userName = $('#uxNewUserUserNameTxt').val();
        var password = $('#uxNewUserPasswordTxt').val();
        var isAdmin = $('#uxNewUserAdminChk').is(':checked');
        var fieldNames = ["First Name", "Last Name", "Username", "Password"];
        var fieldValues = [firstName, lastName, userName, password];
        var incompleteFieldAlert = validateFieldInfo(fieldNames, fieldValues);
        if (incompleteFieldAlert !== "") {
            openJqueryAlert(incompleteFieldAlert);
        }
        else {
            $.ajax({
                type: "POST",
                url: "ManageService.svc/AddUserAjax",
                data: '{"firstName": "' + firstName + '", "lastName": "' + lastName +
                '", "userName": "' + userName + '", "password": "' + password + '", "isAdmin": "' + isAdmin + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(msg) {
                    addUserAjaxSuccess(msg);
                    if (!(msg.value.startsWith("Error"))) {
                        $('#uxAjaxUserList').append("<option value='" + msg.Key + "'>" + firstName + " " + lastName + "</option>");
                    }
                }
            });
        }
    };

    var deleteUserAjax = function() {
        if ($('#uxAjaxUserList').val() !== "") {
            var userId = ($('#uxAjaxUserList').val()[0]);
            $.ajax({
                type: "delete",
                url: "http://" + CONFAB.hostnameAndPort + "/api/users/" + userId,
                success: function(msg) {
                    if (!(msg.startsWith("Error"))) {
                        $("#uxAjaxUserList option[value='" + userId + "']").remove();
                    }
                    openJqueryResponseDialog(msg, "Success");
                }
            });
        }
        else {
            openJqueryAlert("Please select a user.");
        }
    };

    var addUserAjaxSuccess = function(msg) {
        returnNoAcctDivToInitialState();
        $('#uxNoSelectionAlert').html(msg.value);
        $('#uxNoSelectionAlert').dialog({
            title: "Info",
            autoOpen: true,
            buttons: {
                "Okay": function() {
                    returnNoAcctDivToInitialState();
                    $(this).dialog('close');
                    if (!(msg.value.startsWith("Error"))) {
                        wipeNewUserInfo();
                    }
                    $('#uxAddUserAjaxDiv').dialog('close');
                }
            }
        });
        $('#uxNoSelectionAlert').dialog("open");
    };

    var requestEditFiscalYear = function(fiscalYearId) {
        var i;
        for (i = 0; i < self.allFiscalYears.Length; i++) {
            if (self.allFiscalYears[i].FiscalYearId === parseInt(fiscalYearId, 10)) {
                openFiscalYearEditDialog();
                break;
            }
        }
    };

    var requestEditAccount = function() {
        var i;
        if ($('#uxActiveAccountsListBox').val() !== "") {
            var acctId = $('#uxActiveAccountsListBox').val();
            for (i = 0; i < self.accounts.length; i++) {
                if (self.accounts[i].AccountId === parseInt(acctId, 10)) {
                    $('#uxEditAccountNameTxt').val(accounts[i].AccountName);
                    $('#uxEditAccountIncomeChk').get(0).checked = accounts[i].Income;
                    $('#uxEditAccountProjectedIncomeTxt').val(accounts[i].ProjectedIncome);
                    $('#uxEditAccountStartingBalanceTxt').val(accounts[i].StartingBalance);
                    break;
                }
            }
            $('#uxEditAccountAjaxDiv').dialog('option', 'title', 'Edit account - Fiscal Year ' + getCurrentFiscalYearDisplayName());
            $('#uxEditAccountAjaxDiv').dialog('open');
        }
        else {
            returnNoAcctDivToInitialState();
            $('#uxNoSelectionAlert').dialog("open");
        }
    };

    var applyAccountEditAjax = function() {
        var editAccountInfo = {
            AccountId: parseInt($('#uxActiveAccountsListBox').val(), 10),
            AccountName: $('#uxEditAccountNameTxt').val(),
            Inome: $('#uxEditAccountIncomeChk').is(':checked'),
            ProjectedIncome: $('#uxEditAccountProjectedIncomeTxt').val(),
            StartingBalance: $('#uxEditAccountStartingBalanceTxt').val()
        };

        $.ajax({
            type: "put",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts/" + editAccountInfo.AccountId,
            data: JSON.stringify(editAccountInfo),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) { applyEditAccountSuccess(msg, editAccountInfo); }
        });
    };

    var getFiscalYearStartEndClient = function() {
        var i;
        for (i = 0; i < this.allFiscalYears.Length; i++) {
            if (this.allFiscalYears[i].Active) {
                var fyStart = new Date(this.allFiscalYears[i].DateStart);
                var fyEnd = new Date(this.allFiscalYears[i].DateEnd);
                this.fiscalYearStart = (fyStart.getMonth() + 1) + "/" + fyStart.getDate() + "/" + fyStart.getFullYear();
                this.fiscalYearEnd = (fyEnd.getMonth() + 1) + "/" + fyEnd.getDate() + "/" + fyEnd.getFullYear();
                break;
            }
        }
    };

    var getFiscalYears = function() {
        $.ajax({
            type: "get",
            url: "http://" + CONFAB.hostnameAndPort + "/api/fiscalyears/all/true",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                getFiscalYearsSuccess(msg);
            }
        });
    };

    var getFiscalYearsSuccess = function(msg) {
        this.allFiscalYears = msg;
        this.allFiscalYears.Length = $(this.allFiscalYears).length;
        self.selectedFiscalYearId = CONFAB.getActiveFiscalYearId(msg);
        getAccounts();
    };

    var addFiscalYear = function() {
        var displayName = createFiscalYearDisplayName();
        if (fiscalYearDisplayNameIsValid(displayName)) {
            var active = $('#uxActiveFiscalYear').is(':checked');
            var startDate = $('#uxFiscalYearStartDate').val();
            var endDate = $('#uxFiscalYearEndDate').val();
            $.ajax({
                type: "post",
                url: "http://" + CONFAB.hostnameAndPort + "/api/fiscalyears",
                data: '{ "FiscalYearId" : 0, "DisplayName": "' + displayName + '", "Active": "' + active + '", "StartDate": "' + startDate + '", "EndDate": "' + endDate + '"}',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(msg) { addFiscalYearSuccess(msg, displayName); }
            });
        }
        else {
            openJqueryResponseDialog("Fiscal years must be in yyyy-yyyy format.", "Invalid Format");
        }
    };

    var activateExistingFiscalYear = function() {
        var fiscalYearId = $('#uxEditFiscalYearSelect').val();
        $.ajax({
            type: "put",
            url: "http://" + CONFAB.hostnameAndPort + "/api/fiscalyears/activate/" + fiscalYearId,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                activateExistingFiscalYearSuccess(msg, fiscalYearId);
            }
        });
        $('#uxEditFiscalYearDialog').dialog('close');
    };

    var addFiscalYearFromEdit = function() {
        $('#uxEditFiscalYearDialog').dialog('close');
        $('#uxActiveFiscalYear').prop('checked', true);
        $('#uxActiveFiscalYear').hide();
        $('#uxActiveFiscalYearInstructions').hide();
        $('#uxAddFiscalYearDialog').dialog('open');
    };

    var activateExistingFiscalYearSuccess = function(msg, fiscalYearId) {
        if (msg === parseInt(fiscalYearId, 10)) {
            var fiscalYearDisplayName = $('#uxEditFiscalYearSelect').text();
            openJqueryResponseDialog("Fiscal year " + fiscalYearDisplayName + " made active.", "Fiscal Year Updated");
            updateFiscalYears(fiscalYearId);
        }
    };

    var openFiscalYearEditDialog = function() {
        var i;
        $('#uxEditFiscalYearSelect').empty();
        for (i = 0; i < self.allFiscalYears.Length; i++) {
            if (!self.allFiscalYears[i].Active) {
                $('#uxEditFiscalYearSelect').append('<option value="' + self.allFiscalYears[i].FiscalYearId + '">' + self.allFiscalYears[i].DisplayName + '</option>');
            }
        }
        $('#uxEditFiscalYearDialog').dialog('open');
    };


    var wipeEditAccountInfo = function() {
        $('#uxEditAccountNameTxt').val("");
        $('#uxEditAccountProjectedIncomeTxt').val("");
        $('#uxEditAccountStartingBalanceTxt').val("");
        $('#uxEditAccountIncomeChk').get(0).checked = false;
    };

    var addFiscalYearSuccess = function(msg, displayName) {
        if (msg !== -1) {
            openJqueryResponseDialog("Fiscal year " + displayName + " added successfully.", "Fiscal year added");
            $('#uxFiscalYearList').append("<option value='" + msg + "'>" + displayName + "</option>");

        }
    };

    var addYearToDateString = function(dateString) {
        var targetDate = new Date(dateString);
        var year = targetDate.getFullYear();
        year += 1;
        targetDate.setFullYear(year);
        return targetDate;
    };

    var fiscalYearDisplayNameIsValid = function(displayName) {
        displayName = $.trim(displayName);
        var fiscalYearFormatString = /\d{4}-\d{4}$/;
        return fiscalYearFormatString.test(displayName);
    };

    var createFiscalYearDisplayName = function() {
        var fyStartDate = new Date($('#uxFiscalYearStartDate').val());
        var fyEndDate = new Date($('#uxFiscalYearEndDate').val());
        var fyStartYear = fyStartDate.getFullYear();
        var fyEndYear = fyEndDate.getFullYear();
        var retVal = fyStartYear + '-' + fyEndYear;
        return retVal;
    };

    var getCurrentFiscalYearDisplayName = function() {
        var retVal = "";
        var i;
        for (i = 0; i < this.allFiscalYears.Length; i++) {
            if (this.allFiscalYears[i].Active) {
                retVal = this.allFiscalYears[i].DisplayName;
                break;
            }
        }
        return retVal;
    };

    var updateFiscalYears = function(fiscalYearId) {
        var i;
        $('#uxEditFiscalYearSelect').empty();
        for (i = 0; i < this.allFiscalYears.Length; i++) {
            if (this.allFiscalYears[i].FiscalYearId === parseInt(fiscalYearId, 10)) {
                this.allFiscalYears[i].Active = true;
                var fyStart = new Date(this.allFiscalYears[i].DateStart);
                var fyEnd = new Date(this.allFiscalYears[i].DateEnd);
                this.fiscalYearStart = (fyStart.getMonth() + 1) + "/" + fyStart.getDate() + "/" + fyStart.getFullYear();
                this.fiscalYearEnd = (fyEnd.getMonth() + 1) + "/" + fyEnd.getDate() + "/" + fyEnd.getFullYear();
            }
            else {
                this.allFiscalYears[i].Active = false;
                $('#uxEditFiscalYearSelect').append("<option value='" + this.allFiscalYears[i].FiscalYearId + "'>" + this.allFiscalYears[i].DisplayName + "</option>");
            }
        }
        $('#uxFiscalYearList').val(fiscalYearId);
    };

    var haveCurrentUser = function(currentUserName) {
        if (!(currentUserName.startsWith("Error"))) {
            $('#uxUserGreetingLbl').html("Welcome, " + currentUserName);
        }
    };

    var applyEditAccountSuccess = function(msg, editAccountInfo) {
        //TODO: add updated name (if different) to account dropdown and account delete dropdown

        openJqueryResponseDialog(editAccountInfo.AccountName + " has been successfully updated.", "Account updated successfully");
        $("#uxActiveAccountsListBox option[value='" + editAccountInfo.AccountId + "']").html(editAccountInfo.AccountName);
        this.allAccountListBoxText = $('#uxActiveAccountsListBox').html();
    };

    var wipeNewUserInfo = function() {
        $('#uxNewUserFirstNameTxt').val("");
        $('#uxNewUserLastNameTxt').val("");
        $('#uxNewUserUserNameTxt').val("");
        $('#uxNewUserPasswordTxt').val("");
    };

    var validateFieldInfo = function(fieldNames, fieldValues) {
        var message = "";
        var i;
        for (i = 0; i < fieldNames.length; i++) {
            if (fieldValues[i].length < 2) {
                message += fieldNames[i] + ", ";
            }
        }
        if (message !== "") {
            message = message.substring(0, (message.length - 2));
            var lastComma = message.lastIndexOf(',');
            if (lastComma !== -1) {
                var firstFinalMessage = message.substring(0, lastComma);
                var secondFinalMessage = message.substring((lastComma + 1), message.length);
                message = firstFinalMessage + " and" + secondFinalMessage;
            }
            message += " must be entered.";
        }
        return message;
    };

    var changeStartingBalanceLbl = function(checkBox, elementSelector) {
        if (checkBox.checked) {
            $(elementSelector).html("Projected Income");
        }
        else {
            $(elementSelector).html("Starting Balance");
        }
    };

    var haveUsers = function(users) {
        var i;
        for (i = 0; i < users.length; i++) {
            $('#uxAjaxUserList').append("<option value='" + users[i].Id + "'>" + users[i].FirstName + " " + users[i].LastName + "</option>");
        }
    };

    var haveAccounts = function(accounts) {
        var i;
        for (i = 0; i < $(accounts).length; i++) {
            $('#uxActiveAccountsListBox').append("<option value='" + accounts[i].AccountId + "'>" + accounts[i].AccountName + "</option>");
            $('#uxTargetMoveAccountDropDown').append("<option value='" + accounts[i].AccountId + "'>" + accounts[i].AccountName + "</option>");
        }
        self.allAccountListBoxText = $('#uxActiveAccountsListBox').html();
    };

    var populateFiscalYearList = function() {
        var i;
        for (i = 0; i < this.allFiscalYears.Length; i++) {
            if (this.allFiscalYears[i].Active) {
                $('#uxFiscalYearList').append("<option value='" + this.allFiscalYears[i].FiscalYearId + "' selected='selected'>" + this.allFiscalYears[i].DisplayName + "</option>");
            }
            else {
                $('#uxFiscalYearList').append("<option value='" + this.allFiscalYears[i].FiscalYearId + "'>" + this.allFiscalYears[i].DisplayName + "</option>");
            }
        }
    };

    var returnNoAcctDivToInitialState = function() {
        $('#uxNoSelectionAlert').html("Please select an account.");
        $('#uxNoSelectionAlert').dialog('option', 'title', 'Not so fast...');
    };

    var openJqueryAlert = function(alertMessage) {
        $('#uxNoSelectionAlert').html(alertMessage);
        $('#uxNoSelectionAlert').dialog({
            title: 'Not so fast...',
            buttons: {
                "Okay": function() {
                    returnNoAcctDivToInitialState();
                    $(this).dialog('close');
                }
            },
            autoOpen: true
        });
    };

    var openJqueryResponseDialog = function(alertMessage, alertTitle) {
        $('#uxNoSelectionAlert').html(alertMessage);
        $('#uxNoSelectionAlert').dialog({
            title: alertTitle,
            buttons: {
                "Okay": function() {
                    returnNoAcctDivToInitialState();
                    $(this).dialog('close');
                }
            },
            autoOpen: true
        });
    };

    //public members
    return {
        returnNoAcctDivToInitialState: returnNoAcctDivToInitialState,
        changeStartingBalanceLbl: changeStartingBalanceLbl,
        wipeNewUserInfo: wipeNewUserInfo,
        wipeEditAccountInfo: wipeEditAccountInfo,
        getFiscalYears: getFiscalYears,
        applyAccountEditAjax: applyAccountEditAjax,
        requestEditAccount: requestEditAccount,
        deleteUserAjax: deleteUserAjax,
        addNewUserAjax: addNewUserAjax,
        getAccounts: getAccounts,
        getCurrentUser: getCurrentUser,
        getUsers: getUsers,
        addAcctAjax: addAcctAjax,
        deleteAccountNoMove: deleteAccountNoMove,
        deleteAccountWithMove: deleteAccountWithMove,
        findSelectedAccount: findSelectedAccount,
        initiateFiscalYearsTab: initiateFiscalYearsTab
    };
} ());
