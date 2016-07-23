var routes = require('express').Router();
var fs = require('fs');
var api_key = require('../../api_keys.js')
var db = require('../database');


module.exports = {
	
	grabFbook: function(req, res) {

		// Search through the article archive using the largest keyword in the trend
		var largestKeyword = '';
		var temp = req.body.q.split(' ');

		temp.forEach(function(item, index) {
			if (index === 0) {
				largestKeyword += item
			} else if (index === 1) {
				largestKeyword += ' ' + item
			}
		})

		// Search the database for articles that contain the selected trend
		db.FB_Sentiments.findAll({where: {status_message: {like: '%' + largestKeyword + '%'}}}).then(function(data) {
			
			// Declare all the variables we will want to send back to the client side
			var num_likes = 0;
			var num_loves = 0
			var num_wows = 0;
			var num_hahas = 0;
			var num_sads = 0;
			var num_angrys = 0;
			var counter = data.length;

			// Iterate through the data object and tally up all of the respective reactions etc 
			for (var i = 0; i < data.length; i++) {
				num_likes += data[i].dataValues.num_likes;
				num_loves += data[i].dataValues.num_loves;
				num_wows += data[i].dataValues.num_wows;
				num_hahas += data[i].dataValues.num_hahas;
				num_sads += data[i].dataValues.num_sads;
				num_angrys += data[i].dataValues.num_angrys;
			}

			// Average the # of reactions across articles
			num_loves = num_loves / counter;
			num_wows = num_wows / counter;
			num_hahas = num_hahas / counter;
			num_sads = num_sads / counter;
			num_angrys = num_angrys / counter;

			totalReactions = num_wows + num_hahas + num_sads + num_angrys + num_loves

			// Compute how much each reaction accounts for among the total reactions
			num_loves = num_loves	/ totalReactions;
			num_wows = num_wows / totalReactions;
			num_hahas = num_hahas / totalReactions;
			num_sads = num_sads / totalReactions;
			num_angrys = num_angrys / totalReactions;

			// Temp Obj is being used to log the retrieved article names to the console (for testing purposes)
			var tempObj = {};

			// Declare a Top Article which we'll pass to the front end
			var topArticle = {title: 'No relevant news articles found', likes: 0}
			var secondArticle = {title: '', likes: 0}

			// Update the tempObj with all of the headlines found
			// Update the topArticle and secondArticle with the headlines that have the most number of likes
			data.forEach(function(item, index) {
				tempObj[index] = 'likes: ' + item.dataValues.num_likes + ': ' + item.dataValues.status_message;
				if (item.dataValues.num_likes > topArticle.likes) {
					secondArticle.title = topArticle.title;
					secondArticle.likes = topArticle.likes;
					topArticle.title = item.dataValues.status_message;
					topArticle.likes = item.dataValues.num_likes;
				}
			})

			// Find the most dominant facebook reaction
			
			var tempReactions = [[num_wows, 'mostly surprised'], [num_hahas, 'mostly amused'], [num_sads, 'mostly sad'], [num_angrys, 'mostly angry'], [num_loves, 'mostly loved']];
			tempReactions = tempReactions.sort(function(a,b) {
				if (a[0] < b[0]) {
					return 1;
				} else if (a[0] > b[0]) {
					return -1;
				} else if (a[0] == b[0]) {
					return 0;
				}
			})

			// Create the final object to be sent to the client
			var summary = {summary: tempReactions[0][1], topHeadline: topArticle.title, secondHeadline: secondArticle.title, likes: num_likes, loves: num_loves, wows: num_wows, hahas: num_hahas, sads: num_sads, angrys: num_angrys}

			console.log(summary)

			res.send(summary)

		})
	}	

}

