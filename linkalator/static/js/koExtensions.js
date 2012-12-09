//NOTE: do not remove the 'element' param; valueAccessor() seems to query it for the observable value

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
            if (typeof value === 'object' && typeof value.getDate === 'function')
            {
                //if value is a JavaScript date, try getting date string
                value = CONFAB.formateDateString(value);
            }
            $(element).datepicker("setDate", value);
        }
    }
};

ko.bindingHandlers.button = {
    init: function (element)
    {
        //initialize button
        $(element).button();

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function ()
        {
            $(element).button("destroy");
        });

    },
    update: function (element)
    {
        $(element).button();
    }
};

ko.bindingHandlers.money = {
    init: function (element, valueAccessor)
    {
        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function ()
        {
            var observable = valueAccessor();
            if (typeof observable === 'function')
            {
                observable(CONFAB.formatMoneyString(element.value));
            }
        });
    },
    update: function (element, valueAccessor)
    {
        var observable = valueAccessor();
        if (typeof observable === 'function')
        {
            var value = ko.utils.unwrapObservable(valueAccessor());
            observable(CONFAB.formatMoneyString(value));
        }
    }
};

ko.extenders.liveEditor = function(target) {
    if (typeof target === 'function') {
        target.editing = ko.observable(false);

        target.edit = function() {
            target.editing(true);
        };

        target.stopEditing = function() {
            target.editing(false);

        };
    }

    return target;
};

ko.bindingHandlers.liveEditor = {
    init: function(element, valueAccessor) {
        var observable = valueAccessor();
        if (typeof observable === 'function') {
            //observable.extend({ liveEditor: this });
            $(element.children[0].children[0]).click(function() { CONFAB.focusNextInput(this); });
        }
    },
    update: function(element, valueAccessor) {
        var observable = valueAccessor();
        if (typeof observable === 'function') {
            //ko.bindingHandlers.css.update(element, function() { return { editing: observable.editing }; });
        }
    }
};