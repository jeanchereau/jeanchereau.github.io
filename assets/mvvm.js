/**
 * Created by Jean on 30/10/2014.
 */
;(function($,kendo){
    var contact = kendo.observable({
        prefix:"",
        firstName:"",
        lastName:"",
        address:"",
        city:"",
        postalCode:"",
        country:"",
        dob:null,
        email:"",
        remember:false,
        save:function(){
            localStorage.setItem("contact",JSON.stringify(contact));
            alert("your contact has been saved");
        }
    });

    $(document).ready(function(){
        kendo.bind("body",contact);
    });

}(jQuery,kendo));

