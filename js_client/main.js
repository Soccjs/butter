// global variables
var isShownBtmMenu = false;			// boolean for bottom menu
var isPerInfoVisible = false;		// boolean for personal_info menu
var tree_root = "/home/choidora/Documents/test_folder/";
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




	//로그인 처음 되면 리빙룸에 있도록 in
	socket.emit("in",{id: _GLOBAL.id});
	

	//////////////////////////
	// USER IN - 포스트잇 추가
	//////////////////////////
	//data : {project: _GLOBAL.project, id:_GLOBAL.id, file_name: file}
	socket.on("room_in_draw", function(data) {
		var position = 0;

		for(var i in userIndexArray) {
			if(userIndexArray[i] == 0) {
				position = i;
				break;
			}
		}

		if(position == 0) {	
			$("#user_0").css("visibility", "visible");
			$("#user_0 > p").html(data.id);
			userIndexArray[position] = 1;
		} else if(position == 1) {
			$("#user_1").css("visibility", "visible");
			$("#user_1 > p").html(data.id);
			userIndexArray[position] = 1;
		} else if(position == 2) {
			$("#user_2").css("visibility", "visible");
			$("#user_2 > p").html(data.id);
			userIndexArray[position] = 1;
		} else if(position == 3) {
			$("#user_3").css("visibility", "visible");
			$("#user_3 > p").html(data.id);
			userIndexArray[position] = 1;
		}

	});


	//////////////////////////
	// USER OUT - 포스트잇 삭제
	//////////////////////////
	socket.on("room_out_delete", function(id_data) {
		
		$("#user_container > div").each(function(index){
			//console.log(filePathArr[filePathArr.length - 1] + "/" + $(this).text().slice(1, $(this).text().length));
			var tmp = $(this).children("p").text();
			if(id_data == tmp){
				//alert(index + "!!!!");  //******지워지는index찍는부분
				userIndexArray[index] = 0;

				if(index == 0) {	
					$("#user_0").css("visibility", "hidden");
				} else if(index == 1) {
					$("#user_1").css("visibility", "hidden");
				} else if(index == 2) {
					$("#user_2").css("visibility", "hidden");
				} else if(index == 3) {
					$("#user_3").css("visibility", "hidden");
				}

			}
		});

	});


	/////////////////////////////////////////
	// USER WORKLIST - 포스트잇에 ido
	/////////////////////////////////////////

	$(".users_label").click(function(e){
		var t = e.target;
		$(t).parent().toggleClass("users_open", 700, 'easeInOutBack');
		var usr_id = $(t).parent().children("p").text();
		
		socket.emit("workList_request", {project: _GLOBAL.project, id: usr_id});	//usr_id제대로 바껴서 들어가는지 확인 (V)

		/////////////////////////////////////////
		// USER WORKLIST - 포스트잇에 workList추가
		/////////////////////////////////////////
		$("#user_contents_inner").text("///WORKLIST///" );
		// data : {id: data.id, works: CurrentProjectsArray[i].workArray}
		socket.on("workList_response", function(data) {
			console.log("workList_response data check////////////////////////");
			var str = "///WORKLIST///" ;
			// 데이타 받아서 그려준다.
			for(var i in data.works) {
				//************내꺼만 그려준다. 이부분 제대로 되나 체크 (V)
				if(usr_id == data.works[i].name)
					str += ("\n" + data.works[i].work);
			}
			
			$("#user_contents_inner").text(str);
		});

		$("#user_contents_inner").text(str);
	});


	
	$(".users > p").mouseenter(function(e){
		var pos = $(e.target).parent().position();
		$("#user_contents").css("top", pos.top);
		$("#user_contents").removeClass("uc_off");
		$("#user_contents").addClass("uc_on");
	});
	
	$(".users > p").mouseleave(function(e){
		$("#user_contents").removeClass("uc_on");
		$("#user_contents").addClass("uc_off");
		var t = e.target;
		$(t).parent().toggleClass("users_open", 700, 'easeInOutBack');
	});


	function make_editor(data, file, flag, _working_flag){
		$("#right_editor").children().remove();
		$("#right_editor").append("<div id='right_editor_inner' style='top:63px;'></div>");
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
		editor.getSession().setMode("ace/mode/java");
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
					$("#mini_popup_text").text("Nothing Changed to Save");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
				}
				else {
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
	}

	// Using jQuery File Tree - fileTree({root : root dir, script : serverside file}, callback func when chosing file})
	function make_fileTree(folder_path){
		$('#left_tree').fileTree({root : folder_path, script : 'req_filetree'}, function(file) {
			// When file opening...send data to server with 'post'
			console.log(folder_path);
			console.log(file);
			_GLOBAL.file= file;
			$.post('openFile', {path : file}, function(data) {
					make_editor(data, file, 1, 1);

					//파일트리에서 열면: read-only
				});
		});
	}

	// Draggable settings...
	$("#left_drag").css("left", "288px");
	$("#left_drag").draggable({
		axis : "x",
		drag : function(event, ui) {
			$("#left").width(ui.position.left + 12);
			$("#right").css('margin-left', ui.position.left + 12 + "px");
		}
	});

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

	// Bottom Menu
	$("#left_bottom_menu").click(function(){
		console.log("Hi");
		if(isShownBtmMenu == false){
			$("#btm_menu").animate({top : "50%"}, {duration: 1000, easing: 'easeInOutBack'});
			isShownBtmMenu = true;
		}

		else{
			$("#btm_menu").animate({top : "180%"}, {duration: 1000, easing: 'easeInOutBack'});
			isShownBtmMenu = false;
		}
	});

	// Bottom Menu - Select Project
	$("#btm_menu_sel_project").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
			isShownBtmMenu = false;
		$.get("/select_project?id=" + getParameterByName('id'), function(data, status){
			if(data != null){
				var temp = "<br>";
				for(var i in data){
					temp += "<a>" + data[i] + "</a><br><br>";
				}
				$("#dialog_select_project_proj").html(temp);
			}
			$("#dialog_select_project").dialog({
				dialogClass : "bottom_dialog",
				modal : true,
				resizable : true,
				width : 800,
				height : 770,
				show : {
					effect : "fade",
					duration : 500
				},
				hide : {
					effect : "fade",
					duration : 500
				},
				beforeClose : function() {
					$("#dialog_select_project_info_contents").html("");
					$("#dialog_selected_project").val("");
				}
			});
		});
	});

	$("#btm_menu_run").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
			isShownBtmMenu = false;
		$.get("/btm_menu_run?id=" + _GLOBAL.id + "&project=" + _GLOBAL.project, function(data, status){

				$("#mini_popup_img").attr("src", "img/check.png");
				$("#mini_popup_text").text("Run Project Successed");
				$("#mini_popup").fadeIn("slow", function() {
					setTimeout(function() {
						$("#mini_popup").fadeOut("slow");
					}, pupup_time);
				$("#right_log_inner").append(data);
				});
			make_fileTree(fileTreePath); 
		});
	});
	
	$("#btm_menu_export").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;
		window.location = "/btm_menu_export?id=" + _GLOBAL.id + "&project=" + _GLOBAL.project;
	});
	$("#btm_menu_import").click(function(){
		console.log("in!");
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;

		$("#dialog_importProject").dialog({
			dialogClass : "bottom_dialog",
			modal : true,
			resizable : true,
			width : 400,
			height : 280,
			show : {
				effect : "fade",
				duration : 500
			},
			hide : {
				effect : "fade",
				duration : 500
			}
		});
	});	
	$("#submit").click(function(data){
		$("#uploadSearch").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;
	});	

	$("#btm_menu_apk").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;	
		window.location = "/btm_menu_apk?id=" + _GLOBAL.id + "&project=" + _GLOBAL.project;
	});
	$("#btm_menu_graphic").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;
		$.post("/graphical", {
					id : _GLOBAL.id,
					pname : _GLOBAL.project,

				}, function(data) {
					if (data === "G_L") {
						console.log("이동");
						if(typeof _GLOBAL.file=== "undefined"){
							alert("file was Not selected!");
						}
						else{
						window.location.href=("./G_L.html?id=" + _GLOBAL.id + "&path=" + _GLOBAL.file + "&proj=" +_GLOBAL.project);
						} 
					}
				});
	});
	

	$("#dialog_select_project_proj").scroll();

	$("#dialog_select_project_proj").on("click", "a", function(){
		var proj_name = $(this).text();

		$("#dialog_selected_project").val(proj_name);

		// 서버에서 프로젝트 정보 받기
		$.get("/project_info?id=" + _GLOBAL.id + "&project=" + proj_name, function(data, status){

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

	// 프로젝트 불러오기
	$("#dialog_select_project_select").click(function() {
		var target = $("#dialog_selected_project").val();

		_GLOBAL.project = target;

		if (target) {
			fileTreePath = _GLOBAL.project + "_" +_GLOBAL.id +  "/_" + _GLOBAL.id + "/";
			console.log("tired  " + fileTreePath);

			$.get('/updatetarget?path=' +fileTreePath);
			$.get('/makeGitTree?path=' +_GLOBAL.project+ "&id=" +_GLOBAL.id, function(data, status){
				console.log("/makeGitTree complete");
				$("#git_tree_container").empty();
				$("#git_tree_container").append(data);
			});

			$("#right_topbar_sortable").children().remove();
			if(editor != null)
				editor.container.remove();

			make_fileTree(fileTreePath);
			
			$("#left_project_name").css("visibility", "visible");
			$("#left_project_name").text(_GLOBAL.project);

		    //*************************//
		    // Switch the room 
		    //*************************//
		    $("#user_0").css("visibility", "hidden");
			$("#user_1").css("visibility", "hidden");
			$("#user_2").css("visibility", "hidden");
			$("#user_3").css("visibility", "hidden");
			//userIndexArray[] = 0; 

			socket.emit("switch", {project:_GLOBAL.project, id:_GLOBAL.id});
			//내꺼에다가, 이미 참여중이였던 사용자꺼를 그려준다.
			//socket.emit("roon_in_init_draw", {project: _GLOBAL.project, id: _GLOBAL.id});

			$("#dialog_select_project").dialog("close");
			$("#mini_popup_img").attr("src", "img/check.png");
			$("#mini_popup_text").text("Loading Project Complete");
			$("#mini_popup").fadeIn("slow", function() {
					setTimeout(function() {
						$("#mini_popup").fadeOut("slow");
			}, pupup_time);});
		} else {
			$("#mini_popup_img").attr("src", "img/not_check.png");
				$("#mini_popup_text").text("Please Select a Project to open");
				$("#mini_popup").fadeIn("slow", function() {
					setTimeout(function() {
						$("#mini_popup").fadeOut("slow");
					}, pupup_time);
				});
		}
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
	$("#left_tree").on("mouseenter", "a", function(e){
		$("#left_tree_hoverdItem").val($(e.target).attr('rel'));
	});

	$(function(){
		$.contextMenu({
			selector: "#left_tree",
			items: {
				"new_dir": {name: "New Directory", icon: "directory", callback: function(){
					$("#dialog_makeDirFile").dialog({
						dialogClass : "bottom_dialog",
						modal : true,
						resizable : true,
						width : 350,
						height : 250,
						show : {
							effect : "fade",
							duration : 500
						},
						hide : {
							effect : "fade",
							duration : 500
						},
						open: function(){
							__filePath = $("#left_tree_hoverdItem").val();
						}
					});
				}},
				"new_file": {name: "New File", icon: "file", callback: function(){
					$("#dialog_makeDirFile2").dialog({
						dialogClass : "bottom_dialog",
						modal : true,
						resizable : true,
						width : 350,
						height : 250,
						show : {
							effect : "fade",
							duration : 500
						},
						hide : {
							effect : "fade",
							duration : 500
						},
						open: function(){
							__filePath = $("#left_tree_hoverdItem").val();
						}
					});
				}},
				"delete": {name: "Delete", icon: "delete", callback: function(){
					var ok = confirm("Delete?");
					if(ok){
						$.get('/delete_file?path=' + $("#left_tree_hoverdItem").val(), function(data, status){

							console.log("client : " + data);

							$("#mini_popup_img").attr("src", "img/check.png");
							$("#mini_popup_text").text("Delete Complete");
							$("#mini_popup").fadeIn("slow", function() {
								setTimeout(function() {
									$("#mini_popup").fadeOut("slow");
								}, pupup_time);
							});  

							make_fileTree(fileTreePath);
						});
					}
				}},
				
				"sep1": "---------",
				"refresh": {name: "Refresh", icon: "refresh", callback: function(){
					make_fileTree(fileTreePath);
				}},
				
	        }
		});
	});

	$("#makeDirFile_btn").click(function(){
		var name = $("#makeDirFile_name").val();
		var path = __filePath + name;
		
		$.get('/make_dir?path=' + path, function(data, status){
			console.log("client : " +data);
			
			$("#mini_popup_img").attr("src", "img/check.png");
			$("#mini_popup_text").text("Make New Directory Complete");
			$("#mini_popup").fadeIn("slow", function() {
				setTimeout(function() {
					$("#mini_popup").fadeOut("slow");
				}, pupup_time);
			});
		});

		$("#dialog_makeDirFile").dialog("close");
		make_fileTree(fileTreePath);

	});
	
	$("#makeDirFile_btn2").click(function() {
		var name = $("#makeDirFile_name2").val();
		var path = __filePath + name;

		$.get('/make_file?path=' + path, function(data, status) {
			console.log("client : " +data);
			
			$("#mini_popup_img").attr("src", "img/check.png");
			$("#mini_popup_text").text("Make New File Complete");
			$("#mini_popup").fadeIn("slow", function() {
				setTimeout(function() {
					$("#mini_popup").fadeOut("slow");
				}, pupup_time);
			});
		});

		$("#dialog_makeDirFile2").dialog("close");
		make_fileTree(fileTreePath);
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

	$("#btm_menu_add_project").click(function(){
		$("#btm_menu").animate({top : "130%"}, {duration: 1000, easing: 'easeInOutBack'});
		isShownBtmMenu = false;
		$("#dialog_createProject").dialog({
				dialogClass : "bottom_dialog",
				modal : true,
				resizable : false,
				width : 360,
				height : 390,
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

			$("#form_create_id").val(_GLOBAL.id);
	});


	// project_create.html

	$("#btn_pcreate").click(function() {
		var user_id = $("#form_create_id").val();
		var project_name = $("#form_pname").val();
		var project_desc = $("#form_pdesc").val();

		if (project_name.search('/'))
			if (user_id != "" && project_name != "" && project_desc != "") {
				$.post("/project_create", {
					id : user_id,
					pname : project_name,
					pdesc : project_desc
				}, function(data) {
					if (data == "project_create_successed") {

						$("#form_create_id").val("");
						$("#form_pname").val("");
						$("#form_pdesc").val("");
						$("#dialog_createProject").dialog("close");

						$("#mini_popup_img").attr("src", "img/check.png");
						$("#mini_popup_text").text("Create Project Complete");
						$("#mini_popup").fadeIn("slow", function() {
							setTimeout(function() {
								$("#mini_popup").fadeOut("slow");
							}, pupup_time);
						});

					} else {
						// case1. 이미 존재하는 프로젝트입니다.
						$("#mini_popup_img").attr("src", "img/not_check.png");
						$("#mini_popup_text").text("Exist Project Name");
						$("#mini_popup").fadeIn("slow", function() {
							setTimeout(function() {
								$("#mini_popup").fadeOut("slow");
							}, pupup_time);
						});
					}
				});
			} else {
				$("#mini_popup_img").attr("src", "img/not_check.png");
					$("#mini_popup_text").text("Please Fill Out the Form");
					$("#mini_popup").fadeIn("slow", function() {
						setTimeout(function() {
							$("#mini_popup").fadeOut("slow");
						}, pupup_time);
					});
			}
	});

	// preject_invite.html

	$("#btn_pinvite").click(function() {

		var user_id = $("#form_id").val();

		var inv_id = $("#form_inv_id").val();
		var inv_project = $("#form_inv_project").val();
		var inv_msg = $("#form_inv_msg").val();

		if (user_id != "" && inv_id != "" && inv_project != "" && inv_msg != "") {
			$.post("/project_invite", {
				id : user_id,
				inv_id : inv_id,
				inv_project : inv_project,
				inv_msg : inv_msg
			}, function(data) {

				if (data == "project_invite_successed") {
					$("#mini_popup_img").attr("src", "img/check.png");
						$("#mini_popup_text").text("Invite User to Project Success");
						$("#mini_popup").fadeIn("slow", function() {
							setTimeout(function() {
								$("#mini_popup").fadeOut("slow");
							}, pupup_time);
					});
				} else {
					// case1. 존재하지 않는 상대방입니다.
					// case2. 존재하지 않는 프로젝트입니다.
					// case3. 상대방이 이미 프로젝트에 참여중입니다.
					$("#mini_popup_img").attr("src", "img/not_check.png");
						$("#mini_popup_text").text("Invite User to Project Failed");
						$("#mini_popup").fadeIn("slow", function() {
							setTimeout(function() {
								$("#mini_popup").fadeOut("slow");
							}, pupup_time);
					});
				}
			});
			
			$("#dialog_invite").dialog("close");
			
			$("#form_inv_id").val("");
			$("#form_inv_msg").val("");
			
		} else {
			$("#mini_popup_img").attr("src", "img/not_check.png");
				$("#mini_popup_text").text("Please Fill Out the Form");
				$("#mini_popup").fadeIn("slow", function() {
					setTimeout(function() {
						$("#mini_popup").fadeOut("slow");
					}, pupup_time);
			});
		}
	});

	//////////////////////
	// BTN ACCEPT
	/////////////////////
	$("#btn_accept").click(function() {

		var content = $(".invitem.selected").html();
		var project_name = content.substr(content.search(':') + 1).trim().split('<br>')[0];
		var inviting = content.substr(content.search(':') + 1).trim().split('<br>')[2];
		var inviting_user = inviting.split(' ')[2];
		console.log("[inviting_user] : " + inviting_user);
		console.log("[invitelist_accept request] : ", _GLOBAL.id, project_name);		
		socket.emit("invitelist_accept", {id:_GLOBAL.id, project:project_name, inv_usr:inviting_user});
	});

	//////////////////////
	// BTN DECLINE
	/////////////////////
	$("#btn_decline").click(function() {

	console.log("btn_decline");
		var content = $(".invitem.selected").html();
		var project_name = content.substr(content.search(':') + 1).trim().split('<br>')[0];
		
		console.log("[invitelist_decline request] : ", _GLOBAL.id, project_name);		
		socket.emit("invitelist_decline", {id:_GLOBAL.id, project:project_name});
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
		
	///////////////////////////////////
	//	INVITE ACCEPT RESPONSE
	///////////////////////////////////
	socket.on("invitelist_accept_response", function(project_name) {
		
		console.log("[invitelist_accept_response] : ", project_name);
		
		if (project_name == null)
		{
			console.log("accept request failed.");				
		}
		else
		{
			$("#invitation_list").children(".selected").remove();
		}
	});
		
		
	///////////////////////////////////
	//	INVITE DECLINE RESPONSE
	///////////////////////////////////
	socket.on("invitelist_decline_response", function(project_name) {
		
		console.log("[invitelist_decline_response] : ", project_name);
		
		if (project_name == null)
		{
			console.log("decline request failed.");				
		}
		else
		{
			$("#invitation_list").children(".selected").remove();
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
    
});
