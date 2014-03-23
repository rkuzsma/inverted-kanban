define('modules/jira', // this module
['jQuery','amplify'], // our dependencies
function (amplify) {
	var Exports = function(jiraRestRoute) {
		JIRA_REST_ROUTE = jiraRestRoute;
	}
	
	var JIRA_REST_ROUTE = null;

	var search = Exports.prototype.search = function(jql, fields, max_results, successFn, failFn, alwaysFn) {
		var ajax_url = JIRA_REST_ROUTE+'search?jql='+jql;
		if (max_results != '') {
			ajax_url += '&startAt=0&maxResults='+max_results;
		}
		if (fields != '') {
			ajax_url += '&fields='+fields;
		}
		// console.log(ajax_url);

		$.ajax({
			type: 'GET',
			async: true,
			dataType: 'json',
			url: ajax_url,
		}).done(function(datas, textStatus, jqXHR){
			successFn(datas);
		}).fail(function(xhr,textStatus,errorThrowable) {
			var errMsg = '<strong>Failed to query Jira for tickets</strong>.<br/>';
			if (errorThrowable == '') {
				// No error message usually indicates a CORS problem if hitting Jira directly, or the app server that proxies Jira REST API requests is down.
				errMsg += 'Check if the <a href="'+JIRA_REST_ROUTE+'" class="alert-link">Jira REST routes server</a> is down or broken.<br/>';
			}
			else {
				// Probably just a parser error
				errMsg += errorThrowable;
			}
			console.log('ERROR: ' + errMsg + 
				' xhr=' + xhr + ' textStatus=' + textStatus + 
				' errorThrowable=' + errorThrowable +
				' textStatus.responseCode=' + textStatus.responseCode);
			failFn(errMsg);
		}).always(function() {
			alwaysFn();
		});
	};

	return Exports;
});