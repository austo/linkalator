var CONFAB = CONFAB || {};
CONFAB.LinkalatorPage = function() {};


CONFAB.LinkalatorPage.prototype = (function() {
    var self = this;

    //private members
    var confirmLinkDelete = function(linkId){
      alert('Are you sure you want to delete this link?');
      $.ajax({
                type: "post",
                url: "/link/remove/" + linkId,
                statusCode: {
                    200: function(response) {
                        alert(response.message);
                    },
                    500: function() { alert("Internal server error!"); }
                }
            });
      $('li[value^="' + linkId + '"]').first().toggle();
    };

    var incrementClickCount = function(linkId){
      $.ajax({
          type: "post",
          url: "/click/" + linkId,
          statusCode: {
              200: function(response) { alert(response.message); },
              500: function() { alert("Internal server error!"); }
          }
      });
    };    

    //public members
    return {
        confirmLinkDelete: confirmLinkDelete,
        incrementClickCount: incrementClickCount,        
    };
} ());