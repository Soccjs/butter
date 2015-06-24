// Session에 저장된 GLOBAL 변수 값 저장
var _GLOBAL = {};
function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var editor;
$(document).ready(function() 
{
	$("#leftToright").click(function() 
	{
		editor = ace.edit("right_editor_inner");
		editor.setValue(makeParser(), 1);
	});

	// HTML parser
	function makeParser()
	{
		var html = $("#trash").html();
		var	htmlDoc = $.parseHTML(html);
		$html = $(htmlDoc);

		var fullHtml = makeChildeNode(htmlDoc);
		return fullHtml;
	}

	// HTML parser를 시작한다.
	function makeChildeNode(htmlDoc)
	{
		var childHtml = "";
		$(htmlDoc).each(function() {
			var type = getClass($(this));
			childHtml += makeView($(this), type);
			childHtml += makeInChildeNode($(this));
			childHtml += "</"+type+">"; // Child 노드가 있을 경우 재귀 종료시 Close
		});
		return childHtml;
	}

	// 하위 HTML parsing
	function makeInChildeNode(parent)
	{
		var childHtml = "";
		parent.children().each(function(index){
			var type = getClass($(this));
			childHtml += makeView($(this), type);
			if($(this).children().length >= 1)
			{
				childHtml += makeInChildeNode($(this));
				if(type != null && validationView(type) == true)
					childHtml += "</"+type+">"; // Child 노드가 있을 경우 재귀 종료시 Close
			}
		});	
		return childHtml;
	}

	// 유효한 HTML 태그만 종료 태깅한다.
	function validationView(type)
	{
		var validationViewResult = false;
		switch(type)
		{
			case "ScrollView" :
			case "LinearLayout" :
			case "RelativeLayout" :
			case "FrameLayout" :
			 validationViewResult = true; break;
		}
		return validationViewResult;
	}

	// XML elemets의 Type에 따라 다른 형태의 View를 생성한다.
	function makeView(htmlDoc, type)
	{
		var eachXML = "";
		switch(type)
		{
			case "TextView" : eachXML += makeTextView(htmlDoc); break;
			case "Button" : eachXML += makeButton(htmlDoc); break;
			case "EditText" : eachXML += makeEditText(htmlDoc); break;
			case "RadioButton" : eachXML += makeRadioButton(htmlDoc); break;
			case "CheckBox" : eachXML += makeCheckBox(htmlDoc); break;
			case "WebView" : eachXML += makeWebView(htmlDoc); break;
			case "ImageView" : eachXML += makeImageView(htmlDoc); break;
			case "ScrollView" : eachXML += makeScrollView(htmlDoc); break;
			case "LinearLayout" : eachXML += makeLinearLayout(htmlDoc); break;
			case "RelativeLayout" : eachXML += makeRelativeLayout(htmlDoc); break;
			case "FrameLayout" : eachXML += makeFrameLayout(htmlDoc); break;
		}
		return eachXML;
	}

	// FrameLayout 속성 추출
	function makeFrameLayout(html)
	{
		var viewXML = "<FrameLayout ";
		//DefaultLayout생성
		viewXML += makeDefaultLayout(html);
		return viewXML+">";
	}

	// RelativeLayout 속성 추출
	function makeRelativeLayout(html)
	{
		var viewXML = "<RelativeLayout ";
		//DefaultLayout생성
		viewXML += makeDefaultLayout(html);
		return viewXML+">";
	}

	// LinearLayout 속성 추출
	function makeLinearLayout(html)
	{
		var viewXML = "<LinearLayout ";
		//DefaultLayout생성
		viewXML += makeDefaultLayout(html);
		//Orientation생성
		viewXML += getOrientation(html);
		return viewXML+">";
	}

	// ScrollView 속성 추출
	function makeScrollView(html)
	{
		var viewXML = "<ScrollView ";
		//DefaultLayout생성
		viewXML += makeDefaultLayout(html);
		return viewXML+">";
	}

	// DefaultLayout 속성 추출
	function makeDefaultLayout(html)
	{
		var viewXML = "";
		//Root Information생성
		viewXML += getRootInfo(html)+"\n";
		//ID생성
		viewXML += getId(html)+"\n";
		//WIDTH생성
		viewXML += getWidth(html)+"\n";
		//HEIGHT생성
		viewXML += getHeight(html)+"\n";
		//BACKGROUND생성
		viewXML += getBackground(html);
		return viewXML;
	}

	// TextView 속성 추출
	function makeTextView(html)
	{
		//TextView생성
		var viewXML = "<TextView ";
		//기본 Default View 속성 생성
		viewXML += makeDefaultView(html)+"\n";
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		viewXML += getText(html);
		return viewXML+"/>";
	}

	// Button 속성 추출
	function makeButton(html)
	{
		//Button생성
		var viewXML = "<Button ";
		//기본 Default View 속성 생성
		viewXML += makeDefaultView(html)+"\n";
		//TEXT생성
		viewXML += getText(html);
		return viewXML+"/>";
	}

	// ImageView 속성 추출
	function makeImageView(html)
	{
		//Button생성
		var viewXML = "<ImageView ";
		//기본 Default View 속성 생성
		viewXML += makeDefaultView(html)+"\n";
		return viewXML+"/>";
	}

	// EditText 속성 추출
	function makeEditText(html)
	{
		//EditText생성
		var viewXML = "<EditText ";
		//INPUT TYPE VIEW생성
		viewXML += makeInputTypeView(html);
		return viewXML+"/>";
	}

	// RadioButton 속성 추출
	function makeRadioButton(html)
	{
		//RadioButton생성
		var viewXML = "<RadioButton ";
		//INPUT TYPE VIEW생성
		viewXML += makeInputTypeView(html);
		return viewXML+"/>";
	}

	// CheckBox 속성 추출
	function makeCheckBox(html)
	{
		//CheckBox생성
		var viewXML = "<CheckBox ";
		//INPUT TYPE VIEW생성
		viewXML += makeInputTypeView(html);
		return viewXML+"/>";
	}

	// WebView 속성 추출
	function makeWebView(html)
	{
		var viewXML = "<WebView ";
		//ID생성
		viewXML += getId(html)+"\n";
		//WIDTH생성
		viewXML += getWidth(html)+"\n";
		//HEIGHT생성
		viewXML += getHeight(html);
		return viewXML+"/>";
	}

	// InputType 속성 추출 (EditText, RadioButton, CheckBox)
	function makeInputTypeView(html)
	{
		//DIV생성
		var viewXML = "";
		// 기본 Default View 속성 생성
		viewXML += makeDefaultView(html);
		//TEXT생성(<Input>태그는 값을 value 속성안에 저장하여 별도의 getValueText 사용.)
		viewXML += getValueText(html);
		return viewXML;
	}

	// 기본 View 속성 추출
	function makeDefaultView(html)
	{
		var viewXML = "";
		//ID생성
		viewXML += getId(html)+"\n";
		//WIDTH생성
		viewXML += getWidth(html)+"\n";
		//HEIGHT생성
		viewXML += getHeight(html)+"\n";
		//MARGIN생성
		viewXML += getMargin(html)+"\n";
		//TEXTSIZE생성
		viewXML += getTextSize(html)+"\n";
		//TEXTSTYLE생성
		viewXML += getTextStyle(html)+"\n";
		//TEXTCOLOR생성
		viewXML += getTextColor(html)+"\n";
		//GRAVITY생성
		viewXML += getGravity(html)+"\n";
		//ELLIPSIZE생성
		viewXML += getEllipsize(html)+"\n";
		//BACKGROUND생성
		viewXML += getBackground(html);
		return viewXML;
	}

	// Style 속성의 내부 속성은 자체 파서를 통해 검색
	function getStyleValue(html, key)
	{
		var styleValue = null;
		console.log(html.attr("style"));
		if(html.attr("style")!=="undefined"){
			var stylesBox = html.attr("style").split(";");
		
			for (var x = 0; x < stylesBox.length; x++) 
			{
			    var cmpKey = stylesBox[x].split(':');
			    if(cmpKey[0] == key)
					styleValue = cmpKey[1];
			}
		}
		return styleValue;
	}

	// HTML Root 정보 추출
	function getRootInfo(xml)
	{
		var xmlRootInfo = xml.attr("xml");
		if(xmlRootInfo == null)
			return "";
		else
			return "xmlns:android=\""+xmlRootInfo+"\" ";
	}

	// HTML Orientation값 추출
	function getOrientation(html)
	{
		var xmlOrientation = getStyleValue(html, "display");
		if(xmlOrientation == "inline") 
			return "android:orientation=\"horizontal\" ";
		else
			return "android:orientation=\"vertical\" ";
	}

	// HTML Id값 추출
	function getClass(html)
	{
		var className = html.attr("class")
		if(className != null)
		{
			var firstName = className.split(" ");
			return firstName[0];
		}
		else
			return "";
	}

	// HTML Id값 추출
	function getId(html)
	{
		// 고유 아이디를 사용하기 위해 임시로 저장된 id+[$-R]의 [$-R]마크 부분 제거
		var xmlID = html.attr("id");
		if(xmlID == null)
			return "";
		else
			return "android:id=\"@+id/"+xmlID.replace("[$-R]", "")+"\" ";
	}

	//==================================================================================//
	// Default관련 Function
	//==================================================================================//

	// HTML Width값 추출
	function getWidth(html)
	{
		var htmlWidth = getStyleValue(html, "width");
		if(htmlWidth == null)
			return "android:layout_width=\"wrap_content\" ";
		else if(htmlWidth == "100%")
			return "android:layout_width=\"match_parent\" ";
		else
			return "android:layout_width=\""+htmlWidth+"\" ";
	}

	// HTML Height값 추출
	function getHeight(html)
	{
		var htmlHeight = getStyleValue(html, "height");
		if(htmlHeight == null)
			return "android:layout_height=\"wrap_content\" ";
		else if(htmlHeight == "100%")
			return "android:layout_height=\"match_parent\" ";
		else
			return "android:layout_height=\""+htmlHeight+"\" ";
	}

	// HTML Background값 추출
	function getBackground(html)
	{
		var htmlBackground = getStyleValue(html, "background");
		if(htmlBackground == null)
			return "";
		else{
			//불필요한 태그 정보 삭제
			htmlBackground = htmlBackground.replace("url('@drawable/", "");
			htmlBackground = htmlBackground.replace("')", "");
		
			return "android:background=\"@drawable/"+htmlBackground+"\" ";
		}
	}

	// HTML Margin값 추출
	function getMargin(html)
	{
		var htmlMargin = getStyleValue(html, "margin");
		if(htmlMargin == null)
			return "";
		else
			return "android:layout_margin=\""+htmlMargin+"\" ";
	}
	
	// HTML Text값 추출
	function getText(html)
	{
		return "android:text=\""+html.text()+"\" ";
	}

	// HTML Value Text값 추출
	function getValueText(html)
	{
		return "android:text=\""+html.attr("value")+"\" ";
	}

	// HTML Gravity 추출
	function getGravity(html)
	{
		var htmlGravityn = getStyleValue(html, "text-align");
		if(htmlGravityn == null)
			return "";
		else
			return "android:gravity=\""+htmlGravityn+"\" ";
	}

	//==================================================================================//
	// Text관련 Function
	//==================================================================================//

	// HTML TextSize값 추출
	function getTextSize(html)
	{
		var htmlTextSize = getStyleValue(html, "font-size");
		if(htmlTextSize == null)
			return "";
		else
			return "android:textSize=\""+htmlTextSize+"\" ";
	}

	// HTML TextStyle값 추출
	function getTextStyle(html)
	{
		var htmlTextStyle = getStyleValue(html, "font-style");
		if(htmlTextStyle == null)
			return "";
		else
			return "android:textStyle=\""+htmlTextStyle+"\" ";
	}

	// HTML TextColor값 추출
	function getTextColor(html)
	{
		var htmlTextColor = getStyleValue(html, "color");
		if(htmlTextColor == null)
			return "";
		else
			return "android:textColor=\""+htmlTextColor+"\" ";
	}

	// HTML Ellipsize 추출
	function getEllipsize(html)
	{
		var htmlEllipsize = getStyleValue(html, "text-overflow");
		if(htmlEllipsize == "ellipsis")
			return "android:ellipsize=\"end\" ";
		else
			return "";
	}

	//==================================================================================//
});