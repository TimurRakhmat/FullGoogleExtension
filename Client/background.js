chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // sendResponse can be used to send back a result to the content script
	console.log(request);
    fetch('http://127.0.0.1:8080/app', {
				method: 'POST',
				headers: {
				  'Accept': 'application/json',
				  'Content-Type': 'application/json',
				  'Access-Control-Allow-Origin': '*'
				},
				body: JSON.stringify({
					 		"find_str": "test",
					 		"find_arr": ["wefw", "wetw", "testa"]
					 	})
			  })
         .then((response) => response.json())
         .then((codeTourContent) => sendResponse(codeTourContent));
    // As we will reply asynchronously to the request, we need to tell chrome to wait for our response
    return true
})