var async = require('async');
var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;

var __DIR = './user_data/projects/';
var __child = null;

// child
// login, view, create, join, invite
// load, file reload, save, build, apk, edit, connection

/////////////////////////////
// CREATE BARE REPOSITORY
/////////////////////////////
exports.create = function(project_name, user_name, user_email, handler) {

	var context = "[git create project] : ";
	var DIR_PROJECT = __DIR + project_name + '_'+user_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	console.log(context, project_name)

	// condition check
	var task0 = function(callback)
	{
		// directory duplicate must be checked.

		callback(null);
	};

	// central repository
	var task1 = function(callback)
	{
		var cmd = "git --bare init " + DIR_PROJECT_ORIGIN;
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// clone repository
	var task2 = function(callback)
	{
		var cmd = "git clone " + DIR_PROJECT_ORIGIN + " " + DIR_PROJECT_USER;
		var child = exec(cmd, function(error, stdout, stderr) {

			// directory duplicate must be checked.
			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd);
				callback(null);
			}
		});
	};

	// "git config --local user.name id"
	// "git config --local user.email email"
	// append string
	// "[user]
	//  	email = user_email
	//		name = user_id
	// "
	// to '_user/.git/config' file.
	var task3 = function(callback)
	{
		var str1 = "[user]\n";
		var str2 = "\temail = " + user_email + "\n";
		var str3 = "\tname = " + user_name + "\n";

		var configFile = DIR_PROJECT_USER + "/.git/config";

		fs.appendFile(configFile, str1+str2+str3, function(err) {
			if (err)
			{
				throw err;
			}
			else
			{
				console.log("successful: config update.");
				callback(null);
			}
		});
	}

	// clone repository를 안드로이드 프로젝트로 만들기
	var task4 = function(callback)
	{
		var cmd = "android create project --name " + project_name + " --activity MainActivity --package com.bonobono." + project_name + " --target 10 --path " + DIR_PROJECT_USER;
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};
	

	var task5 = function(callback){//target update


	
	//var context = "[git create project] : ";
	//var DIR_PROJECT = __DIR + project_name;
	//var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	//afasfd//var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	
	console.log("readfilejs "+DIR_PROJECT_USER);

	fs.readFile(DIR_PROJECT_USER+'/'+"project.properties", 'utf8', function(err, data) {
		
		console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@@@@@@@ : " +data);
 		if(typeof(data)===undefined){
 			res.send("no project , please create project!")
 		}

 		var n = data.search("target=");
 		if(n===-1){
			var k=24;
 		}
 		else{
 		data = data.substring(n,data.length-1);
 		var k = data.split("\n");
 		k = k[0].substring(7, k[0].length);
		}		
		console.log("res : " + k);

		var child = exec("cd " + DIR_PROJECT_USER +"; android update project -p . -t "+ k +";" + " cd ../appcompat_v7; "+ "android update project -p . -t "+ k +"; " , function(error, stdout ,stderr){
			var context = "[/update target] : ";

			//console.log(context, "connected");
			//console.log("in "+ _GLOBAL.cur_project_target);
			if (error !== null)
			{
				console.log(context, "error-");
				console.log(error);
			}
			else
			{
				console.log(context, "successful-");
				callback(null);
			}
		});
	});
}
	
	// 빌드에 필요한 라이브러리 카피하기
	var task6 = function(callback)
	{
		var cmd1 = "cp -rf ./user_data/build/appcompat_v7 " + DIR_PROJECT;
		var cmd2 = "cp " + DIR_PROJECT + "/appcompat_v7/libs/android-support-v4.jar " + DIR_PROJECT_USER + "/libs"
		var cmd3 = "cd "+DIR_PROJECT_USER+"; ant clean;";
		var cmd = cmd1 + ";" + cmd2 + ";" + cmd3;

		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// 빌드에 필요한 라이브러리 카피하기
	var task7 = function(callback)
	{
		var cmd = "cp ./user_data/build/.gitignore " + DIR_PROJECT_USER;

		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// git add, commit, push
	var task8 = function(callback)
	{
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git add --a";
		var cmd3 = 'git commit -m "first commit"'
		var cmd4 = "git push origin master"

		var cmd = cmd1 + ";" + cmd2 + ";" + cmd3 + ";" + cmd4;
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null, true);
			}
		});
	};

	// acknowledge for the "create request"
	var callback = function(err, result)
	{
		if (result === true)
			handler();
	};

	async.waterfall([task0, task1, task2, task3, task4, task5, task6, task7, task8], callback);
};



exports.upload = function(project_name, user_name, user_email, handler) {

	var context = "[git upload project] : ";
	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	console.log(context, project_name)

	// condition check
	var task0 = function(callback)
	{
		// directory duplicate must be checked.

		callback(null);
	};

	// central repository
	var task1 = function(callback)
	{
		var cmd = "git --bare init " + DIR_PROJECT_ORIGIN;
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// clone repository
	var task2 = function(callback)
	{
		var cmd = "git clone " + DIR_PROJECT_ORIGIN + " " + DIR_PROJECT_USER;
		var child = exec(cmd, function(error, stdout, stderr) {

			// directory duplicate must be checked.
			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd);
				callback(null);
			}
		});
	};

	// "git config --local user.name id"
	// "git config --local user.email email"
	// append string
	// "[user]
	//  	email = user_email
	//		name = user_id
	// "
	// to '_user/.git/config' file.
	var task3 = function(callback)
	{
		var str1 = "[user]\n";
		var str2 = "\temail = " + user_email + "\n";
		var str3 = "\tname = " + user_name + "\n";

		var configFile = DIR_PROJECT_USER + "/.git/config";

		fs.appendFile(configFile, str1+str2+str3, function(err) {
			if (err)
			{
				throw err;
			}
			else
			{
				console.log("successful: config update.");
				callback(null);
			}
		});
	}

	// clone repository를 안드로이드 프로젝트로 만들기
	var task4 = function(callback)
	{			
		console.log("[task4]");

		var cmd1 = "cd uploads"
		var cmd2 = "unzip " + project_name + ".zip -d .";
		
		var cmd = cmd1 + " ; " + cmd2;

		console.log(cmd);
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	var task5 = function(callback)
	{
		var cmd1 = "cd uploads/" + project_name + "/src";
		var cmd2 = "for i in `find . \( -name '*.java' -o  -name '*.properties' -o\) -print` ; do ../../../user_data/build/e2u.sh $i ; done"
		//var cmd3 = "cd .."
		var cmd3 = "find . -name '*.tmp' -exec rm {} " + "\\" + ";"
		var cmd4 = "cd .."
		var cmd5 = "mv * ../../user_data/projects/" + project_name + "/_" + user_name + "/";

		var cmd = cmd1 + " ; " + cmd2 + ' ; ' + cmd3 + ' ;' + cmd4 + ';' + cmd5;

		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// 빌드에 필요한 라이브러리 카피하기
	var task6 = function(callback){//target update

		console.log("[task6]");
	
		//var context = "[git create project] : ";
		//var DIR_PROJECT = __DIR + project_name;
		//var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
		//afasfd//var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;
		
		console.log("readfilejs " + DIR_PROJECT_USER);

		fs.readFile(DIR_PROJECT_USER+'/'+"project.properties", 'utf8', function(err, data) {
			
	 		if(typeof(data)==="undefined"){
	 			console.log("no project , please upload project!")
	 			return;
	 		}

	 		console.log(data);

	 		var n = data.search("target=");
	 		
	 		if(n === -1)
	 		{
				var k=24;
	 		}
	 		else
	 		{
		 		data = data.substring(n,data.length-1);
		 		var k = data.split("\n");
		 		k = k[0].substring(7, k[0].length);
			}		
			console.log("res : " + k);

			callback(null, k);
		});

	};

	var task7 = function(sdk_version, callback) {

		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "android update project -n " + user_name + " -p . -t "+ sdk_version;
		var cmd3 = "cd ../appcompat_v7"
		var cmd4 = "android update project -p . -t "+ sdk_version;

		var cmd = cmd1 + ';' + cmd2 + ';' + cmd3 + ';' + cmd4;

		var child = exec(cmd, function(error, stdout ,stderr){
			
			var context = "[/update target] : ";

			//console.log(context, "connected");
			//console.log("in "+ _GLOBAL.cur_project_target);
			if (error !== null)
			{
				console.log(context, "error-");
				console.log(error);
			}
			else
			{
				console.log(context, "successful-");
				callback(null);
			}
		});
	}



	var task8 = function(callback)
	{
				
		console.log("[task8]");

		var cmd1 = "cp -rf ./user_data/build/appcompat_v7 " + DIR_PROJECT;
		var cmd2 = "cp " + DIR_PROJECT + "/appcompat_v7/libs/android-support-v4.jar " + DIR_PROJECT_USER + "/libs"
		var cmd3 = "cd  " + DIR_PROJECT_USER+"; ant clean;";


		var cmd = cmd1 + ";" + cmd2 + ";" + cmd3;
		console.log(cmd);
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	var task9 = function(callback)
	{
		var cmd = "cp ./user_data/build/.gitignore " + DIR_PROJECT_USER;

		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	// git add, commit, push
	var task10 = function(callback)
	{
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git add --a";
		var cmd3 = 'git commit -m "first commit"'
		var cmd4 = "git push origin master"

		var cmd = cmd1 + ";" + cmd2 + ";" + cmd3 + ";" + cmd4;
		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null);
			}
		});
	};

	var task11 = function(callback){//rm zip, folder
		
		var cmd = "cd ./uploads/; rm -r "+project_name+ " && rm "+project_name+".zip";
		console.log("[task7]");

		var child = exec(cmd, function(error, stdout, stderr) {

			if (error !== null)
			{
				console.log(context, "error-", cmd);
				console.log(error);
			}
			else
			{
				console.log(context, "successful-", cmd)
				callback(null, true);
			}
		});

	}

	// acknowledge for the "upload request"
	var callback = function(err, result)
	{
		if (result === true)
			handler();
	};

	async.waterfall([task0, task1, task2, task3, task4, task5, task6, task7, task8, task9, task10, task11], callback);
};
/****** execute a unix command with node.js MORE CONCISELY **

var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { console.log(stdout) }
exec("ls -la", puts);

*************************************************************/


/////////////////////////////
// JOIN A PROJECT
/////////////////////////////
exports.join = function(project_name, user_name, user_email, handler) {

	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	var goal = "\n[git] join(clone) '" + project_name + "' with id '" + user_name + "'";
	console.log(goal);

	// condition check
	var task0 = function(callback)
	{
		// project existence must be checked.
		// directory duplicate must be checked.
		// project join permission must be checked.

		callback(null);
	};

	// "git clone" origin project.
	var task1 = function(callback)
	{
		var cmd = "git clone " + DIR_PROJECT_ORIGIN + " " + DIR_PROJECT_USER;
		var child = exec(cmd, function(error, stdout, stderr) {

			// directory duplicate must be checked.
			if (error !== null)
			{
				console.log(error);
			}
			else
			{
				console.log("successful: " + cmd);
				callback(null);
			}
		});
	};

	// "git config --local user.name id"
	// "git config --local user.email email"
	// append string
	// "[user]
	//  	email = user_email
	//		name = user_id
	// "
	// to '_user/.git/config' file.
	var task2 = function(callback)
	{
		var str1 = "[user]\n";
		var str2 = "\temail = " + user_email + "\n";
		var str3 = "\tname = " + user_name + "\n";

		var configFile = DIR_PROJECT_USER + "/.git/config";

		fs.appendFile(configFile, str1+str2+str3, function(err) {
			if (err)
			{
				throw err;
			}
			else
			{
				console.log("successful: config update.");
				callback(null, true);
			}
		});
	}

	// acknowledge for the "create request"
	var callback = function(err, result)
	{
		if (result === true)
			handler();
	};

	async.waterfall([task0, task1, task2], callback);
};

/////////////////////////////
// PULL
/////////////////////////////
exports.pull = function(project_name, user_name, pull_handler, socket) {

	console.log("project", project_name);
	console.log("id", user_name);

	var context = "[/editor, PULL] : ";

	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	var msg = "";

	console.log(context, user_name, "request commit for project", project_name);

	var task0 = function(callback)
	{
		//var cmd = "cd projects & cd " + project_name + "& cd _" + user_name + "&" + "git pull origin master";
		var cmd = "cd " + DIR_PROJECT_USER + " ; " + 'git fetch origin; git merge origin/master -m "merged after fetch"';
		var child = exec(cmd, function(error, stdout, stderr) {

			console.log(context, stdout);
			msg += stdout;

			if (error !== null)
			{
				console.log(context, "task0 error");
				console.log(error);
				pull_handler(false, socket, stderr);
			}
			else
			{
				callback(null, true);
			}
		});

	};

	// acknowledge for the "pull request"
	var callback = function(err, pull_successful) {

		if (pull_successful)
		{
			pull_handler(true, socket, msg);
		}
	};

	async.waterfall([task0], callback);
}


/////////////////////////////
// COMMIT
/////////////////////////////
exports.commit = function(project_name, user_name, _m, commit_handler, socket) {

	var context = "[/editor, COMMIT] : ";

	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	console.log(context, user_name, "request commit for project", project_name);

	var task0 = function(callback)
	{
		//var cmd = "cd projects & cd " + project_name + "& cd _" + user_name + "&" + "git commit origin master";
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git add --a";
		var cmd3 = 'git commit -m \"' + _m + '\"';

		var cmd = cmd1 + ';' + cmd2 + ';' + cmd3;

		var child = exec(cmd, function(error, stdout, stderr) {

			console.log(context, stdout);

			console.log("error:", error);
			if (error !== null)
			{
				console.log(context, "task0 error");
				console.log(error);
				commit_handler(false, socket, stderr);
			}
			else
			{
				callback(null, true);
			}
		});
	};

	// acknowledge for the "commit request"
	var callback = function(err, commit_successful) {

		if (commit_successful)
		{
			commit_handler(true, socket);
		}
	};

	async.waterfall([task0], callback);
}

/////////////////////////////
// PUSH
/////////////////////////////
exports.push = function(project_name, user_name, push_handler, socket) {

	var context = "[/editor, PUSH] : ";

	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	console.log(context, user_name, "request push for project", project_name);

	var task0 = function(callback)
	{
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git push origin master";

		var cmd = cmd1 + ';' + cmd2;

		var child = exec(cmd, function(error, stdout, stderr) {

			console.log(context, stdout);

			if (error !== null)
			{
				console.log(context, "task0 error");
				console.log(error);
				push_handler(false, socket, stderr);
			}
			else
			{
				callback(null, true);
			}
		});

	};

	// acknowledge for the "push request"
	var callback = function(err, push_successful) {

		if (push_successful)
		{
			push_handler(true, socket);
		}
	};

	async.waterfall([task0], callback);
}
