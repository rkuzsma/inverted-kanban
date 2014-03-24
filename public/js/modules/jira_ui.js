define('modules/jira_ui', // this module
['modules/users','modules/jira','amplify'], // our dependencies
function (modUsersRef, modJiraRef) {
	var modJira = null;
	var modUsers = new modUsersRef();
	var JIRA_HOME_URL = null;
	
	var Exports = function(modJiraInst, jiraHomeUrl) {
		modJira = modJiraInst;
		JIRA_HOME_URL = jiraHomeUrl;
	}

	var initialize = Exports.prototype.initialize = function() {

		amplify.subscribe('onUserChanged', _onUserChanged);

		$( document ).ready(function() {


			$('#jira_query_show_closed').change( function() {
				_updateJqlText();
				_queryJira();
			});
			$('#jira_query_blockers_and_criticals').change( function() {
				_updateJqlText();
				_queryJira();
			});
			$('#jira_query_fixVersion_1').change( function() {
				_updateJqlText();
				_queryJira();
			});
			$('#jira_query_fixVersion_2').change( function() {
				_updateJqlText();
				_queryJira();
			});
			$('#jira_query_fixVersion_3').change( function() {
				_updateJqlText();
				_queryJira();
			});
			
			$('#jira_external_query').on('click', _queryJira_external);

		});
	};

	// Invoked from pub/sub event triggered by Users module, which triggers Amplify.
	var _onUserChanged = function() {
		_updateJqlText();
		_queryJira();
	};

	var _updateJqlText = function() {
		var show_closed = $('#jira_query_show_closed').is(':checked');
		var blockers_and_criticals_only = $('#jira_query_blockers_and_criticals').is(':checked');

		var jql = 'project = VN';

		// fixVersions
		var fixVersions = '';
		for (var i=1; i <= 3; i++) {
			var ctl = $('#jira_query_fixVersion_'+i);
			if (ctl.is(':checked')) {
				if (fixVersions != '') {
					fixVersions += ',';
				}
				fixVersions += '"'+ctl.val()+'"';
			}
		}
		if (fixVersions != '') {
			jql += ' AND fixVersion in (' + fixVersions + ')';
		}

		// Assignee
		var activeUser = modUsers.getActiveUser();
		if (activeUser != undefined && activeUser.uname != 'UNDEFINED_USER') {
			jql += ' AND assignee=' + activeUser.uname
		}

		// Red Team filter
		jql += ' AND (labels in (RedTeam) OR labels not in (RedTeam, BlueTeam))';

		if (!show_closed) {
			jql += ' AND Status!=Closed';
		}
		if (blockers_and_criticals_only) {
			jql += ' AND Priority in ("Blocker", "Critical")';
		}

		// Sort order
		jql += ' ORDER BY fixVersion ASC, Status DESC, priority, severity DESC, assignee ASC';

		$('#jira_query_text').text(jql);
	};


	// Sort tickets by Release, then by Status, then by Priority, then by Assignee
	// 'issues' is the issues array that comes back from JIRA JSON response
	var _sortIssues = function(issues) {
		var statuses = {};
		var i=1;
		statuses['Closed'] = i++;
		statuses['Test Done'] = i++;
		statuses['In Test'] = i++;
		statuses['Ready for Test'] = i++;
		statuses['In Development'] = i++;
		statuses['Ready for Development'] = i++;
		statuses['Planning'] = i++;
		statuses['Todo/User Story'] = i++;

		var priorities = {};
		i = 1;
		priorities['Blocker'] = i++;
		priorities['Critical'] = i++;
		priorities['High'] = i++;
		priorities['Medium'] = i++;
		priorities['Low'] = i++;
		priorities['None'] = i++;

		issues.sort(function(a,b) {
			// Sort by Release Date
			// A ticket can have many fixVersions; we only look at the first one.
			var fixVersion_a = '';
			var fixVersion_b = '';
			if (a.fields.fixVersions.length > 0) {
				fixVersion_a = a.fields.fixVersions[0].releaseDate;
			}
			if (b.fields.fixVersions.length > 0) {
				fixVersion_b = b.fields.fixVersions[0].releaseDate;
			}
			if (fixVersion_a < fixVersion_b) {
				return -1;
			}
			else if (fixVersion_a > fixVersion_b) {
				return 1;
			}

			// Release Dates are equal
			// Sort by Status
			var status_a = statuses[a.fields.status.name];
			var status_b = statuses[b.fields.status.name];
			if (status_a < status_b) {
				return -1;
			}
			else if (status_a > status_b) {
				return 1;
			}

			// Statuses are equal
			// Sort by Priority
			var priority_a = priorities[a.fields.priority.name];
			var priority_b = priorities[b.fields.priority.name];
			if (priority_a < priority_b) {
				return -1;
			}
			else if (priority_a > priority_b) {
				return 1;
			}

			// Priorities are equal
			// Sort by Assignee
			var assignee_a = (a.fields.assignee == null ? '' : a.fields.assignee.name);
			var assignee_b = (b.fields.assignee == null ? '' : b.fields.assignee.name);
			if (assignee_a < assignee_b) {
				return -1;
			}
			else if (assignee_a > assignee_b) {
				return 1;
			}
			return 0;
		});
	};

	// Update 'issues' with the total number of child issues in each Release or Status group.
	//
	// This method injects the following properties into an issue:
	//  issue.INJECTED_fixVersionRowCountObj.count  - number of child items in this release group
	//  issue.INJECTED_statusRowCount - number of child items in this status group
	//
	// @param issues - the issues array that comes back from JIRA JSON response
	var _setIssueCounts = function(issues) {
		// Keep track of table row IDs for Release and Status so we can
		// back-fill them with issue counts
		var fixVersionIssueObj = null;
		// We use an object to store the Release group count so that the Status group 
		// can have a reference to this count.
		var fixVersionRowCountObj = new Object();
		fixVersionRowCountObj.count = 0; // total number of rows in a particular Release group
		var statusIssueObj = null;
		var statusRowCount = 0; // total number of rows in a particular Status group
		var prevFixVersion = '';
		var prevStatus = '';

		if (issues.length == 0) return;

		jQuery.each(issues, function() {
			// We only use the first fixVersion listed on the ticket.
			var fixVersion = '';
			if (this.fields.fixVersions.length > 0) {
				fixVersion = this.fields.fixVersions[0].name;
			}
			var status = this.fields.status.name;

			if (fixVersion != prevFixVersion) {
				// Update the count of issues in the previous Release group
				if (fixVersionIssueObj != null) {
					fixVersionIssueObj.INJECTED_fixVersionRowCountObj = fixVersionRowCountObj;
					fixVersionRowCountObj = new Object();
					fixVersionRowCountObj.count = 0;
				}
				fixVersionIssueObj = this;
				prevFixVersion = fixVersion;
				prevStatus = '';
			}
			if (status != prevStatus) {
				// Update the count of issues in the previous Status group
				if (statusIssueObj != null) {
					statusIssueObj.INJECTED_statusRowCount = statusRowCount;
					statusIssueObj.INJECTED_fixVersionRowCountObj = fixVersionRowCountObj;
					statusRowCount = 0;
				}
				statusIssueObj = this;
				prevStatus = status;
			}

			statusRowCount++;
			fixVersionRowCountObj.count++;
		});
		fixVersionIssueObj.INJECTED_fixVersionRowCountObj = fixVersionRowCountObj;
		statusIssueObj.INJECTED_statusRowCount = statusRowCount;
		statusIssueObj.INJECTED_fixVersionRowCountObj = fixVersionRowCountObj;
	};

	var _populateBoard = function(datas) {
		$('#jira_content').html('');

		var issues = datas.issues;
		if (issues.length == 0) return;

		_sortIssues(issues);

		// Fill in Totals for all the issues, grouped by Release and Status.
		_setIssueCounts(issues);

		// Detect when Release and Status changes as we iterate through the issues
		// so we can visually highlight the Release and Status groupings.
		var prevFixVersion = '';
		var prevStatus = '';
		// Highlight all rows for every odd release
		var tr_class = 'active'; // oscillates between '' and 'active'

		var tableHtml = '<table class="table .table-condensed">'+
		//				'<thead><tr><th>Release</th><th>Status</th></tr></thead>'+
		'<tbody>';

		jQuery.each(issues, function() {
			// We only use the first fixVersion listed on the ticket.
			var fixVersion = '';
			if (this.fields.fixVersions.length > 0) {
				fixVersion = this.fields.fixVersions[0].name;
			}
			var status = this.fields.status.name;
			var priorityIconUrl = this.fields.priority.iconUrl;
			var priority = this.fields.priority.name;
			var typeIconUrl = this.fields.issuetype.iconUrl;
			var type = this.fields.issuetype.name;
			var key = this.key;
			var summary = this.fields.summary;
			var avatarIconUrl = '';
			var assignee = '';
			if (this.fields.assignee != undefined) {
				assignee = this.fields.assignee.displayName;
				if (this.fields.assignee.avatarUrls != undefined) {
					avatarIconUrl = this.fields.assignee.avatarUrls["16x16"];
				}
			} 

			if (fixVersion != prevFixVersion) {
				prevFixVersion = fixVersion;
				prevStatus = '';
				// Highlight all rows in every other Release group
				if (tr_class == '') {
					tr_class = 'active';
				}
				else {
					tr_class = '';
				}
				tableHtml += '<tr class="info"><td colspan="8"><strong>' +
				fixVersion + ' <span class="pull-right">' + this.INJECTED_fixVersionRowCountObj.count + ' tickets</span> ' +
				'</strong></td></tr>';
			}
			if (status != prevStatus) {
				prevStatus = status;
				tableHtml += '<tr class="'+tr_class+'"><td></td><td colspan="7"><strong>' + 
				status + ' <span class="pull-right">' + this.INJECTED_statusRowCount + ' out of ' +
				this.INJECTED_fixVersionRowCountObj.count + ' tickets</span>' +
				'</strong></td></tr>';
			}
			if (priority=='Blocker' || priority == 'Critical') {
				tableHtml += '<tr class="danger">';
			}
			else {
				tableHtml += '<tr class="'+tr_class+'">';
			}

			tableHtml += 
			'<td></td>' + // + fixVersion + '</td>'+
			'<td></td>' + // + status + '</td>'+
			'<td>' + '<img src="'+priorityIconUrl+'" title="'+priority+'"/>' + '</td>' +
			'<td>' + '<img src="'+typeIconUrl+'" title="'+type +'"/>' + '</td>' +
			'<td nowrap>' + '<a href="'+JIRA_HOME_URL+'/browse/'+key+'">'+key+'</a>' + '</td>' +
			'<td>' + summary + '</td>' +
			'<td>' + '<img src="'+avatarIconUrl+'"/>' + '</td>' +
			'<td nowrap>' + assignee + '</td>' +
			'</tr>\n';
		});
		tableHtml +='</tbody></table>';


		$('#jira_content').append(tableHtml);
		$('#raw_json').html('<pre>'+JSON.stringify(issues, undefined, 2)+'</pre>');
	};

	var _queryJira_external = function() {
		var jql = encodeURIComponent($('#jira_query_text').text());
		window.open(JIRA_HOME_URL+'/issues/?jql='+jql);
	};

	var _queryJira = function() {
		var jql = encodeURIComponent($('#jira_query_text').val());
		var fields = encodeURIComponent($('#jira_query_fields').val());
		var max_results = $('#jira_query_max_results').val();
		
		function successFn(datas) {
			_populateBoard(datas);
		};
		function failureFn(errMsg) {
			$( '#jira_error' ).html(errMsg);
			$( '#jira_error' ).removeClass('hide');
		};
		function alwaysFn() {
			$('#loading_jira_status').addClass('hide');
		};
		$('#jira_error').addClass('hide');
		$('#loading_jira_status').removeClass('hide');
		return modJira.search(jql, fields, max_results, successFn, failureFn, alwaysFn);
	};
	
	return Exports;
});