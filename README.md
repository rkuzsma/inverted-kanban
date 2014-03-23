inverted-kanban
===============

Inverted Kanban Standup Board

Drive agile standup meetings using an inverted Kanban board.

User-facing Features:
* Display Jira tickets grouped by release, sorted by release, then by status, then priority, then assignee.
* Sort tickets by release date, not by release name like Jira does.
* Sort tickets by pre-configured status order to match your workflow.
* Filter board by team members
** Raise awareness of team members' individual tickets
** For standup meetings, cycle through team members in a random order, because the first person to talk in standup tends to consume a disproportionate share of meeting time

Technical Features:
* Entire application can run client-side, very simple static HTML/JS implementation
* Query Jira using REST APIs entirely through client-side JavaScript code, via a CORS proxy server
* Demonstrates using require JS, Bootstrap, JQuery
* Includes an app.js file to host the application using the Node.js "connect" module
