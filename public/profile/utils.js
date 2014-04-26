/**
 * Created with PyCharm.
 * User: spencertank
 * Date: 4/24/14
 * Time: 8:37 PM
 * To change this template use File | Settings | File Templates.
 */


$(function () {
    $("#register-course-btn").click(function() {
        var self = this;
        if ($(this).prop("disabled"))
            return false;
        $(this).prop("disabled", true);
        $.ajax({
            crossDomain: false,
            type: "POST",
            data: {name: $('#course-name').val()},
            url: "/register_course"
        }).success(function(data) {
                console.log(data);
                $(self).removeProp("disabled");
            });
    });



});

