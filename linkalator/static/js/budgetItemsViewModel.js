function BudgetItem(data)
{
    this.ItemId = ko.observable(data.ItemId);
    this.ItemDate = ko.observable(data.ItemDate);
    this.Counterparty = ko.observable(data.Counterparty);
    this.ItemDescription = ko.observable(data.ItemDescription);
    this.Amount = ko.observable(data.Amount);
    this.RemainingBalance = ko.observable(data.RemainingBalance);
}

var BudgetItemModel = function (accountId)
{
    var self = this;
    self.budgetItems = ko.observableArray([]);

    self.addBudgetItem = function ()
    {
        self.budgetItems.push({
            ItemDate: new Date(),
            Counterparty: "",
            ItemDescription: "",
            Amount: "",
            RemainingBalance: ""
        });
    };

    self.removeBudgetItem = function (budgetItem)
    {
        self.budgetItems.remove(budgetItem);
    };

    self.save = function (form)
    {
        alert("Could now transmit to server: " + ko.toJSON({ budgetItems: self.budgetItems }));
        // To actually transmit to server as a regular form post, write this: ko.utils.postJson($("form")[0], self.budgetItems);
    };


    $.ajax({
        type: "get",
        url: "http://localhost:62801/api/budgetitems?accountId=" + accountId,
        data: '{}',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        statusCode: {
            200: function (data)
            {
                var mappedBudgetItems = $.map(data, function (item) { return new BudgetItem(item); });
                self.budgetItems(mappedBudgetItems);
            },
            401: function ()
            {
                sendToLogin();
            }
        }
    });


    var sendToLogin = function ()
    {
        $('<div></div>')
            .load('http://localhost:62801/account/login?reload=1')
            .dialog({
                autoOpen: true,
                width: 600,
                modal: true,
                zIndex: 3000,
                title: "Please Sign In"
            });
    };
};

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindingsAccessor)
    {
        //initialize datepicker with some optional options
        var options = allBindingsAccessor().datepickerOptions || {};
        $(element).datepicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function ()
        {
            var observable = valueAccessor();
            observable($(element).datepicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function ()
        {
            $(element).datepicker("destroy");
        });

    },
    update: function (element, valueAccessor)
    {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            current = $(element).datepicker("getDate");

        if (value - current !== 0)
        {
            $(element).datepicker("setDate", value);
        }
    }
};


 