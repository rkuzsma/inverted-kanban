// Settings that are specific to your environment/instance.
define(
'modules/config', // this module
[], // our dependencies
function () {
	var Exports = function() {
	}
	
	var getConfig = Exports.prototype.getConfig = function() {
		return _config;
	}
	
	var _config = {};
	
	/**** JIRA CONFIGURATION ***/
	// We must use a CORS proxy in order to query Jira using their published REST APIs.
	// Jira doesn't natively support CORS or JSONP, see JRA-30371.
	// Option 1: Wait for JRA-30371 to be fixed. Then we can access it directly using:
	//         _config.jira.restRoute='https://jira.roving.com/rest/api/2/'
	// Option 2: Enable CORS on Jira using a hack workaround - https://answers.atlassian.com/questions/69356/cross-origin-resource-sharing-with-jira-rest-api-and-javascript
	//           (not a good option for production Jira servers due to future upgrade complications)
	// Option 3: Enable JSONP on Jira server by setting atlassian.allow.jsonp=true
	//           See: https://developer.atlassian.com/display/JIRADEV/Preparing+for+JIRA+6.0#PreparingforJIRA6.0-JSON-Pnolongersupported
	// Option 4: Run our own CORS proxy server to blindly route our REST queries to Jira.
	//           Run 'npm install cors-anywhere' and you can access Jira through it like this:
	//           _config.jira-restRoute = 'http://127.0.0.1:8080/https://jira.example.com:443/rest/api/2/';
	// We'll go with Option 4; we installed cors-anywhere and run it on port 9199.
	_config.jira = {};
	_config.jira.restRoute = 'http://replaceme:port/https://jira.example.com:443/rest/api/2/';
	_config.jira.homeUrl = 'https://jira.example.com';
	
	/*** USERS CONFIGURATION ***/
	_config.users = [
		{'full_name': 'Joe', 'uname': 'jcoder'},
		{'full_name': 'Sam', 'uname': 'sprogrammer'},
		{'full_name': 'Betty', 'uname': 'bdeveloper'}
	];
	
	_config.title = 'Your Title Here';
	
	_config.navbar = {};
	_config.navbar.title = 'Your Title Here';
	_config.navbar.links = [
		{'url': '/', 'text': 'ʞanban Board'},
		{'url': '/', 'text': 'Some Other Link'}
	]
	
	return Exports;
});
