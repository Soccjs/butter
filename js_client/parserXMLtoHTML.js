var orientation = "display:block;";

var editor;


$(document).ready(function() 
{

	   	$("#rightToleft").click(function() {
	
				editor = ace.edit("right_editor_inner");

					console.log("click");
				var cur_contents = editor.getValue();
				console.log(cur_contents);
				makeParser(cur_contents);
			
		});
    	


	console.log("parser");
	// XML parser
	function makeParser(cur_contents)
	{
		var xml = cur_contents.replace(/\"/g,"'");
		var	xmlDoc = $.parseXML(xml);
		$xml = $(xmlDoc);

		var fullHtml = makeChildeNode(xmlDoc);
		$("#trash").html(fullHtml);

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
			case "LinearLayout" : eachHtml += makeLinearLayout(xmlDoc); break;
		}
		return eachHtml;
	}

	function makeLinearLayout(xml)
	{
		var textview = "<div style=\""+orientation+"\" ";

		//ID생성
		textview += "id=\""+getId(xml)+"\" ";
		//WIDTH생성
		textview += "width=\""+getWidth(xml)+"\" ";
		//HEIGHT생성
		textview += "height=\""+getHeight(xml)+"\">";

		textview += getOrientation(xml);

		return textview;
	}

	function makeRelativeLayout(xml)
	{
		var textview = "<div ";

		//ID생성
		textview += "id=\""+getId(xml)+"\" ";
		//WIDTH생성
		textview += "width=\""+getWidth(xml)+"\" ";
		//HEIGHT생성
		textview += "height=\""+getHeight(xml)+"\" ";
		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		textview += ">"+getText(xml)+"</div>";

		return textview;
	}

	// TextView 속성 추출
	function makeTextView(xml)
	{
		//ID생성
		var textview = "<div id=\""+getId(xml)+"\" ";

		//STYLE생성
		textview += "style=\""+orientation+"margin:"+getMargin(xml)+";"+"\">"+"<span class=\"TextView\" style=\"";

		//WIDTH생성
		var width = getWidth(xml);
		textview += "width:"+width+";";
		
		// 기본 Default View 속성 생성
		textview += makeDefaultView(xml, "TextView");

		//DEFAULT생성
		textview += "background:"+getBackground(xml, width, "TextView")+";";

		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		textview += "\">"+getText(xml)+"</span></div>";
		return textview;
	}
		
	// EditText 속성 추출
	function makeEditText(xml)
	{
		//ID생성
		var textview = "<div id=\""+getId(xml)+"\" ";

		//STYLE생성
		textview += "style=\""+orientation+"margin:"+getMargin(xml)+";"+"\">"+"<input style=\"";

		//WIDTH생성
		var width = getWidth(xml);
		textview += "width:"+width+";";
		
		// 기본 Default View 속성 생성
		textview += makeDefaultView(xml, "EditText");

		//DEFAULT생성
		textview += "background:"+getBackground(xml, width, "EditText")+";";

		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		textview += "\" value=\""+getText(xml)+"\"></div>";
		return textview;
	}

	// Button 속성 추출
	function makeButton(xml)
	{
		//ID생성
		var textview = "<div id=\""+getId(xml)+"\" ";

		//STYLE생성
		textview += "style=\""+orientation+"margin:"+getMargin(xml)+";padding:5px;display:inline-block;";

		//DEFAULT생성
		textview += "background:"+getBackground(xml, width, "Button")+";"+"\">";

		textview += "<span style=\"";

		//WIDTH생성
		var width = getWidth(xml);
		textview += "width:"+width+";";
		
		// 기본 Default View 속성 생성
		textview += makeDefaultView(xml, "Button");

		//TEXT생성:텍스트는 가장 마지막에 추가 하고 종료한다.
		textview += "\">"+getText(xml)+"</span></div>";
		return textview;
	}

	// 기본 View 속성 추출
	function makeDefaultView(xml, type)
	{
		var textview = "";
		//HEIGHT생성
		textview += "height:"+getHeight(xml)+";";

		//MARGIN생성
		textview += "margin:"+getMargin(xml)+";";

		//TEXTSIZE생성
		textview += "font-size:"+getTextSize(xml)+";";

		//TEXTSTYLE생성
		textview += "font-style:"+getTextStyle(xml)+";";

		//TEXTCOLOR생성
		textview += "color:"+getTextColor(xml, type)+";";

		//GRAVITY생성
		textview += "text-align:"+getGravity(xml)+";";

		//ELLIPSIZE생성
		textview += "text-overflow:"+getEllipsize(xml)+";";
		return textview;
	}

	// XML Orientation값 추출
	function getOrientation(xml)
	{
		var xmlRawData = xml.attr("android:orientation");
		if(xmlRawData == null || xmlRawData == "vertical") 
		{
			orientation = "display:block;";
			return "<ul id=\"layout_vertical\">";
		}
		else
		{
			orientation = "display:inline-block;";
			return "<ul id=\"layout_horizontal\">";
		}
	}

	// XML Id값 추출
	function getId(xml)
	{
		var xmlRawData = xml.attr("android:id");
		if(xmlRawData != null)
			xmlRawData = xmlRawData.replace("@+id/", "");
		else
			xmlRawData = "none";

		return xmlRawData;
	}

	//==================================================================================//
	// Default관련 Function
	//==================================================================================//

	// XML Width값 추출
	function getWidth(xml)
	{
		var xmlWidth = xml.attr("android:layout_width");
		if(xmlWidth == "wrap_content")
			return "0%";
		else if(xmlWidth == "fill_parent" || xmlWidth == "match_parent")
			return "100%";
		else
			return xmlWidth;
	}

	// XML Height값 추출
	function getHeight(xml)
	{
		var xmlHeight = xml.attr("android:layout_height");
		if(xmlHeight == "wrap_content")
			return "100%";
		else if(xmlHeight == "fill_parent" || xmlHeight == "match_parent")
			return "100%";
		else
			return xmlHeight;
	}

	// XML Background값 추출
	function getBackground(xml, width, type)
	{
		var xmlBackground = xml.attr("android:background");
		xmlBackground = "url('"+xmlBackground+"');background-size:cover;background-repeat:no-repeat"

		if(width == "100%")
		{
			xmlBackground += ";display:inline-block";
		}

		switch(type)
		{
			case "Button" : xmlBackground += ";background-color:#BBBBBB"; break;
			case "EditText" : xmlBackground += ";background-color:#FFFFFF"; break;
		}

		return xmlBackground;
	}

	// XML Margin값 추출
	function getMargin(xml)
	{
		return xml.attr("android:layout_margin");
	}

	// XML Gravity 추출
	function getGravity(xml)
	{
		return xml.attr("android:gravity");
	}

	//==================================================================================//
	// EditText관련 Function
	//==================================================================================//

	// XML Text값 추출
	function getInputType(xml)
	{
		var xmlText = xml.attr("android:inputType");
		switch(xmlText)
		{
			case "textPassword" : xmlText = "password"; break;
			case "number" : xmlText = "number"; break;
		}
		if(xmlText == null)
			return "";
		else
			return xmlText;
	}
	//==================================================================================//

	//==================================================================================//
	// Text관련 Function
	//==================================================================================//
	
	// XML Text값 추출
	function getText(xml)
	{
		var xmlText = xml.attr("android:text");
		if(xmlText == null)
			return "";
		else
			return xmlText;
	}

	// XML TextSize값 추출
	function getTextSize(xml)
	{
		var xmlTextSize = xml.attr("android:textSize");
		if(xmlTextSize == null)
			return "20px";
		else
			return xmlTextSize;
	}

	// XML TextStyle값 추출
	function getTextStyle(xml)
	{
		var xmlTextStyle = xml.attr("android:textStyle");
		if(xmlTextStyle == null)
			return "normal";
		else
			return xmlTextStyle;
	}

	// XML TextColor값 추출
	function getTextColor(xml, type)
	{
		var xmlTextColor = xml.attr("android:textColor");
		if(xmlTextColor == null)
		{
			switch(type)
			{
				case "EditText" :
				case "Button" : xmlTextColor = "#000000"; break;
				default : xmlTextColor = "#FFFFFF"; break;
			}
		}
		return xmlTextColor;
	}

	// XML Ellipsize 추출
	function getEllipsize(xml)
	{
		var xmlEllipsize = xml.attr("android:ellipsize");
		if(xmlEllipsize == "end")
			return "ellipsis;overflow:hidden;display:inline-block";
		else
			return "string";
	}

	//==================================================================================//
});

