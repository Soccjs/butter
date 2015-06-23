//////////////////////////////////////////////////////////////////////////////////////////
//
// 이 코드는 node.js 서버에게 {클래스명} 혹은 {클래스명.메소드명의일부}를 전달하고
//
// socket.io를 통해 전달되는 클래스의 메소드 목록을 출력합니다.
//
// ac (auto complete)
// ac.parseImports(code)			- imports 분석
// ac.getClass(code, current_line)	- 현재 커서가 있는 변수의 클래스 검색
// ac.requestMethods(className)		- 서버에 클래스명 전송 
// ac.nameStarts					- 커서가 {클래스명.}에 있다면 null, 아니라면 메소드의 시작이름
//
//////////////////////////////////////////////////////////////////////////////////////////


var socket = io();

var ac = {
    DATA: null,
    packages: [],
    parseImports: null,
    getClass: null,
    requestMethods: null,   
    nameStarts: null,
    list: null,
    cursor: null,
};

ac.DATA = null;                      	 // android sdk 클래스목록
ac.packages = [];                    	 // 코드에 포함된 패키지 목록
ac.parseImports = function(code) {       // 코드에 포함된 imports들을 ac.packages에 넣음
    
    var init_pos, end_pos;

    while (true)
    {
        init_pos = code.search("import");
     
        if (init_pos == -1)
        {
            break;
        }
        else
        {
            init_pos = init_pos + 6;
            code = code.substr(init_pos);
            
            end_pos = code.search(';');
            this.packages.push(code.substr(0, end_pos).trim());
            
            code = code.substr(end_pos + 1);
        }
    }
    console.log("imported packages : ", this.packages);
};

// 현재 커서가 위치한 라인에 해당하는 클래스를 구함
ac.getClass = function(code, current_line) {

    console.log("[current line]", current_line);

    var split_dot = current_line.split('.');
    var split_space = split_dot[split_dot.length - 2].split(' ');

     // 메소드명을 전혀 작성하지 않았을 때,
    console.log(this)
    if (current_line.charAt(current_line.length - 1) == '.')
	    this.nameStarts = null;
    else
    	this.nameStarts = split_dot[split_dot.length - 1];
    
    ////// 클래스 변수 뽑기
    
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
	
	console.log("클래스 변수 명 : ", target_split_dot_arr[0]);
    
    var right_border = code.search(' ' + target_split_dot_arr[0] + ';');
    var codesplit1 = code.substr(0, right_border).trim();
    
    var left_searching_arr = [];
    left_searching_arr.push(codesplit1.lastIndexOf(';'));
	left_searching_arr.push(codesplit1.lastIndexOf('{'));
	left_searching_arr.push(codesplit1.lastIndexOf('}'));
	left_searching_arr.push(codesplit1.lastIndexOf('('));
	left_searching_arr.push(codesplit1.lastIndexOf('\n'));
	left_searching_arr.push(codesplit1.lastIndexOf(' '));
	
	console.log("[left_searching_arr] : ", left_searching_arr);
	
	console.log("codesplit1:\n", codesplit1);
	console.log("codesplit1 length:", codesplit1.length);
	console.log("left_cutter:", Math.max.apply(null,left_searching_arr) + 1);
	
	var codesplit2 = codesplit1.substr(Math.max.apply(null,left_searching_arr) + 1);
	var classname = codesplit2.trim();
    
    console.log("CLASS FOUND : ", classname);
    return classname;
}


ac.requestMethods = function(className) {
    
    // 레퍼런스 주소로 서버에 메소드 목록 요청하기.
    for (var i=0; i<ac.DATA.length; i++)
    {
        var arr = ac.DATA[i].label.split('.');
        var target = arr[arr.length-1];

        if(className == target)
        {
            socket.emit("autocomplete", ac.DATA[i].link);
            console.log("methods request has been sent : ", ac.DATA[i].link);
            break;
        }
    }
}
