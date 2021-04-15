// ------ Discord Bot handling point -------- \\
var Discord = require('discord.js');
var client = new Discord.Client();

var Channel1 = client.channels.cache.get("811679133590355968");
var Channel2 = client.channels.cache.get("814349208776998952");

client.login('NDcxODY3MTQ3ODcwNzk3ODI0.W1kyhg.neoL-GbyNTXmIQaUs135oRBqm28'); //Bot ID here

client.once('ready', () => {
	client.user.setActivity('Sitting Idle');
	client.user.setStatus('idle');
	console.log('\n========\n- Media Server Bot active - \n========');
});


// ------ Payload handling point -------- \\

const Busboy = require('busboy');
const express = require('express');
const app = new express();

const PORT = 1337

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
				console.log(`\n========\n${payload.Account.title} finished an episode: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}`);
			}

			// --- check payload.event for play --- \\

			if (payload.event === 'media.play') {

				// --- check media.play for episodes --- \\

				if (payload.Metadata.type === 'episode') {

					const episodeEmbed = new Discord.MessageEmbed()
						.setColor('#e5a00d')
						.setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
						.setURL('https://app.plex.tv/desktop')
						.setDescription(`${payload.Metadata.summary}`)
						//.setThumbnail('https://i.imgur.com/wSTFkRM.png')
						.addFields({
							name: 'Show:',
							value: `${payload.Metadata.grandparentTitle}`,
							inline: true
						}, {
							name: 'Season:',
							value: `${payload.Metadata.parentTitle}`,
							inline: true
						}, {
							name: 'Episode:',
							value: `${payload.Metadata.title}`,
							inline: true
						}, )
						.setTimestamp();

					client.channels.cache.get("814007625296379904").send(`Someone has started watching an episode of {payload.Metadata.grandparentTitle} (${payload.Metadata.parentTitle}): ${payload.Metadata.title}`, {episodeEmbed});
					console.log(`\n========\n${payload.Account.title} is now watching: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);

					client.user.setStatus('online');
					client.user.setActivity(`${payload.Metadata.grandparentTitle}`, {type: 'WATCHING'});
				}

				// --- check media.play for movies --- \\

				if (payload.Metadata.type === 'movie') {

					const movieEmbed = new Discord.MessageEmbed()
						.setColor('#e5a00d')
						.setTitle(`${payload.Metadata.title}`)
						.setURL('https://app.plex.tv/desktop')
						.setDescription(`${payload.Metadata.summary}`)
						//.setThumbnail('https://i.imgur.com/wSTFkRM.png')
						.setTimestamp();

					client.channels.cache.get("814007625296379904").send(`Someone has started watching a movie: ${payload.Metadata.title}`); //playing Manor
					client.channels.cache.get("814007625296379904").send({
						movieEmbed
					});

					console.log(`\n========\n[${payload.Account.title}] ${payload.event}: \n= ${payload.Metadata.title}\n========`);
					client.user.setActivity(`${payload.Metadata.title}`, {
						type: 'WATCHING'
					});
					client.user.setStatus('online');

				}

				// --- check media.play for tracks --- \\

				if (payload.Metadata.type === 'track') {
					console.log(`track event triggered by ${payload.Account.title}`
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
				client.user.setActivity(`${payload.Metadata.title}`, {
					type: 'WATCHING'
				});
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

					client.on('ready', () => {

						const movieEmbed = new Discord.MessageEmbed()
							.setColor('#e5a00d')
							.setTitle('${payload.Metadata.title}')
							.setURL('https://app.plex.tv/desktop')
							.setDescription('${payload.Metadata.summary}')
							//.setThumbnail('https://i.imgur.com/wSTFkRM.png')
							.setTimestamp()

						client.channels.cache.get("811679133590355968").send("a new movie has been added to the server!", {embed}); // Send to Mixer's Manor
						// client.channels.cache.get("814349566006657034").send("a new movie has been added to the server!", {embed}); //Send to The Gamer House
					});
					console.log("lirary.new: new movie has been added/message sent")
				}

				// --- check library.new for episodes --- \\

				if (payload.Metadata.type === 'episode') {

					const episodeEmbed = new Discord.MessageEmbed()
						.setColor('#e5a00d')
						.setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
						.setURL('https://app.plex.tv/desktop')
						.setDescription(`${payload.Metadata.summary}`)
						//.setThumbnail('https://i.imgur.com/wSTFkRM.png')
						.addFields({
							name: 'Show:',
							value: `${payload.Metadata.grandparentTitle}`,
							inline: true
						}, {
							name: 'Season:',
							value: `${payload.Metadata.parentTitle}`,
							inline: true
						}, {
							name: 'Episode:',
							value: `${payload.Metadata.title}`,
							inline: true
						}, )
						.setTimestamp();

					client.channels.cache.get("811679133590355968").send(`a new episode of ${payload.Metadata.grandparentTitle} has been added!`, {
						embed
					}); //manor
					//client.channels.cache.get("814349566006657034").send(`a new episode of ${payload.Metadata.grandparentTitle} has been added!`, {embed}); //gamer house
					console.log("lirary.new: new episode has been added/message sent")
				}

				// --- check library.new for tracks --- \\

				if (payload.Metadata.type === 'track') {
					// Nothing here yet, Decide if you want this later.
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
app.listen(PORT, () => console.log(`\n========\n- Hook Grabber running on port ${PORT} -\n========`));
