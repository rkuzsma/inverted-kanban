define('modules/navbar', [], function () {
	var _navbarConfig = null;
	
	// navbarConfig:
	// { title: 'Some Title',
	//   links: [
	//     { url: 'http://example.com/', text: 'Example 1' },
	//     { url: 'http://example.com/', text: 'Example 2' }
	//   ]
	// }
	var Exports = function(navbarConfig) {
		_navbarConfig = navbarConfig;
	};
	
	var initialize = Exports.prototype.initialize = function() {
		$( document ).ready(function() {
			
			// Update the navbar span elements with a title and links
			
			$('#navbar-title').text(_navbarConfig.title);
			
			var links = '';
			for (var i = 0; i < _navbarConfig.links.length; i++) {
				var link = _navbarConfig.links[i];
				links += '<li><a href="'+link.url+'" target="_blank">'+link.text+'</a></li>';
			}
			$('#navbar-list').html(links);
		});
	};
	
	return Exports;
});
