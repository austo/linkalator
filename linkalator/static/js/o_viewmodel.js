var CONFAB = CONFAB || {};

CONFAB.Agent = function(data)
{
    this.id = ko.observable(data.id);
    this.city = ko.observable(data.city);
    this.name = ko.observable(data.name);
    this.commission = ko.observable(data.commission);    
}

CONFAB.AgentModel = function () {
    var self = this;
    self.agents = ko.observableArray([]);

    self.addAgent = function (){
        self.agents.push(new CONFAB.Agent({
            id: 0,
            city: "",
            name: "",
            commission: "",
        }));
    };

    self.removeAgent = function (agent) {
        self.agents.remove(agent);
    };

    self.save = function (form) {
        alert("Could now transmit to server: " + ko.toJSON({ agents: self.agents }));
        // To actually transmit to server as a regular form post, write this: ko.utils.postJson($("form")[0], self.budgetItems);
    };


    $.ajax({
        type: "get",
        url: "http://" + CONFAB.hostnameAndPort + "/agents",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        statusCode: {
            200: function (data)
            {
                var retAgents = data.agents;
                var mappedAgents = $.map(retAgents, function (item) { return new CONFAB.Agent(item); });
                self.agents(mappedAgents);
            },
            500: function ()
            {
                alert("Oh my god!!!");
            }
        }
    });

    ko.applyBindings(self);    
};