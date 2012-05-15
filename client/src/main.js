if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var MARGIN = 100;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

var POSTPROCESS = true;

var container, stats;

var camera, scene, renderer;

var composer, effectFXAA, renderTargetParameters;

var cityTile, transitionTile, countryTile, simpleTile1, simpleTile2;

var clock = new THREE.Clock();

var controlsCar = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};

var controlsCharacter = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};

var controlsDummy = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};

var controls = controlsCar;

var morphs = [];

var characters = [];
var gyroCharacters = [];

var oldCharacter;
var oldFar;

var gyroCar;

var flareA, flareB;
var sprites = [];

var particleLights = [];

var LIGHT_INTENSITY = 3;
var FOG_NEAR = 20, FAR = 400;
var FOG_H, FOG_S, FOG_V;

var configDay = {

    LIGHT_INTENSITY: 3,

    FOG_NEAR: 20,
    FAR: 400,

    FOG_H: 0.59,
    FOG_S: 0.2,
    FOG_V: 1

};

var configNight = {

    LIGHT_INTENSITY: 1.7,

    FOG_NEAR: 1,
    FAR: 100,

    FOG_H: 0,
    FOG_S: 0,
    FOG_V: 0

};


var h, s, v, near, far, intensity, vv = 0, vdir = 1;

var isDay = true;

var tiltShiftEnabled = false;
var bluriness = 5;

var MULTIPLIER = 1;
var SLOW_MOTION = 0.1;
var FAST_MOTION = 2;
var mdir = 1;



function init() {

    container = document.getElementById( 'container' );

    if ( isDay ) {

        LIGHT_INTENSITY = 3;

        FOG_NEAR = 20;
        FAR = 400;

        FOG_H = 0.59;
        FOG_S = 0.2;
        FOG_V = 1;

    } else {

        LIGHT_INTENSITY = 1.7;

        FOG_NEAR = 1;
        FAR = 100;

        FOG_H = 0;
        FOG_S = 0;
        FOG_V = 0;

    }


    // CAMERA

    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, 1, FAR );
    camera.position.set( 10, 3, 10 );

    // CONTROLS

    controlsCamera = new THREE.TrackballControls( camera );
    controlsCamera.dynamicDampingFactor = 0.25;

    // SCENE

    scene = new THREE.Scene();
    scene.add( camera );

    scene.fog = new THREE.Fog( 0xffffff, FOG_NEAR, FAR );
    scene.fog.color.setHSV( FOG_H, FOG_S, FOG_V );

    // LIGHTS

    var ambient = new THREE.AmbientLight( 0xffffff );
    ambient.color.setHSV( 0.1, 0.0, 0.25 );
    scene.add( ambient );


    dirLight = new THREE.DirectionalLight( 0xffffff, LIGHT_INTENSITY );
    dirLight.position.set( 100, 55, 50 );

    dirLight.castShadow = true;
    //dirLight.shadowCameraVisible = true;

    var d = 20;
    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;

    dirLight.shadowDarkness = 0.6;
    dirLight.shadowBias = 0.000065;

    dirLight.shadowCascade = true;
    dirLight.shadowCascadeCount = 3;

    dirLight.shadowCascadeNearZ = [ -1.000, 0.9, 0.975 ];
    dirLight.shadowCascadeFarZ  = [  0.9, 0.975, 1.000 ];
    dirLight.shadowCascadeWidth = [ 2048, 2048, 2048 ];
    dirLight.shadowCascadeHeight = [ 2048, 2048, 2048 ];
    dirLight.shadowCascadeBias = [ 0.00005, 0.000065, 0.000065 ];

    dirLight.shadowCascadeOffset.set( 0, 0, -10 );

    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;

    scene.add( dirLight );

    // WORLD

    var mapStrips = THREE.ImageUtils.loadTexture( "textures/road/strips.png" );
    mapStrips.wrapS = mapStrips.wrapT = THREE.RepeatWrapping;
    mapStrips.magFilter = THREE.NearestFilter;
    mapStrips.repeat.set( 1, 512 );

    // shared materials

    var materialRoad = new THREE.MeshPhongMaterial( { color: 0x222222, ambient: 0x222222, specular: 0x222222, perPixel: true } );

    var materialCenter = new THREE.MeshPhongMaterial( { color: 0xffee00, ambient: 0xffee00, specular: 0xffee00, map: mapStrips, perPixel: true, alphaTest: 0.5 } );
    materialCenter.polygonOffset = true;
    materialCenter.polygonOffsetFactor = -1;
    materialCenter.polygonOffsetUnits = 1;

    var materialFront = new THREE.MeshBasicMaterial( { color: 0xffee00 } );
    materialFront.polygonOffset = true;
    materialFront.polygonOffsetFactor = -1;
    materialFront.polygonOffsetUnits = 1;

    var materialBack = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    materialBack.polygonOffset = true;
    materialBack.polygonOffsetFactor = -1;
    materialBack.polygonOffsetUnits = 1;

    var materialGround = new THREE.MeshPhongMaterial( { color: 0xaaaaaa, ambient: 0xaaaaaa, specular: 0x999999, perPixel: true, vertexColors: THREE.FaceColors } );

    var sharedMaterials = {

        ground: materialGround,
        road: materialRoad,
        center: materialCenter,
        front: materialFront,
        back: materialBack

    }

    // parameters

    var parametersLong = {

        ROAD_LENGTH: 1000,

        CENTER_WIDTH: 0.125,
        ROAD_WIDTH: 15,

        CURB_WIDTH:  0.25,
        CURB_HEIGHT: 0.15,

        DELINEATOR_WIDTH: 0.1,
        DELINEATOR_HEIGHT: 0.9,

        SIDEWALK_WIDTH: 4,
        SIDEROAD_WIDTH: 2,

        GROUND_WIDTH: 200,

        LAMP_HEIGHT: 4.5,
        LAMP_BOTTOM: 0.5,

        NUM_BUILDINGS: 100

    };

    var parametersShort = {

        ROAD_LENGTH: 500,

        CENTER_WIDTH: 0.125,
        ROAD_WIDTH: 15,

        CURB_WIDTH:  0.25,
        CURB_HEIGHT: 0.15,

        DELINEATOR_WIDTH: 0.1,
        DELINEATOR_HEIGHT: 0.9,

        SIDEWALK_WIDTH: 4,
        SIDEROAD_WIDTH: 2,

        GROUND_WIDTH: 150,

        LAMP_HEIGHT: 4.5,
        LAMP_BOTTOM: 0.5,

        NUM_BUILDINGS: 100

    };

    cityTile = generateTile( "city", parametersShort, sharedMaterials );
    transitionTile = generateTile( "transition", parametersShort, sharedMaterials );
    countryTile = generateTile( "country", parametersShort, sharedMaterials );
    simpleTile1 = generateTile( "simple", parametersShort, sharedMaterials );
    simpleTile2 = generateTile( "simple", parametersShort, sharedMaterials );

    cityTile.position.y = -2.5;
    scene.add( cityTile );

    simpleTile1.position.y = -2.5;
    simpleTile1.position.z = -parametersLong.ROAD_LENGTH/2;
    scene.add( simpleTile1 );

    transitionTile.position.y = -2.5;
    transitionTile.position.z = parametersLong.ROAD_LENGTH/2;
    scene.add( transitionTile );

    countryTile.position.y = -2.5;
    countryTile.position.z = parametersLong.ROAD_LENGTH/2 + parametersShort.ROAD_LENGTH;
    scene.add( countryTile );

    simpleTile2.position.y = -2.5;
    simpleTile2.position.z = parametersLong.ROAD_LENGTH/2 + 2 * parametersShort.ROAD_LENGTH;
    scene.add( simpleTile2 );

    var loader = new THREE.JSONLoader();
    loader.load( "rome/city-2b.js", function( geo ) {

        var mat = new THREE.MeshFaceMaterial();
        var mesh = new THREE.Mesh( geo, mat );

        var s = 1.3;
        mesh.scale.set( s, s, s );

        mesh.position.z = -350;
        mesh.position.y = -2.5;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );

    });


    var skeletMaterial = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture( "md2/skeleton.png" ), perPixel: true, metal: true } );
    skeletMaterial.alphaTest = 0.5;
    skeletMaterial.transparent = true;

    loader.load( "md2/skelet.js", function( geo ) {

        geo.computeVertexNormals();

        var mesh = new THREE.Mesh( geo, skeletMaterial );
        mesh.doubleSided = true;

        var s = 0.045;
        mesh.scale.set( s, s, s );

        mesh.position.set( -10, -2.6, -746 );
        mesh.rotation.y = 4;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );

        skeleton = mesh;

    });

    loader.load( "md2/skelet3.js", function( geo ) {

        geo.computeVertexNormals();

        var mesh = new THREE.Mesh( geo, skeletMaterial );
        mesh.doubleSided = true;

        var s = 0.045;
        mesh.scale.set( s, s, s );

        mesh.position.set( -8, -2.5, 1749 );
        mesh.rotation.y = -0.7;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );

    });

    var cobraMaterial = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture( "md2/cobra.jpg" ), perPixel: true, metal: true } );
    cobraMaterial.morphTargets = true;
    cobraMaterial.morphNormals = true;

    loader.load( "md2/cobra.js", function( geo ) {

        geo.computeFaceNormals();
        geo.computeVertexNormals();
        geo.computeMorphNormals();

        var morph = new THREE.MorphAnimMesh( geo, cobraMaterial );

        var s = 0.04;
        morph.scale.set( s, s, s );

        morph.position.set( -10, -2.5, -250 );
        morph.rotation.y = -0.7;

        morph.castShadow = true;
        morph.receiveShadow = true;

        morph.duration = 4000;

        morph.dz = 0;

        scene.add( morph );

        morphs.push( morph );

    });

    var monkeyMaterial = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture( "md2/raven.jpg" ), perPixel: true, metal: true } );
    monkeyMaterial.morphTargets = true;
    monkeyMaterial.morphNormals = true;

    loader.load( "md2/raven.js", function( geo ) {

        geo.computeFaceNormals();
        geo.computeVertexNormals();
        geo.computeMorphNormals();

        var morph = new THREE.MorphAnimMesh( geo, monkeyMaterial );

        var s = 0.04;
        morph.scale.set( s, s, s );

        morph.position.set( -5, 1, -175 );
        morph.rotation.y = -Math.PI/2;

        morph.castShadow = true;
        morph.receiveShadow = true;

        morph.duration = 500;

        morph.dz = 20;

        scene.add( morph );

        morphs.push( morph );

    });


    //

    var path = "textures/cube/SwedishRoyalCastle/";
    var format = '.jpg';
    var urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];

    var textureCube = THREE.ImageUtils.loadTextureCube( urls );
    textureCube.format = THREE.RGBFormat;

    var cubeTarget = textureCube;

    // MATERIALS

    mlib = {

        body: [],

        "Chrome": 		new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0xffffff, envMap: cubeTarget  } ),
        "ChromeN": 		new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0xffffff, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.75  } ),
        "Dark chrome": 	new THREE.MeshLambertMaterial( { color: 0x444444, ambient: 0x444444, envMap: cubeTarget } ),

        "Black rough":	new THREE.MeshLambertMaterial( { color: 0x050505, ambient: 0x050505 } ),

        "Dark glass":	new THREE.MeshLambertMaterial( { color: 0x101020, ambient: 0x101020, envMap: cubeTarget, opacity: 0.5, transparent: true } ),
        "Orange glass":	new THREE.MeshLambertMaterial( { color: 0xffbb00, ambient: 0xffbb00, opacity: 0.5, transparent: true } ),
        "Red glass": 	new THREE.MeshLambertMaterial( { color: 0xff0000, ambient: 0xff0000, opacity: 0.5, transparent: true } ),

        "Black metal":	new THREE.MeshLambertMaterial( { color: 0x222222, ambient: 0x222222, envMap: cubeTarget, combine: THREE.MultiplyOperation } ),
        "Orange metal": new THREE.MeshLambertMaterial( { color: 0xff6600, ambient: 0xff6600, envMap: cubeTarget, combine: THREE.MultiplyOperation } )

    }

    mlib.body.push( [ "Orange", new THREE.MeshLambertMaterial( { color: 0x883300, ambient: 0x883300, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.1 } ) ] );
    mlib.body.push( [ "Blue", 	new THREE.MeshLambertMaterial( { color: 0x113355, ambient: 0x113355, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.1 } ) ] );
    mlib.body.push( [ "Red", 	new THREE.MeshLambertMaterial( { color: 0x996600, ambient: 0x992200, specular: 0x992200, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.05 } ) ] );
    mlib.body.push( [ "Black", 	new THREE.MeshLambertMaterial( { color: 0x000000, ambient: 0x000000, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } ) ] );
    mlib.body.push( [ "White", 	new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x666666, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } ) ] );

    mlib.body.push( [ "Carmine", new THREE.MeshPhongMaterial( { color: 0x770000, specular: 0xffaaaa, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );
    mlib.body.push( [ "Gold", 	 new THREE.MeshPhongMaterial( { color: 0xaa9944, specular: 0xbbaa99, shininess: 50, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );
    mlib.body.push( [ "Bronze",  new THREE.MeshPhongMaterial( { color: 0x150505, specular: 0xee6600, shininess: 10, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } ) ] );
    mlib.body.push( [ "Chrome",  new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );

    // FLARES

    flareA = THREE.ImageUtils.loadTexture( "textures/lensflare2_alpha.png" );
    flareB = THREE.ImageUtils.loadTexture( "textures/lensflare0_alpha.png" );

    // CARS - VEYRON

    veyron = new THREE.Car();

    veyron.modelScale = 0.025;
    veyron.backWheelOffset = 0.02;

    veyron.MAX_SPEED = 25;
    veyron.MAX_REVERSE_SPEED = -15;
    veyron.FRONT_ACCELERATION = 12;
    veyron.BACK_ACCELERATION = 15;

    veyron.WHEEL_ANGULAR_ACCELERATION = 1.5;

    veyron.FRONT_DECCELERATION = 15;
    veyron.WHEEL_ANGULAR_DECCELERATION = 1.0;

    veyron.STEERING_RADIUS_RATIO = 0.23;

    veyron.callback = function( object ) {

        addCar( object, -3.5, -2.5, 0, 0 );
        setMaterialsVeyron( object );

        object.enableShadows( true );

        var sa = 2, sb = 5;

        var params  = {

            "a" : { map: flareA, useScreenCoordinates: false, color: 0xffffff, blending: THREE.AdditiveBlending },
            "b" : { map: flareB, useScreenCoordinates: false, color: 0xffffff, blending: THREE.AdditiveBlending },

            "ar" : { map: flareA, useScreenCoordinates: false, color: 0xff0000, blending: THREE.AdditiveBlending },
            "br" : { map: flareB, useScreenCoordinates: false, color: 0xff0000, blending: THREE.AdditiveBlending }

        };

        var flares = [ // front
                       [ "a", sa, [ 47, 38, 120 ] ], [ "a", sa, [ 40, 38, 120 ] ], [ "a", sa, [ 32, 38, 122 ] ],
                       //[ "b", sb, [ 47, 38, 120 ] ], [ "b", sb, [ 40, 38, 120 ] ], [ "b", sb, [ 32, 38, 122 ] ],

                       [ "a", sa, [ -47, 38, 120 ] ], [ "a", sa, [ -40, 38, 120 ] ], [ "a", sa, [ -32, 38, 122 ] ],
                       //[ "b", sb, [ -47, 38, 120 ] ], [ "b", sb, [ -40, 38, 120 ] ], [ "b", sb, [ -32, 38, 122 ] ],

                       // back
                       [ "ar", sa, [ 22, 50, -123 ] ], [ "ar", sa, [ 32, 49, -123 ] ],
                       [ "br", sb, [ 22, 50, -123 ] ], [ "br", sb, [ 32, 49, -123 ] ],

                       [ "ar", sa, [ -22, 50, -123 ] ], [ "ar", sa, [ -32, 49, -123 ] ],
                       [ "br", sb, [ -22, 50, -123 ] ], [ "br", sb, [ -32, 49, -123 ] ],

                     ];

        var particleGeo = new THREE.Geometry();

        for ( var i = 0; i < flares.length; i ++ ) {

            var p = params[ flares[ i ][ 0 ] ];

            var s = 0.0035 * flares[ i ][ 1 ];

            var x = flares[ i ][ 2 ][ 0 ];
            var y = flares[ i ][ 2 ][ 1 ];
            var z = flares[ i ][ 2 ][ 2 ];

            var sprite = new THREE.Sprite( p );
            sprite.depthWrite = false;

            sprite.scale.set( s, s, s );
            sprite.position.set( x, y, z );

            object.bodyMesh.add( sprite );

            sprites.push( sprite );

        }


    };

    veyron.loadPartsBinary( "obj/veyron/parts/veyron_body_bin2.js", "obj/veyron/parts/veyron_wheel_bin2.js" );

    // characters

    var configBobafett = {

        baseUrl: "models/animated/bobafett/",

        body: "bobafett-light.js",
        skins: [ "esb_fett.png", "ctf_r.png", "ctf_b.png", "prototype_fett.png", "rotj_fett.png" ],
        weapons:  [],
        animations: {
            move: "run",
            idle: "stand",
            jump: "jump",
            attack: "attack",
            crouchMove: "crwalk",
            crouchIdle: "crstnd",
            crouchAttach: "crattak"
        },

        walkSpeed: 2.50,
        crouchSpeed: 0.75

    };

    var configFaerie = {

        baseUrl: "models/animated/faerie/",

        body: "faerie-light.js",
        skins: [ "black_angel.png", "bumbla.png", "faerie1.png",
                 "faerie2.png", "faerie3.png", "faerie4.png", "faerie5.png", "faerie6.png", "faerie20.png",
                 "faerie21.png", "faerie22.png", "insecta.png", "ladybug.png" ],
        weapons:  [ [ "weapon-light.js", "weapon.png" ]
                    ],
        animations: {
            move: "run",
            idle: "stand",
            jump: "jump",
            attack: "attack",
            crouchMove: "crwalk",
            crouchIdle: "crstnd",
            crouchAttach: "crattak"
        },

        walkSpeed: 2.75,
        crouchSpeed: 0.50

    };

    var configOgro = {

        baseUrl: "models/animated/ogro/",

        body: "ogro-light.js",
        skins: [ "grok.jpg", "ogrobase.png", "arboshak.png", "ctf_r.png", "ctf_b.png", "darkam.png", "freedom.png",
                 "gib.png", "gordogh.png", "igdosh.png", "khorne.png", "nabogro.png",
                 "sharokh.png" ],
        weapons:  [ [ "weapon-light.js", "weapon.jpg" ] ],
        animations: {
            move: "run",
            idle: "stand",
            jump: "jump",
            attack: "attack",
            crouchMove: "cwalk",
            crouchIdle: "cstand",
            crouchAttach: "crattack"
        },

        walkSpeed: 3.50,
        crouchSpeed: 0.175

    };

    var configSupermale = {

        baseUrl: "models/animated/supermale/",

        body: "supermale-light.js",
        skins: [ "CaptainA.png", "CaptainB.png", "CaptainC.png", "CyclopsDL.png", "Carnge.png", "ctf_b.png", "ctf_r.png",
                 "DD_classic.png", "Deadpool.png", "DoubleD.png", "DukeNuke.png", "Fist.png", "Flash.png",
                 "GL_Classic.png", "GreenLan.png", "He-Man.png", "Hulk.png", "IM_classic.png", "JohnBlade.png",
                 "kw_aqua.png", "kw_black.png", "kw_blue.png", "kw_green.png", "kw_orange.png",
                 "Magneto.png", "Nightwing.png", "Punisher.png", "Running.png",
                 "Running2.png", "Silver.png", "Sm2099.png", "SpawnDL.png",
                 "spiderman.png", "Superman.png", "Tick.png" ],
        weapons:  [],
        animations: {
            move: "run",
            idle: "stand",
            jump: "jump",
            attack: "attack",
            crouchMove: "crwalk",
            crouchIdle: "crstnd",
            crouchAttach: "crattak"
        },

        walkSpeed: 4,
        crouchSpeed: 0.50

    };

    addCharacter( configSupermale, 	0, 0, -1.475, 0 );
    addCharacter( configFaerie, 	0, 2, -1.475, 0 );
    addCharacter( configBobafett, 	0, 4, -1.475, 0 );
    addCharacter( configOgro, 		0, 6, -1.475, 0 );


    // renderer

    renderer = new THREE.WebGLRenderer( { alpha: false, antialias: !POSTPROCESS } );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    renderer.setClearColor( scene.fog.color, 1 );

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = MARGIN + "px";
    renderer.domElement.style.left = "0px";

    container.appendChild( renderer.domElement );

    //

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

    //

    renderer.shadowMapEnabled = true;
    //renderer.shadowMapDebug = true;
    //renderer.shadowMapCullFrontFaces = false;
    renderer.shadowMapCascade = true;

    renderer.sortObjects = true;

    // stats

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.left = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );

    stats.domElement.children[ 0 ].children[ 0 ].style.color = "#aaa";
    stats.domElement.children[ 0 ].style.background = "transparent";
    stats.domElement.children[ 0 ].children[ 1 ].style.display = "none";

    // composer

    var renderModel = new THREE.RenderPass( scene, camera );

    var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );
    var effectColor = new THREE.ShaderPass( THREE.ShaderExtras[ "colorCorrection" ] );

    effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras[ "fxaa" ] );

    hblur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalTiltShift" ] );
    vblur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalTiltShift" ] );

    //

    hblur.uniforms[ 'h' ].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms[ 'v' ].value = bluriness / SCREEN_HEIGHT;

    hblur.uniforms[ 'r' ].value = vblur.uniforms[ 'r' ].value = 0.5;

    renderTargetParameters = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat };
    colorTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );

    effectFXAA.renderToScreen = true;
    //effectColor.renderToScreen = true;
    //vblur.renderToScreen = true;
    //effectScreen.renderToScreen = true;

    hblur.enabled = false;
    vblur.enabled = false;

    composer = new THREE.EffectComposer( renderer, colorTarget );
    composer.addPass( renderModel );

    composer.addPass( effectColor );
    composer.addPass( effectFXAA );

    composer.addPass( hblur );
    composer.addPass( vblur );
    //composer.addPass( effectScreen );

    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );

    effectColor.uniforms[ 'mulRGB' ].value.set( 1.2, 1.2, 1.2 );
    effectColor.uniforms[ 'powRGB' ].value.set( 1.6, 1.6, 1.6 );

    //effectColor.uniforms[ 'mulRGB' ].value.set( 1.3, 1.3, 1.3 );
    //effectColor.uniforms[ 'powRGB' ].value.set( 1.4, 1.4, 1.4 );

    // events

    window.addEventListener( 'resize', onWindowResize, false );

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

}

//

function addCharacter ( config, skin, x, y, z ) {

    var character = new THREE.MD2CharacterComplex();

    character.scale = 0.0425;
    character.frontAcceleration = 10;
    character.backAcceleration = 10;
    character.frontDecceleration = 10;
    character.angularSpeed = 3;

    character.controls = controlsDummy;

    var gyro = new THREE.Gyroscope();
    character.root.add( gyro );

    characters.push( character );
    gyroCharacters.push( gyro );

    character.onLoadComplete = function() {

        character.root.position.set( x, y, z );
        scene.add( character.root );

        character.meshBody.material.specular.setHSV( 0, 0, 0.5 );

        character.setWeapon( 0 );
        character.setSkin( skin );

        character.enableShadows( true );

        var shadowTexture = generateDropShadowTexture( character.meshBody, 64, 64, 15, 1 );

        character.meshBody.geometry.computeBoundingBox();
        var bb = character.meshBody.geometry.boundingBox;

        var ss = character.scale * 1.75;
        var shadowWidth  = ss * ( bb.max.z - bb.min.z );
        var shadowHeight = ss * ( bb.max.x - bb.min.x );

        var shadowPlane = new THREE.PlaneGeometry( shadowWidth, shadowHeight );
        var shadowMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.75, transparent: true,
                                                  map: shadowTexture,
                                                  polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: 1 } );

        var shadow = new THREE.Mesh( shadowPlane, shadowMaterial );
        shadow.rotation.x = -Math.PI/2;
        shadow.rotation.z = Math.PI/2;
        shadow.position.y = -1;

        character.root.add( shadow );

    }

    character.loadParts( config );

}

//

function setMaterialsVeyron( car ) {

    // 0 - top, front center, back sides
    // 1 - front sides
    // 2 - engine
    // 3 - small chrome things
    // 4 - backlights
    // 5 - back signals
    // 6 - bottom, interior
    // 7 - windshield

    // BODY

    var materials = car.bodyGeometry.materials;

    materials[ 0 ] = mlib[ "Black metal" ];	// top, front center, back sides
    materials[ 1 ] = mlib[ "Chrome" ];			// front sides
    materials[ 2 ] = mlib[ "Chrome" ];			// engine
    materials[ 3 ] = mlib[ "Dark chrome" ];	// small chrome things
    materials[ 4 ] = mlib[ "Red glass" ];		// backlights
    materials[ 5 ] = mlib[ "Orange glass" ];	// back signals
    materials[ 6 ] = mlib[ "Black rough" ];	// bottom, interior
    materials[ 7 ] = mlib[ "Dark glass" ];		// windshield

    materials[ 1 ] = mlib.body[4][1];

    // WHEELS

    materials = car.wheelGeometry.materials;

    materials[ 0 ] = mlib[ "Chrome" ];			// insides
    materials[ 1 ] = mlib[ "Black rough" ];	// tire

}

//

function addCar( object, x, y, z, s ) {

    object.root.position.set( x, y, z );
    scene.add( object.root );

    object.enableShadows( true );

    gyroCar = new THREE.Gyroscope();
    gyroCar.position.set( 0, 0, 1 );

    object.root.add( gyroCar );
    gyroCar.add( camera );

    camera.position.set( 10, 3, 10 );

    var shadowTexture = generateDropShadowTexture( object.bodyMesh, 64, 32, 15, 0.15 );

    object.bodyMesh.geometry.computeBoundingBox();
    var bb = object.bodyMesh.geometry.boundingBox;

    var ss = object.modelScale * 1.0;
    var shadowWidth  =        ss * ( bb.max.z - bb.min.z );
    var shadowHeight = 1.25 * ss * ( bb.max.x - bb.min.x );

    var shadowPlane = new THREE.PlaneGeometry( shadowWidth, shadowHeight );
    var shadowMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 0.5, transparent: true,
                                              map: shadowTexture,
                                              polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: 1 } );

    var shadow = new THREE.Mesh( shadowPlane, shadowMaterial );
    shadow.rotation.x = -Math.PI/2;
    shadow.rotation.z = Math.PI/2;
    shadow.position.y = 0;

    object.root.add( shadow );


}

function generateDropShadowTexture( object, width, height, bluriness, margin ) {

    var renderTargetParameters = { minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
    var shadowTarget = new THREE.WebGLRenderTarget( width, height, renderTargetParameters );

    var shadowMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );
    var shadowGeometry = THREE.GeometryUtils.clone( object.geometry );

    var shadowObject = new THREE.Mesh( shadowGeometry, shadowMaterial );

    var shadowScene = new THREE.Scene();
    shadowScene.add( shadowObject );

    shadowObject.geometry.computeBoundingBox();

    var bb = shadowObject.geometry.boundingBox;

    var dimensions = new THREE.Vector3();
    dimensions.sub( bb.max, bb.min );

    var width  = dimensions.z,
    height = dimensions.x,
    depth  = dimensions.y,

    left   = bb.min.z - margin * width,
    right  = bb.max.z + margin * width,

    top    = bb.max.x + margin * height,
    bottom = bb.min.x - margin * height,

    near = bb.max.y + margin * depth,
    far  = bb.min.y - margin * depth;

    var topCamera = new THREE.OrthographicCamera( left, right, top, bottom, near, far );
    topCamera.position.y = bb.max.y;
    topCamera.lookAt( shadowScene.position );

    shadowScene.add( topCamera );

    var renderShadow = new THREE.RenderPass( shadowScene, topCamera );

    var blurShader = THREE.ShaderExtras[ "triangleBlur" ];
    var effectBlurX = new THREE.ShaderPass( blurShader, 'texture' );
    var effectBlurY = new THREE.ShaderPass( blurShader, 'texture' );

    var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );

    var blurAmountX = bluriness / width;
    var blurAmountY = bluriness / height;

    effectBlurX.uniforms[ 'delta' ].value = new THREE.Vector2( blurAmountX, 0 );
    effectBlurY.uniforms[ 'delta' ].value = new THREE.Vector2( 0, blurAmountY );

    //effectBlurY.renderToScreen = true;
    //effectScreen.renderToScreen = true;

    var shadowComposer = new THREE.EffectComposer( renderer, shadowTarget );

    shadowComposer.addPass( renderShadow );
    shadowComposer.addPass( effectBlurX );
    shadowComposer.addPass( effectBlurY );
    //shadowComposer.addPass( effectScreen );

    renderer.setClearColorHex( 0x000000, 0 );

    shadowComposer.render( 0.1 );
    shadowComposer.render( 0.1 ); // hack to get around ANGLE troubles

    renderer.setClearColor( scene.fog.color, 1 );

    return shadowComposer.renderTarget2;

}

function onKeyDown ( event ) {

    switch( event.keyCode ) {

        case 38: /*up*/	controls.moveForward = true; break;
        case 87: /*W*/ 	controls.moveForward = true; break;

        case 40: /*down*/controls.moveBackward = true; break;
        case 83: /*S*/ 	 controls.moveBackward = true; break;

        case 37: /*left*/controls.moveLeft = true; break;
        case 65: /*A*/   controls.moveLeft = true; break;

        case 39: /*right*/controls.moveRight = true; break;
        case 68: /*D*/    controls.moveRight = true; break;

        case 49: /*1*/	setCurrentObject( "car" ); break;
        case 50: /*2*/	setCurrentObject( "character", 0 ); break;
        case 51: /*3*/	setCurrentObject( "character", 1 ); break;
        case 52: /*4*/	setCurrentObject( "character", 2 ); break;
        case 53: /*5*/	setCurrentObject( "character", 3 ); break;

        case 78: /*N*/   vdir *= -1; break;
        case 77: /*M*/   mdir *= -1; break;

        case 79: /*O*/   cycleSkin( -1 ); break;
        case 80: /*P*/   cycleSkin(  1 ); break;

        case 84: /*T*/   toggleTiltShift(); break;

    }

};

function onKeyUp ( event ) {

    switch( event.keyCode ) {

        case 38: /*up*/controls.moveForward = false; break;
        case 87: /*W*/ controls.moveForward = false; break;

        case 40: /*down*/controls.moveBackward = false; break;
        case 83: /*S*/ 	 controls.moveBackward = false; break;

        case 37: /*left*/controls.moveLeft = false; break;
        case 65: /*A*/ 	 controls.moveLeft = false; break;

        case 39: /*right*/controls.moveRight = false; break;
        case 68: /*D*/ 	  controls.moveRight = false; break;

    }

};

//

function toggleTiltShift() {

    if ( tiltShiftEnabled ) {

        tiltShiftEnabled = false;

        vblur.renderToScreen = false;

        hblur.enabled = false;
        vblur.enabled = false;

        effectFXAA.renderToScreen = true;

    } else {

        tiltShiftEnabled = true;

        effectFXAA.renderToScreen = false;

        hblur.enabled = true;
        vblur.enabled = true;

        vblur.renderToScreen = true;

    }

};

//

function cycleSkin( d ) {

    if ( oldCharacter !== undefined ) {

        var character = characters[ oldCharacter ];

        var index = ( character.currentSkin + d ) % character.skinsBody.length;
        if ( index < 0 ) index += character.skinsBody.length;

        characters[ oldCharacter ].setSkin( index );

    }

}

//

function setCurrentObject( name, n ) {

    if ( name === "car" ) {

        controls = controlsCar;
        gyroCar.add( camera );

    } else if ( name === "character" ) {

        controls = controlsCharacter;
        gyroCharacters[ n ].add( camera );
        characters[ n ].controls = controlsCharacter;

        if ( oldCharacter !== n ) {

            if ( characters[ oldCharacter ] !== undefined )  {

                characters[ oldCharacter ].controls = controlsDummy;

            }

            oldCharacter = n;

        }

    }

}

//

function generateRoad ( roadLength, roadWidth, centerWidth, materialRoad, materialCenter ) {

    var root = new THREE.Object3D();
    root.rotation.x = -Math.PI/2;

    var groundGeo = new THREE.PlaneGeometry( roadWidth, roadLength );
    var centerGeo = new THREE.PlaneGeometry( centerWidth, roadLength );

    var ground = new THREE.Mesh( groundGeo, materialRoad );
    var center = new THREE.Mesh( centerGeo, materialCenter );

    ground.receiveShadow = true;
    center.receiveShadow = true;

    addStatic( root, ground );
    addStatic( root, center );

    return root;

}

//

function generateSidewalk( roadLength, curbWidth, curbHeight, sidewalkWidth, offset, materialGround ) {

    var root = new THREE.Object3D();

    var sideGeo = new THREE.PlaneGeometry( sidewalkWidth, roadLength );
    applyColor( sideGeo, 0.1, 0, 0.5 );

    var curbGeo = new THREE.CubeGeometry( curbWidth, curbHeight, roadLength, 1, 1, 1, materialGround, { ny: false } );
    applyColor( curbGeo, 0, 0, 0.7 );

    var sideRight = new THREE.Mesh( sideGeo, materialGround );
    var sideLeft = new THREE.Mesh( sideGeo, materialGround );
    var curbLeft = new THREE.Mesh( curbGeo, materialGround );
    var curbRight = new THREE.Mesh( curbGeo, materialGround );

    sideRight.position.x = sidewalkWidth / 2 + curbWidth + offset;
    sideLeft.position.x = - ( sidewalkWidth / 2 + curbWidth + offset );

    sideRight.rotation.x = -Math.PI/2;
    sideLeft.rotation.x = -Math.PI/2;

    curbRight.position.x = curbWidth/2 + offset;
    curbLeft.position.x = - ( curbWidth/2 + offset );

    curbRight.position.y = curbHeight/2;
    curbLeft.position.y = curbHeight/2;

    sideRight.receiveShadow = true;
    sideLeft.receiveShadow = true;

    curbRight.receiveShadow = true;
    curbLeft.receiveShadow = true;

    curbRight.castShadow = true;
    curbLeft.castShadow = true;

    addStatic( root, sideLeft );
    addStatic( root, sideRight );
    addStatic( root, curbRight );
    addStatic( root, curbLeft );

    return root;

}

//

function generateSideroad( roadLength, dWidth, dHeight, sidewalkWidth, offset, materialGround, materialFront, materialBack ) {

    var root = new THREE.Object3D();

    var sideGeo = new THREE.PlaneGeometry( sidewalkWidth, roadLength );
    applyColor( sideGeo, 0.1, 0, 0.5 );

    var sideRight = new THREE.Mesh( sideGeo, materialGround );
    var sideLeft = new THREE.Mesh( sideGeo, materialGround );

    sideRight.position.x = sidewalkWidth / 2 + offset;
    sideLeft.position.x = - ( sidewalkWidth / 2 + offset );

    sideRight.rotation.x = -Math.PI/2;
    sideLeft.rotation.x = -Math.PI/2;

    sideRight.receiveShadow = true;
    sideLeft.receiveShadow = true;

    addStatic( root, sideLeft );
    addStatic( root, sideRight );

    // delineators

    var delineatorGeo = new THREE.CubeGeometry( dWidth, dHeight, dWidth, 1, 1, 1, materialGround, { ny: false, py: false } );
    applyColor( delineatorGeo, 0, 0, 0.8 );

    var delineatorGeoTop = new THREE.CubeGeometry( dWidth, dWidth * 3, dWidth, 1, 1, 1, materialGround, { ny: false } );
    applyColor( delineatorGeoTop, 0, 0, 0 );

    var delineatorGeoFront = new THREE.CubeGeometry( dWidth * 0.5, dWidth * 2, dWidth, 1, 1, 1, materialFront, { ny: false, py: false, nx: false, px: false, nz: false } );
    applyColor( delineatorGeoFront, 0.1, 1, 1 );

    var delineatorGeoBack = new THREE.CubeGeometry( dWidth * 0.5, dWidth * 2, dWidth, 1, 1, 1, materialBack, { ny: false, py: false, nx: false, px: false, pz: false } );
    applyColor( delineatorGeoBack, 0, 1, 1 );

    var mergedGeo = new THREE.Geometry();
    var mergedGeoFront = new THREE.Geometry();
    var mergedGeoBack = new THREE.Geometry();

    var n = 50 * roadLength / 1000;

    for ( var i = -n; i < n; i ++ ) {

        var mesh = new THREE.Mesh( delineatorGeo, materialGround );

        mesh.position.y = dHeight / 2;
        mesh.position.z = i * 10;

        THREE.GeometryUtils.merge( mergedGeo, mesh );

        var mesh = new THREE.Mesh( delineatorGeoTop, materialGround );

        mesh.position.y = dHeight + dWidth * 1.5;
        mesh.position.z = i * 10;

        THREE.GeometryUtils.merge( mergedGeo, mesh );

        //

        var mesh = new THREE.Mesh( delineatorGeoFront, materialFront );

        mesh.position.y = dHeight + dWidth * 1.5;
        mesh.position.z = i * 10;

        THREE.GeometryUtils.merge( mergedGeoFront, mesh );

        var mesh = new THREE.Mesh( delineatorGeoBack, materialBack );

        mesh.position.y = dHeight + dWidth * 1.5;
        mesh.position.z = i * 10;

        THREE.GeometryUtils.merge( mergedGeoBack, mesh );

    }

    function addDelineators( x, ry ) {

        var mesh = new THREE.Mesh( mergedGeo, materialGround );
        mesh.position.x = x;
        mesh.rotation.y = ry;

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        addStatic( root, mesh );

        //

        var mesh = new THREE.Mesh( mergedGeoFront, materialFront );
        mesh.position.x = x;
        mesh.rotation.y = ry;

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        addStatic( root, mesh );

        var mesh = new THREE.Mesh( mergedGeoBack, materialBack );
        mesh.position.x = x;
        mesh.rotation.y = ry;

        mesh.receiveShadow = true;
        mesh.castShadow = true;

        addStatic( root, mesh );

    }

    addDelineators( offset + dWidth, 0 );
    addDelineators( - ( offset + dWidth ), Math.PI );

    return root;

}

//

function generateGround( roadLength, groundWidth, offset, materialGround ) {

    var groundHeight = 0.15;

    var root = new THREE.Object3D();

    var sideGeo = new THREE.CubeGeometry( groundWidth, groundHeight, roadLength, 1, 1, 1, materialGround, { ny: false } );
    applyColor( sideGeo, 0.3, 0.5, 0.3 );

    var meshRight = new THREE.Mesh( sideGeo, materialGround );
    var meshLeft = new THREE.Mesh( sideGeo, materialGround );

    meshRight.position.x = offset;
    meshLeft.position.x = - offset;

    meshRight.position.y = groundHeight / 2;
    meshLeft.position.y = groundHeight / 2;

    meshRight.receiveShadow = true;
    meshLeft.receiveShadow = true;

    addStatic( root, meshRight );
    addStatic( root, meshLeft );

    return root;

}

function generateLamps( n, lampHeight, lampBottom, offset, material, lightsEnabled ) {

    var points = []; // for particle lights

    var mergedGeo = new THREE.Geometry();

    var cubeGeo2 = new THREE.CubeGeometry( 0.1,  lampHeight, 0.1,  1, 1, 1, material, { ny: false } );
    var cubeGeo3 = new THREE.CubeGeometry( 0.15, lampBottom, 0.15, 1, 1, 1, material, { ny: false } );
    var cubeGeo4 = new THREE.CubeGeometry( 0.25, 0.25, 0.25,       1, 1, 1, material, { ny: false } );

    function generateLamp( x, y, z ) {

        var h, s, v, yy;

        yy = y + lampBottom + lampHeight * 0.5;

        h = 0.05;
        s = 0.1;
        v = 0.5;

        addPart( mergedGeo, cubeGeo2, x, yy, z, material, h, s, v );

        yy = y + lampBottom * 0.5;

        h = 0;
        s = 0.35;
        v = 0.5;

        addPart( mergedGeo, cubeGeo3, x, yy, z, material, h, s, v );

        yy = y + lampBottom + lampHeight;

        h = 0.1;
        s = 0.5;
        v = 0.95;

        addPart( mergedGeo, cubeGeo4, x, yy, z, material, h, s, v );

        points.push( new THREE.Vector3( x + 0.2, yy, z + 0.2 ) );
        points.push( new THREE.Vector3( x + 0.2, yy, z - 0.2 ) );
        points.push( new THREE.Vector3( x - 0.2, yy, z - 0.2 ) );
        points.push( new THREE.Vector3( x - 0.2, yy, z + 0.2 ) );

    }

    var x, y, z;

    for ( var i = -n; i < n; i ++ ) {

        x = offset;
        y = 0;
        z = i * 10;

        generateLamp( x, y, z );

        //

        x = -offset;
        y = 0;
        z = i * 10;

        generateLamp( x, y, z );

    }

    var mesh = new THREE.Mesh( mergedGeo, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if ( lightsEnabled ) {

        var particleGeo = new THREE.Geometry();

        for ( var i = 0, il = points.length; i < il; i ++ ) {

            var vertex = new THREE.Vertex( points[ i ] );
            particleGeo.vertices[ i ] = vertex;

        }

        var map = THREE.ImageUtils.loadTexture( "textures/lensflare/lensflare0_alpha.png" );
        var particleMaterial = new THREE.ParticleBasicMaterial( { size: 3, color: 0xffffff, map: map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } );

        var particles = new THREE.ParticleSystem( particleGeo, particleMaterial );
        particles.visible = false;
        mesh.add( particles );

        particleLights.push( particles );

    }

    return mesh;

}

//

function generateBuildings( number, distance, offsetMin, offsetMax, material ) {

    var mergedGeo = new THREE.Geometry();

    var baseSize = 1;
    var cubeGeo = new THREE.CubeGeometry( baseSize, baseSize, baseSize, 1, 1, 1, material, { ny: false } );

    for ( var i = 0; i < number; i ++ ) {

        var sy = 1.5 + 0.5 * Math.random();
        var sx = 5 + 10 * Math.random();
        var sz = 10 + 10 * Math.random();

        var mesh = new THREE.Mesh( cubeGeo, material );

        mesh.position.x = ( Math.random() < 0.5 ? 1 : -1 ) * THREE.Math.randFloat( offsetMin + sx / 2, offsetMax );
        sy *= 0.25 * Math.abs( mesh.position.x );

        mesh.position.y = 0.5 * ( sy * baseSize );
        mesh.position.z = 0.5 * distance * ( 2.0 * Math.random() - 1.0 );

        mesh.scale.set( sx, sy, sz );

        var h = 0.525  + 0.05 * Math.random();
        var s = 0.3 + 0.25 * Math.random();
        var v = 0.75 + 0.25 * Math.random();

        applyColor( cubeGeo, h, 0.15, 0.6 );

        THREE.GeometryUtils.merge( mergedGeo, mesh );

    }

    var mesh = new THREE.Mesh( mergedGeo, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;

}

//

function addPart( mergedGeo, geo, x, y, z, material, h, s, v ) {

    var mesh = new THREE.Mesh( geo, material );
    mesh.position.set( x, y, z );

    applyColor( geo, h, s, v );

    THREE.GeometryUtils.merge( mergedGeo, mesh );

}

function addStatic( parent, child ) {

    child.matrixAutoUpdate = false;
    child.updateMatrix();

    parent.add( child );

}


//

function applyColor( geo, h, s, v ) {

    for ( var j = 0, jl = geo.faces.length; j < jl; j ++ ) {

        geo.faces[ j ].color.setHSV( h, s, v );

    }

}

//

function generateTile( tileType, parameters, materials ) {

    var useSidewalk = true;

    if ( tileType === "country" ) {

        useSidewalk = false;

    }

    var tileRoot = new THREE.Object3D();

    // road

    var road = generateRoad( parameters.ROAD_LENGTH, parameters.ROAD_WIDTH, parameters.CENTER_WIDTH, materials.road, materials.center );
    tileRoot.add( road );

    // side

    var offset = parameters.ROAD_WIDTH / 2;
    var sideWidth = 0;

    if ( useSidewalk ) {

        // sidewalk

        var sidewalk = generateSidewalk( parameters.ROAD_LENGTH, parameters.CURB_WIDTH, parameters.CURB_HEIGHT, parameters.SIDEWALK_WIDTH, offset, materials.ground );
        addStatic( tileRoot, sidewalk );

        sideWidth = parameters.SIDEWALK_WIDTH + parameters.CURB_WIDTH;

    } else {

        // sideroad

        var sideroad = generateSideroad( parameters.ROAD_LENGTH, parameters.DELINEATOR_WIDTH, parameters.DELINEATOR_HEIGHT, parameters.SIDEROAD_WIDTH, offset, materials.ground, materials.front, materials.back );
        addStatic( tileRoot, sideroad );

        sideWidth = parameters.SIDEROAD_WIDTH;

    }

    // ground

    var offset = parameters.GROUND_WIDTH / 2 + parameters.ROAD_WIDTH / 2 + sideWidth;

    var ground = generateGround( parameters.ROAD_LENGTH, parameters.GROUND_WIDTH, offset, materials.ground );
    addStatic( tileRoot, ground );

    // lamps

    if ( tileType === "city" || tileType === "transition" ) {

        var offset = parameters.ROAD_WIDTH / 2 + 0.75;
        var n = 50 * parameters.ROAD_LENGTH / 1000;

        var lightsEnabled = true;

        var lamps = generateLamps( n, parameters.LAMP_HEIGHT, parameters.LAMP_BOTTOM, offset, materials.ground, lightsEnabled );
        addStatic( tileRoot, lamps );

        tileRoot.lamps = lamps;

    }

    // buildings

    if ( tileType === "city" ) {

        var offsetMin = parameters.ROAD_WIDTH / 2 + parameters.SIDEWALK_WIDTH + 2.5;
        var offsetMax = 70;

        var buildings = generateBuildings( parameters.NUM_BUILDINGS, parameters.ROAD_LENGTH, offsetMin, offsetMax, materials.ground );
        addStatic( tileRoot, buildings );

    }

    if ( tileType !== "simple" ) {

        // trees

        var loader = new THREE.JSONLoader();
        loader.load( "rome/treeGeneric.js", function( geo ) {

            var offset = parameters.ROAD_WIDTH / 2 + sideWidth + 1;

            var material = new THREE.MeshFaceMaterial();

            function addTree( x, y, z ) {

                var tree = new THREE.Mesh( geo, material );

                tree.position.set( x, y, z );

                var s = 0.015 + Math.random() * 0.0025;
                var ry = Math.random() * 3.14;

                tree.scale.set( s, s, s );
                tree.rotation.y = ry;

                tree.castShadow = true;
                tree.receiveShadow = true;

                addStatic( tileRoot, tree );

            }

            var n = 20 * parameters.ROAD_LENGTH / 1000;

            for ( var i = -n; i < n; i ++ ) {

                addTree(  offset, -2.35 + 2.5, 25 * i );
                addTree( -offset, -2.35 + 2.5, 25 * i );

            }

        } );

    }

    return tileRoot;

}

//

function setSpritesOpacity( opacity ) {

    for ( var i = 0; i < sprites.length; i ++ ) {

        sprites[ i ].opacity = opacity;
        if ( opacity === 0 ) sprites[ i ].visible = false;
        else 				 sprites[ i ].visible = true;

    }

    for ( var i = 0; i < particleLights.length; i ++ ) {

        particleLights[ i ].material.opacity = opacity;
        if ( opacity === 0 ) particleLights[ i ].visible = false;
        else 				 particleLights[ i ].visible = true;

    }

}

//

function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    colorTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );

    composer.reset( colorTarget );

    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );

    hblur.uniforms[ 'h' ].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms[ 'v' ].value = bluriness / SCREEN_HEIGHT;

}

//

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    var delta = clock.getDelta();

    MULTIPLIER = THREE.Math.clamp( MULTIPLIER + 0.5 * delta * mdir, SLOW_MOTION, 1 );

    delta *= MULTIPLIER;

    // day / night

    vv = THREE.Math.clamp( vv + 1.5 * delta * vdir, 0, 1 );

    dirLight.intensity = THREE.Math.mapLinear( vv, 0, 1, configNight.LIGHT_INTENSITY, configDay.LIGHT_INTENSITY );

    h = THREE.Math.mapLinear( vv, 0, 1, configNight.FOG_H, configDay.FOG_H );
    s = THREE.Math.mapLinear( vv, 0, 1, configNight.FOG_S, configDay.FOG_S );
    v = THREE.Math.mapLinear( vv, 0, 1, configNight.FOG_V, configDay.FOG_V );

    scene.fog.color.setHSV( h, s, v );
    renderer.setClearColor( scene.fog.color, 1 );

    near = THREE.Math.mapLinear( vv, 0, 1, configNight.FOG_NEAR, configDay.FOG_NEAR );
    far = THREE.Math.mapLinear( vv, 0, 1, configNight.FAR, configDay.FAR );

    scene.fog.near = near;
    scene.fog.far = far;

    if ( far !== oldFar ) {

        camera.far = far;
        camera.updateProjectionMatrix();

        oldFar = far;

    }

    if ( vv < 0.3 ) {

        setSpritesOpacity( 1 - vv / 0.3 );

    } else {

        setSpritesOpacity( 0 );

    }

    // update car model

    veyron.updateCarModel( delta, controlsCar );

    // update character models

    for ( var i = 0; i < characters.length; i ++ ) {

        var character = characters[ i ];

        if ( character.meshBody ) character.update( delta );

    }

    // update simple morphs

    for ( var i = 0; i < morphs.length; i ++ ) {

        var morph = morphs[ i ];

        morph.updateAnimation( 1000 * delta );

        morph.position.z += morph.dz * delta;
        if ( morph.position.z > 2000 ) morph.position.z = -300;

    }

    // update controls

    controlsCamera.update( delta );

    // render

    if ( !POSTPROCESS ) {

        renderer.render( scene, camera );

    } else {

        composer.render( delta );

    }


}