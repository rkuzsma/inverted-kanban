// This module exposes an amplify event called 'onUserChanged(user)'
// which is triggered whenever the active user is changed.
define(
'modules/users', // this module
['modules/md5', 'amplify'], // our dependencies
function (modMd5Ref, modAmplifyRef) {
	var Exports = function() {
	}

	var modMd5 = new modMd5Ref();
	var _activeUser = null;
	var _users = null;

	var getActiveUser = Exports.prototype.getActiveUser = function() {
		return _activeUser;
	};

	// @targetId is the DIV ID where to render the users
	var render = Exports.prototype.render = function(targetId) {
		_render(targetId);
	};

	var shuffle = Exports.prototype.shuffle = function() {
		var firstUser = _users[0]; // Don't shuffle the first "All users" item.
		_users.splice(0,1);
		_shuffle(_users);
		_users.unshift(firstUser);
	};

	// Example usage:
	//	initialize([{'full_name': 'User One', 'uname': 'user1'}, {'full_name': 'User Two', 'uname': 'user2'} ]);
	var initialize = Exports.prototype.initialize = function(usersArray) {
		_initialize(usersArray);
	};

	// Trap "Shift+Up Arrow" and "Shift+Down Arrow"
	// to trigger highlighting the next/prev user in the list.		
	var hookShiftUpDownKeys = Exports.prototype.hookShiftUpDownKeys = function() {
		$(document).keydown(function(event) {
			var UP_KEY=38;
			var DOWN_KEY=40;
			if (event.shiftKey) {
				switch (event.keyCode) {
					case UP_KEY:
					_highlightPrevUser();
					break;
					case DOWN_KEY:
					_highlightNextUser();
					break;
				}
			}
		});
	};

	var _initialize = function(usersArray) {
		_users = usersArray;
		
		var allUsersItem = _createUser("All Users", 'UNDEFINED_USER')
		_users.unshift(allUsersItem);

		for(var i = 0; i < _users.length; i++) {
			var user = _users[i];
			if (user.full_name == undefined) {
				throw 'full_name is undefined';
			}
			if (user.uname == undefined) {
				throw 'uname is undefined';
			}
			if (user.email == undefined) {
				user.email = user.uname+'@constantcontact.com';
			}
			var hash = modMd5.md5(user.email);
			if (user.gravatar_img_medium == undefined) {
				user.gravatar_img_medium = 'http://www.gravatar.com/avatar/'+hash+'?s=50';
			}
			if (user.gravatar_img_small == undefined) {
				user.gravatar_img_small = 'http://www.gravatar.com/avatar/'+hash+'?s=25';
			}
		}
	};

	// Attribution goes to http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
	var _shuffle = function(o) {
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};

	// @targetId is the DIV ID where to render the users
	var _render = function(targetId) {

		$( document ).ready(function() {

			// Populate users into the list
			for(var i = 0; i < _users.length; i++) {
				var user = _users[i];
				user._ordinal = i;
				$('#'+targetId).append(_linkItemForUser(user));
				_bindUserLink(user);
			}

			// Highlight the first user
			_onUserChanged(_users[0]);
		});
	};

	var _linkItemForUser = function(user) {
		var uname = user.uname;
		var fname = user.full_name;
		if (uname=='UNDEFINED_USER') {
			return '<a id="'+uname+'" class="list-group-item" href="#">'+
			'<span class="list-group-item-heading">'+fname+'</span>' +
			'</a>';
		}
		else {
			return '<a id="'+uname+'" class="list-group-item" href="#">' +
			'<img class="img-thumbnail" src="'+user.gravatar_img_small+'"/>'+
			'<span class="list-group-item-heading">'+fname+'</span>' +
			'</a>';
		}
	};

	var _onUserChanged = function(user) {
		// Toggle the "active" highlight on the menu
		var activeUser = getActiveUser();
		if (activeUser != null) {
			$( '#'+activeUser.uname ).removeClass('active');
		}
		$( '#'+user.uname ).addClass('active');
		_activeUser = user;
		
		amplify.publish('onUserChanged', user);
	};

	var _bindUserLink = function(user) {
		$( '#'+user.uname ).click({user:user}, function( event ) {
			_onUserChanged(event.data.user);
		});
	};

	var _highlightPrevUser = function() {
		var activeUser = getActiveUser();
		if (activeUser == null) {
			return;
		}
		var next_ordinal = activeUser._ordinal - 1;
		if (next_ordinal < 0) {
			next_ordinal = _users.length-1;
		}
		_onUserChanged(_users[next_ordinal]);
	};

	var _highlightNextUser = function() {
		var activeUser = getActiveUser();
		if (activeUser == null) {
			return;
		}
		var next_ordinal = activeUser._ordinal + 1;
		if (next_ordinal >= _users.length) {
			next_ordinal = 0;
		}
		_onUserChanged(_users[next_ordinal]);
	};

	var _createUser = function(full_name, uname) {
		var email = uname+'@constantcontact.com';
		var hash = modMd5.md5(email);
		return {
			'full_name': full_name,
			'uname': uname,
			'email': email,
			'gravatar_img_medium': 'http://www.gravatar.com/avatar/'+hash+'?s=50',
			'gravatar_img_small': 'http://www.gravatar.com/avatar/'+hash+'?s=25'
		};
	};
	
	return Exports;
});
