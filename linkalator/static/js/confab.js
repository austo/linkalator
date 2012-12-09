var CONFAB = CONFAB || {};

CONFAB.hostnameAndPort = window.location.host;

CONFAB.ensureObjectCreate = function() {
    if (typeof Object.create !== 'function') {
        Object.create = function(o) {
            function F() { }

            F.prototype = o;
            return new F();
        };
    }
};

CONFAB.ensureStringStartsWith = function() {
    if (typeof String.prototype.startsWith !== 'function') {
        String.prototype.startsWith = function(str) {
            return this.indexOf(str) === 0;
        };
    }
};

CONFAB.openDialog = function(alertDivId, alertMessage, alertTitle) {
    $(alertDivId).html(alertMessage);
    $(alertDivId).dialog({
        title: alertTitle,
        width: 400,
        buttons: {
            "Okay": function() {
                $(alertDivId).html("Please select a value.");
                $(alertDivId).dialog('option', 'title', 'Information');
                $(this).dialog('close');
            }
        },
        autoOpen: true
    });
};

CONFAB.formatMoneyString = function(rawMoney) {
    var retVal = "";
    var dollarSign = '$';
    if (rawMoney) {

        if (typeof rawMoney === 'number' && !isNaN(rawMoney)) {
            retVal = dollarSign + rawMoney.toFixed(2);
        }
        else if (typeof rawMoney === 'string' && !isNaN(rawMoney)) {
            retVal = dollarSign + parseFloat(rawMoney).toFixed(2);
        }
        else if (typeof rawMoney === 'string' && rawMoney.indexOf('$') === 0) {
            retVal = rawMoney;
        }
        else {
            throw { name: "Invalid format exception", message: "Monetary amounts must be in numeric or currency format." };
        }
    }
    return retVal;

};

CONFAB.parseMoneyString = function(moneyString) {
    var retVal = 0;
    if (typeof moneyString === 'string' && moneyString.indexOf('$') === 0) {
        retVal = moneyString.substr(1);
        retVal = parseFloat(retVal);
    }
    return retVal;
};

CONFAB.formateDateString = function(rawDate) {
    return (rawDate.getMonth() + 1) + "/" + rawDate.getDate() + "/" + rawDate.getFullYear();
};

CONFAB.getActiveFiscalYearId = function(data) {
    var retVal = 0;
    var i;
    for (i = 0; i < data.length; i++) {
        if (data[i].Active) {
            retVal = data[i].FiscalYearId;
        }
    }
    return retVal;
};

CONFAB.focusNextInput = function(currentLabel) {
    //Get hidden input, set display = block,
    //register blur callback, focus input, set cursor to line end
    if (currentLabel) {
        var nextInput = currentLabel.parentElement.parentElement.children[1];
        var text = $(nextInput).val();
        $(currentLabel).css('display', 'none');
        $(nextInput).css('display', 'block');
        $(nextInput).blur(function() {
            $(this).css('display', 'none');
            var nextLabel = $("label").get(($("label").index(currentLabel) + 1));
            CONFAB.focusNextInput(nextLabel);
            $(currentLabel).css('display', 'block');
        });
        $(nextInput).focus();
        $(nextInput).val(text);
    }
};


