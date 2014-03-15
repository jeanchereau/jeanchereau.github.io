/**
 * Created by Jean on 02/02/2014.
 */
$(document).ready(function(){
    $('#button1').click(function(){
        $('#second').css('display', 'block');
    });

    $('#button2').click(function(){
        $('#second').css('display', 'none');
    });

    $('.urgent').click(function(e){
        var color = '#';
        for (var i=0; i<6; i++){
            var r = Math.floor(17*Math.random());
            color = color + r.toString(16);

        }
        $(e.target).css('color',color);
    });
});
