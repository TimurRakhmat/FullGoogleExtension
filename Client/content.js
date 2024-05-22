
var enable_site_search = 1; 
var find_window_fixed = 0; 
var find_window_background = "white"; // the color of the pop-up window
var find_window_border = "blue"; // the border color of pop-up window
var find_text_color = "black";
var find_title_color = "white";
var find_window_width = 255;

var find_root_node = null;
var find_start_at_scroll = 1; 


var drag = {mousex:0,mousey:0,tempx:'',tempy:'',isdrag:false, drag_obj:null, drag_obj_x:0, drag_obj_y:0};

var find_timer = 0;  

var highlights = [];

var find_pointer = -1;

var find_text = ''; // Global variable of searched for text
var search_input = '';
var search_list = [];

var found_highlight_rule = 0;
var found_selected_rule = 0;



function levenshteinDamerau(s1, s2, costs) {
    var i, j, l1, l2, flip, ch, chl, ii, ii2, cost, cutHalf;
    l1 = s1.length;
    l2 = s2.length;

    costs = costs || {};
    var cr = costs.replace || 1;
    var cri = costs.replaceCase || costs.replace || 1;
    var ci = costs.insert || 1;
    var cd = costs.remove || 1;

    cutHalf = flip = Math.max(l1, l2);

    var minCost = Math.min(cd, ci, cr);
    var minD = Math.max(minCost, (l1 - l2) * cd);
    var minI = Math.max(minCost, (l2 - l1) * ci);
    var buf = new Array((cutHalf * 2) - 1);

    for (i = 0; i <= l2; ++i) {
        buf[i] = i * minD;
    }

    for (i = 0; i < l1; ++i, flip = cutHalf - flip) {
        ch = s1[i];
        chl = ch.toLowerCase();

        buf[flip] = (i + 1) * minI;

        ii = flip;
        ii2 = cutHalf - flip;

        for (j = 0; j < l2; ++j, ++ii, ++ii2) {
            cost = (ch === s2[j] ? 0 : (chl === s2[j].toLowerCase()) ? cri : cr);
            buf[ii + 1] = Math.min(buf[ii2 + 1] + cd, buf[ii] + ci, buf[ii2] + cost);
        }
    }
    return buf[l2 + cutHalf - flip];
}


function highlight(word, node)
{
	if (!node)
		node = document.body;
	
	
	
	for (node=node.firstChild; node; node=node.nextSibling)
	{	
		//console.log(node.nodeName);
		if (node.nodeType == 3) // text node
		{
			var n = node;
			//console.log(n.nodeValue);
			var match_pos = -1;
			//for (match_pos; match_pos > -1; n=after)
			{	
				let set = new Set();
				minPos = -1;
				search_list.forEach((value) => 
				{
					var listpos = n.nodeValue.toLowerCase().indexOf(value.toLowerCase());
					if (listpos > -1)
					{
						console.log(value + " Pos: " + listpos);
						set.add(listpos);
					}
				});


				
				
				if (set.size > 0)
				{
					//match_pos = Math.min(null, Array.from(set));
					let indexAr = Array.from(set);
					match_pos = indexAr[0];
					indexAr.forEach((el)=> {if (match_pos > el) match_pos = el;})
					console.log("linexessees:= " + match_pos + " : " + Array.from(set));
				}
				
				if (match_pos > -1) // if we found a match
				{
					console.log("linexessees1");
          console.log(match_pos + n.nodeValue);
					var before = n.nodeValue.substr(0, match_pos); // split into a part before the match
					var middle = n.nodeValue.substr(match_pos, word.length); // the matched word to preserve case
					//var after = n.splitText(match_pos+word.length);		
					var after = document.createTextNode(n.nodeValue.substr(match_pos+word.length)); // and the part after the match	
					var highlight_span = document.createElement("span"); // create a span in the middle
			        if (found_highlight_rule == 1)
						highlight_span.className = "highlight";
					else 
						highlight_span.style.backgroundColor = "yellow";	
			        
					highlight_span.appendChild(document.createTextNode(middle)); // insert word as textNode in new span
					n.nodeValue = before; // Turn node data into before
					n.parentNode.insertBefore(after, n.nextSibling); // insert after
		            n.parentNode.insertBefore(highlight_span, n.nextSibling); // insert new span
		           	highlights.push(highlight_span); 
		           	highlight_span.id = "highlight_span"+highlights.length;
					node=node.nextSibling; 
				}
			}
		}
		else // if not text node then it must be another element
		{
			// nodeType 1 = element
			if (node.nodeType == 1 && node.nodeName.match(/textarea|input/i) && node.type.match(/textarea|text|number|search|email|url|tel/i) && !getStyle(node, "display").match(/none/i)) 
				textarea2pre(node);
			else
			{
			if (node.nodeType == 1 && !getStyle(node, "visibility").match(/hidden/i)) // Dont search in hidden elements
			if (node.nodeType == 1 && !getStyle(node, "display").match(/none/i)) // Dont search in display:none elements
			highlight(word, node);
			}
		}
	}
	

} // end function highlight(word, node)


function unhighlight()
{
	for (var i = 0; i < highlights.length; i++)
	{
		
		var the_text_node = highlights[i].firstChild; // firstChild is the textnode in the highlighted span
	
		var parent_node = highlights[i].parentNode; // the parent element of the highlighted span
		
		// First replace each span with its text node nodeValue
		if (highlights[i].parentNode)
		{
			highlights[i].parentNode.replaceChild(the_text_node, highlights[i]);
			if (i == find_pointer) selectElementContents(the_text_node); 
			parent_node.normalize(); 
			normalize(parent_node);	
		}
	}
	// Now reset highlights array
	highlights = [];
	find_pointer = -1; 
} // end function unhighlight()


function normalize(node) {
  if (!node) { return; }
  if (node.nodeType == 3) {
    while (node.nextSibling && node.nextSibling.nodeType == 3) {
      node.nodeValue += node.nextSibling.nodeValue;
      node.parentNode.removeChild(node.nextSibling);
    }
  } else {
    normalize(node.firstChild);
  }
  normalize(node.nextSibling);
}


function findit(dir) 
{
	// put the value of the textbox in string
	//var string = document.getElementById('fwtext').value;
  var string = search_input;
  console.log(string + " in findit1");
	dir = dir || 1; // 1 = next; 2 = prev
	
	if (find_text.toLowerCase() == search_input.toLowerCase() &&
		find_pointer >= 0) 
	{	
		console.log("find NEXT");
		if (dir == 1) findnext(); 
		else findprev(); 
	}
	else
	{
		console.log("unhighlight");
		unhighlight(); // Remove highlights of any previous finds
		
		if (string == '') // if empty string
		{
			find_msg.innerHTML = "";
			
			return;
		}
		
		find_text = string;
		
		// Ver 5.0a - 7/18/2014. Next four lines because find_root_node won't exist until doc loads
		if (find_root_node != null)
			var node = document.getElementById(find_root_node);
		else
			var node = null;
		
		highlight(string, node); // highlight all occurrences of search string
		
		if (highlights.length > 0) // if we found occurrences
		{
			find_pointer = -1;
			if (find_start_at_scroll) // Version 5.4i
				find_pointer = find_highlight_at_scroll();
			clearSelection(); // Version 5.4i
			
			console.log("find next1");
			if (dir == 1) findnext(); 
			else findprev(); 
			console.log("find next2");
			//chrome.runtime.sendMessage({type: "SEARCH_ANS", data: highlights.length});
		}
		else
		{
			
			find_pointer = -1;	
		}
	}
	//findwindow.style.visibility = 'visible';
	//findwindow.style.display = 'block';	
	
}  // end function findit()


function findnext()
{
	var current_find;
	
	if (find_pointer != -1) // if not first find
	{
		current_find = highlights[find_pointer];
		
		// Turn current find back to yellow
		if (found_highlight_rule == 1)
			current_find.className = "highlight";
		else 
			current_find.style.backgroundColor = "yellow";
	}	
	
	find_pointer++;
	
	if (find_pointer >= highlights.length) // if we reached the end
			find_pointer = 0; // go back to first find
	
	var display_find = find_pointer+1;
	
	//find_msg.innerHTML = display_find+" of "+highlights.length;
	
	current_find = highlights[find_pointer];
	
	// Turn selected find orange or add .find_selected css class to it
	if (found_selected_rule == 1)
			current_find.className = "find_selected";
		else 
			current_find.style.backgroundColor = "orange";
			
	
	setTimeout(function(){ 
		scrollToPosition(highlights[find_pointer]);
	}, 250); 
} // end findnext()



// This function is to find backwards by pressing the Prev button
function findprev()
{
	var current_find;
	
	if (highlights.length < 1) return;
	
	if (find_pointer != -1) // if not first find
	{
		current_find = highlights[find_pointer];
		
		// Turn current find back to yellow
		if (found_highlight_rule == 1)
			current_find.className = "highlight";
		else 
			current_find.style.backgroundColor = "yellow";
	}	
	
	find_pointer--;
	
	if (find_pointer < 0) // if we reached the beginning
			find_pointer = highlights.length-1; // go back to last find
	
	var display_find = find_pointer+1;
	
	find_msg.innerHTML = display_find+" of "+highlights.length;
	
	current_find = highlights[find_pointer];
	
	// Turn selected find orange or add .find_selected css class to it
	if (found_selected_rule == 1)
			current_find.className = "find_selected";
		else 
			current_find.style.backgroundColor = "orange";
			
	//highlights[find_pointer].scrollIntoView(); // Scroll to selected element
	setTimeout(function(){ 
		scrollToPosition(highlights[find_pointer]);
	}, 250); // Version 5.4f - Android chrome was not scrolling to first find because keyboard taking too long to close?
	
} // end findprev()



function show()
{
	if (!find_window_fixed) 
		findwindow.style.top = (document.body.scrollTop || document.documentElement.scrollTop || 0) + "px"; // Version 5.4i
	var textbox = textVal;
	
	// Make the find window visible
	findwindow.style.visibility = 'visible';
	//fwtext.style.visibility = 'visible';
	
	// Put cursor focus in the text box
	textbox.focus(); 
	textbox.select(); 
	textbox.setSelectionRange(0, 9999);
	
	if (!find_window_fixed) find_timer = setInterval('move_window();', 500);
	// Setup to look for keypresses while window is open
	document.onkeydown = checkkey;
	
}

function hide()
{	
	unhighlight(); 
	
	// turn off timer to move window on scrolling
	clearTimeout(find_timer);
	
	// Make document no longer look for enter key
	document.onkeydown = null;
	
}

function resettext()
{
	if (find_text.toLowerCase() != search_input.toLowerCase())
		unhighlight(); // Remove highlights of any previous finds
	
} 

function isOnScreen(el) 
{
	
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; // Version 1.2.0
	var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth; // Version 1.2.0
	var scrollBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + scrollTop;
	var scrollRight = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) + scrollLeft;
	var onScreen = false;
	
	 
	var rect = el.getBoundingClientRect();
	if (rect.bottom >= 0 && rect.right >= 0 && 
		rect.top <= screenHeight && rect.left <= screenWidth) 
		return true;
	else { 
		
		var distance = Math.min(Math.abs(rect.bottom), Math.abs(rect.right), Math.abs(rect.top - screenHeight), Math.abs(rect.left - screenWidth));	
		
		return -Math.abs(distance); 
	}
}

function scrollToPosition(field)
{  
   
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var scrollBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + scrollTop;
	var scrollRight = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) + scrollLeft;

   if (field)
   {
		if (isOnScreen(field) != true) 
		{
			//window.scrollTo(elemPosX ,elemPosY); 
			var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
			if(isSmoothScrollSupported) {
	   			field.scrollIntoView({
			     behavior: "smooth",
			     block: "center"
			   });
			} else {
			   
			   field.scrollIntoView(false);
			}
		}
		
	}
} 


function getStyle(el,styleProp)
{
	
	var x = (document.getElementById(el)) ? document.getElementById(el) : el;
	if (x.currentStyle) // IE
		var y = x.currentStyle[styleProp];
	else if (window.getComputedStyle)  // FF
		var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
	return y;
}


function textarea2pre(el)
{		
	// el is the textarea element
	
	// If a pre has already been created for this textarea element then use it
	if (el.nextSibling && el.nextSibling.id && el.nextSibling.id.match(/pre_/i))
		var pre = el.nextsibling;
	else
		var pre = document.createElement("pre");
	
	var the_text = el.value; // All the text in the textarea		
	
	// replace <>" with entities
	the_text = the_text.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
	//var text_node = document.createTextNode(the_text); // create text node for pre with text in it
	//pre.appendChild(text_node); // add text_node to pre			
	pre.innerHTML = the_text;
	
	// Copy the complete HTML style from the textarea to the pre
	var completeStyle = "";
	if (typeof getComputedStyle !== 'undefined') // webkit
	{
		completeStyle = window.getComputedStyle(el, null).cssText;
		if (completeStyle != "")
			pre.style.cssText = completeStyle;
		else { 
			var style = window.getComputedStyle(el, null);
			for (var i = 0; i < style.length; i++) {
    			completeStyle += style[i] + ": " + style.getPropertyValue(style[i]) + "; ";
    		}
    		pre.style.cssText = completeStyle;
		}
	}
	else if (el.currentStyle) // IE
	{
		var elStyle = el.currentStyle;
	    for (var k in elStyle) { completeStyle += k + ":" + elStyle[k] + ";"; }
	    //pre.style.cssText = completeStyle;
	    pre.style.border = "1px solid black"; // border not copying correctly in IE
	}
	
	el.parentNode.insertBefore(pre, el.nextSibling); // insert pre after textarea
	
	
	el.onblur = function() { this.style.display = "none"; pre.style.display = "block"; };
	
	el.onchange = function() { pre.innerHTML = el.value.replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
	
	el.style.display = "none"; // hide textarea
	pre.id = "pre_"+highlights.length; // Add id to pre
	
	
	pre.onclick = function() {this.style.display = "none"; el.style.display = "block"; el.focus(); el.click()};
	
	// this.parentNode.removeChild(this); // old remove pre in onclick function above
	 
}

function selectElementContents(el) 
{
    
	if (window.getSelection && document.createRange) {
        // IE 9 and non-IE
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (document.body.createTextRange) {
        // IE < 9
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.select();
        //textRange.execCommand("Copy");
    }
}

function find_highlight_at_scroll() { 
	var scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || 0;
	var pointer = -1;
	for (var i = 0; i < highlights.length; i++) {
		if ((highlights[i].getBoundingClientRect().y + scrollTop) > scrollTop)
			break;
		pointer = i;
	}
	return pointer;
}

function clearSelection() { 
 if (window.getSelection) {window.getSelection().removeAllRanges();}
 else if (document.selection) {document.selection.empty();}
}

// chrome.runtime.onMessage.addListener((message) => {
// 	if(message.type === "SEARCH") {
// 	  search_input = message.data;
// 	  console.log("start " + search_input);
// 	  findit();
// 	  console.log("end " + search_input);
// 	  chrome.runtime.sendMessage({type: "SEARCH_ANS", data: message.data + "5"});
// 	}
//   });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.type === 'SEARCH') {
		(async () => {
			search_input = message.data;
			let arra = document.body.innerText.split(/(\s+)/).filter( e => e.trim().length > 0)
			.map(el => el.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).map(el => el.toLowerCase());
			//arra = document.body.innerText.split("\\W+").map(e => e.trim()).filter( e => e.trim().length > 0);
			search_list = [];
			let set = new Set();
			set.add(search_input.toLowerCase());
			//search_list.push(search_input);
			let errorSize = 1;
			errorSize +=  Number(search_input.length / 8);
			console.log(arra);
			//arra.forEach(el => el = el.replace(/[^\w\s]|_/g, ""));
			//console.log(arra);


			// let response = await fetch('http://127.0.0.1:8080/app', {
			// 	method: 'POST',
			// 	headers: {
			// 	  'Accept': 'application/json',
			// 	  'Content-Type': 'application/json',
			// 	  'Access-Control-Allow-Origin': '*'
			// 	},
			// 	body: JSON.stringify({
			// 		"find_str": search_input.toLowerCase(),
			// 		"find_arr": arra
			// 	})
			//   });

			let sendback = {
				body: JSON.stringify({
					 		"find_str": search_input.toLowerCase(),
					 		"find_arr": arra
					 	})
			};
			console.log(sendback);

			const data = await forwardRequest({
				"find_str": search_input.toLowerCase(),
				"find_arr": arra
			});
    		//let data = await response.json();
			console.log(data);
			data.ans_find.forEach(element => {
				set.add(element)
			});

			arra.forEach(element => {
				if (levenshteinDamerau(search_input.toLowerCase(), element.toLowerCase()) <= errorSize){
					set.add(element.toLowerCase());
				}
			});
			search_list = Array.from(set);
			console.log("l array word:");
			console.log(search_list);
			console.log("start " + search_input);
			document.body.style.backgroundColor = search_input;
			findit();
			console.log("end " + search_input);
			sendResponse({data: highlights.length});
		})();
	  	//chrome.runtime.sendMessage({type: "SEARCH_ANS", data: message.data + "5"});
	}
	else if(message.type === 'SEARCH_NEXT') {
		search_input = message.data;
		console.log("startNEXT " + search_input);
		document.body.style.backgroundColor = search_input;
	  	findit();
	  	console.log("endNEXT " + search_input);
	  	//chrome.runtime.sendMessage({type: "SEARCH_ANS", data: message.data + "5"});
	}
	else if(message.type === 'HIDE') {
		console.log("hide request");
		hide();
	  	//chrome.runtime.sendMessage({type: "SEARCH_ANS", data: message.data + "5"});
	}
	return true;
});


function forwardRequest(message) {
	return new Promise((resolve, reject) => {
		console.log(message);
	  chrome.runtime.sendMessage(message, (response) => {
		if (!response) return reject(chrome.runtime.lastError)
		return resolve(response)
	  })
	})
  }