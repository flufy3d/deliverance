﻿////Config Variable
var server_ip = 'http://localhost';
var server_port = 8000;
//var server_ip = 'http://server.jit.su/';
//var server_port = 80;
////////////////////////////////////////
var already_login = false;

var user_name;
var socket;
socket = io.connect(server_ip,{port: server_port});
socket.on('login_response',function (data){
    if (data.result == 'OK' ) {
            $("#dialog-login").dialog( "close" );
            if(!already_login){
                user_name = data.name;
                $("#chat_div").chatbox("option", "id",user_name);
                run_client();
                }
            already_login = true;
    }
    else{
        alert('login failed');
}});
    
socket.on('register_response',function (data){
    if (data.result == 'OK' ) {
            alert('register success!');
            $( "#dialog-form" ).dialog( "close" );
    }
    else{
            alert('register failed!');
    }
});

socket.on('broadcast_chat_msg',function (data){
    if(already_login){
        $("#chat_div").chatbox("option", "boxManager").addMsg(data.name, data.value);
    }
});


function setCanvas(canvas_name){

   var canvasNode = document.getElementById(canvas_name);

   var pw = canvasNode.parentNode.clientWidth;
   var ph = canvasNode.parentNode.clientHeight;

   canvasNode.height = pw * (canvasNode.height/canvasNode.width);  
   canvasNode.width = pw ;
   //canvasNode.style.top = (ph-canvasNode.height)/2 + "px";
   //canvasNode.style.left = (pw-canvasNode.width)/2 + "px";
}     
setCanvas('canvas');
        
function run_client()
{
    var gameScene;
    var doc = new GLGE.Document();
    doc.onLoad=function(){
        //create the renderer
        var gameRenderer=new GLGE.Renderer(document.getElementById('canvas'));
        gameScene=new GLGE.Scene();
        gameScene=doc.getElement("scene");
        gameRenderer.setScene(gameScene);

        var mouse=new GLGE.MouseInput(document.getElementById('canvas'));
        var keys=new GLGE.KeyInput();

        doc.getElement("OBCircle").pickable=false;

        var manstate="stand";
        var manvel=[0,0,0];
        var manpos=[0,0,45];
        var manrot=0;
        var manrotvel=0;
        var armatue=doc.getElement("AMArmature");
        var manwalk=doc.getElement("ACArmature_walk");
        var manjump=doc.getElement("ACArmature_Jump");
        var manwalkback=doc.getElement("ACArmature_walkback");
        var manstand=doc.getElement("ACArmature_stand");
        var manland=doc.getElement("ACArmature_Land");
        var manfly=doc.getElement("ACArmature_Fly");
        var mantime=0;
        var char_title = new GLGE.Text();
        char_title.setId("char_title");
        char_title.setText(user_name);
        char_title.setSize(100);
        char_title.setFont("times");
        char_title.setColor("171a1c");
        char_title.setAlpha(0.8);
        char_title.setLookat(gameScene.camera);
        gameScene.addChild(char_title);

        function manlogic(){
            var matrix=armatue.getModelMatrix();
            incx=matrix[0];
            incy=matrix[4];
            var time=(new Date()).getTime();
            var dt=(time-mantime)/1000;
            
            //$("#debug").append(dt + '<br/>');
            //$("#debug").html(dt + '<br/>');
            if (dt > 1){
                mantime=(new Date()).getTime();
                return;
            }
            
            var camera=gameScene.camera;
            var position=camera.getPosition();
            
            if(dt<1){
                target=[manpos[0]-incx*40,manpos[1]-incy*40,manpos[2]+20];
                camera.setLocX(position.x+(target[0]-position.x)*dt);
                camera.setLocY(position.y+(target[1]-position.y)*dt);
                camera.setLocZ(position.z+(target[2]-position.z)*dt);
                camera.Lookat([manpos[0],manpos[1],manpos[2]+7]);
            }
                    
            if(keys.isKeyPressed(GLGE.KI_SPACE)){
                if(manstate!="jump" && manstate!="land"){
                    manstate="jump";
                    armatue.setAction(manjump,150);
                    manvel=[15*incx,15*incy,50];
                }
            }
            
            if(keys.isKeyPressed(GLGE.KI_UP_ARROW) && manstate!="jump" && manstate!="land"){
                if(manstate!="walk"){
                    manstate="walk";
                    armatue.setAction(manwalk,150,true);
                    manvel=[25*incx,25*incy,0];
                }
            }else if(keys.isKeyPressed(GLGE.KI_UP_ARROW) && (manstate=="jump" || manstate=="land")){
                manvel[0]=manvel[0]+20*incx*dt;
                manvel[1]=manvel[1]+20*incy*dt;
            }else if(manstate=="walk"){
                manstate="stand";
                armatue.setAction(manstand,150,true);
                manvel=[0,0,0];
            }
            if(keys.isKeyPressed(GLGE.KI_DOWN_ARROW) && manstate!="jump"){
                if(manstate!="walkback"){
                    manstate="walkback";
                    armatue.setAction(manwalkback,150,true);
                    manvel=[-15*incx,-15*incy,0];
                }
            }else if(manstate=="walkback"){
                manstate="stand";
                armatue.setAction(manstand,150,true);
                manvel=[0,0,0];
            }
            
            if(keys.isKeyPressed(GLGE.KI_LEFT_ARROW) && manstate!="jump"){
                if(manstate!="walk" && manrotvel==0){
                    manstate="turn";
                    manvel=[0,0,0];
                    armatue.setAction(manwalk,150,true);
                }else if(manstate=="walk"){
                    manvel=[10*incx,10*incy,0];
                }
                if(manstate!="walkback"){
                    manrotvel=3;
                }
            }else if(keys.isKeyPressed(GLGE.KI_RIGHT_ARROW) && manstate!="jump"){
                if(manstate!="walk" && manrotvel==0){
                    manstate="turn";
                    manvel=[0,0,0];
                    armatue.setAction(manwalk,150,true);
                }else if(manstate=="walk"){
                    manvel=[10*incx,10*incy,0];
                }
                if(manstate!="walkback"){
                    manrotvel=-3;
                }
            }else{
                if(manstate=="turn"){
                    armatue.setAction(manstand,150,true);
                    manvel=[0,0,0];
                }
                manrotvel=0;
            }
            
            if(manvel[0]>0 || manvel[1]>0){
                var dirtotal=Math.sqrt(manvel[0]*manvel[0]+manvel[1]*manvel[1]);
                var dirx=manvel[0]/dirtotal;
                var diry=manvel[1]/dirtotal;
                xdist=gameScene.ray([manpos[0],manpos[1],manpos[2]-6],[-dirx,-diry,0]);
                if(xdist != null){
                    xdist=((xdist.distance*100)|0)/100;
                    if(xdist<3 && xdist>0){
                        manvel[0]=0;
                        manvel[1]=0;
                    }};
            }
            
            if(mantime>0){
                mantime=time;
                manpos[0]=manpos[0]+manvel[0]*dt;
                manpos[1]=manpos[1]+manvel[1]*dt;
                manpos[2]=manpos[2]+manvel[2]*dt;
                manrot=manrot+manrotvel*dt;
                armatue.setLocX(manpos[0]);
                armatue.setLocY(manpos[1]);
                armatue.setLocZ(manpos[2]);
                char_title.setLocX(manpos[0]);
                char_title.setLocY(manpos[1]);
                char_title.setLocZ(manpos[2]+10);
                
                $("#debug").html("pos:x: " + manpos[0]+"y: "+manpos[1]+"z: "+manpos[2]);
                
                armatue.setRotZ(manrot);
                zdist=gameScene.ray([manpos[0],manpos[1],manpos[2]],[0,0,1]);
                if(zdist != null){
                zdist=((zdist.distance*100)|0)/100;
                if(zdist>7.81){
                    manvel[2]=manvel[2]-70*dt;
                }else if(zdist<7.81){
                    manpos[2]=manpos[2]+(7.81-zdist);
                    manstate="land";
                    armatue.setAction(manland,150);
                    manvel=[15*incx,15*incy,0];
                }
                }
                else{
                    manpos[2]=manpos[2]+(7.81-zdist);
                    manstate="land";
                    armatue.setAction(manland,150);
                    manvel=[15*incx,15*incy,0];
                }
            }else{
                mantime=(new Date()).getTime();
            }
        }

        var jumplistener=function(data){
            armatue.setAction(manfly,200,true);
        };
        var landlistener=function(data){
            if(manstate!="stand"){
                armatue.setAction(manstand,200,true);
                manstate="stand";
                manvel=[0,0,0];
            }
        }

        manland.addEventListener("animFinished",landlistener);	
        manjump.addEventListener("animFinished",jumplistener);

        function render(){
            manlogic();
            gameRenderer.render();
            requestAnimationFrame(render);
        }
        render();
        $("#chat_div").chatbox("option", "boxManager").toggleBox();
    }
    // Preloader configurations are optional. They improve the accuracy of the preloader.
    var preloaderConfiguration1 = {XMLQuota: 0.13, numXMLFiles: 1}; // Example 1 (active)
    var preloaderConfiguration2 = {XMLQuota: 0.30, XMLBytes: 852605}; // Example 2 

    doc.load("plat.xml", preloaderConfiguration1);
    // alternative: doc.load("plat.xml", preloaderConfiguration2);
    // alternative: doc.load("plat.xml", true);
    // alternative: doc.load("plat.xml"); // In this case you may not use the preloader gui because preloading is disabled.

    GLGE.GUI.useLibrary("jQuery"); // use the jQuery progress-bar

    var preloaderGUI = new GLGE.GUI.Preloader(); // use the preloader gui-gadget to display the progress
    preloaderGUI.setDocumentLoader(doc.preloader);
    preloaderGUI.addToDOM(document.getElementById('container'));
}

$(function() {

        //chatbox
        var box = $("#chat_div").chatbox({id:"chat_div", 
                                    user:{key : "value"},
                                    title : "chat dailog",
                                    width : 600,
                                    height: 150,
                                    hidden: true,
                                    messageSent : function(id, user, msg) {
                                        //$("#log").append(id + " said: " + msg + "<br/>");
                                        //$("#chat_div").chatbox("option", "boxManager").addMsg(id, msg);
                                        this.boxManager.addMsg(id, msg);
                                        socket.emit('send_chat_msg', { value: msg});
                                    }});
        //box.chatbox("widget").css("left",0 + "px");
        //box.chatbox("widget").css("top",0 + "px");
        //box.chatbox("option", "boxManager").toggleBox();
        box.chatbox("widget").draggable({ containment: "#container", scroll: false });
        box.chatbox("widget").position({ my: 'center', at: 'center', of: '#container' });


		function updateTips( tips,t ) {
			tips
				.text( t )
				.addClass( "ui-state-highlight" );
			setTimeout(function() {
				tips.removeClass( "ui-state-highlight", 1500 );
			}, 500 );
		}

		function checkLength(tips, o, n, min, max ) {
			if ( o.val().length > max || o.val().length < min ) {
				o.addClass( "ui-state-error" );
				updateTips(tips, "Length of " + n + " must be between " +
					min + " and " + max + "." );
				return false;
			} else {
				return true;
			}
		}

		function checkRegexp(tips,o, regexp, n ) {
			if ( !( regexp.test( o.val() ) ) ) {
				o.addClass( "ui-state-error" );
				updateTips( tips,n );
				return false;
			} else {
				return true;
			}
		}
        
        $( "#dialog-form" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
            draggable: false,
            resizable: false,
			modal: true,
			buttons: {
				"Create an account": function() {
                    var name = $( "#dialog-form #name" ),
                    email = $( "#dialog-form #email" ),
                    password = $( "#dialog-form #password" ),
                    allFields = $( [] ).add( name ).add( email ).add( password ),
                    tips = $( "#dialog-form .validateTips" );
                    
                    var bValid = true;
                    allFields.removeClass( "ui-state-error" );

                    bValid = bValid && checkLength( tips,name, "username", 3, 16 );
                    bValid = bValid && checkLength( tips,email, "email", 6, 80 );
                    bValid = bValid && checkLength( tips,password, "password", 5, 16 );

                    bValid = bValid && checkRegexp( tips,name, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
                    // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
                    bValid = bValid && checkRegexp( tips,email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
                    bValid = bValid && checkRegexp( tips,password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );

                    if ( bValid ) {
                        //$( "#users tbody" ).append( "<tr>" +
                        //    "<td>" + name.val() + "</td>" + 
                        //    "<td>" + email.val() + "</td>" + 
                        //    "<td>" + password.val() + "</td>" +
                        //"</tr>" ); 
                        socket.emit('register', { name: name.val() ,email : email.val() ,password:password.val()});
                    }
                },
                "Cancel":function() {$( this ).dialog( "close" );}},
            close: function() {
                    var name = $( "#dialog-form #name" ),
                    email = $( "#dialog-form #email" ),
                    password = $( "#dialog-form #password" ),
                    allFields = $( [] ).add( name ).add( email ).add( password ),
                    tips = $( "#dialog-form .validateTips" );
                    allFields.val( "" ).removeClass( "ui-state-error" );
                }
        });
        
        
        
        $( "#dialog-login" ).dialog({
            open: function(event, ui) { 
            // Hide close button 
            $(this).parent().children().children(".ui-dialog-titlebar-close").hide();},
            autoOpen: true,
            height: 250,
            draggable: false,
            resizable: false,
            closeOnEscape: false,
            width: 350,
            modal: true,
            buttons: {
                "Login":function() {
                    var email = $( "#dialog-login #ID" ),
                    password = $( "#dialog-login #password" ),
                    allFields = $( [] ).add( email ).add( password ),
                    tips = $( "#dialog-login .validateTips" );
                    
                    var bValid = true;
                    allFields.removeClass( "ui-state-error" );

                    bValid = bValid && checkLength( tips,email, "email", 6, 80 );
                    bValid = bValid && checkLength( tips,password, "password", 5, 16 );

                    // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
                    bValid = bValid && checkRegexp( tips,email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
                    bValid = bValid && checkRegexp( tips,password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );

                    if ( bValid ) {
                        socket.emit('login', { email : email.val() ,password:password.val()});
                    }
                },
                "Register":function() {$( "#dialog-form" ).dialog( "open" ).parent()
                    .position({ my: 'center', at: 'center', of: '#container' });}},
            close: function() {}
        }).parent()
        .position({ my: 'center', at: 'center', of: '#container' });
        
	});
