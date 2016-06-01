var urls = []

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(changeInfo.url != undefined && changeInfo.url.substring(0, 9) != "chrome://") {
    	console.log("new URL: " + changeInfo.url);
    	urls[tabId] = changeInfo.url;
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    // how to fetch tab url using activeInfo.tabid
    chrome.tabs.get(activeInfo.tabId, function(tab) {
    	if(tab.url.substring(0, 9) != "chrome://") {
        	console.log("new active tab: " + tab.url);
        	urls[activeInfo.tabId] = tab.url;
    	}
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	console.log("tab closed: " + urls[tabId]);
});