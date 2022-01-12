const os = require('os');
const extIP = require("ext-ip")();
const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_PRESENCES] });

const { token }= require('./Config.json');
const { debug } = require('./Config.json');
const { OMDBApiKey } = require('./Config.json');
const { webhookport } = require('./Config.json');
const { eventsChannel } = require('./Config.json');
const { newContentChannel } = require('./Config.json');
const interfaces = os.networkInterfaces();
const addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}
const localip = addresses[0];
var externalip = "";
getExternalip();
function getExternalip(){
	 extIP.get().then(ip => {
 	   let newip = ip;
	   externalip = newip;
 })
};



// ------ Discord Bot handling point -------- \\

client.login(token);

client.once('ready', () => {
	client.user.setActivity('Sitting Idle');
	client.user.setStatus('idle');
	console.log('\n========\n- Discord.JS Bot Online - \n========');

});

// ------ Payload/Data handling point -------- \\

const Busboy = require('busboy');
const express = require('express');
const app = new express();

app.post('/', async function(req, res, next) {
  const busboy = Busboy({ headers: req.headers });
	let payload = null;

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		file.resume(); // This is just a catch and continue i guess?, Im gonnna use OMDB's API instead.
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


    const episodeEmbed = new MessageEmbed()
      .setColor('#e5a00d')
      .setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
      .setURL('https://app.plex.tv/desktop')
      .setDescription(`${payload.Metadata.summary}`)
      .addFields(
        { name: 'Show:', value: `${payload.Metadata.grandparentTitle}` },
        { name: 'Season:', value: `${payload.Metadata.parentTitle}` },
        { name: 'Episode:', value:  `${payload.Metadata.title}` },
      )

    const movieEmbed = new MessageEmbed()
        .setColor('#e5a00d')
        .setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
        .setURL('https://app.plex.tv/desktop')
        .setDescription(`${payload.Metadata.summary}`)
        .addFields(
          { name: 'Added:', value: `${payload.Metadata.addedAt}`, inline: true },
          { name: 'Server:', value: `${payload.Server.title}`, inline: true},
        )

    var thumbnailJson; // Used for saving Poster URL from findThumbnail();

    if (TMDBApiKey !== null){
      findThumbnail();

      movieEmbed.setThumbnail(`${thumbnailJson}`);
      episodeEmbed.setThumbnail(`${thumbnailJson}`);

      if (debug == true){
        console.log(thumbnailJson);
      }
    };


    function findThumbnail(){

      const http = require('http');

      let url = `http://www.omdbapi.com/?apikey=${OMDBApiKey}&t=${payload.Metadata.title}`;

      http.get(url,(res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
              let json = JSON.parse(body);

              if (debug == true){
        				console.log("\n====== OMDB Api Json Info ======\n")
        				console.log(json);
        				console.log("\n====== OMDB Api Json Info ======\n")

        		  };

            thumbnailJson = json.Poster;

            } catch (error) {
              console.error(error.message);
            };
          });

        }).on("error", (error) => {
          console.error(error.message);
        });



    };


			if (debug == true){
				console.log("\n====== Payload Info ======\n")
				console.log(payload);
				console.log("\n====== Payload Info ======\n")
		  };

		// --- check payload.event for scrobble (aka "90% completed shows/movies") --- \\

			if (payload.event === 'media.scrobble') {

				// Add IF statements for detecting types of media
				// Currently only logging to console

				console.log(`\n========\n${payload.Account.title} finished an episode: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}`);
			}

			// --- check payload.event for play --- \\

			if (payload.event === 'media.play') {

				// --- check media.play for episodes --- \\

				if (payload.Metadata.type === 'episode') {


					client.channels.cache.get(`${eventsChannel}`).send({ content: `Someone has started watching an episode of ${payload.Metadata.grandparentTitle} (${payload.Metadata.parentTitle}): ${payload.Metadata.title}`, embeds: [episodeEmbed] });

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

					client.channels.cache.get(`${eventsChannel}`).send({ content: `Someone has started watching a movie: ${payload.Metadata.title}`, embeds: [movieEmbed] }); // Post to events channel

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

			// --- check payload.event for library --- \\

			if (payload.event === 'library.new') {
				// --- Check library.new for movies --- \\

				if (payload.Metadata.type === 'movie') {


					 client.channels.cache.get(`${newContentChannel}`).send({ content: `A new movie has been added to the server! ${payload.Metadata.title}`, embeds: [movieEmbed] }); // Send to Mixer's Manor

					 console.log("lirary.new: new movie has been added/message sent")
				}

				// --- check library.new for episodes --- \\

				if (payload.Metadata.type === 'episode') {

					client.channels.cache.get(`${newContentChannel}`).send({ content: `A new episode of ${payload.Metadata.grandparentTitle} has been added!`, embeds: [episodeEmbed] });

					console.log("lirary.new: new episode has been added/message sent")
				}

				// --- check library.new for tracks --- \\

				if (payload.Metadata.type === 'track') {
					// Havent started touching this event yet.
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
	app.listen(webhookport, () => console.log(`\n========\n- Plex2Discord.Js is now active on the following address: -\n- Local Address: ${localip}:${webhookport} -\n- Extenral Address: ${externalip}:${webhookport} -\n========`));
});

// ------ Script Error Handling -------- \\

process.on('unhandledRejection', (reason, p) => {

	var realReason = String(reason); //saves the reason above to a string
	var channelCheck = `${realReason.includes("TypeError: Cannot read property 'send' of undefined")}` // Check for error related to incorrect IDs
  var tokenCheck = `${realReason.includes("[TOKEN_INVALID]")}` // Check for error related to incorrect tokens

	if (channelCheck == "true"){
    console.log('\n========\nExiting Plex2Discord.JS - Reason: Invalid channel IDs \n========');

		console.log('\n========\nSeem like your put the Invalid channel IDs in the "eventsChannel" & "newContentChannel" feilds at the top of the file, please check them!\n========\n');

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
