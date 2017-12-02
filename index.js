'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const search = require('youtube-search');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 3333, () => {
  console.log('SuchTube server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.all('/:format?', (req, res) => {
  var format = req.params.format;
  var query = format == "slack" ? req.body.text : req.query.q;

  // Parse timestamp (query format is /suchtube video_query --t=start_in_seconds)
  var timestamp = '0';
  var timeFormat = /--t=/;
  var splittedQuery = query.split(timeFormat);

  if (splittedQuery.length == 2) {
    query = splittedQuery[0];
    timestamp = splittedQuery[1].match(/\d+/);
  }

  var youtube_api_options = {
    maxResults: 1,
    key: process.env.YOUTUBE_DATA_API_V3
  };

  console.log(query);

  search(query, youtube_api_options, function(err, results) {
    if (err) return console.log(err);

    var video = results[0];

    if (format == 'slack') {
      var slack_json = {
        response_type: 'in_channel',
        text: video.link + '&t=' + timestamp
      };
      res.json(slack_json);
    } else if (format == 'text') {
      res.send(video.link + '&t=' + timestamp);
    } else if (format == 'json') {
      res.send(video);
    } else if (format == 'html' || format == null) {
      var link = video.link + '&t=' + timestamp;
      res.send(
        '<h1>SuchTube</h1>' +
        '<h2>' + video.title + '</h2>' +
        '<a href="' + link + '" target="_blank">' + link + '</a>'
      );
    }
  });
});
