var fs = require('fs');
var path = require('path');

var cheerio = require('cheerio');

var db = require('./lib/db.js')();
var git = require('./lib/git.js');
var gitTree = require('./lib/git_log.js')();
var importclass = require('./lib/imports.js')();
var filetree = require('./lib/jqueryFileTree_srv.js');

// express 4.0
var express = require('express');
// serve_static - uploading server files to serve for client
var serve_static = require('serve-static');
// body-parser - getting params when post method is requested
var bodyParser = require('body-parser');
// jQuery File Tree - make file tree for client for browsing

// make server
var sys = require('sys');
var exec = require('child_process').exec;
var app = express();
var EasyZip = require('easy-zip').EasyZip;
var multer = require('multer');
var unzip = require('unzip');

// sessoin
var cookieParser = require('cookie-parser');
var session = require('express-session');

// rimraf - delete dir recursive
var rimraf = require('rimraf');


var CurrentProjectsArray = [];

function projectObj(_name, _workArray) {
	this.p_name = _name;
	this.workArray = _workArray;
}

function taskObj(_name, _work) {
	this.name = _name;
	this.work = _work;
}


function chkDevice(req, res, next){
	var ua = req.header('user-agent').toLowerCase();
	//console.log(ua);
	if(ua.indexOf("nexus 7") >= 0) {
		//console.log("This is Nexus");
		req.device = "tablet";
		return next();
    } else {
    	//console.log("This is PC");
    	return next();
    }
}




var global_pushids = [];
//****************************** work sync ******************************



app.use(session({
	secret : 'Android Web IDE',
	resave : false,
	saveUninitialized : true,
	cookie: {
		maxAge : 60 * 1000000
	}
}));

app.use(cookieParser());
// sessoin


// middleware installation
app.use(serve_static(__dirname));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.Router());

var _GLOBAL = {
	path_reference : "./user_data/"
};
var upload_done = false;

app.use(multer({
	dest:'./uploads',
	rename: function(fieldname, filename){
		return filename;
	},
	onFileUploadStart: function(file){
		console.log(file.originalname+ ' is starting .....................................');
	},
	onFileUploadComplete: function(file){
		console.log(file.fieldname+ ' uploaded to ' + file.path);
		upload_done = true;

	}
}));


var http = require('http').Server(app);
var io = require('socket.io')(http);

var __DIR = './user_data/projects/';

// method - get /
app.get('/', chkDevice, function(req, res){
	if(req.session.user_id){
		res.redirect('/main?id=' + req.session.user_id);
	}
	else{
		fs.readFile('login.html', function(err, data){
			res.send(data.toString());
		});
	}
});

app.get('/make_dir', function(req, res){
	var path = req.param("path");

	console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!path : " + path);
	fs.mkdir(path, function(){
		console.log("make_dir complete");
		res.send("make_dir complete");
	});
});

app.get('/make_file', function(req, res){
	var path = req.param("path");

	fs.open(path, "w+", function(){
		console.log("make_file complete");
		res.send("make_file complete");
	});
});

app.get('/delete_file', function(req, res){
	var path = req.param("path");
	var stats = fs.stat(path, function(err, stat){
		var isDir = stat.isDirectory();
		if(isDir){
		
			rimraf(path, function(){
				console.log("Folder/File Deleted..");
				res.send("Folder/File Deleted..");
			});
		}else{
			fs.unlink(path, function(){
				console.log("File Deleted..");
				res.send("File Deleted..");
			});
		}
	});
});


// method - get /signUp : Sign Up for new User
app.get('/signUp', function(req, res){
	fs.readFile('signUp.html', function(err, data){
		res.send(data.toString());
	});
});

// method - get /main   ************************ 2.26 ************************ 
app.get('/main', chkDevice, function(req, res){
	var user_id = req.param("id");
	var page;
	
	if(req.device != "tablet"){
		console.log("PC");
		page = 'main.html';
	}else{
		console.log("TAB");
		page = 'main_m.html';
	}  
	
	if(req.session.user_id && req.session.user_id == user_id){
		fs.readFile(page, function(err, data){
			res.send(data.toString());
		});
	}
	else{
		console.log("Bed Request..");
		res.redirect('/');
	}
});


// method - get /select_project
app.get('/select_project', function(req, res) {

	var context = "[/select_project] : ";
	var user_id = req.param("id");

	console.log(context, user_id, "project list request");

	function projectlist_request_handler(projectlist_request_successful, projectList, res) {
		var res = res;

		if (projectlist_request_successful) {
			res.send(projectList);
		} else {
			res.send(null);
			console.log(context, "failure");
		}
	}


	db.userproject.list(user_id, projectlist_request_handler, res);

});

// method - get /select_project
app.get('/project_info', function(req, res) {

	var context = "[/project_info] : ";
	var project_name = req.param("project");
	_GLOBAL.project_name = project_name ;
	_GLOBAL.project_path = __DIR + project_name + '_' +req.param("id");
	console.log("js: proj_name " + _GLOBAL.project_name);
	console.log("js: proj_path " + _GLOBAL.project_path);

	console.log(context, "project information request");

	function project_info_handler(project_info_successful, projectObj, res)
	{
		var res = res;

		if (project_info_successful)
		{
			res.send(projectObj);
		}
		else
		{
			res.send(null);
			console.log(context, "failure");
		}
	}

	db.projectinfo.info(project_name, project_info_handler, res);

});

//*********
//GitTree
//*********
function draw_handler(_finalObject, res) {
	var log_diff_cnt = 0;
	var origin_pos = _finalObject.origin_position;
	var my_pos = _finalObject.my_position;
	var res_html = "";
	var drawTreeArray = [];
	var arr_length;

	var context = "[draw_handler] : ";
	console.log(context, "origin_length- ", _finalObject.originLogTreeArray.length + "\n" + "user_length- ", _finalObject.userLogTreeArray.length + "\n");
	console.log("_finalObject: " + "\n" + JSON.stringify(_finalObject));

	

	if(_finalObject.originLogTreeArray.length <= _finalObject.userLogTreeArray.length) 
	{	
		drawTreeArray = _finalObject.userLogTreeArray;
	}
	else
	{
		drawTreeArray = _finalObject.originLogTreeArray;
	}
	console.log("drawTree: " + drawTreeArray.length + "\n" + drawTreeArray);

	arr_length = drawTreeArray.length - 1;

	console.log("drawTree:" + drawTreeArray.length);
	console.log(drawTreeArray);		
	
	for(var i in drawTreeArray){
		var com_msg = drawTreeArray[i].commit_msg;
		if(com_msg.length > 30){
			var temp = com_msg.slice(0, 30);
			com_msg = temp.concat("...");
		}
		if(origin_pos === drawTreeArray[i].commit_hash){
			res_html += '<div class="git_tree_node node_origin" data-hash="' 
					  + drawTreeArray[i].commit_hash + '" data-name="' 
					  + drawTreeArray[i].committer_name + '" data-date="' 
					  + drawTreeArray[i].commit_date + '" data-msg="' 
					  + com_msg + '">o</div>';
		}else if(my_pos === drawTreeArray[i].commit_hash){
			res_html += '<div class="git_tree_node node_user" data-hash="' 
					  + drawTreeArray[i].commit_hash + '" data-name="' 
					  + drawTreeArray[i].committer_name + '" data-date="' 
					  + drawTreeArray[i].commit_date + '" data-msg="' 
					  + com_msg + '">m</div>';
		}else if(origin_pos === drawTreeArray[i].commit_hash && my_pos === drawTreeArray[i].commit_hash){
			res_html += '<div class="git_tree_node node_origin_user" data-hash="' 
					  + drawTreeArray[i].commit_hash + '" data-name="' 
					  + drawTreeArray[i].committer_name + '" data-date="' 
					  + drawTreeArray[i].commit_date + '" data-msg="' 
					  + com_msg + '">o_m</div>';
		}else{
			res_html += '<div class="git_tree_node node_normal" data-hash="' 
					  + drawTreeArray[i].commit_hash + '" data-name="' 
					  + drawTreeArray[i].committer_name + '" data-date="' 
					  + drawTreeArray[i].commit_date + '" data-msg="' 
					  + com_msg + '">n</div>';
		}
		if(i != arr_length)
			res_html += "<div class='git_tree_edge'></div>";
	}
			
	res.send(res_html);
}

//pull push commit 버튼을 누를때마다 실행되게 (V)
app.get('/makeGitTree', function(req, res){
	var path = req.param('path');
	var id = req.param('id');
	console.log("/makeGitTree : " +path + " / " +id);
	gitTree.logTree(path, id, draw_handler, res); 
});
//export
app.get('/btm_menu_export', function(request, response){

	var context = "[/btm_menu_export] : ";

	console.log(context, "connected");

	var user_id = request.param("id");
	var project_name = request.param("project");

	var path = './user_data/projects/' + project_name + '/_' + user_id;
	
	console.log(_GLOBAL.cur_project_target);
	console.log(path);
	
	var child = exec("cd " + path +"; "+ " zip -r ../"+project_name+".zip ./*", function(err, stdout ,stderr){
 		if (err === null)
		{
			console.log(context, "	successful");
			response.download('./user_data/projects/' + project_name +'/' +project_name+'.zip');
		}
		else
		{
			console.log(context, "error");
			sys.print('stderr : ' + stderr);
			//response.download);
		}
	});
});

//apk
app.get('/btm_menu_apk', function(request, response){

	var context = "[/btm_menu_apk] : ";

	console.log(context, "connected");

	var user_id = request.param("id");
	var project_name = request.param("project");

	var path = "./user_data/projects/" + project_name + "/_" + user_id + "/bin/";
	var Apk_name = user_id +"-release.apk";	
	console.log(path);
	
	var child = exec("cd " + path +";", function(err, stdout ,stderr){
 		if (err === null)
		{
			console.log(context, "	successful");
			response.download(path + Apk_name);
		}
		else
		{
			console.log(context, "error");
			sys.print('stderr : ' + stderr);
			//response.download);
		}
	});
});
//import
app.post('/upload',function(req,res){//import zipfile
	if(upload_done){
		console.log(req.files);
		upload_done=false;
		var upload_project_name = req.files.uploadFile.originalname;	
		var user_id = req.session.user_id ;
		var project_name=upload_project_name.split(".");
		project_name = project_name[0];
		var project_desc = project_name+" made by "+ user_id;
		console.log("[user_id] = " +user_id);
		console.log("[upload_project_name] = " + upload_project_name);
		console.log("[project_name] = " + project_name[0]);
		console.log("[project_desc] = " + project_desc);
////////upload end////////create start////////////////
	//	var path = "./user_data/projects/";

		var context = "[/project_add] : ";


		console.log(context, "project upload request");

		function project_upload_handler(project_upload_successful, res)
		{
			
			if (project_upload_successful)
			{
				res.redirect("back");
			}
			else
			{
				res.redirect("back");
			}
		}

		db.projectinfo.upload(user_id, project_name, project_desc, project_upload_handler, res);
	
	}
});


//child : run
app.get('/btm_menu_run', function(request, response){

	var context = "[/btm_menu_run] : ";

	console.log(context, "connected");

	var user_id = request.param("id");
	var project_name = request.param("project");

	var path = "./user_data/projects/" + project_name + "/_" + user_id;

	console.log(_GLOBAL.cur_project_target);
	console.log(path);

	function process_after_attach(err)
	{
		console.log('File write completed');
		// 빌드 끝내고 apk 파일도 전송해 줘야함.

		var child = exec("cd " + path +"; "+ " ant clean release",

			function(err, stdout ,stderr)
			{
				if (err === null)
				{
					console.log(context, "	successful");
					//sys.print('stdout : '+ stdout);
					response.send("Run Success!!!!!");
					//response.download(path1);
				}
				else
				{
					console.log(context, "error");
					sys.print('stderr : ' + stderr);
					response.send(stderr);
				}
			});
	}

	function build_process(err, stdout, stderr)
	{
		var filecontent, key_none;

		//local.properties update
		fs.readFile(path + "/local.properties", 'utf8',

			function(err, fd)
			{
				console.log(path + "/local.properties");
				//console.log("read success\n"+fd);

				if (err)
				{
					throw err;
				}
				else
				{
					filecontent = fd;
				
					//console.log("change\n"+filecontent);
		  			key_none = filecontent.search("#key");
		  			console.log("key is " + key_none);
		  			
		  			if (key_none === -1)
		  			{
		  				filecontent = filecontent + "#key\nkey.store=./test.keystore\nkey.alias=test\nkey.store.password=helloworld\nkey.alias.password=helloworld\n";
		  				console.log("change\n"+filecontent);

		  				fs.writeFile(path + "/local.properties", filecontent, process_after_attach);
		  			}
		  			else
		  			{
		  				process_after_attach(null);
		  			}
				}
		  	});
	}

	//local.properties update
	fs.readFile(path + "/test.keystore", 'utf8',

		function(err, data)
		{
			if (err)
			{
				// when keystore not exist, copy and proceed to build process.
				var cmd = "cp user_data/build/test.keystore " + path + "/test.keystore";
				var key = exec(cmd, build_process);
			}
	  		if (!err)
	  		{
	  			// keystore already exists, proceed to build process.
	  			build_process();
	  		}
	  	});
});

app.get('/updatetarget', function(req, res){

	var filePath = req.param('path');



	_GLOBAL.cur_project_path = "./user_data/projects/"+filePath;
	console.log("readfilejs "+_GLOBAL.cur_project_path);

	fs.readFile(_GLOBAL.cur_project_path+"project.properties", 'utf8', function(err, data) {
		
		console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@@@@ : " +data);
 		if(typeof data === "undefined"){
 			res.send("no project , please create project!");
            return;
 		}
 		var n = data.search("target=");
 		if(n===-1){
			var k=24;
 		}
 		else{
 			data = data.substring(n,data.length-1);
 			var k = data.split("\n");
 			k = k[0].substring(7, k[0].length);
 		}		console.log("res : " + k);

		//var resTarget = data.substring(n+7,data.length-1);
		//console.log("res : " + resTarget);

		_GLOBAL.cur_project_target = k;
		//console.log("again : "+ _GLOBAL.cur_project_target);


		var child = exec("cd " + _GLOBAL.cur_project_path +"; android update project -p . -t "+ _GLOBAL.cur_project_target +";" + " cd ../appcompat_v7; "+ "android update project -p . -t "+ _GLOBAL.cur_project_target +"; " , function(err, stdout ,stderr){
			var context = "[/update target] : ";

			//console.log(context, "connected");
			//console.log("in "+ _GLOBAL.cur_project_target);
			if (err === null)
			{
				console.log(context, "	successful");
				sys.print('stdout : '+ stdout);
				res.send(stdout);
			}
			else
			{
				console.log(context, "error");
				sys.print('stderr : ' + stderr);
				res.send(stderr);
			}
		});
	});




});

app.get('/btm_menu_graphic', function(request, response){

	var context = "[/btm_menu_graphic] : ";

	console.log(context, "connected");

	var user_id = request.param("id");
	var project_name = request.param("project");

	var path = "./user_data/projects/" + project_name + "/_" + user_id + "/bin/";
	
	
	});

/*
	graphic

*/
app.post('/graphical', function(req, res){

	var context = "[/graphical] : ";

	var user_id = req.body.id;
	var project = req.body.project_name;
	var path = req.body.project_path;

	console.log(context, user_id, "graphical request");
	res.send("G_L");
});

/**********
 LOGIN
 **********/

app.get('/logout', function(req, res){
	delete req.session.user_id;
	res.send("logout");
});

app.post('/login', function(req, res){

	var context = "[/login] : ";

	var user_id = req.body.id;
	var user_pwd = req.body.pwd;

	console.log(context, user_id, "login request");

	function login_handler(login_successful, res)
	{
		if (login_successful)
		{
			req.session.user_id = user_id;
			res.send("login_successed");
		}
		else
		{
			res.send("login_failed");
		}
	}

	db.userinfo.login(user_id, user_pwd, login_handler, res);
});

/**********
 JOIN
 **********/
app.post('/join', function(req, res){

	var context = "[/join] : ";

	var user_id = req.body.id;
	var user_pwd = req.body.pwd;
	var user_email = req.body.email;

	console.log(context, user_id, "join request");

	function join_handler(join_successful, res)
	{
		if (join_successful)
		{
			res.send("join_successed");
		}
		else
		{
			res.send("join_failed");
		}
	}

	db.userinfo.join(user_id, user_pwd, user_email, join_handler, res);
});

/***************
 PROJECT CREATE
 ***************/
app.post('/project_create', function(req, res){

	var context = "[/project_create] : ";

	var user_id = req.body.id;
	var project_name = req.body.pname;
	var project_desc = req.body.pdesc;

	console.log(context, "project creation request");

	function project_create_handler(project_create_successful, res)
	{
		if (project_create_successful)
		{
			res.send("project_create_successed");
		}
		else
		{
			res.send("project_create_failed");
		}
	}

	db.projectinfo.create(user_id, project_name, project_desc, project_create_handler, res);

});

/***************
 PROJECT INVITE
 ***************/
app.post('/project_invite', function(req, res){

	var context = "[/project_invite] : ";

	var user_id = req.body.id;

	var inv_id = req.body.inv_id;
	var inv_project = req.body.inv_project;
	var inv_msg = req.body.inv_msg;

	console.log(context, "user invitation request");

	function project_invite_handler(project_invite_successful, res)
	{
		if (project_invite_successful)
		{
			res.send("project_invite_successed");
		}
		else
		{
			res.send("project_invite_failed");
		}
	}

	db.invitation.invite(user_id, inv_id, inv_project, inv_msg, project_invite_handler, res);
});

/*********************
 EDITOR - FILE SAVE
**********************/
// method = post /file_save : save file when client press 'Ctrl + S'
app.post('/file_save', function(req, res){
	var fileName = req.body.fileName;
	var contents = req.body.contents;
	var user_id = req.body.id;
	var project_name = req.body.project;

	var path = "./user_data/projects/" + project_name + "/_" + user_id;

	fs.writeFile(fileName, contents, 'utf8', function(err){
		if(err) throw err;
		console.log("### Save Complete ###\n\n");
	});
	
	console.log(_GLOBAL.cur_project_target);
	console.log(path);

	var antcompile = exec("cd " + path +"; "+ " ant compile", function(err, stdout ,stderr){
		console.log(stdout);
			
      	
			if (err === null)
			{
				console.log( "compile successful</br><br/>");
				sys.print('stdout : '+ stdout);
				res.send("Compile Success!!!!!</br><br/>");
			}
			else
			{	
				if(stdout===null){
					reponse.send("not compile , create project");
				}
				var task1index=stdout.search("task1");//not java error
				
				if(task1index!==-1){
					var start = stdout.search("part!");
					stdout = stdout.substring(start+6,stdout.length);
					
					stdout = stdout.replace(/(\r\n|\r|\n|\^)/gm,"");
					stdout = stdout.replace(/(\s{2,})/g,' ');	
					var _LOG = stdout.split("[javac] ");
					var _ParseLog="";
					var k=0;
		
					if(_LOG.length>1){
							_ParseLog+=(  "statments &nbsp;:&nbsp; " + _LOG[3] +"</br>");
							var _tmp = _LOG[2].split(":");
							_ParseLog += ("  state  &nbsp;&nbsp;&nbsp;&nbsp;  :&nbsp;" + _tmp[3]);
							
							if(_tmp[3]===null){response.send("not compile, create project");}
							var symbolindex = _tmp[3].search("symbol");		//java file error check
											
							if(symbolindex!==-1){					//java file error
									////////////////////////////////
									_LOG[5] = _LOG[5].split(" ");

									i++; 

									//////////////////////////////////////
									_LOG[5][2] = "."+_LOG[5][2];
									for(var c=0;c<importclass.length;c++){
										if(importclass[c].label.search(_LOG[5][2])!=-1){
											var tmp_Label = importclass[c].label.split(".");
											_LOG[5][2] = _LOG[5][2].replace(".","");
											if(tmp_Label[tmp_Label.length-1]===_LOG[5][2]){
												//console.log(importclass[c].label);
												_ParseLog += ("   --->   import " + importclass[c].label + "</br>");
												break;	
											}
										}
									}
									//////////////////////////////////////
	

									_ParseLog += ("   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[1] + "</br>");
									var index = _tmp[0].search(user_id);
									_tmp[0] = _tmp[0].substring(_tmp[0].search('_'+user_id)+user_id.length+1,_tmp[0].length);
									_ParseLog += (" location &nbsp;&nbsp;:&nbsp; " + _tmp[0] + "</br></br>");
								
								for(var i = 7;i<_LOG.length;i++){
								//	console.log("_LOG["+i+"] = " + _LOG[i]);
									if((i)%5===3){
										_ParseLog+=(  "statments &nbsp;:&nbsp; " + _LOG[i] +"</br>");
										var _tmp = _LOG[i-1].split(":");
										_ParseLog += ("  state  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;  " + _tmp[3]);
										if(_tmp[3] == null){break;}
										var symbolindex = _tmp[3].search("symbol");
							

										if(symbolindex!==-1){
											i+=2;
											_LOG[i] = _LOG[i].split(" ");


											//////////////////////////////////////
											_LOG[i][2] = "."+_LOG[i][2];
											for(var c=0;c<importclass.length;c++){
												if(importclass[c].label.search(_LOG[i][2])!=-1){
													var tmp_Label = importclass[c].label.split(".");
													_LOG[i][2] = _LOG[i][2].replace(".","");
													if(tmp_Label[tmp_Label.length-1]===_LOG[i][2]){
														//console.log(importclass[c].label);
														_ParseLog += ("   --->   import " + importclass[c].label + "</br>");
														break;	
													}
												}
											}
										
											i++; 
										}
										_ParseLog += ("   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[1] + "</br>");
										var index = _tmp[0].search(user_id);
										_tmp[0] = _tmp[0].substring(_tmp[0].search('_'+user_id)+user_id.length+1,_tmp[0].length);
										_ParseLog += (" location &nbsp;&nbsp;:&nbsp; " + _tmp[0] + "</br></br>");
									}
							
								}
							}
							else{//layout error

								_ParseLog += ("</br>   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[1] + "</br>");
								var index = _tmp[0].search(user_id);
								_tmp[0] = _tmp[0].substring(_tmp[0].search('_'+user_id)+user_id.length+1,_tmp[0].length);
								_ParseLog += (" location &nbsp;&nbsp;:&nbsp; " + _tmp[0] + "</br></br>");
							

								for(var i=4;i<_LOG.length;i++){
								//	console.log("_LOG["+i+"] = " + _LOG[i]);
									if((i)%3===0){
										_ParseLog+=(  "statments &nbsp;:&nbsp; " + _LOG[i] +"</br>");
										var _tmp = _LOG[i-1].split(":");
										_ParseLog += ("  state &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;" + _tmp[3]);
										_ParseLog += ("</br>   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[1] + "</br>");
										var index = _tmp[0].search(user_id);
										_tmp[0] = _tmp[0].substring(_tmp[0].search('_'+user_id)+user_id.length+1,_tmp[0].length);
										_ParseLog += (" location &nbsp;&nbsp;:&nbsp; " + _tmp[0] + "</br></br>");
									}
								//	console.log(_ParseLog);
								}
							}
					}
		

					_ParseLog = "Compile ERROR     :    "+ _LOG[_LOG.length-1] +"</br></br>"+_ParseLog+"</br></br>";
				
					res.send(_ParseLog);
			}
			else{

				if(stdout.search("task3")===-1){//androidmanifext.xml error
					stdout = stdout.replace(/(\r\n|\r|\n|\^)/gm,"");
					stdout = stdout.replace(/(\s{2,})/g,' ');	
					var _tmp = stdout.split("[gettarget] ");

					console.log(_tmp[3]);
					_tmp[3] = _tmp[3].split(":");
					var _ParseLog="";
					_ParseLog+="Compile ERROR &nbsp; &nbsp; : &nbsp; &nbsp; AndroidManifest.xml Error<br/><br/>";
					_ParseLog+=("statments &nbsp;:&nbsp; " + _tmp[3][3]+"<br/>");
					_ParseLog+=("   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[3][1] + "<br/><br/>");
					//res.send(_ParseLog);
				}
				else{
					var start = stdout.search("task3");
					stdout = stdout.substring(start,stdout.length);
					console.log(stdout);
					
					stdout = stdout.replace(/(\r\n|\r|\n|\^)/gm,"");
					stdout = stdout.replace(/(\s{2,})/g,' ');	
					var _LOG = stdout.split("[aapt] ");
					var _ParseLog="";
					var _tmp=_LOG[_LOG.length-2].split(":");


					_ParseLog+=(  "statments &nbsp;:&nbsp;" + _tmp[3] +"</br>");
					_ParseLog += ("  state  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;  " + _tmp[4]);
					_ParseLog += ("</br>   line   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp; " + _tmp[1] + "</br>");
					var index = _tmp[0].search(user_id);
					_tmp[0] = _tmp[0].substring(_tmp[0].search('_'+user_id)+user_id.length+1,_tmp[0].length);
					_ParseLog += (" location &nbsp;&nbsp;:&nbsp; " + _tmp[0] + "</br></br>");
						
					_ParseLog = "Compile ERROR     :    Not .java error</br></br>"+_ParseLog+"</br></br>";
					console.log(_ParseLog);			
				}
				res.send(_ParseLog);
			}
		}
	});
	//res.send(_ParseLog);
});
/*********************
 EDITOR - FILE TREE
**********************/
// method - post /req_filetree : request file tree
app.post('/req_filetree', function(req, res){

	var context = "[/req_filetree] : ";

	var __PROJECT_BASE_DIR = "./user_data/projects/";
	var dir = req.body.dir;

	if (dir.search(__PROJECT_BASE_DIR) == -1)
	{
		//req.body.dir = dir.substr(__PROJECT_BASE_DIR.length);
		dir = __PROJECT_BASE_DIR.concat(dir);
	}


	console.log("File Tree : " +dir);

	filetree.getDirList(dir, res);
});

/*********************
 EDITOR - OPEN FILE
**********************/
// method - post //openfile : request open file
app.post('/openFile', function(req, res){

	var context = "[/openFile] : ";

	var __PROJECT_BASE_DIR = "./user_data/projects/";
	var filePath = req.body.path;
	if(filePath){
		if (filePath.search(__PROJECT_BASE_DIR) == -1) {
			filePath = __PROJECT_BASE_DIR + req.body.path;
		}

		console.log(context, filePath);

		if (filePath) {
			fs.readFile(filePath, 'utf-8', function(err, data) {
				//console.log(data);
				res.send(data);
			});
		}	
	}else{
		res.send("&*^nothing");
	}
	
});


//////////////////////////////////////////////////////////////////////////
//	SOCKTE.IO HANDLERS
//////////////////////////////////////////////////////////////////////////

io.on('connection', function(socket) {

		var context = "[/editor] : ";
	console.log(context, "a user connected (socket.io) / ip address: " + socket.handshake.address);



	socket.on('disconnect', function() {
		console.log(context, 'a user disconnected (socket.io)/ ip address : ' + socket.handshake.address);
	});


	//////////////////////
	// room OUT
	//////////////////////
	//data : {project:_GLOBAL.project, id:_GLOBAL.id}
	// socket.on("out", function(data) {	
	// 	socket.broadcast.to(socket.room).emit("room_out_response", data);
	// });

	//////////////////////
	// room IN
	/////////////////////
	//data : {id: _GLOBAL.id}
	socket.on("in", function(data) {
		socket.room = "livingRoom"; //기본은 livingRoom  이다.
		socket.join(socket.room);
	});


	//////////////////////
	// room SWITCH
	//////////////////////
	//data : {project:_GLOBAL.project, id:_GLOBAL.id}
	socket.on("switch", function(data) {
		var newroom = data.project;

		//기존 방 사람들한테 내 자리에서 포스트잇 지우라고 퍼트려주고
		io.in(socket.room).emit("room_out_delete", data.id);		
		// 기존 방에서 나오고
		socket.leave(socket.room);



		// 새 방에 들어감
		socket.join(newroom);
		socket.room = newroom;	//새 방을 socket의 방으로 설정해주고		
		// 방에 들어간 사람들한테 들어왔다고 메세지

		io.in(socket.room).emit("room_in_msg", data);


		console.log("/////////////////room swtich check///////////////////////");
		console.log("User " + socket.handshake.address + " in at : " + socket.room);
		
		// 0. 사용자가 이미 속해있던 다른 프로젝트의 work들을 빼준다.
		//////////////////////
		// IN - Work Delete
		//////////////////////
		var delete_cnt = 0;
		for(var i in CurrentProjectsArray) 
		{
			for(var idx in CurrentProjectsArray[i].workArray) 
			{
				if(data.id == CurrentProjectsArray[i].workArray[idx].name)
				{
					console.log("얘네지워짐:::" + CurrentProjectsArray[i].workArray[idx].work);
					delete_cnt++;
				}
			}
		}

		for(var cnt = 0; cnt<delete_cnt; cnt++)
		{
			for(var i in CurrentProjectsArray) 
			{
				for(var idx in CurrentProjectsArray[i].workArray) 
				{
					if(data.id == CurrentProjectsArray[i].workArray[idx].name)
					{
						CurrentProjectsArray[i].workArray.splice(idx,1); 
					}
				}
			}
		}		

		console.log("지운 후==============");
		for(var i in CurrentProjectsArray)
		{
			for(var idx in CurrentProjectsArray[i].workArray)
			{
				console.log(CurrentProjectsArray[i].workArray[idx].work);	
			}
		}console.log("=====================");


		//////////////////////
		// 객체 생성
		//////////////////////
		// 1) 프로젝트가 있나를 검사해서
		if(CurrentProjectsArray.length == 0)
		{
			var workArray = [];
			var p = new projectObj(data.project, workArray);
			CurrentProjectsArray.push(p);

		}
		else
		{
			for(var i in CurrentProjectsArray)
			{
				// 2) 없으면, 만들어주고
				if(data.project != CurrentProjectsArray[i].p_name)
				{	
					var workArray = [];
					var p = new projectObj(data.project, workArray);
					CurrentProjectsArray.push(p);
				}

				// 3) 있으면, 그 안에다 user를 넣어준다.
				else
				{
					// work와 user를 넣는 직접적인 동작은 사용자가 수정을 할때이므로
					// 여기에서는 일단 아무것도 안한다.
				}

			}
			
		}


		//////////////////////
		// roon_in_init_draw
		//////////////////////
		// 이미 참여중인 사용자를 보내준다.
		// data :  {project: _GLOBAL.project, id: _GLOBAL.id}
		//socket.on("roon_in_init_draw", function(data){
			for(var i in CurrentProjectsArray)
			{
				if(data.project == CurrentProjectsArray[i].p_name)
				{
					data.works = CurrentProjectsArray[i].workArray;
					socket.emit("room_in_init_draw", data);
				}
			}
		//});

		//나를 포함해서 방사람들 모두에게
		io.in(socket.room).emit("room_in_draw",data);
		//나를 제외한 같은 방사람들에게
		//socket.broadcast.to(socket.room).emit("room_in_draw", data);

	});
	

	//////////////////////
	// workList_request
	//////////////////////
	// data : {project: _GLOBAL.project, id: usr_id}
	socket.on("workList_request", function(data) {
		//var splitArray = data.id.split('&nbsp');
		//var user_name = splitArray[splitArray.length - 1];

		for(var i in CurrentProjectsArray)
		{
			if(CurrentProjectsArray[i].p_name == data.project)
			{
				//console.log("data.project :::" +data.project );
				for(var j in CurrentProjectsArray[i].workArray)
				{
					// console.log("////////////////////////");
					// console.log(data.id);
					// console.log(CurrentProjectsArray[i].workArray[j].name);
					// console.log("////////////////////////");
					if(data.id === CurrentProjectsArray[i].workArray[j].name)
					{
						console.log("workList_request check////////////////////");
						console.log(CurrentProjectsArray[i].workArray);
						socket.emit("workList_response", {id: data.id, works: CurrentProjectsArray[i].workArray});
					}
				}
			}
		}

	});


	socket.on("push_msg", function(data) {
		console.log("/////////////////socket data check///////////////////////");			
		console.log(data.id);
		io.in(socket.room).emit("get_msg", data);
	});

///////////////////////////////////////////////////////////////////////////////





	
	////////////////////////////////////
	// Work Delete + room_out_delete
	///////////////////////////////////
	//id_data : _GLOBAL.id
	socket.on("logout_delete", function(id_data) {

		io.in(socket.room).emit("room_out_delete", id_data);

		var delete_cnt = 0;

		console.log("지우기전==============");
		for(var i in CurrentProjectsArray)
		{
			for(var idx in CurrentProjectsArray[i].workArray)
			{
				console.log(CurrentProjectsArray[i].workArray[idx].work);	
			}
		}console.log("=====================");

		//work delete
		for(var i in CurrentProjectsArray) 
		{
			for(var idx in CurrentProjectsArray[i].workArray) 
			{
				if(id_data == CurrentProjectsArray[i].workArray[idx].name)
				{
					console.log("얘네지워짐:::" + CurrentProjectsArray[i].workArray[idx].work);
					delete_cnt++;
				}
			}
		}

		for(var cnt = 0; cnt<delete_cnt; cnt++)
		{
			for(var i in CurrentProjectsArray) 
			{
				for(var idx in CurrentProjectsArray[i].workArray) 
				{
					if(id_data == CurrentProjectsArray[i].workArray[idx].name)
					{
						CurrentProjectsArray[i].workArray.splice(idx,1);
					}
				}
			}
		}
		//p		

		console.log("지운 후==============");
		for(var i in CurrentProjectsArray)
		{
			for(var idx in CurrentProjectsArray[i].workArray)
			{
				console.log(CurrentProjectsArray[i].workArray[idx].work);	
			}
		}console.log("=====================");

	});


	//////////////////////
	// Work Insert
	//////////////////////
	//data : {project: _GLOBAL.project, id:_GLOBAL.id, file_name: file}
	socket.on("insert", function(data) {
		//console.log(data.id);
		//console.log(data.file_name);
		
		var check_flag = 0;

		//***********data.file parsing
		var path = data.file_name;
		var splitArray = path.split('/');
		var fileN = splitArray[splitArray.length - 1];
		//console.log("제대로파싱되니2----------" + fileN);


		var t = new taskObj(data.id, fileN);
		
		console.log("[[[[[[[[[[[insert triggered]]]]]]]]]]");
		// 1) Current 통에서 프로젝트 이름을 찾아서
		for(var i in CurrentProjectsArray)
		{
			// 2) 같은 이름의 프로젝트를 찾으면
			if(data.project == CurrentProjectsArray[i].p_name)
			{
				// 3) work가 같은애가 있나 검사해서,
				for(var idx in CurrentProjectsArray[i].workArray)
				{
					// 4_1) 있으면 break
					if((data.id == CurrentProjectsArray[i].workArray[idx].name) && (fileN == CurrentProjectsArray[i].workArray[idx].work)) 
					{											//limit: 동일한 프로젝트에 존재하는 같은이름의파일은 구분 불가하게 됨
						check_flag = 1;
						break;
						
					}
				}
				if(check_flag) break;
			}
		}
		console.log("check_flag:::" + check_flag);

		console.log("insert 전============================");
		console.log(CurrentProjectsArray);
		console.log("====================================");
		// 4_2) 없으면 넣어준다.
		if(check_flag === 0)
		{
			// 1) Current 통에서 프로젝트 이름을 찾아서
			for(var i in CurrentProjectsArray)
			{	
				// 2) 같은 이름의 프로젝트를 찾으면
				if(data.project == CurrentProjectsArray[i].p_name)
				{
					console.log("[insert start!!!!!]");
					//해당 프로젝트의 workArray에 추가
					CurrentProjectsArray[i].workArray.push(t);

					for(var idx in CurrentProjectsArray[i].workArray) {
						console.log(CurrentProjectsArray[i].workArray[idx]);
					}
						
				}

			}
		}
		console.log("insert 후===========================");
		console.log(CurrentProjectsArray);
		console.log("====================================");

	});

	//////////////////////
	// Work Sync
	//////////////////////
	//지금 선택된 파일이 수정해도 되는 건지 아닌지 확인한다.
	//data : {project: _GLOBAL.project, id:_GLOBAL.id, file: file_path});
	socket.on("work_sync",function(data){
		// console.log("////////////////work_sync data check///////////////////");
		// console.log(data.id);
		// console.log(data.project);
		// console.log(data.file);
		var work_flag = 0;
		var length = CurrentProjectsArray.length;

		//***********data.file parsing
		var path = data.file;
		if(typeof(path)=="undefined"){
			console.log("no path!!");
			return ;
		}
		var splitArray = path.split('/');
		var fileN = splitArray[splitArray.length - 1];
		//console.log("제대로파싱되니----------" + fileN);

		
		//console.log("CurrentProjectsArray.length::: " + CurrentProjectsArray.length);

		if(length === 0) 
		{
			socket.emit("work_sync_response",work_flag);
		}
		else
		{
			for(var i in CurrentProjectsArray) 
			{	
				if(data.project === CurrentProjectsArray[i].p_name)
				{
					// (O)
					for(var j in CurrentProjectsArray[i].workArray) 
					{
						// (O)
						//console.log(j + " : " + CurrentProjectsArray[i].workArray[j].work);
						if( fileN === CurrentProjectsArray[i].workArray[j].work)
						{
							if(data.id != CurrentProjectsArray[i].workArray[j].name)
							{
								console.log("다른 사용자가 편집중입니다.");
								work_flag = 1;
								break;

							}
						}	

					}
					if(work_flag === 1)
						break;
				}
			}
			//console.log("====================================================");
			//console.log("CurrentProjectsArray::: " + CurrentProjectsArray);
			console.log("server---------work_flag::: " + work_flag);

			//var task = new taskObj(data.id, data.file);
			//workArray.push(task1);
			//var project1 = new projectObj(data.project, workArray);
			socket.emit("work_sync_response",work_flag);


		}

	});

	//임시
	socket.on("pushids", function(data) {
		var temp = [];
		temp.push(data);
		global_pushids = temp;
	});


	///////////////////
	// PULL
	///////////////////
	socket.on('pull', function(data) {

		if ( typeof data.project === "undefined") {
			socket.emit("pull_response", null);
			return;
		}

		function pull_handler(pull_successful, socket, msg) {
			var socket = socket;
			var data = {};

			data.reason = msg;

			if (pull_successful === true)
				data.result = "successful";
			else
				data.result = "fail";

		
				//////////////////////
				// workArray delete
				//////////////////////
				// var delete_cnt = 0;
				// var pushids_delete_cnt = 0;


				// console.log("global_pushids================///////");
				// console.log(global_pushids);

				// // global_push에서 같은 프로젝트면, 해당 아이디들이 갖고있는 work를 지워라
				// for(var g in global_pushids)
				// {
				// 	if(global_pushids[g].project == data.project) {

				// 		for(var i in CurrentProjectsArray) 
				// 		{
				// 			for(var idx in CurrentProjectsArray[i].workArray) 
				// 			{
				// 				if(global_pushids[g].id == CurrentProjectsArray[i].workArray[idx].name)
				// 				{
				// 					console.log("얘네지워짐:::" + CurrentProjectsArray[i].workArray[idx].work);
				// 					delete_cnt++;
				// 				}
				// 			}
				// 		}

				// 		for(var cnt = 0; cnt<delete_cnt; cnt++)
				// 		{
				// 			for(var i in CurrentProjectsArray) 
				// 			{
				// 				for(var idx in CurrentProjectsArray[i].workArray) 
				// 				{
				// 					if(global_pushids[g].id == CurrentProjectsArray[i].workArray[idx].name)
				// 					{
				// 						CurrentProjectsArray[i].workArray.splice(idx,1);
				// 					}
				// 				}
				// 			}
				// 		}		

				// 		console.log("pull에서 지운 후==============");
				// 		for(var i in CurrentProjectsArray)
				// 		{
				// 			for(var idx in CurrentProjectsArray[i].workArray)
				// 			{
				// 				console.log(CurrentProjectsArray[i].workArray[idx].work);	
				// 			}
				// 		}console.log("============================");
					
				// 	}

				// }

				// //지운 후엔 global_pushids에 있는 애들도 지워줘야한다.
				// for(var i in global_pushids) 
				// {
				// 	if(global_pushids[g].project == data.project)
				// 	{
				// 		pushids_delete_cnt++;
				// 	}
				// }

				// for(var i in global_pushids) 
				// {
				// 	if(data.project == global_pushids[g].project)
				// 	{
				// 		global_pushids[g].splice(g,1);
				// 	}
				// }

				//////////////////////
			

			socket.emit("pull_response", data);
		}


		git.pull(data.project, data.id, pull_handler, socket);
	});

	///////////////////
	// COMMIT
	///////////////////
	socket.on('commit', function(data) {

		if ( typeof data.project === "undefined") {
			socket.emit("commit_response", null);
			return;
		}

		function commit_handler(commit_successful, socket, msg) {
			var socket = socket;
			var data = {};

			data.reason = msg;

			if (commit_successful === true)
				data.result = "successful";
			else
				data.result = "fail";

			socket.emit("commit_response", data);
		}


		git.commit(data.project, data.id, data.m, commit_handler, socket);
	});

	///////////////////
	// PUSH
	///////////////////
	socket.on('push', function(_data) {

		if ( typeof _data.project === "undefined") {
			//socket.emit("push_response", null);
			io.in(socket.room).emit("push_response",null);
			return;
		}

		function push_handler(push_successful, socket, msg) 
		{
			var socket = socket;
			var data = {};

			data.id = _data.id;
			data.project = _data.project;
			data.reason = msg;

			if (push_successful === true)
				data.result = "successful";
			else
				data.result = "fail";

			console.log("/////////////////socket data check///////////////////////");			
			console.log(data.id, data.project);

			//////////////////////
			// workArray delete
			//////////////////////
			var delete_cnt = 0;

			for(var i in CurrentProjectsArray) 
			{
				if(data.project == CurrentProjectsArray[i].p_name)
				{	
					for(var idx in CurrentProjectsArray[i].workArray) 
					{
						if(data.id == CurrentProjectsArray[i].workArray[idx].name)
						{
							console.log("얘네지워짐:::" + CurrentProjectsArray[i].workArray[idx].work);
							delete_cnt++;
						}
					}
				}
			}

			for(var cnt = 0; cnt<delete_cnt; cnt++)
			{
				if(data.project == CurrentProjectsArray[i].p_name)
				{
					for(var i in CurrentProjectsArray) 
					{
						for(var idx in CurrentProjectsArray[i].workArray) 
						{
							if(data.id == CurrentProjectsArray[i].workArray[idx].name)
							{
								CurrentProjectsArray[i].workArray.splice(idx,1);
							}
						}
					}
				}
			}		

			console.log("push에서 지운 후==============");
			for(var i in CurrentProjectsArray)
			{
				for(var idx in CurrentProjectsArray[i].workArray)
				{
					console.log(CurrentProjectsArray[i].workArray[idx].work);	
				}
			}console.log("============================");
			//////////////////////


			io.in(socket.room).emit("push_response",data);
			//socket.emit("push_response", data);
		}


		git.push(_data.project, _data.id, push_handler, socket);
	});

	/////////////////////////
	//	INVITE LIST REQUEST
	/////////////////////////
	socket.on('invitelist_request', function(user_id) {

		// DB에서 사용자 프로젝트 목록 가져오기
		// project item : {name, desc, user}

		function invitelist_request_handler(arr, socket) {
			var socket = socket;

			// successful		arr.length != 0
			// failure			arr.length == 0
			socket.emit('invitelist_response', arr);
		}


		db.invitation.list(user_id, invitelist_request_handler, socket);
	});

	/////////////////////////
	//	INVITE LIST ACCEPT
	/////////////////////////
	socket.on('invitelist_accept', function(data) {

		var user_id = data.id;
		var project_name = data.project;

		function inv_accept_handler(accept_successful, project_name, socket) {
			var socket = socket;

			if (accept_successful) {
				socket.emit('invitelist_accept_response', project_name);
			} else {
				socket.emit('invitelist_accept_response', null);
			}
		}

		// execute db
		db.invitation.accept(user_id, project_name, inv_accept_handler, socket);
	});

	/////////////////////////
	//	INVITE LIST DECLINE
	/////////////////////////
	socket.on('invitelist_decline', function(data) {

		var user_id = data.id;
		var project_name = data.project;

		function inv_decline_handler(decline_successful, project_name, socket) {
			var socket = socket;

			if (decline_successful) {
				socket.emit('invitelist_decline_response', project_name);
			} else {
				socket.emit('invitelist_decline_response', null);
			}
		}

		// execute db
		db.invitation.decline(user_id, project_name, inv_decline_handler, socket);
	});
	
	
	/////////////////////////
	//	AUTO COMPLETE
	/////////////////////////
	socket.on('autocomplete', function(path) {
		
		var context = "[autocomplete] : ";
		var class_path = _GLOBAL.path_reference + path;
		console.log(context, class_path);
        
        fs.readFile(class_path, function(err, html) {

            var methods_list = [];

            if (err)
            {
                socket.emit("autocomplete_response", null);
                throw err;
            }
            else
            {
                var $ = cheerio.load(html);

                $(".jd-details-title").each(function(){

                    if ($(this).children(".normal").length == 2) {
                        var obj = {};
                        obj.arr = [];

                        obj.name = $(this).children(".sympad").text();
                        obj.arr.push($(this).text().split(obj.name)[0].trim().replace(/(\r\n|\n|\r)/gm,"").replace(/\s{2,}/g, ' '));
                        obj.arr.push($(this).text().split(obj.name)[1].trim().replace(/(\r\n|\n|\r)/gm,"").replace(/\s{2,}/g, ' '));

                        methods_list.push(obj);
                    }
                });

                socket.emit("autocomplete_response", methods_list);
            }
        });
    });
	
	

});

// server start listening
http.listen(8000, function() {
	console.log('Server Start');
});
