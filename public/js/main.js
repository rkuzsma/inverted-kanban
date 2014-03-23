require.config({
    paths: {
        'jQuery': '../../dist/js/jquery-1.10.2.min',
		'jQuery.bootstrap': '../../dist/js/bootstrap.min',
		'amplify': '../../dist/js/amplify.min'  // for easy pub-sub events
    },
    shim: {
		'jQuery.bootstrap': {
			deps: ['jQuery']
		},
        'jQuery': {
            exports: '$'
        },
		'amplify': {
			deps: ['jQuery'],
			exports: 'amplify'
		}
    }

});

// Load modules and use them
require([
	'modules/config',
	'modules/md5', 
	'modules/navbar', 
	'modules/users', 
	'modules/jira', 
	'modules/jira_ui',
	'jQuery', 
	'jQuery.bootstrap'],
	function(
		modConfigRef,
		modMd5Ref,
		modNavbarRef, 
		modUsersRef, 
		modJiraRef, 
		modJiraUiRef,
		$, 
		modBootstrapRef)
		{
			// Subscribe to onUserChanged event fired by Users module via Amplify.js
			amplify.subscribe('onUserChanged', onUserChanged);
			function onUserChanged(user) {
				// Display the new user's details
				if (user.uname != 'UNDEFINED_USER') {
					$( '#board_title' ).html('<img src="'+user.gravatar_img_medium+'"/> ' +
					user.full_name + "'s Tickets");
				}
				else {
					$( '#board_title' ).html('All Tickets');
				}
			}
			
			var config = new modConfigRef().getConfig();
			
			document.title = config.title;
			
			var modNavbar = new modNavbarRef(config.navbar);
			modNavbar.initialize();
			
			// See modules/config.js for the Jira URLs
			var modJira = new modJiraRef(config.jira.restRoute);
			var modJiraUi = new modJiraUiRef(modJira, config.jira.homeUrl);
			modJiraUi.initialize();
			
			// See modules/config.js for the username list
			var modUsers = new modUsersRef();
			modUsers.initialize(config.users);
			
			modUsers.shuffle(); // Randomize the order in which users appear in the users list
			modUsers.render('users'); // 'users' is the ID of the users DIV
			modUsers.hookShiftUpDownKeys();
		});