Inverted Kanban Standup Board
=============================

Drive agile standup meetings using an inverted Kanban board.

* Display Jira tickets grouped by release, sorted by release, then by status, then priority, then assignee.
* Sort tickets by release date, not by release name like Jira does.
* Sort tickets by pre-configured status order to match your workflow.
* Filter board by team members
    * Raise awareness of team members' individual tickets
    * For standup meetings, cycle through team members in a random order, because the first person to talk in standup tends to consume a disproportionate share of meeting time

### Technical Features
* Entire application can run client-side, very simple static HTML/JS implementation
* Query Jira using REST APIs entirely through client-side JavaScript code, via a CORS proxy server
* Demonstrates using require JS, Bootstrap, JQuery
* Includes an app.js file to host the application using the Node.js "connect" module


# Running this App
1. Clone this repository.
2. From the repo's root directory, run this command to install this project's NodeJS dependencies:

    `npm install`

3. Update `public/js/modules/config.js` with your own values.
4. Run the CORS proxy server to route REST API calls to Jira:

    `node cors-anywhere.js &`

5. Run the app:

    `node app.js &`

6. Fire up your browser and go to [http://localhost:3006](http://localhost:3006)
