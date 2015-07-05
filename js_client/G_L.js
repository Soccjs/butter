var parser = require('./parserXMLtoHTML.js');

// global variables
var isShownBtmMenu = false;			// boolean for bottom menu
var isPerInfoVisible = false;		// boolean for personal_info menu
var tree_root = "/home/soccjs/Documents/butter/";
var isShownimportMenu=false;
var _GLOBAL = {};

var user_id = "";
var currentProject = "";
var fileTreePath = "";

var tttt = 0;

var __filePath;
var pupup_time = 2000;
////////////////
// 포스트잇 붙이기
////////////////
var userIndexArray = [0,0,0,0];

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var add_flag = 0;

var editor;


$(document).ready(function() {

	_GLOBAL.id = getParameterByName('id');
	// Ace Editor Object
	var prv_contents;
	var file_cnt = 0;
	var socket = io();


	
//	loadjscssfile("parserXMLtoHTML.js", "js");
$(document).on({
	ajaxStart : function(){
		console.log("AJAX START");
		$("#spinner_container").animate({opacity: '1'}, "slow");
		$("#spinner_container").css("z-index", "9999999");
	},
	ajaxStop : function(){
		console.log("AJAX STOP");
		$("#spinner_container").animate({opacity: '0'}, "slow");
		$("#spinner_container").css("z-index", "-9999");
	}
});

_GLOBAL.file=getParameterByName('path');
$.post('openFile', {path : _GLOBAL.file}, function(data) {
					make_editor(data, _GLOBAL.file, 1, 0);	//파일트리에서 열면: read-only

				});



	//로그인 처음 되면 리빙룸에 있도록 in
	socket.emit("in",{id: _GLOBAL.id});
	


	function make_editor(data, file, flag, _working_flag){
		$("#right_editor").children().remove();
		$("#right_editor").append("<div id='right_editor_inner' style='top:0px;'></div>");
		editor = null;
		ace.require("ace/ext/language_tools");
		// create Ace Editor
		editor = ace.edit("right_editor_inner");
		// settings for Ace Editor
		editor.setOptions({
			enableBasicAutocompletion : true,
			enableSnippets : true,
			enableLiveAutocompletion : false
		});
		editor.setTheme('ace/theme/tomorrow_night_eighties');
		editor.setShowPrintMargin(false);
		editor.getSession().setMode("ace/mode/xml");
		document.getElementById("right_editor_inner").style.fontSize = "15px";

		//_working_flag설정
		if(_working_flag == 1) {
			editor.setReadOnly(true);
		} else {
			editor.setReadOnly(false);	
			add_flag = 0;


			$("#right_editor_inner").bind("keydown", function(e) {
				if(add_flag == 0)
				{
					add_flag = 1;
					alert("파일을 수정합니다.\n팀의 다른멤버는 파일에 접근할 수 없습니다.\n수정 후 반드시 저장해주세요.");
					socket.emit("insert", {project: _GLOBAL.project, id:_GLOBAL.id, file_name: file});
				}
			});


		}


		editor.commands.addCommand({
			name : 'save',
			bindKey : {
				win : 'Ctrl-S',
				mac : 'Command-S'
			},
			exec : function(editor) {
				var cur_contents = editor.getValue();
				if (prv_contents == cur_contents){
					$("#mini_popup_img").attr("src", "img/not_check.png");
					$("#mini_popup_text").text("Nothig Changed to Save");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
				}
				else {
					_GLOBAL.project=getParameterByName('proj');
					prv_contents = cur_contents;
					$.post('/file_save', {
						id : _GLOBAL.id,
						project : _GLOBAL.project,
						fileName : file,
						contents : editor.getValue()
					}, function(data,status) {
						$("#mini_popup_img").attr("src", "img/check.png");
						$("#mini_popup_text").text("Save Complete");
						$("#mini_popup").fadeIn("slow", function() {
							setTimeout(function() {
								$("#mini_popup").fadeOut("slow");
							}, pupup_time);
							$("#right_log_inner").append(data);
						}); 
					});
				}
			},
			readOnly : false
		});


		// Change Values when choosing other file
		prv_contents = data;
		editor.setValue(prv_contents, 1);

		if(flag){
			// Make right_topbar li
			if(file_cnt > 0){
				var pre_sel = $("#right_topbar_sortable").children(".file_selected");
				//alert($(pre_sel).children("a").text());
				$(pre_sel).removeClass("file_selected");
				$(pre_sel).addClass("file_notSelected");
			}

			var filePathArr = file.split('/');
			var isOpened = false;
			var li_index;

			$("#right_topbar_sortable > li").each(function(index){
				//console.log(filePathArr[filePathArr.length - 1] + "/" + $(this).text().slice(1, $(this).text().length));
				if(filePathArr[filePathArr.length - 1] == $(this).text().slice(1, $(this).text().length)){
					isOpened = true;
					li_index = index;
				}
			});

			if(!isOpened){
				$("#right_topbar_sortable").append('<li class="file_selected"><span></span>&nbsp;<a data-path="'+ file +'">'+ filePathArr[filePathArr.length - 1] +'</a></li>');
				file_cnt++;
			}else{
				$("#right_topbar_sortable > li:eq("+ li_index +")").removeClass("file_notSelected");
				$("#right_topbar_sortable > li:eq("+ li_index +")").addClass("file_selected");
			}
		}
		// ace 에디터에 자동완성을 위한 이벤트핸들러 등록 
		$(".ace_text-input").keydown(hdlr_showBox);

		console.log("hi");
		directParser();
				//$( ".TextView", $trash ).draggable();

				console.log("bye");
			}

	// Using jQuery File Tree - fileTree({root : root dir, script : serverside file}, callback func when chosing file})
	function make_fileTree(folder_path){

		$.post('openFile', {path : file}, function(data) {
			make_editor(data, file, 1, 1);
					//파일트리에서 열면: read-only
				});
		
	}

	// Draggable settings...
	$("#left_drag").css("left", "288px");

	// Sortable settings...
	$("#right_topbar_sortable").on("click", "span", function(){
		$(this).parent().remove();
		if(file_cnt > 0){
			file_cnt--;
			/*
			prv_contents = "";
			editor.setValue(prv_contents, 0);*/
			editor.container.remove();
		}
	});
	

	$("#right_topbar_sortable").on("click", "li", function(e){

		//var temp = $(e.target).children("a").text();
		//var fullPath = tree_root.concat(temp);
		var file_path = $(e.target).children("a").attr("data-path");

		//지금 선택된 파일이 수정해도 되는 건지 아닌지 확인하라고 시킨다.
		socket.emit("work_sync", {project: _GLOBAL.project, id:_GLOBAL.id, file: file_path});

		socket.on("work_sync_response", function(_work_flag) {

			console.log("_work_flag:::: " + _work_flag);
			console.log("work_sync_response", "arrived");

			$.post('openFile', {path : file_path}, function(data){
				if(data != "&*^nothing"){
					
					var pre_sel = $("#right_topbar_sortable").children(".file_selected");
					$(pre_sel).removeClass("file_selected");
					$(pre_sel).addClass("file_notSelected");

					$(e.target).removeClass("file_notSelected");
					$(e.target).addClass("file_selected");

					//alert("_work_flag:::: " + _work_flag);
					if(_work_flag == 1) {
						alert("다른 사용자가 수정중 입니다.");
					} else {
						alert("수정 가능한 파일입니다.");
					}
					make_editor(data, file_path, 0, _work_flag);    

				}
			});
			editor.$blockScrolling = Infinity;
			socket.removeListener("work_sync_response");

		});



	});


$("#right_topbar_sortable").sortable({
	axis : "x"
});
$("#right_topbar_sortable").disableSelection();
$("#li_dummy").remove();



$("#dialog_select_project_proj").scroll();

$("#dialog_select_project_proj").on("click", "a", function(){
	var proj_name = $(this).text();

	$("#dialog_selected_project").val(proj_name);

		// 서버에서 프로젝트 정보 받기
		$.get("/project_info?project=" + proj_name, function(data, status){

			// 과연 get 메세지는 객체를 수신할 수 있을 것인가?!
			var date_str = "";
			console.log(typeof data);
			if (typeof data === "object")
			{
				// 프로젝트 정보 붙여주기
				date_str = data.date.substr(0, 10	);
				$("#dialog_select_project_info_contents").html("<p>Project Name : " + data.name + "</p><p>Description : " + data.desc + "</p><p>Project Owner : " + data.owner + "</p><p>Date : " + date_str + "</p><p>Members : " + data.member + "</p>");
			}
			else
			{
				$("#dialog_select_project_info_contents").html("<p>project not exist</p>");
			}
		});
	});



socket.on("room_in_msg", function(data) {
	alert(data.project + " 에 " + data.id + " 님 참여!");	
});	

	// data : {project: _GLOBAL.project, id: _GLOBAL.id}
	// data.works = CurrentProjectsArray[i].workArray;
	socket.on("room_in_init_draw", function(data) {
		//alert("오나?!?!");
		//***************************alert(data.works);//****얘 여러번옴. 추후 수정 요. ()
		var position = 0;
		var tempArray = [];
		for(var p in data.works) {
			tempArray.push(data.works[p].name);
		} // 이름만 다 넣어줌

		//다른애만 그려주기 위한 절차
		var uniqueIds = [];
		$.each(tempArray, function(i, el) {
			if($.inArray(el, uniqueIds) === -1) {
				uniqueIds.push(el);
			}
		});
		
		for(var index in uniqueIds)
		{
			if(uniqueIds[index] != data.id)
			{
				for(var i in userIndexArray) {
					if(userIndexArray[i] == 0) {
						position = i;
						break;
					}
				}
				//그 빈자리에 그려준다.
				if(position == 0) {	
					$("#user_0").css("visibility", "visible");
					$("#user_0 > p").html(uniqueIds[index]);
					userIndexArray[position] = 1;
					//break;
				} else if(position == 1) {
					$("#user_1").css("visibility", "visible");
					$("#user_1 > p").html(uniqueIds[index]);
					userIndexArray[position] = 1;
					//break;
				} else if(position == 2) {
					$("#user_2").css("visibility", "visible");
					$("#user_2 > p").html(uniqueIds[index]);
					userIndexArray[position] = 1;
					//break;
				} else if(position == 3) {
					$("#user_3").css("visibility", "visible");
					$("#user_3 > p").html(uniqueIds[index]);
					userIndexArray[position] = 1;
					//break;
				}
				//******************************************
				// 	}				
				// });

}

}

});


	// Context Menu

	// Put Dir,File path for make/delete Dir,File
	$("#left_tree").on("mouseenter", "a", function(e){				//right curser => mouse enter
		$("#left_tree_hoverdItem").val($(e.target).attr('rel'));
	});


	$("#personal_info > img").click(function() {
		if (isPerInfoVisible) {
			isPerInfoVisible = false;
			$("#personal_info_menu").css("visibility", "hidden");
		} else {
			isPerInfoVisible = true;
			$("#personal_info_menu").css("visibility", "visible");
		}
	});

	$("#personal_info_menu > div").click(function(){
		var menu = $(this).text();
		if(menu == "User Info"){
			alert("Under Construnction.....");
		}else if(menu == "Invite User to Project"){
			$("#dialog_invite").dialog({
				dialogClass : "bottom_dialog",
				modal : true,
				resizable : false,
				width : 360,
				height : 460,
				show : {
					effect : "fade",
					duration : 500
				},
				hide : {
					effect : "fade",
					duration : 500
				},
				beforeClose : function() {
				}
			});

			$("#form_id").val(_GLOBAL.id);
			$("#form_inv_project").val(_GLOBAL.project);
			

		}else if(menu == "Invitation List"){
			$("#dialog_invitelist").dialog({
				dialogClass : "bottom_dialog",
				modal : true,
				resizable : false,
				width : 360,
				height : 460,
				show : {
					effect : "fade",
					duration : 500
				},
				hide : {
					effect : "fade",
					duration : 500
				},
				beforeClose : function() {
				}
			});

			socket.emit("invitelist_request", _GLOBAL.id);	
			
		}else if(menu == "Logout"){
			var res = confirm("Logout?");
			if(res){
				$.get('/logout', function(data, stat){
					if(data == "logout") {
						socket.emit("logout_delete", _GLOBAL.id);
						window.location = "/";
					}
				});
			}
		}
		isPerInfoVisible = false;
		$("#personal_info_menu").css("visibility", "hidden");
	});




	// git Tree client script...2015.2.24 cwlsn88
	

	$("#git_tree_container").on("mouseenter", "div", function(e) {
		var this_node = $(e.target);
		var pos = this_node.position();
		$("#git_tree_window_hash").text("commit_hash : " + this_node.data("hash"));
		$("#git_tree_window_name").text("commit_name : " + this_node.data("name"));
		$("#git_tree_window_date").text("commit_date : " + this_node.data("date"));
		$("#git_tree_window_msg").text("commit_msg : " + this_node.data("msg"));
		$("#git_tree_window").css("top", pos.top + 570).css("left", pos.left + 170).css("visibility", "visible");
	});

	$("#git_tree_container").on("mouseleave", "div", function(e) {
		$("#git_tree_window").css("visibility", "hidden");
	}); 	
	
	



	////////////////////////////////////////////////////////
	//	SOCKET.IO
	////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////socket = io();
console.log("connect to socket.io");

	////////////////////////////////////
	// SEND
	////////////////////////////////////	

	$(".git_button").click(function() {
		$(".git_commit").toggleClass("git_btn_container_open_commit", 1000, 'easeInOutBack');
		$(".git_push").toggleClass("git_btn_container_open_push", 1100, 'easeInOutBack');
		$(".git_pull").toggleClass("git_btn_container_open_pull", 1200, 'easeInOutBack');
	});

	$(".git_smallBtn").click(function() {
		var git_case = $(this).attr('title');
		if(git_case == "commit"){
			var inputString = prompt("커밋메세지를 입력하세요.","commit message");
			socket.emit("commit", {id: _GLOBAL.id, project: _GLOBAL.project, m: inputString});
			$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
				tttt++;
				console.log("/makeGitTree complete ------- " +tttt);
				$("#git_tree_container").empty();
				$("#git_tree_container").append(data);
			});
		}else if(git_case == "push"){
			socket.emit("push", {id: _GLOBAL.id, project: _GLOBAL.project});
		}else if(git_case == "pull"){
			socket.emit("pull", {id: _GLOBAL.id, project: _GLOBAL.project});
		}
	}); 


			//*************************//
		    // room test
		    //*************************//
		    //SEND
		    $("#btm_menu_subtract").click(function(){
		    	socket.emit("push_msg", {id: _GLOBAL.id, project: _GLOBAL.project});
		    });
			//RECEIVE
			socket.on("get_msg", function(data) {
				alert(data.project + "에 변경사항!" + "\n" + data.id + "님이 push하셨습니다.");
				$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
					console.log("/makeGitTree complete");
					$("#git_tree_container").empty();
					$("#git_tree_container").append(data);
				});
			}); 


	////////////////////////////////////
	// RECEIVE
	////////////////////////////////////
	
	
	
	socket.on("pull_response", function(data) {

		console.log(data);
		if (data === null)
		{
			$("#mini_popup_img").attr("src", "img/not_check.png");
			$("#mini_popup_text").text("Please Load the Project First");
			$("#mini_popup").fadeIn("slow", function() {
				setTimeout(function() {
					$("#mini_popup").fadeOut("slow");
				}, pupup_time);
			});
				//$("#git_pull").html("pull");
				return;
			}

			if (data.result === "successful")
			{
				console.log("pull successful.", data.reason);
				if (data.reason.search("Already up-to-date") != -1)
				{
					$("#mini_popup_img").attr("src", "img/not_check.png");
					$("#mini_popup_text").text("Already Up-to-Date");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
				}
				else
				{
					$("#mini_popup_img").attr("src", "img/check.png");
					$("#mini_popup_text").text("Pull Project Success");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
					//gitTree draw
					$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
						console.log("/makeGitTree complete");
						$("#git_tree_container").empty();
						$("#git_tree_container").append(data);
					});
				}
			}
			else
				console.log("pull fail.", data.reason);
		});

socket.on("commit_response", function(data) {

	console.log(data);
	if (data === null)
	{
		$("#mini_popup_img").attr("src", "img/not_check.png");
		$("#mini_popup_text").text("Please Load the Project First");
		$("#mini_popup").fadeIn("slow", function() {
			setTimeout(function() {
				$("#mini_popup").fadeOut("slow");
			}, pupup_time);
		});
		return;
	}

	if (data.result === "successful")
	{
		console.log("commit successful.", data.reason);
		$("#mini_popup_img").attr("src", "img/check.png");
		$("#mini_popup_text").text("Commit Project Success");
		$("#mini_popup").fadeIn("slow", function() {
			setTimeout(function() {
				$("#mini_popup").fadeOut("slow");
			}, pupup_time);
		});
				//gitTree draw
				$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
					console.log("/makeGitTree complete");
					$("#git_tree_container").empty();
					$("#git_tree_container").append(data);
				});
			}
			else
			{
				console.log("commit fail.", data.reason);
				if (data.reason.search("nothing to commit") != -1)
				{
					$("#mini_popup_img").attr("src", "img/not_check.png");
					$("#mini_popup_text").text("Nothing to Commit");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
				}
			}

		});

socket.on("push_response", function(data) {

	console.log(data);
	if (data === null)
	{
		$("#mini_popup_img").attr("src", "img/not_check.png");
		$("#mini_popup_text").text("Please Load the Project First");
		$("#mini_popup").fadeIn("slow", function() {
			setTimeout(function() {
				$("#mini_popup").fadeOut("slow");
			}, pupup_time);
		});
		return;
	}

	if (data.result === "successful")
	{
		console.log("push successful.", data.reason);
		$("#mini_popup_img").attr("src", "img/check.png");
		$("#mini_popup_text").text("Push Project Success");
		$("#mini_popup").fadeIn("slow", function() {
			setTimeout(function() {
				$("#mini_popup").fadeOut("slow");
			}, pupup_time);
		});

		alert(data.project + "에 변경사항!" + "\n" + data.id + "님이 push하셨습니다.");

		socket.emit("pushids",{project: data.project, id: data.id});

				//gitTree draw
				$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
					console.log("/makeGitTree complete");
					$("#git_tree_container").empty();
					$("#git_tree_container").append(data);
				});
			}
			else
				console.log("push fail.", data.reason);

			//$("#git_push").html("push");

		});

	///////////////////////////////////
	//	INVITE LIST RESPONSE
	///////////////////////////////////
	socket.on("invitelist_response", function(arr) {
		
		console.log("[invitelist_response] : ", arr);
		
		if (arr.length == null)
		{
			console.log("-> there's any invitation.");				
		}
		else
		{
			for (var i=0; i<arr.length; i++)
			{
				var content = "Project : " + arr[i].name + "<br/>" + "Description : " + arr[i].desc + "<br/>" + "invitation from " + arr[i].user;
				var item = $("<li>").html(content).addClass("invitem");
				
				$("#invitation_list").append(item);
				
				$(".invitem").click(function(){
					console.log("invitem click");				
					$(".invitem").removeClass("selected");
					$(this).addClass("selected");
				});	

			}
		}
	});

	
    ////////////////////////////////////////////
    //  AUTO COMPLETE
    ////////////////////////////////////////////
    console.log($(".ace_text-input"))
    
    // make_editor 마지막에 $(".ace_text-input").keydown(hdlr_showBox) 등록
    
    var li, liSelected;
    function hdlr_showBox(e)
    {
    	if (e.ctrlKey)
    	{
    		if (e.which == 13)
    		{
    			ac.cursor = editor.selection.getCursor()

		        // 서버에 메소드 리스트 요청하기

		        var code = editor.getValue().trim();
		        var current_line = editor.session.getLine(editor.selection.getCursor().row).substr(0, editor.selection.getCursor().column).trim();

		        console.log("[current line] :", current_line);

				// 클래스인지 메소드인지 판단하기
				var arr = [];
				arr.push(current_line.lastIndexOf(';'));
				arr.push(current_line.lastIndexOf('{'));
				arr.push(current_line.lastIndexOf('}'));
				arr.push(current_line.lastIndexOf('('));
					arr.push(current_line.lastIndexOf('\n'));
					arr.push(current_line.lastIndexOf(' '));

					console.log("[array] : ", arr);
					
					var target = current_line.substr(Math.max.apply(null, arr) + 1);

					console.log("[target] : ", target);

				////////////////////////////////////
				//	자동완성 알고리즘
				////////////////////////////////////
				
				var target_split_dot_arr = target.split('.');
				console.log(target_split_dot_arr);
				
				switch( target_split_dot_arr.length )
				{
					
					// target이 '.' 포함하지 않으면 클래스
					case 1:
						// 대문자로 시작 - lists.js 조회
						if (target[0] <= 'Z' && target[0] >= 'A')
						{
							ac.list = [];
							ac.nameStarts = target;
							
							for (var i=0; i<ac.DATA.length; i++)
							{
								var arr = ac.DATA[i].label.split('.');
								var className = arr[arr.length - 1];

								if (className.search(target) == 0)
									ac.list.push( { name: className, arr: ["", ""] } );
							}
						}
						// 소문자로 시작 - 문서 내 조회
						else if (target[0] <= 'z' && target[0] >= 'a')
						{
							ac.list = [];
							
						}
						else
						{
							console.log("exception! 클래스인 것 같은데 대문자도 아니고 소문자도 아님")						
						}
						
						// 창 띄워주기
						$("#methods_list").empty();
						for (var i=0; i<ac.list.length; i++)
						{
							$("#methods_list").append($("<li>").val(i).html(ac.list[i].arr[0] + ' ' + ac.list[i].name + ' ' + ac.list[i].arr[1]));
						}	
						$('#autocomplete_listbox').css("display", "block");
						
						break;

					// target이 '.' 포함하면 메소드 ; api 사용				
					case 2:
					ac.requestMethods(ac.getClass(code, current_line));
					break;
					
				}
				
			}
		}
		else if ($('#autocomplete_listbox').css('display') != "none")
		{
			li = $('#autocomplete_listbox li');

			console.log(li);

			switch(e.which)
			{
				case 40:
				if(liSelected)
				{
					liSelected.removeClass('selected');
					next = liSelected.next();
					if(next.length > 0)
						liSelected = next.addClass('selected');
					else
						liSelected = li.eq(0).addClass('selected');
				}
				else
				{
					liSelected = li.eq(0).addClass('selected');
				}
				break;

				case 38:
				if(liSelected)
				{
					liSelected.removeClass('selected');
					next = liSelected.prev();
					if (next.length > 0)
						liSelected = next.addClass('selected');
					else
						liSelected = li.last().addClass('selected');
				}
				else
				{
					liSelected = li.last().addClass('selected');
				}
				break;

				case 13:
				if(liSelected)
				{
					$('#autocomplete_listbox').css("display", "none");
					console.log("selected NO: ", liSelected.val())

					var targetMethod = ac.list[liSelected.val()];

					if (ac.nameStarts != null)
						targetMethod.name = targetMethod.name.split(ac.nameStarts)[1];
					editor.moveCursorTo(ac.cursor.row, ac.cursor.column);
					editor.insert(targetMethod.name + targetMethod.arr[1]); 
					console.log("hideBox", "display:none");
				}
				break;
			} 
		}
	}

	///////////////////
	// AUTO COMPLETE
	///////////////////

	socket.on("autocomplete_response", function(list) {

		ac.list = [];
		$("#methods_list").empty();

		if (ac.nameStarts == null)
		{
			console.log("ac.nameStarts null,")
			ac.list = list;
		}
		else
		{
			console.log("ac.nameStarts NOT null,")

			for (var i=0; i<list.length; i++)
			{
				if (list[i].name.search(ac.nameStarts) == 0)
				{
					console.log(list[i].name);
					ac.list.push(list[i]);
				}
			}
		}

		for (var i=0; i<ac.list.length; i++)
		{
			$("#methods_list").append($("<li>").val(i).html(ac.list[i].arr[0] + ' ' + ac.list[i].name + ' ' + ac.list[i].arr[1]));
		}

		$('#autocomplete_listbox').css("display", "block");

	});


///////////////변수 선언///declare//////////////////////graphical layout/////////////////
	var t_v_cnt=0;//textview count

	var btn_cnt=0;//button count
	var e_t_cnt=0;//EditText count
	var c_b_cnt=0;//Checkbox count
	var r_b_cnt=0;//radiobutton count
	var r_l_cnt=0;//relativelayout count
	var l_l_cnt=0;//LenearLayout count
	var f_l_cnt=0;//FrameLayout count
	var w_v_cnt=0;//Webview count
	var s_v_cnt=0;//Scrollview count

	var $widget = $("#widget" );
	var $layout = $("#layout");
	var $view = $("#view");
	var $trash = $("#trash");
	var $input = $("#input");

	var clickFlag = true;
	var $tmp,$before,$after;
	var beforeClass, afterClass;
//////////////메뉴에서 선택////select component in menu///////////////////////////////////
$( "li", $widget ).click(function( event){
	var $li_target = $(event.target);
	var selected_item = $li_target.text();
	console.log("[select] " + selected_item  + " click");

	$("#item_box").children().remove();

	goto_item_box(selected_item);
});

$( "li", $layout ).click(function(event){
	var $li_target = $(event.target);
	var selected_item = $li_target.text();
	console.log("[select] " + selected_item  + " click");

	$("#item_box").children().remove();

	goto_item_box(selected_item);
});	

$( "li", $view ).click(function(event){
	var $li_target = $(event.target);
	var selected_item = $li_target.text();
	console.log("[select] " + selected_item  + " click");

	$("#item_box").children().remove();

	goto_item_box(selected_item);
});	
////item_box 로 이동 ////when selecting a component in menu, go to the item_box////////////
function goto_item_box(selected){
	console.log("[goto_item_box] : " + selected);
	switch(selected) {
		case "TextView" :
		$("<div id=\"textview"+(t_v_cnt++)+"\" class=\"TextView\"><span>TextView</span></div>").appendTo("#item_box");
		break;
		case "Button" :
		$("<div id=\"button"+(btn_cnt++)+"\" class=\"Button\"><span>Button</span></div>").appendTo("#item_box");
		break;
		case "EditText" :
		$("<div class=\"inputType\" ><input type=\"text\" class=\"EditText\" id=\"edittext"+(e_t_cnt++)+"\" value=\"EditText\" style=\"color:black;\" /></input></div>").appendTo("#item_box");
		break;
		case "CheckBox" :
		$("<div class=\"inputType\" ><input type=\"checkbox\" class=\"CheckBox\"id=\"checkbox"+(c_b_cnt++)+"\"  value=\"CheckBox\" >CheckBox</input></div>").appendTo("#item_box");
		break;
		case "RadioButton" :
		$("<div class=\"inputType\" ><input type=\"radio\" class=\"RadioButton\" id=\"radiobutton"+(r_b_cnt++)+"\"  value=\"RadioButton\" >RadioButton</input></div>").appendTo("#item_box");
		break;
		case "LinearLayout" :
		$("<div class=\"LinearLayout\" id=\"linearlayout"+(l_l_cnt++)+"\" ><ul class=\"layout_vertical\"></ul></div>").appendTo("#item_box");
		break;
		case "RelativeLayout" :
		$("<div class=\"RelativeLayout\" id=\"relativelayout"+(r_l_cnt++)+"\"><ul class=\"layout_relative\"></ul></div>").appendTo("#item_box");
		break;
		case "FrameLayout" :
		$("<div class=\"FrameLayout\" id=\"framelayout"+(f_l_cnt++)+"\" ><ul class=\"layout_frame\"></ul></div>").appendTo("#item_box");
		break;				
		case "WebView" :
		$("<iframe src=\"http://goto.kakao.com/@%ED%95%9C%ED%99%94%EC%9D%B4%EA%B8%80%EC%8A%A4\" id=\"wbview"+(w_v_cnt++)+"\" class=\"WebView\" style=\"width:360px;height:360px;\" frameborder=\"3\"></iframe>").appendTo("#item_box");
		break;
		case "ScrollView" :
		$("<div class=\"ScrollView\" id=\"scrollview"+(s_v_cnt++)+"\" style=\"\" >").appendTo("#item_box");
		break;
		
		default:
		break;
	}
	/////////left ,top0 ////////////// ////////////////////////////////

	/////////클래스 부여 //////////////allow class /////////////////////////////////
	console.log("[resizable]");

	switch(selected){
		case "TextView" : case "Button": case"CheckBox": case"RadioButton":
		$("#item_box").children().resizable({
			maxHeight: 360,
			maxWidth: 360,
			minHeight: 30,
			minWidth: 50,
			containment:"#item_box" , autoHide:true, handles:"e,s"
		});
		break;
		case "EditText" :
		$("#item_box").find(".EditText").parent().resizable({
			maxHeight: 360,
			maxWidth: 360,
			minHeight: 30,
			minWidth: 100,
			containment:"#item_box" , autoHide:true, handles:"n,e,s,w",

			stop: function( event , ui ){
				ui.element.children().css("width",ui.element.css("width"));
				ui.element.children().css("height",ui.element.css("height"));
					//line-height
				}
			});break;
 		case "LinearLayout": 
	 		$("#item_box").children().resizable({
				maxHeight: 360,
				maxWidth: 360,
				minHeight: 30,
				minWidth: 50,
				containment:"#parent" , autoHide:true, handles:"e,s"
			})
			.children().sortable({revert:false,axis:"y",connectWith:".layout_vertical,.layout_horizontal,.layout_relative,.layout_frame"
			,receive: function(event, ui){
				console.log("receive "+ ui.item.attr("id"));
				var axis = $( event.target ).sortable( "option", "axis" );
				console.log(axis);
				if(axis==='y'){
					$(ui.item).css("display","block");
				}
				else{
					$(ui.item).css("display","inline-block");
				}
			}	
			}).disableSelection();
	 			break;
 		case "RelativeLayout": 
 			$("#item_box").children()
 			.resizable({
				maxHeight: 360,
				maxWidth: 360,
				minHeight: 30,
				minWidth: 50,
				containment:"#parent" , autoHide:true, handles:"n,e,s,w"
			})
			.draggable({
				connectToSortable:".layout_vertical,.layout_horizontal,.layout_relative,#trash",
				scroll:false,
				start: function(event, ui){
				}
			});
	 			break;

 		case "FrameLayout":	
 			$("#item_box").children().resizable({
				maxHeight: 360,
				maxWidth: 360,
				minHeight: 30,
				minWidth: 50,
				containment:"#item_box" , autoHide:true, handles:"n,e,s,w"
			}).sortable({revert:false,axis:"y",connectWith:".layout_vertical,.layout_horizontal,.layout_relative,.layout_frame"}).disableSelection();
	 			break;

	 	case "WebView":
		 	$("#item_box").children().resizable({
				maxHeight: 480,
				maxWidth: 360,
				minHeight: 100,
				minWidth: 100,
				containment:"#item_box" , autoHide:true, handles:"e,s"
			});break;
		case "ScrollView":
		 	$("#item_box").children().resizable({
				maxHeight: 640,
				maxWidth: 360,
				minHeight: 100,
				minWidth: 100,
				containment:"#item_box" , autoHide:true, handles:"e,s"
			});break; 	

 		default:break;
	}
	checkInput($("#item_box").children());
}
/////rgb to hex ////////////////////////////////////////////////////////////////////////////////////////
function rgb2hex(rgb){
console.log("rgb :: " + rgb);
 rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
 console.log("rgb :: " + rgb);

 return "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2);
}

///////////컴퍼넌트 속성 읽어오기 //////read attributes into #input/////////////////////////////////////////////////
function checkInput($obj){
	console.log("[checkInput]");
	var _class = $obj.attr("class");
	var ul_class;

	if(_class.search("TextView")!==-1 || _class.search("Button") !==-1 ){
		ul_class = $obj.parent().attr("class");

	 	if(ul_class.search("vertical")!==-1||ul_class.search("horizontal")!==-1){//margin-left
	 	 	$input.find("input[name=" + "layout_margin" + "]").val($obj.css("margin"));

	 	 	$input.find("input[name=" + "margin_left" + "]").val($obj.css("margin-left"));
			$input.find("input[name=" + "margin_right" + "]").val($obj.css("margin-right"));
			$input.find("input[name=" + "margin_top" + "]").val($obj.css("margin-top"));
			$input.find("input[name=" + "margin_bottom" + "]").val($obj.css("margin-bottom"));
		}
	 	else{																//relativelayout //left
	 	 	$input.find("input[name=" + "margin_left" + "]").val($obj.css("left"));
			$input.find("input[name=" + "margin_right" + "]").val($obj.css("right"));
			$input.find("input[name=" + "margin_top" + "]").val($obj.css("top"));
			$input.find("input[name=" + "margin_bottom" + "]").val($obj.css("bottom"));
		}


		$input.find("input[name=" + "obj_id" + "]").val( $obj.attr("id"));
		$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
		$input.find("input[name=" + "height" + "]").val(  $obj.css("height"));
		$input.find("input[name=" + "background" + "]").val(rgb2hex($obj.css("background-color")));
		$input.find("input[name=" + "text_align" + "]").val($obj.css("text-align"));
		$input.find("input[name=" + "color" + "]").val(rgb2hex($obj.css("color")));
		$input.find("input[name=" + "font_size" + "]").val($obj.css("font-size"));
		$input.find("input[name=" + "text" + "]").val($obj.children().text());


		//$input.find("input[name=" + "layout_margin" + "]").val($obj.css("margin"));

		// $input.find("input[name=" + "margin_left" + "]").val($obj.css("margin-left"));
		// $input.find("input[name=" + "margin_right" + "]").val($obj.css("margin-right"));
		// $input.find("input[name=" + "margin_top" + "]").val($obj.css("margin-top"));
		// $input.find("input[name=" + "margin_bottom" + "]").val($obj.css("margin-bottom"));

	}
	else if(_class.search("inputType")!==-1){
		$obj=$obj.children();
		_class=$obj.attr("class");
		if(_class.search("EditText")!==-1){
			$input.find("input[name=" + "obj_id" + "]").val( $obj.attr("id"));
			$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
			$input.find("input[name=" + "height" + "]").val(  $obj.css("height"));
			$input.find("input[name=" + "background" + "]").val(rgb2hex($obj.css("background-color")));
			$input.find("input[name=" + "text_align" + "]").val($obj.css("text-align"));
			$input.find("input[name=" + "color" + "]").val(rgb2hex($obj.css("color")));
			$input.find("input[name=" + "font_size" + "]").val($obj.css("font-size"));
			$input.find("input[name=" + "text" + "]").val($obj.attr("value"));
		}
		else{
			$obj=$obj.parent();
			$input.find("input[name=" + "obj_id" + "]").val( $obj.children().attr("id"));
			$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
			$input.find("input[name=" + "height" + "]").val(  $obj.css("height"));
			$input.find("input[name=" + "background" + "]").val(rgb2hex($obj.css("background-color")));
			$input.find("input[name=" + "text_align" + "]").val($obj.css("text-align"));
			$input.find("input[name=" + "color" + "]").val(rgb2hex($obj.css("color")));
			$input.find("input[name=" + "font_size" + "]").val($obj.css("font-size"));
			$input.find("input[name=" + "text" + "]").val($obj.text());
		}
	}
	else if(_class.search("Layout")!==-1){
		$input.find("input[name=" + "obj_id" + "]").val( $obj.attr("id"));
		$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
		$input.find("input[name=" + "height" + "]").val(  $obj.css("height"));
		$input.find("input[name=" + "background" + "]").val(rgb2hex($obj.css("background-color")));
		$input.find("input[name=" + "text_align" + "]").val($obj.css("text-align"));
		$input.find("input[name=" + "color" + "]").val(rgb2hex($obj.css("color")));
		$input.find("input[name=" + "font_size" + "]").val($obj.css("font-size"));
		console.log($obj.children(":first").css("float"));
		if($obj.children(":first").css("float")==="left"){
			$input.find("input[name=" + "float" + "]").val("horizontal");
		}
		else{
			$input.find("input[name=" + "float" + "]").val("vertical");
		}
		$input.find("input[name=" + "text" + "]").val("");
	}
	else if(_class.search("WebView")!==-1){
		$input.find("input[name=" + "obj_id" + "]").val( $obj.attr("id"));
		$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
		$input.find("input[name=" + "height" + "]").val( $obj.css("height"));
		$input.find("input[name=" + "background" + "]").val("");
		$input.find("input[name=" + "text_align" + "]").val("");
		$input.find("input[name=" + "color" + "]").val("");
		$input.find("input[name=" + "font_size" + "]").val("");
		$input.find("input[name=" + "text" + "]").val("");
	}
	else if(_class.search("ScrollView")!==-1){
		$input.find("input[name=" + "obj_id" + "]").val( $obj.attr("id"));
		$input.find("input[name=" + "width" + "]").val( $obj.css("width"));
		$input.find("input[name=" + "height" + "]").val( $obj.css("height"));
		$input.find("input[name=" + "background" + "]").val(rgb2hex($obj.css("background-color")));
		$input.find("input[name=" + "text_align" + "]").val("");
		$input.find("input[name=" + "color" + "]").val("");
		$input.find("input[name=" + "font_size" + "]").val("");
		$input.find("input[name=" + "text" + "]").val("");
		
	}
}

///////////기본 특성 /////Basic func/////////////////////////////////////////////////////////////////////
$( "#trash").sortable({
		connectWith: ".layout_vertical,.layout_horizontal,.layout_relative,.FrameLayout"
		,scroll:false
		,receive:function(event, ui){
		//	directParser1();
		}
}).disableSelection();

$("#item_box").sortable({
	connectWith: "#trash,.layout_vertical,.layout_horizontal,.layout_relative,.FrameLayout",scroll:false,
	revert: true
}).disableSelection();

$("#input").draggable();
//////////////make layout class////////////////////////////////////////////////////////////////////////////
	$(".layout_vertical").sortable({
		revert:false,axis:"y",connectWith:".layout_vertical,.layout_horizontal,.layout_relative,.layout_frame"
			,receive: function(event, ui){
				console.log("receive "+ ui.item.attr("id"));
				var axis = $( event.target ).sortable( "option", "axis" );
				console.log(axis);
			}	
	}).disableSelection();
	$(".layout_horizontal").sortable({
		revert:false,axis:"y",connectWith:".layout_vertical,.layout_horizontal,.layout_relative,.layout_frame"
		,receive: function(event, ui){
		console.log("receive "+ ui.item.attr("id"));
		var axis = $( event.target ).sortable( "option", "axis" );
		console.log(axis);
		}	
	}).disableSelection();

///////////////input delete, complete///////////////////////////////////////////////////////////////////////////////
     $("#delete").click(function() { //object delete
     	var id = $("#input").find("input[name="+"obj_id"+"]").val();
		if( $('#' + id).attr("class").search("RadioButton") !== -1 || $('#' + id).attr("class").search("CheckBox") !== -1 ){
			
			$('#' + id).parent().remove();

		}else{

			$('#' + id).remove();
		}
     	
     });	

     $("#complete").click(function() {
     	console.log("[complete click]");
     	var id = $("#input").find("input[name="+"obj_id"+"]").val();
     	var _class = $('#' + id).attr("class");
     	var ul_class;

     	var background = $("#input").find("input[name=" + "background" + "]").val();
     	var width = $("#input").find("input[name="+"width"+"]").val();
     	var height = $("#input").find("input[name="+"height"+"]").val();
     	var text = $("#input").find("input[name="+"text"+"]").val();
     	var gravity = $("#input").find("input[name="+"text_align"+"]").val();
     	var textColor = $("#input").find("input[name="+"color"+"]").val();
     	var textSize = $("#input").find("input[name="+"font_size"+"]").val();
     	var Float = $("#input").find("input[name="+"float"+"]").val();

     	var Layout_margin = $("#input").find("input[name="+"layout_margin"+"]").val();
		var Layout_marginLeft = $("#input").find("input[name="+"margin_left"+"]").val();
     	var Layout_marginRight = $("#input").find("input[name="+"margin_right"+"]").val();
     	var Layout_marginTop = $("#input").find("input[name="+"margin_top"+"]").val();
     	var Layout_marginBottom = $("#input").find("input[name="+"margin_bottom"+"]").val();
     	

		if(_class.search("TextView")!==-1 || _class.search("Button") !==-1 ){
		 	
		 	ul_class = $('#' + id).parent().attr("class");
		 	if(ul_class.search("vertical")!==-1||ul_class.search("horizontal")!==-1){//margin-left
		 	 	if(Layout_margin!=="0px"){
		 			$('#' + id).css("margin",Layout_margin);
		 		}
		 		else{
				 	$('#' + id).css("margin-left",Layout_marginLeft);
				 	$('#' + id).css("margin-right",Layout_marginRight);
				 	$('#' + id).css("margin-top",Layout_marginTop);
				 	$('#' + id).css("margin-bottom",Layout_marginBottom);
		 		}
		 	}
		 	else{																//relativelayout //left
			 	$('#' + id).css("left",Layout_marginLeft);
			 	$('#' + id).css("right",Layout_marginRight);
			 	$('#' + id).css("top",Layout_marginTop);
			 	$('#' + id).css("bottom",Layout_marginBottom);
		 	}

		 	$('#' + id).css("background",background);
		 	$('#' + id).css("width",width);
		 	$('#' + id).css("height",height);
		 	$('#' + id).css("line-height",height);
		 	$('#' + id).css("text-align",gravity);
		 	$('#' + id).css("color",textColor);
		 	$('#' + id).css("font-size",textSize);
		 	
		
		 	$('#' + id).children().text(text);
		 	
		 	

		 }
		 else if(_class.search("EditText")!==-1){
				$('#' + id).css("background",background);
		     	$('#' + id).css("width",width);
		     	$('#' + id).css("height",height);
		     	$('#' + id).css("line-height",height);
		     	$('#' + id).css("text-align",gravity);
		     	$('#' + id).css("color",textColor);
		     	$('#' + id).css("font-size",textSize);
			    $('#' + id).attr("value",text);
		}
		else if(_class.search("CheckBox")!==-1||_class.search("RadioButton")!==-1){//radio,check
				console.log("this is check")
				console.log($('#'+id));
				$('#' + id).parent().css("background",background);
		     	$('#' + id).parent().css("width",width);
		     	$('#' + id).parent().css("height",height);
		     	$('#' + id).parent().css("line-height",height);
		     	$('#' + id).parent().css("text-align",gravity);
		     	$('#' + id).parent().css("color",textColor);
		     	$('#' + id).parent().css("font-size",textSize);
				//$input.find("input[name=" + "text" + "]").val($obj.text());
			
		}
		else if(_class.search("Layout")!==-1||_class.search("layout")!==-1){
			if(_class.search("layout")!==-1){


			$('#' + id).children().css("background",background);
	     	$('#' + id).css("width",width);
	     	$('#' + id).css("height",height);
	     	//$('#' + id).css("line-height",height);
	     	$('#' + id).css("text-align",gravity);
	     	$('#' + id).css("color",textColor);
	     	$('#' + id).css("font-size",textSize);
	     	if(_class.search("LinearLayout")!==-1){
	     		console.log("float= " + Float);
	     		if(Float==="vertical"){
	     			$('#' + id).children(":first").removeClass("layout_horizontal").addClass("layout_vertical")
	     			.sortable( "option", "axis", "y" );
	     		}
	     		else{
	     			$('#' + id).children(":first").removeClass("layout_vertical").addClass("layout_horizontal")
	     			.sortable( "option", "axis", "x" );
	     		}
	     	}
		}
		else if(_class.search("WebView")!==-1){
			$('#' + id).css("width",width);
	     	$('#' + id).css("height",height);
		}
		else if(_class.search("ScrollView")!==-1){
	     	$('#' + id).css("width",width);
	     	$('#' + id).css("height",height);
			$('#' + id).css("background",background);
		}
	}	
});	

/////////////input on click//////////////////////////////////////////////////////////////
$("#item_box").on('click', function(){
	var $obj = $( event.target );
	//console.log(event.target);
	var _class = $obj.attr("class");
	//console.log("class= " + _class);

	console.log(event.type+ " " + $obj.attr('id') +"  " + $obj.attr('class'));

	if(typeof _class ==="undefined"){//TextView, Button
		console.log("1");
		$obj = $obj.parent();
		checkInput($obj);
	}
	else if(_class.search("EditText") !==-1){
		console.log("5");
		$obj = $obj.parent();
		checkInput($obj);		}
	else if(_class.search("inputType") !==-1){
		console.log("3");
		checkInput($obj);
	}
	else if(_class.search("RadioButton") !==-1||_class.search("CheckBox")!==-1){
		console.log("2");
		$obj = $obj.parent();
		checkInput($obj);		}
	else if(_class.search("Layout")!==-1){
		console.log("4");
		checkInput($obj);
	}
	else if(_class.search("header")!==-1){
		console.log("5");
	}
	else if(_class.search("WebView")!==-1){
		console.log("6");
		checkInput($obj);
	}
	else{
		console.log("7");
		$obj = $obj.parent();
		checkInput($obj);		
	}
});
/////////////trash on click///////////////////////////////////////////////////////////////

$(trash).on('click mousedown mouseup', function(){
	//var $target = $( this ),
	var $obj = $( event.target );
	//console.log(event.target);
	var _class = $obj.attr("class");
	//console.log("class= " + _class);

	if(event.type==="click"){

		console.log(event.type+ " " + $obj.attr('id') +"  " + $obj.attr('class'));

		if(typeof _class ==="undefined"){//TextView, Button
			console.log("1");
			$obj = $obj.parent();
			checkInput($obj);
		}
		else if(_class.search("EditText") !==-1){
			console.log("5");
			$obj = $obj.parent();
			checkInput($obj);		}
		else if(_class.search("inputType") !==-1){
			console.log("3");
			checkInput($obj);
		}
		else if(_class.search("RadioButton") !==-1||_class.search("CheckBox")!==-1){
			console.log("2");
			$obj = $obj.parent();
			checkInput($obj);		}
		else if(_class.search("Layout")!==-1){
			console.log("4");
			checkInput($obj);
		}
		else if(_class.search("header")!==-1){
			console.log("5");
		}
		else if(_class.search("WebView")!==-1){
			console.log("6");
			checkInput($obj);
		}
		else if(_class.search("ScrollView")!==-1){
			console.log("7");
			checkInput($obj);
		}
		else{
			console.log("8");
			$obj = $obj.parent();
			checkInput($obj);		
		}
		
		///////////////////////////
		
		if(clickFlag){//안누른상태
			clickFlag=false;
			$before=$obj;
			beforeClass = $before.attr("class");

			if(beforeClass.search("header")!==-1){
				console.log("before = trash");
				clickFlag = true;
				$before.end();
				return;
			}

			console.log("before = " + beforeClass);
			$before.css("opacity", "0.3");
		}
		else{
			$after = $obj;
			var afterClass=$after.attr("class");
			console.log("after = " + afterClass);
			
			if($before[0] === $after[0]){
				console.log("same before after");
				$before.css("opacity","1");
				$before.end();
				$after.end();
				clickFlag=true;
				return;
			}
						
			var afterUlClass = $after.children().attr("class");
			if(afterClass.search("Layout")!==-1){
				if(afterClass.search("Linear")!==-1){	//into Linearlayout
					console.log("into linear");
				 	
				 	if($('#' + $before.attr("id") + ' #' + $after.attr("id")).length){//before>after
				 		console.log("before > after");
				 		$before.css("opacity", "1");
				 		$before.end();
				 		$after.end();
				 		clickFlag=true;
				 		return;
				 	}  
                    else{
                    	console.log("[move]" + $before.attr("id")+" -> "+$after.attr("id"));
                    	console.log(afterUlClass);
                    	if(afterUlClass.search("vertical")){	//vertical 
                    		$before.css("display", "block");
                            $before.draggable({connectToSortable:".layout_vertical,.layout_horizontal"});

                    	}
                    	else{									//horizontal
                    		$before.css("display", "inline-block");
                    	}
                    	$before.css("opacity","1");
	        			$before.css("left",0).css("top",0);
	                    $before.appendTo($after.find("ul:eq(0)"));
						$before.end();
						$after.end();
						clickFlag=true;	
                    }
				}
				else if(afterClass.search("Relative")!==-1){//into LinearLayout
					console.log("into Relative");
					if($('#' + $before.attr("id") + ' #' + $after.attr("id")).length){//before>after
				 		console.log("before > after");
				 		$before.css("opacity", "1");
				 		$before.end();
				 		$after.end();
				 		clickFlag=true;
			 			return;
				 	}  
                    else{
                    	console.log("move");
 						$before.css("opacity","1");
 						$before.css("left",0).css("top",0);
	                    $before.appendTo($after.find("ul:eq(0)"));
	                    $before.draggable({containment:"parent",connectToSortable:false});
						$before.end();
						$after.end();
						clickFlag=true;	
                    }
				}
			}
			else{
				console.log("not layout")
				$before.css("opacity", "1");
		 		$before.end();
		 		$after.end();
		 		clickFlag=true;
	 			return; 	
			}

		}

		$obj.end();
		
	}
});


//////////////////////////////////////////////////////////////////////////////



// $("#confirm").click(function(){
// 	console.log("[confirm]");
// 	var $obj = $("#item_box").children();

// 	var _id = $obj.attr("id");
// 	var _class = $obj.attr("class");

// 	if(_class.search("TextView")!==-1 || _class.search("Button")!==-1
// 		||_class.search("RelativeLayout")!==-1 || _class.search("LinearLayout")!==-1
// 		|| _class.search("FrameLayout")!==-1){
// 		getCss1($obj);
// }	
// else{
// 	$obj = $obj.children();
// 	_id = $obj.attr("id");
// 	_class = $obj.attr("class");
// 	getCss2($obj);
// }
// });
// function getCss1($obj){
// 	console.log("[getCss1]");
// 	var width = $obj.css("width").split("px")[0];
// 	var height = $obj.css("height").split("px")[0];


// 	$obj.appendTo("#trash");
// 		$obj//.draggable("option","containment","parent")
// 		// .css("width",width).css("height",height)
// 		// .css("left",left).css("top",top)
// 		// .css("line-height",height+"px")
// 		// .css("z-index", 201)
// 		//.draggable("destroy")
// 		.resizable("destroy");

// 		var _class = $obj.attr("class");
// 		console.log(_class);
// 		if(_class.search("Layout")!==-1){//레이아웃 일 경우 
// 			console.log("this is Layout");
// 			checkLayout($obj, _class);
// 		}
// 	}
// 	function getCss2($obj){
// 		$div_obj = $obj.parent();		
// 		$div_obj.appendTo("#trash");
// 		$div_obj//.draggable("option","containment","parent")
// 		// .css("z-index", 201)
// 		.resizable("destroy");
// 		//.draggable("destroy")
// 		// .children().css("left",left).css("top",top);
// 	}
// 	function checkLayout($obj,_class){
// 		console.log(_class);
// 		switch(_class.split(" ")[0]){
// 			//case "LinearLayout" : $obj.sortable({revert:false,axis:"y",connectWith:".LinearLayout"}).disableSelection(); break;
// 			case "RelativeLayout" : $obj.sortable({}).disableSelection();break;
// 			case "FrameLayout" : break;
// 			default:break;
// 		}

// 	}


	
});
