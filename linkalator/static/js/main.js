//TODO: Eliminate spaghetti code (move to revealing module or prototype pattern)
var CONFAB = CONFAB || {};

CONFAB.Account = function(data) {
    this.AccountId = ko.observable(data.AccountId);
    this.AccountName = ko.observable(data.AccountName);
    this.Income = ko.observable(data.Income);
    this.ProjectedIncome = ko.observable(data.ProjectedIncome);
    this.StartingBalance = ko.observable(data.StartingBalance);
};

CONFAB.FiscalYear = function(data) {
    this.FiscalYearId = ko.observable(data.FiscalYearId);
    this.DisplayName = ko.observable(data.DisplayName);
    this.Active = ko.observable(data.Active);
    this.DateStart = ko.observable(data.DateStart);
    this.DateEnd = ko.observable(data.DateEnd);
};

CONFAB.BudgetItem = function(data) {
    this.ItemId = ko.observable(data.ItemId);
    this.AccountId = ko.observable(data.AccountId);
    this.FiscalYearId = data.FiscalYearId;
    this.ItemDate = ko.observable(data.ItemDate);
    this.Counterparty = ko.observable(data.Counterparty);
    this.ItemDescription = ko.observable(data.ItemDescription);
    this.Income = ko.observable(CONFAB.formatMoneyString(data.Income));
    this.Expense = ko.observable(CONFAB.formatMoneyString(data.Expense));
    this.RemainingBalance = ko.observable(CONFAB.formatMoneyString(data.RemainingBalance));
};

CONFAB.AccountModel = function(alertDivId) {
    var self = this;
    self.accounts = ko.observableArray([]);
    self.budgetItems = ko.observableArray([]);
    self.fiscalYears = ko.observableArray([]);
    self.selectedFiscalYearId = ko.observable(0);
    self.initialAccountBalance = ko.observable("");
    self.savedMessage = 'Saved.';
    self.notSavedMessage = 'Click "Save" ...';
    self.saved = ko.observable(self.savedMessage);

    //Update "saved" status based on changing budget items
    self.budgetItems.subscribe(function() {
        ko.utils.arrayForEach(self.budgetItems(), function(item) {
            item.ItemDate.subscribe(function() {
                self.saved(self.notSavedMessage);
            });
            item.Counterparty.subscribe(function() {
                self.saved(self.notSavedMessage);
            });
            item.ItemDescription.subscribe(function() {
                self.saved(self.notSavedMessage);
            });
            item.Income.subscribe(function() {
                self.saved(self.notSavedMessage);
            });
            item.Expense.subscribe(function() {
                self.saved(self.notSavedMessage);
            });
        });
    });

    $.ajax({
        type: "get",
        url: "http://" + CONFAB.hostnameAndPort + "/api/fiscalyears/all/true",
        statusCode: {
            200: function(data) {
                self.selectedFiscalYearId(CONFAB.getActiveFiscalYearId(data));
                var mappedFiscalYears = $.map(data, function(item) { return new CONFAB.FiscalYear(item); });
                self.fiscalYears(mappedFiscalYears);
                self.getAccounts();
            },
            401: function() {
                sendToLogin();
            },
            500: function() {
                openDialog("Sorry, a server error occured.", "Internal server error");
            }
        }
    });

    self.getAccounts = function() {
        $.ajax({
            type: "get",
            url: "http://" + CONFAB.hostnameAndPort + "/api/financialaccounts/" + self.selectedFiscalYearId(),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {
                haveAccounts(msg);
            },
            error: function(msg) { openDialog(msg, "Oops..."); }
        });
    };

    var sendToLogin = function() {
        $('<div></div>')
            .load('http://' + CONFAB.hostnameAndPort + '/account/login?reload=1')
            .dialog({
                autoOpen: true,
                width: 600,
                modal: true,
                zIndex: 3000,
                title: "Please Sign In"
            });
    };

    self.getBudgetItems = function(accountId) {
        $.ajax({
            type: "get",
            url: "http://" + CONFAB.hostnameAndPort + "/api/budgetitems/account/" + accountId + "/fiscalyear/" + self.selectedFiscalYearId(),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            statusCode: {
                200: function(data) {
                    var mappedBudgetItems = $.map(data, function(item) { return new CONFAB.BudgetItem(item); });
                    self.budgetItems(mappedBudgetItems);
                    getInitialAccountBalance(accountId);
                    $('#uxFiscalYearSelect').val(self.selectedFiscalYearId());
                },
                401: function() {
                    sendToLogin();
                }
            }
        });
    };

    self.addBudgetItem = function() {
        var rawDate = new Date();
        self.budgetItems.push(new CONFAB.BudgetItem({
            ItemId: 0,
            AccountId: $('#uxAccountSelect').val(),
            FiscalYearId: self.selectedFiscalYearId(),
            ItemDate: CONFAB.formateDateString(rawDate),
            Counterparty: "",
            ItemDescription: "",
            Amount: 0,
            RemainingBalance: ""
        }));
        self.saved(self.notSavedMessage);
    };

    self.removeBudgetItem = function(budgetItem) {
        if (budgetItem.ItemId() === 0) {
            self.budgetItems.remove(budgetItem);
            //openDialog("Budget item deleted successfully.", "Information");
        }
        else {
            deleteBudgetItem(budgetItem.ItemId());
            self.budgetItems.remove(budgetItem);
        }

    };

    self.saveBudgetItems = function() {
        var plural = self.budgetItems().length > 1 ? "items" : "item";
        $.ajax({
            type: "post",
            url: "http://" + CONFAB.hostnameAndPort + "/api/budgetitems",
            data: ko.toJSON(self.budgetItems),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            statusCode: {
                200: function() {
                    //openDialog("Budget " + plural + " saved successfully.", "Information");
                    self.getBudgetItems($('#uxAccountSelect').val());
                    self.saved(self.savedMessage);
                },
                401: function() {
                    sendToLogin();
                },
                500: function() { openDialog("Internal server error!", "Oops..."); }
            }
        });
    };

    var getInitialAccountBalance = function(accountId) {
        var i;
        for (i = 0; i < self.accounts().length; i++) {
            if (self.accounts()[i].AccountId() === parseInt(accountId, 10)) {
                if (self.accounts()[i].Income()) {
                    self.initialAccountBalance("Projected Income: " + CONFAB.formatMoneyString(self.accounts()[i].ProjectedIncome()));
                    break;
                }
                else {
                    self.initialAccountBalance("Starting Balance: " + CONFAB.formatMoneyString(self.accounts()[i].StartingBalance()));
                    break;
                }
            }
        }
    };

    var deleteBudgetItem = function(itemId) {
        $.ajax({
            type: "delete",
            url: "http://" + CONFAB.hostnameAndPort + "/api/budgetitems/" + itemId + "/" + self.selectedFiscalYearId(),
            statusCode: {
                200: function() {
                    //openDialog("Budget item deleted successfully.", "Information");
                },
                500: function() { openDialog("Internal server error!", "Oops..."); }
            }
        });
    };

    var haveAccounts = function(data) {
        var mappedAccounts = $.map(data, function(item) { return new CONFAB.Account(item); });
        self.accounts(mappedAccounts);
        self.getBudgetItems($('#uxAccountSelect').val() || 1);
    };

    var openDialog = function(alertMessage, alertTitle) {
        CONFAB.openDialog(alertDivId, alertMessage, alertTitle);
    };

    ko.applyBindings(self);

    return {
        saveBudgetItems: self.saveBudgetItems,
        removeBudgetItem: self.removeBudgetItem,
        addBudgetItem: self.addBudgetItem,
        getAccounts: self.getAccounts,
        getBudgetItems: self.getBudgetItems,
        budgetItems: self.budgetItems,
        accounts: self.accounts,
        selectedFiscalYearId: self.selectedFiscalYearId,
        openResponseDialog: openDialog
    };
};