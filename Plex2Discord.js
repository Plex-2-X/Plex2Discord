// ------ Discord Bot handling point -------- \\
var Discord = require('discord.js');
var client = new Discord.Client();

const events = `` // Channel ID here
const newContent = `` // Channel ID here

client.login(''); //Bot ID here

client.once('ready', () => {
	client.user.setActivity('Sitting Idle');
	client.user.setStatus('idle');
	console.log('\n========\n- Discord.JS Bot Online - \n========');

});


client.on('message', msg => {
  if (msg.content === 'Plex2Discord') {
    msg.reply('https://github.com/mixerrules/Plex2Discord');
  }
	if (msg.content === '?Info') {
		msg.reply('Plex2Discord is a simple Node.JS script that listens for for Plex webhook payloads then formats and forwards the payload content to a set Discord channel via a bot. https://github.com/mixerrules/Plex2Discord');
	}

});

// ------ Payload handling point -------- \\

const Busboy = require('busboy');
const express = require('express');
const app = new express();

const PORT = 1337 // Change Port here if needed

app.post('/', async function(req, res, next) {
	const busboy = new Busboy({headers: req.headers});
	let payload = null;

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		file.resume(); // Still trying to figure out how to save poster images but i have a small brain so for now we are gonna skip the file saving.
	});

	busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
		if (fieldname === 'payload') {
			try {
				payload = JSON.parse(val);
			} catch (e) {
				console.log(e);
			}
		}
	});

	busboy.on('finish', async function() {
		if (payload) {

			// --- check payload.event for scrobble (aka "90% completed") --- \\

			if (payload.event === 'media.scrobble') {

				// Add IF statements for detecting types of media

				console.log(`\n========\n${payload.Account.title} finished an episode: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}`);
			}

			// --- check payload.event for play --- \\

			if (payload.event === 'media.play') {

				// --- check media.play for episodes --- \\

				if (payload.Metadata.type === 'episode') {

					const episodeEmbed = {
					  "title": `${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`,
					  "description": `${payload.Metadata.summary}`,
					  "url": "https://app.plex.tv/desktop",
					  "color": 15048717,
					  "fields": [
					    {
					      "name": "Show:",
					      "value": `${payload.Metadata.grandparentTitle}`,
					      "inline": true
					    },
					    {
					      "name": "Season:",
					      "value": `${payload.Metadata.parentTitle}`,
					      "inline": true
					    },
					    {
					      "name": "Episode:",
					      "value": `${payload.Metadata.title}`,
					      "inline": true
					    }
					  ]
					};

					client.channels.cache.get(`${events}`).send(`Someone has started watching an episode of ${payload.Metadata.grandparentTitle} (${payload.Metadata.parentTitle}): ${payload.Metadata.title}`, { embed: episodeEmbed });

					console.log(`\n========\n${payload.Account.title} is now watching: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);

					client.user.setStatus('online');
					client.user.setActivity(`${payload.Metadata.grandparentTitle}`, {type: 'WATCHING'});
				}

				// --- check media.play for movies --- \\

				if (payload.Metadata.type === 'movie') {

					const movieEmbed = {
					  "title": `${payload.Metadata.title}`,
					  "description": `${payload.Metadata.summary}`,
					  "url": "https://app.plex.tv/desktop",
					  "color": 15048717,
					};

					client.channels.cache.get(`${events}`).send(`Someone has started watching a movie: ${payload.Metadata.title}`,{ embed: movieEmbed }); // Post to events channel

					console.log(`\n========\n[${payload.Account.title}] ${payload.event}: \n= ${payload.Metadata.title}\n========`);
					client.user.setActivity(`${payload.Metadata.title}`, {type: 'WATCHING'});
					client.user.setStatus('online');

				}

				// --- check media.play for tracks --- \\

				if (payload.Metadata.type === 'track') {
					console.log(`track event triggered by ${payload.Account.title}`)
					// console.log(`\n========\n${payload.Account.title} is now listening to: \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);
				}

			}

			// --- check payload.event for stop --- \\

			if (payload.event === 'media.stop') {
				client.user.setActivity('Waiting for content.');
				client.user.setStatus('idle');
			}

			// --- check payload.event for resume --- \\

			if (payload.event === 'media.resume') {
				client.user.setActivity(`${payload.Metadata.title}`, {type: 'WATCHING'});
				client.user.setStatus('online');
			}

			// --- check payload.event for pause --- \\

			if (payload.event === 'media.pause') {
				client.user.setActivity('Sitting Idle');
				client.user.setStatus('idle');
			}

			if (payload.event === 'library.new') {
				// --- Check library.new for movies --- \\

				if (payload.Metadata.type === 'movie') {

						const movieEmbed = {
						  "title": `${payload.Metadata.title}`,
						  "description": `${payload.Metadata.summary}`,
						  "url": "https://app.plex.tv/desktop",
						  "color": 15048717,
						  "fields": [
						    {
						      "name": "Added:",
						      "value": `${payload.Metadata.addedAt}`,
						      "inline": true
						    },
								{
									"name": "Plex Server:",
									"value": `${payload.Server.title}`,
									"inline": true
								}
						  ]
						};


					 client.channels.cache.get(`${newContent}`).send(`A new movie has been added to the server! ${payload.Metadata.title}`, { embed: movieEmbed }); // Send to Mixer's Manor

					 console.log("lirary.new: new movie has been added/message sent")
				}

				// --- check library.new for episodes --- \\

				if (payload.Metadata.type === 'episode') {

					const episodeEmbed = {
					  "title": `${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`,
					  "description": `${payload.Metadata.summary}`,
					  "url": "https://app.plex.tv/desktop",
					  "color": 15048717,
					  "fields": [
					    {
					      "name": "Show:",
					      "value": `${payload.Metadata.grandparentTitle}`,
					      "inline": true
					    },
					    {
					      "name": "Season:",
					      "value": `${payload.Metadata.parentTitle}`,
					      "inline": true
					    },
					    {
					      "name": "Episode:",
					      "value": `${payload.Metadata.title}`,
					      "inline": true
					    }
					  ]
					};

					client.channels.cache.get(`${newContent}`).send(`a new episode of ${payload.Metadata.grandparentTitle} has been added!`, { embed: episodeEmbed });

					console.log("lirary.new: new episode has been added/message sent")
				}

				// --- check library.new for tracks --- \\

				if (payload.Metadata.type === 'track') {
					// Nothing here yet, Decide if you want this later.
					console.log("lirary.new: new track has been added/message sent")
				}
			}
		} else {

			console.log(`\n========\n[${payload.Account.title}] ${payload.event}: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);

		}
    res.writeHead(303, {
      Connection: 'close',
      Location: '/'
    });
    res.end();
	})

	return req.pipe(busboy);
});

client.once('ready', () => {
	app.listen(PORT, () => console.log(`\n========\n- Plex2Discord.Js listening for webhooks on port ${PORT} -\n========`));
});



// Error Logging Stuff

process.on('unhandledRejection', (reason, p) => {

	var realReason = String(reason); //saves the reason above to a string
	var channelCheck = `${realReason.includes("TypeError: Cannot read property 'send' of undefined")}` // Check for error related to incorrect IDs
  var tokenCheck = `${realReason.includes("[TOKEN_INVALID]")}` // Check for error related to incorrect tokens

	if (channelCheck == "true"){
    console.log('\n========\nExiting Plex2Discord.JS - Reason: Invalid channel IDs \n========');

		console.log('\n========\nSeem like your put the Invalid channel IDs in the "events" & "newContent" feilds at the top of the file, please check them!\n========\n');

		process.exit();
	}

	if (tokenCheck == "true"){
		console.log('\n========\nExiting Plex2Discord.JS - Reason: Bot Token Incorrect \n========');

		console.log('\n========\nIt seems like you are using an invalid or incorrect bot token! please recheck your bot token!\n========\n');

		process.exit();
	}

	else{
	  console.log('\n========\nUNKNOWN ERROR! PLEASE REPORT THIS ON THE GITHUB!!\n========\n\n', reason,'\n\n========\nUNKNOWN ERROR! PLEASE REPORT THIS ON THE GITHUB!!\n========\n\n');
	};
});
