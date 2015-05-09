var exec = require('child_process').exec;
var async= require('async');

var __DIR = './user_data/projects/';
//global.finalArray = [];

module.exports = function() {
	return {
		logTree: logTree_
	};
};


function logTree_ (project_name, user_name, draw_handler, res)/*, res*/ 
{
	var DIR_PROJECT = __DIR + project_name;
	var DIR_PROJECT_ORIGIN = DIR_PROJECT + "/origin";
	var DIR_PROJECT_USER = DIR_PROJECT + "/_" + user_name;

	var finalArray = [];
	var finalUserArray = [];
	var finalObject = {};

	var task1 = function(callback) 
	{
		var cmd1 = "cd " + DIR_PROJECT_ORIGIN;
		var cmd2 = "git log --pretty=format:\"%h##%cn##%s##%cd##%cr\"";
		var cmd = cmd1 + ";" + cmd2;

		var child = exec(cmd, function(error, stdout, stderr) 
		{
			if (error !== null)
			{
				//console.log("task1 cmd error");
				//console.log(error);
				finalObject.origin_no_commits_flag = 1;

				callback(null, finalArray);
			}
			else
			{
				//console.log("logTree cmd success------");
				//console.log(stdout);
				//console.log("stdout's type: " + typeof(stdout));	//string
				finalObject.origin_no_commits_flag = 0;
				var logArray = stdout.split('\n');	//log split				
				for(idx in logArray) 
				{
					var data = new Object();	// create object (==JSON object)
					var splitArray = logArray[idx].split('##');	//info split
					data.commit_hash = splitArray[0];
					data.committer_name = splitArray[1];
					data.commit_msg = splitArray[2];
					data.commit_date = splitArray[3];
					data.commit_date_rel = splitArray[4];
					finalArray.push(data);
				}
				
				//console.log("task1===========================================");
				//console.log("log(finalArray)의 개수: " + finalArray.length);
				//console.log("finalArray의 type: " + typeof(finalArray));	//object (array)

				callback(null, finalArray);
			}
		});
	};

	var task2 = function(_finalArray, callback) 
	{
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git log --pretty=format:\"%h##%cn##%s##%cd##%cr\"";
		var cmd = cmd1 + ";" + cmd2;

		var child = exec(cmd, function(error, stdout, stderr) 
		{
			if (error !== null)
			{
				//console.log("task1 cmd error");
				//console.log(error);
				finalObject.user_no_commits_flag = 1;

				callback(null, finalArray);
			}
			else
			{
				//console.log("logTree cmd success------");
				//console.log(stdout);
				//console.log("stdout's type: " + typeof(stdout));	//string
				finalObject.user_no_commits_flag = 0;
				var logArray = stdout.split('\n');	//log split				
				for(idx in logArray) 
				{
					var data = new Object();	// create object (==JSON object)
					var splitArray = logArray[idx].split('##');	//info split
					data.commit_hash = splitArray[0];
					data.committer_name = splitArray[1];
					data.commit_msg = splitArray[2];
					data.commit_date = splitArray[3];
					data.commit_date_rel = splitArray[4];
					finalUserArray.push(data);
				}
				
				//console.log("task1===========================================");
				//console.log("log(finalArray)의 개수: " + finalArray.length);
				//console.log("finalArray의 type: " + typeof(finalArray));	//object (array)

				callback(null, finalArray, finalUserArray);
			}
		});
	};


	var task3 = function(_finalArray, _finalUserArray, callback) 
	{
		var cmd1 = "cd " + DIR_PROJECT_USER;
		var cmd2 = "git log --pretty=format:\"%h##%cn##%s##%cd##%cr\"";
		var cmd = cmd1 + ";" + cmd2;

		var child = exec(cmd, function(error, stdout, stderr) 
		{
			if (error !== null)
			{
				//console.log("task2 cmd error");
				finalObject.user_no_commits_flag = 1;
				finalObject.my_name = user_name;
				callback(null, true);
			}
			else
			{
				finalObject.user_no_commits_flag = 0;
				finalObject.my_name = user_name;
				finalObject.origin_position = _finalArray[0].commit_hash;

				var logArray2 = stdout.split('\n');	//log split
				var splitArray2 = logArray2[0].split('##');	//info split
				
				finalObject.my_position = splitArray2[0];
				finalObject.originLogTreeArray = _finalArray;
				finalObject.userLogTreeArray = _finalUserArray;
		
				callback(null, true);
			}
		});
	};

	var callback = function(err, result)
	{
		if (result === true)
		{
			draw_handler(finalObject, res);	//draw_handler에 finalArray 전달
			//handler();
		}
	};

	async.waterfall([task1, task2, task3], callback);

};