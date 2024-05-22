const grabBtn = document.getElementById("grabBtn");
const cnclBtn = document.getElementById("cnclBtn");
textVal = document.getElementById("gsearch");
resval = document.getElementById("res");

document.onkeydown = checkkey;



grabBtn.addEventListener("click",() => {    
    chrome.tabs.query({active: true}, (tabs) => {
        const tab = tabs[0];
        
        if (tab) {
            console.log(tab.id);
            execScript(tab);    
        } else {
            alert("There are no active tabs")
        }
    });
})


cnclBtn.addEventListener("click",() => {    
  chrome.tabs.query({active: true}, (tabs) => {
      const tab = tabs[0];
      
      if (tab) {
          console.log(tab.id);
          execCancScript(tab);    
      } else {
          alert("There are no active tabs")
      }
  });
})


function execScript(tab) {
    // Выполнить функцию на странице указанной вкладки
    // и передать результат ее выполнения в функцию onResult
    // chrome.scripting
    // .executeScript({
    //   target : {tabId : tab.id},
    //   func : getTitle,
    //   args : [ textVal.value ],
    // })
    // .then(injectionResults => {
    //   for (const {frameId, result} of injectionResults) {
    //     //alert(`Frame ${frameId} result:${result}`);
    //     resval.innerHTML  = result;
    //   }
    // });

    //chrome.runtime.sendMessage({type: "SEARCH", data: textVal.value});
    //chrome.tabs.sendMessage(tab.id, {type: "SEARCH", data: textVal.value});
    console.log("send: " + textVal.value)
    chrome.tabs.sendMessage(tab.id, {type: "SEARCH", data: textVal.value}, function(response) {
      console.log(response);
      resval.innerText = response.data;
    });
}


function execCancScript(tab) {
  console.log("Hide: " + textVal.value)
  chrome.tabs.sendMessage(tab.id, {type: "HIDE", data: textVal.value});
}



chrome.runtime.onMessage.addListener((message) => {
  if(message.type === "SEARCH_ANS") {
    console.log("answer" + message.data);
    resval.innerText = message.data;
  }
});

function checkkey(e)
{	
	var keycode;
	if (window.event)  // if ie
		keycode = window.event.keyCode;
	else // if Firefox or Netscape
		keycode = e.which;
	
	//find_msg.innerHTML = keycode;
	
	if (keycode == 13) // if ENTER key
	{	
		// ver 5.1 - 10/17/2014 - Blur on search so keyboard closes on iphone and android
		if (window.event && event.srcElement.id.match(/fwtext/i)) event.srcElement.blur(); 
		else if (e && e.target.id.match(/fwtext/i)) e.target.blur();
		//findit(); // call findit() function (like pressing NEXT)	
    console.log("next press")
    chrome.tabs.query({active: true}, (tabs) => {
      const tab = tabs[0];
      
      if (tab) {
          console.log(tab.id);
          chrome.tabs.sendMessage(tab.id, {type: "SEARCH_NEXT", data: textVal.value});
      } else {
          alert("There are no active tabs")
      }
  });
    
	}
	else if (keycode == 27) // ESC key // Ver 5.1 - 10/17/2014
	{
    chrome.tabs.query({active: true}, (tabs) => {
      const tab = tabs[0];
      
      if (tab) {
          console.log(tab.id);
          chrome.tabs.sendMessage(tab.id, {type: "HIDE", data: textVal.value});
      } else {
          alert("There are no active tabs")
      }
  });
		//hide(); // Close find window on escape key pressed
	}
}

