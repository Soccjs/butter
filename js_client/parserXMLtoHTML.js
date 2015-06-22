// 사위 parent Node의 orientation 속성을 child에서 사용
var defaultOrientation = "display:block;";

// 기본 WebView의 화면으로 표시해 줄 웹 페이지
var defaultWebViewUrl = "http://developer.android.com/develop/index.html";

// Session에 저장된 GLOBAL 변수 값 저장.
var _GLOBAL = {};

$(document).ready(function() 
{
	$(".click_xml_to_html_btn").click(function() {
		makeParser();
	});

	// XML parser
	function makeParser()
	{
		var xml = $(".right_editor").text().replace(/\"/g,"'");
		var	xmlDoc = $.parseXML(xml);
		$xml = $(xmlDoc);

		var fullHtml = makeChildeNode(xmlDoc);
		$("#left_editor").html(fullHtml);

		/*dpi_x = document.getElementById('testdiv').offsetWidth;
   		dpi_y = document.getElementById('testdiv').offsetHeight;*/
	}

	// XML parser를 시작한다.
	function makeChildeNode(xmlDoc)
	{
		var childHtml = "";
		$(xmlDoc).each(function() {
			childHtml += makeInChildeNode($(this));
		});
		return childHtml;
	}

	// 하위 XML parsing
	function makeInChildeNode(parent)
	{
		var childHtml = "";
		parent.children().each(function(index){
			childHtml += makeView($(this), this.tagName);
			if($(this).children().length >= 1)
			{
				childHtml += makeInChildeNode($(this));
				childHtml += "</ul></div>" // Child 노드가 있을 경우 재귀 종료시 Close
			}
		});	
		return childHtml;
	}

	// XML elemets의 Type에 따라 다른 형태의 View를 생성한다.
	function makeView(xmlDoc, type)
	{
		var eachHtml = "";
		switch(type)
		{
			case "TextView" : eachHtml += makeTextView(xmlDoc); break;
			case "Button" : eachHtml += makeButton(xmlDoc); break;
			case "EditText" : eachHtml += makeEditText(xmlDoc); break;
			case "RadioButton" : eachHtml += makeRadioButton(xmlDoc); break;
			case "CheckBox" : eachHtml += makeCheckBox(xmlDoc); break;
			case "WebView" : eachHtml += makeWebView(xmlDoc); break;
			case "ImageView" : eachHtml += makeImageView(xmlDoc); break;
			case "ScrollView" : eachHtml += makeScrollView(xmlDoc); break;
			case "LinearLayout" : eachHtml += makeLinearLayout(xmlDoc); break;
			case "RelativeLayout" : eachHtml += makeRelativeLayout(xmlDoc); break;
			case "FrameLayout" : eachHtml += makeFrameLayout(xmlDoc); break;
		}
		return eachHtml;
	}

	// FrameLayout 속성 추출
	function makeFrameLayout(xml)
	{
		var viewHTML = "<div ";
		//RelativeLayout Class 생성
		viewHTML += setClass("FrameLayout");
		//DefaultLayout생성
		viewHTML += makeDefaultLayout(xml);
		//Orientation생성
		viewHTML += defaultOrientation+"\">";
		//Orientation생성
		viewHTML += "<ul id=\"layout_frame\" style=\"display:block;\">";
		return viewHTML;
	}

	// RelativeLayout 속성 추출
	function makeRelativeLayout(xml)
	{
		var viewHTML = "<div ";
		//RelativeLayout Class 생성
		viewHTML += setClass("RelativeLayout");
		//DefaultLayout생성
		viewHTML += makeDefaultLayout(xml);
		//Orientation생성
		viewHTML += defaultOrientation+"\">";
		//Orientation생성
		viewHTML += "<ul id=\"layout_relative\" style=\"display:block;\">";
		return viewHTML;
	}

	// LinearLayout 속성 추출
	function makeLinearLayout(xml)
	{
		var viewHTML = "<div ";
		//LinearLayout Class생성
		viewHTML += setClass("LinearLayout");
		//DefaultLayout생성
		viewHTML += makeDefaultLayout(xml);
		//Orientation생성
		viewHTML += defaultOrientation+"\">";
		//Orientation생성
		viewHTML +="<ul id=\"layout_vertical\" style=\"display:block;\">";
		return viewHTML;
	}

	// ScrollView 속성 추출
	function makeScrollView(xml)
	{
		var viewHTML = "<div ";
		//ScrollView Class 생성
		viewHTML += setClass("ScrollView");
		//DefaultLayout 생성
		viewHTML += makeDefaultLayout(xml);
		//Scroll 기능 생성
		viewHTML += "overflow:scroll;";
		return viewHTML+"\">";
	}

	// DefaultLayout 속성 추출
	function makeDefaultLayout(xml)
	{
		var viewHTML = "";
		//Root Information생성
		viewHTML += getRootInfo(xml);
		//Global Orientation 정보 설정
		viewHTML += getOrientation(xml);
		//ID생성
		viewHTML += getId(xml);
		//DIV STYLE생성
		viewHTML += "style=\"";
		//WIDTH생성
		viewHTML += getWidth(xml);
		//HEIGHT생성
		viewHTML += getHeight(xml);
		//BACKGROUND생성
		viewHTML += getBackground(xml);
		return viewHTML;
	}

	// TextView 속성 추출
	function makeTextView(xml)
	{
		//DIV생성
		var viewHTML = "<div ";
		//ID생성
		viewHTML += getId(xml);
		//DIV STYLE생성
		viewHTML += "style=\""+defaultOrientation;
		//MARGIN생성
		viewHTML += getMargin(xml);
		//RELATIVE MARGIN생성
		viewHTML += getRelativeMargin(xml);
		//END DIV생성
		viewHTML += "\">";
		//SPAN CLASS생성
		viewHTML += "<span ";
		//TextView Class 생성
		viewHTML += setClass("TextView");
		//Real ID생성
		viewHTML += getRealId(xml);
		//SPAN STYLE생성
		viewHTML += "style=\"";
		//SPAN 기본 Default View 속성 생성
		viewHTML += makeDefaultView(xml);
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		viewHTML += "\">"+getText(xml)+"</span></div>";
		return viewHTML;
	}

	// Button 속성 추출
	function makeButton(xml)
	{
		//DIV생성
		var viewHTML = "<div ";
		//ID생성
		viewHTML += getId(xml);
		//STYLE생성
		viewHTML += "style=\""+defaultOrientation+";padding:5px;display:inline-block;";
		//MARGIN생성
		viewHTML += getMargin(xml);
		//RELATIVE MARGIN생성
		viewHTML += getRelativeMargin(xml);
		//END STYLE생성
		viewHTML += "\">";
		//SPAN CLASS생성
		viewHTML += "<span ";
		//Button Class 생성
		viewHTML += setClass("Button");
		//Real ID생성
		viewHTML += getRealId(xml);
		//SPAN STYLE생성
		viewHTML += "style=\"";
		// 기본 Default View 속성 생성
		viewHTML += makeDefaultView(xml);
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		viewHTML += "\">"+getText(xml)+"</span></div>";
		return viewHTML;
	}

	// Button 속성 추출
	function makeImageView(xml)
	{
		//DIV생성
		var viewHTML = "<div ";
		//ID생성
		viewHTML += getId(xml);
		//STYLE생성
		viewHTML += "style=\""+defaultOrientation+";padding:5px;display:inline-block;";
		//MARGIN생성
		viewHTML += getMargin(xml);
		//RELATIVE MARGIN생성
		viewHTML += getRelativeMargin(xml);
		//END STYLE생성
		viewHTML += "\">";
		//SPAN CLASS생성
		viewHTML += "<span ";
		//Button Class 생성
		viewHTML += setClass("ImageView");
		//Real ID생성
		viewHTML += getRealId(xml);
		//SPAN STYLE생성
		viewHTML += "style=\"";
		// 기본 Default View 속성 생성
		viewHTML += makeDefaultView(xml);
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		viewHTML += "\">"+getText(xml)+"</span></div>";
		return viewHTML;
	}

	// EditText 속성 추출
	function makeEditText(xml)
	{
		//INPUT TYPE VIEW생성
		return makeInputTypeView(xml, "text");
	}

	// RadioButton 속성 추출
	function makeRadioButton(xml)
	{
		//INPUT TYPE VIEW생성
		return makeInputTypeView(xml, "radio");
	}

	// CheckBox 속성 추출
	function makeCheckBox(xml)
	{
		//INPUT TYPE VIEW생성
		return makeInputTypeView(xml, "checkbox");
	}

	// WebView 속성 추출
	function makeWebView(xml)
	{
		//init 생성
		var viewHTML = "<iframe src=\""+defaultWebViewUrl+"\" "; 
		//WebView Class 생성
		viewHTML += setClass("WebView");
		//ID생성
		viewHTML += getId(xml);
		//STYLE생성
		viewHTML += "style=\""+defaultOrientation;
		//WIDTH생성
		viewHTML += getWidth(xml);
		//HEIGHT생성
		viewHTML += getHeight(xml);
		//WebView END 생성
		viewHTML += "\" frameborder=\"0\"></iframe>";
		//INPUT TYPE VIEW생성
		return viewHTML;
	}

	// InputType 속성 추출 (EditText, RadioButton, CheckBox)
	function makeInputTypeView(xml, type)
	{
		//DIV생성
		var viewHTML = "<div ";
		//ID생성
		viewHTML += getId(xml);
		//STYLE생성
		viewHTML += "style=\""+defaultOrientation;
		//MARGIN생성
		viewHTML += getMargin(xml);
		//WIDTH생성
		viewHTML += getWidth(xml);
		//END STYLE생성
		viewHTML += "\">";
		//SPAN CLASS생성
		switch(type)
		{
			case "text" : viewHTML += "<input class=\"EditText\" "; break;
			case "radio" : viewHTML += "<input class=\"RadioButton\" "; break;
			case "checkbox" : viewHTML += "<input class=\"CheckBox\" "; break;
		}
		//Real ID생성
		viewHTML += getRealId(xml);
		//SPAN STYLE생성
		viewHTML += "style=\"";
		// 기본 Default View 속성 생성
		viewHTML += makeDefaultView(xml);
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		if(type == "text")
		{
			viewHTML += "\" value=\""+getText(xml)+"\" type=\""+type+"\"></input>";
		}
		else
		{
			var text = getText(xml);
			viewHTML += "\" value=\""+text+"\" type=\""+type+"\">"+text+"</input>";
		}
		return viewHTML+"</div>";
	}

	// 기본 View 속성 추출
	function makeDefaultView(xml)
	{
		var viewHTML = "";
		//WIDTH생성
		viewHTML += getWidth(xml);
		//HEIGHT생성
		viewHTML += getHeight(xml);
		//MARGIN생성
		viewHTML += getMargin(xml);
		//RELATIVE MARGIN생성
		viewHTML += getRelativeMargin(xml);
		//TEXTSIZE생성
		viewHTML += getTextSize(xml);
		//TEXTSTYLE생성
		viewHTML += getTextStyle(xml);
		//TEXTCOLOR생성
		viewHTML += getTextColor(xml);
		//GRAVITY생성
		viewHTML += getGravity(xml);
		//ELLIPSIZE생성
		viewHTML += getEllipsize(xml);
		//BACKGROUND생성
		viewHTML += getBackground(xml);
		return viewHTML;
	}

	// 컴포넌트 Class 생성
	function setClass(className)
	{
		return "class=\""+className+"\"";
	}

	// XML Root 정보 생성
	function getRootInfo(xml)
	{
		var xmlRootInfo = xml.attr("xmlns:android");
		if(xmlRootInfo == null)
			return "";
		else
			return "xml=\""+xmlRootInfo+"\" ";
	}

	// XML Orientation값 추출
	function getOrientation(xml)
	{
		var xmlOrientation = xml.attr("android:orientation");
		if(xmlOrientation == null || xmlOrientation == "vertical") 
			defaultOrientation = "display:block;";
		else
			defaultOrientation = "display:inline;"; // "display:inline-block;";
		return "";
	}

	// XML Id값 추출
	function getId(xml)
	{
		var xmlID = xml.attr("android:id");
		if(xmlID == null)
			return "";
		else
			return "id=\""+xmlID.replace("@+id/", "")+"\" ";
	}

	// XML 실제 Id값 추출 (Drag&Drop 충돌 방지를 위에 postfix로 "_r"(real) 사용)
	function getRealId(xml)
	{
		// 고유 아이디를 사용하기 위해 임시로 id+[$-R]형태로 아이디 부여
		var xmlID = xml.attr("android:id");
		if(xmlID == null)
			return "";
		else
			return "id=\""+xmlID.replace("@+id/", "")+"[$-R]\" ";
	}

	//==================================================================================//
	// Default관련 Function
	//==================================================================================//

	// XML Width값 추출
	function getWidth(xml)
	{
		var xmlWidth = xml.attr("android:layout_width");
		if(xmlWidth == "wrap_content")
			return "";
		else if(xmlWidth == "fill_parent" || xmlWidth == "match_parent")
			return "width:100%;";
		else
			return "width:"+xmlWidth+";";
	}

	// XML Height값 추출
	function getHeight(xml)
	{
		var xmlHeight = xml.attr("android:layout_height");
		if(xmlHeight == "wrap_content")
			return "";
		else if(xmlHeight == "fill_parent" || xmlHeight == "match_parent")
			return "height:100%;";
		else
			return "height:"+xmlHeight+";";
	}

	// XML Background값 추출
	function getBackground(xml)
	{
		var xmlBackground = xml.attr("android:src");
		if(null != xmlBackground) // 안드로이드드 select 기능을 위해 src와 background가 구분 뒤어 있지만 View 상에서 무의미(역파싱 고려)
			xmlBackground = xml.attr("android:background");

		if(null != xmlBackground)
		{
			// XML Path 경로 추가 -------+-------+-------+-------
			var filePath = "";
			xmlBackground = "background:url('"+filePath+"/"+xmlBackground+"');background-size:cover;background-repeat:no-repeat;"
			if(getWidth(xml) == "width:100%;")
			{
				xmlBackground += "display:inline-block;";
			}
			return xmlBackground;
		}
		else
		{
			return "";
		}
	}

	// XML Margin값 추출
	function getMargin(xml)
	{
		var xmlMargin = xml.attr("android:layout_margin");
		if(xmlMargin == null)
			return "";
		else
			return "margin:"+xmlMargin+";";
	}

	// XML Relative Margin값 추출
	function getRelativeMargin(xml)
	{
		var xmlMarginLeft = xml.attr("android:layout_marginLeft");
		var xmlMarginRight = xml.attr("android:layout_marginRight");
		var xmlMarginBottom = xml.attr("android:layout_marginBottom");
		var xmlMarginTop = xml.attr("android:layout_marginTop");

		if(xmlMarginLeft == null && xmlMarginRight == null && 
			xmlMarginBottom == null && xmlMarginTop == null)
		{
			return "";
		}
		else
		{
			var xmlRelativeMargin = "";
			if(xmlMarginLeft != null)
				xmlRelativeMargin += "left:"+xmlMarginLeft+";";
			if(xmlMarginRight != null)
				xmlRelativeMargin += "right:"+xmlMarginRight+";";
			if(xmlMarginBottom != null)
				xmlRelativeMargin += "bottom:"+xmlMarginBottom+";";
			if(xmlMarginTop != null)
				xmlRelativeMargin += "top:"+xmlMarginTop+";";
			return xmlRelativeMargin;
		}
	}

	// XML Gravity 추출
	function getGravity(xml)
	{
		var xmlGravity = xml.attr("android:gravity");
		if(xmlGravity == null)
			return "";
		else
			return "text-align:"+xmlGravity+";";
	}	

	// XML Text값 추출
	function getText(xml)
	{
		var xmlText = xml.attr("android:text");
		if(xmlText == null)
			return "";
		else
			return xmlText;
	}

	//==================================================================================//

	//==================================================================================//
	// Text관련 Function
	//==================================================================================//

	// XML TextSize값 추출
	function getTextSize(xml)
	{
		var xmlTextSize = xml.attr("android:textSize");
		if(xmlTextSize == null)
			return "";
		else
			return "font-size:"+xmlTextSize+";";
	}

	// XML TextStyle값 추출
	function getTextStyle(xml)
	{
		var xmlTextStyle = xml.attr("android:textStyle");
		if(xmlTextStyle == null)
			return "";
		else
			return "font-style:"+xmlTextStyle+";";
	}

	// XML TextColor값 추출
	function getTextColor(xml)
	{
		var xmlTextColor = xml.attr("android:textColor");
		if(xmlTextColor == null)
			return "";
		else
			return "color:"+xmlTextColor+";";
	}

	// XML Ellipsize 추출
	function getEllipsize(xml)
	{
		var xmlEllipsize = xml.attr("android:ellipsize");
		if(xmlEllipsize == "end")
			return "text-overflow:ellipsis;overflow:hidden;display:inline-block;";
		else
			return "";
	}

	//==================================================================================//
});

