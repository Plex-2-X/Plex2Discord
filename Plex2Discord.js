const os = require('os');
const fs = require('fs');
const extIP = require("ext-ip")();
const RotationFileStream = require('node-rotation-file');
const { Client, Intents, MessageEmbed } = require('discord.js');
const { token, debug, webhookport, eventsChannel, newContentChannel, ConsoleEventLogging, FileEventLogging } = require('./Config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES] });

// --- Get Network Infromation --- \\
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
function getExternalip() {
  extIP.get().then(ip => {
    let newip = ip;
    externalip = newip;
  })
};

// --- Rotation File System --- \\

const logstream = new RotationFileStream({
  path: './logs/current.log',
  maxTime: '1D',
  archivesDirectory: './logs/',
  compressType: 'gzip'
})

const path = "./logs/current.log";

if (fs.existsSync(path)) {
  // path exists
  if (debug) {
    console.log("\n======\n Log File Exists \n======")
  };
} else {
  if (debug) {
    console.log("\n====== Error Opening Log File ======\n")
    console.log("Path doesnt exist or is inacessable");
    console.log("\n====== Error Opening Log File ======")
  };

  try {
    fs.writeFile(path, '--------\n', function (err) {
      if (err) {
        console.log("\n======\n Error Log Creating File \n======\n");
        console.log(err);
        console.log("\n======\n Error Log Creating File \n======")
      }

      if (debug == true) {
        console.log("\n======\n Log File Created \n======")
      };
    });
  }
  catch (err) {

    if (debug == true) {
      console.log("\n====== Log File Creation Error ======\n")
      console.log("file was not created:" + err);
      console.log("\n====== Log File Creation Error ======")
    };
  }

}


// ------ Discord Bot handling point -------- \\

client.login(token);

client.once('ready', () => {
  client.user.setActivity('Sitting Idle');
  client.user.setStatus('online');
  console.log('\n========\n- Discord.JS Bot Online -\n========');

  if (ConsoleEventLogging) {
    logstream.write(Date().toLocaleString() + ` Plex2Discord Started\n`)
  }
});

// ------ Payload/Data handling point -------- \\

const Busboy = require('busboy');
const express = require('express');
const app = new express();

app.post('/', async function (req, res, next) {
  const busboy = Busboy({ headers: req.headers });
  let payload = null;

  busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    file.resume(); // This is just a catch and continue i guess? idk how to save the files..
  });

  busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    if (fieldname === 'payload') {
      try {
        payload = JSON.parse(val);
      } catch (e) {
        console.log(e);
      }
    }
  });

  busboy.on('finish', async function () {
    if (payload) {

      // --- Payload Information for debug mode --- \\
      if (debug) {
        console.log("\n====== Payload Info ======\n")
        console.log(payload);
        console.log("\n====== Payload Info ======\n")
      };

      // --- check payload.event for scrobble (aka "90% completed media") --- \\

      if (payload.event === 'media.scrobble') {

        if (ConsoleEventLogging) {
          console.log(`\n========\n${payload.Account.title} finished an episode: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}`);
        }

        if (FileEventLogging) {
          logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has finished an episode: ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle} - ${payload.Metadata.title}\n`)
        }
      }

      // --- check payload.event for play --- \\

      if (payload.event === 'media.play') {

        // --- Embeds for media.play events --- \\
        let addedDate = new Date(`${payload.Metadata.addedAt}`).toUTCString();

        var episodeEmbed = new MessageEmbed()
          .setColor('#e5a00d')
          .setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
          .setURL('https://app.plex.tv/desktop')
          .setDescription(`${payload.Metadata.summary}`)
          .addFields({
            name: 'Show:',
            value: `${payload.Metadata.grandparentTitle}`
          }, {
            name: 'Season:',
            value: `${payload.Metadata.parentTitle}`
          }, {
            name: 'Episode:',
            value: `${payload.Metadata.title}`
          },);

        var movieEmbed = new MessageEmbed()
          .setColor('#e5a00d')
          .setTitle(` ${payload.Metadata.title} (${payload.Metadata.year})`)
          .setURL('https://app.plex.tv/desktop')
          .setDescription(`${payload.Metadata.summary}`)
          .addFields({
            name: 'Added:',
            value: `${addedDate}`,
            inline: true
          }, {
            name: 'Server:',
            value: `${payload.Server.title}`,
            inline: true
          },);


        // --- check media.play for episodes --- \\

        if (payload.Metadata.type === 'episode') {


          client.channels.cache.get(`${eventsChannel}`).send({
            content: `Someone has started watching an episode of ${payload.Metadata.grandparentTitle} (${payload.Metadata.parentTitle}): ${payload.Metadata.title}`,
            embeds: [episodeEmbed]
          });

          // Sends to Console
          if (ConsoleEventLogging) {
            console.log(`\n========\n${payload.Account.title} is now watching: \n= ${payload.Metadata.grandparentTitle} \n= ${payload.Metadata.parentTitle} \n= ${payload.Metadata.title}\n========`);
          }

          // Sends to Current.log
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User is now watching: ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}\n`)
          }

          // Sets Bot Activity
          client.user.setStatus('online');
          client.user.setActivity(`${payload.Metadata.grandparentTitle}`, {
            type: 'WATCHING'
          });
        }

        // --- check media.play for movies --- \\

        if (payload.Metadata.type === 'movie') {

          // Sends to Discord Channel
          client.channels.cache.get(`${eventsChannel}`).send({
            content: `Someone has started watching a movie: ${payload.Metadata.title}`,
            embeds: [movieEmbed]
          });

          // Sends to Console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] ${payload.event}: \n= ${payload.Metadata.title}\n========`);
          }

          // Sends to Current.log
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has paused ${payload.Metadata.title}\n`)
          }

          // Sets bot activity
          client.user.setActivity(`${payload.Metadata.title}`, {
            type: 'WATCHING'
          });
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

        // Sets bots status
        client.user.setActivity('Waiting for content.');
        client.user.setStatus('idle');


        // Sends to Console
        if (ConsoleEventLogging) {
          console.log(`\n========\n[${payload.Account.title}] User has stopped watching\n= ${payload.Metadata.title}\n========`);
        }

        // Sends to Current.log
        if (FileEventLogging) {
          logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has paused ${payload.Metadata.title}\n`)
        }

      }

      // --- check payload.event for resume --- \\

      if (payload.event === 'media.resume') {

        // --- see if media.resume is an episode --- \\
        if (payload.Metadata.type === 'episode') {

          client.user.setActivity(`${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}`, {
            type: 'STREAMING'
          });
          client.user.setStatus('online');

          // Sends to Console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}\n`)
          }
        }

        // --- see if media.resume is an movie --- \\
        if (payload.Metadata.type === 'movie') {

          // sets bots status
          client.user.setActivity(`${payload.Metadata.title}`, {
            type: 'WATCHING'
          });
          client.user.setStatus('online');

          // Logs to console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.title}\n`)
          }

        }

        // --- see if media.resume is an track --- \\
        if (payload.Metadata.type === 'track') {

          // Sets bot status
          client.user.setActivity(`${payload.Metadata.title}`, {
            type: 'LISTENING'
          });
          client.user.setStatus('online');

          // Logs to console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.title}\n`)
          }

        }

      }

      // --- check payload.event for pause --- \\

      if (payload.event === 'media.pause') {
        client.user.setActivity('Sitting Idle');
        client.user.setStatus('idle');

        if (FileEventLogging) {
          logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has paused ${payload.Metadata.title}\n`);
        }

        // --- see if media.resume is an episode --- \\
        if (payload.Metadata.type === 'episode') {

          // Sends to Console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.grandparentTitle} - ${payload.Metadata.parentTitle}: ${payload.Metadata.title}\n`)
          }
        }

        // --- see if media.resume is an movie --- \\
        if (payload.Metadata.type === 'movie') {

          // Logs to console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.title}\n`)
          }

        }

        // --- see if media.resume is an track --- \\
        if (payload.Metadata.type === 'track') {
          // Logs to console
          if (ConsoleEventLogging) {
            console.log(`\n========\n[${payload.Account.title}] User has resumed ${payload.Metadata.title}`);
          }

          // Logs to file
          if (FileEventLogging) {
            logstream.write(Date().toLocaleString() + ` [${payload.Account.title}] User has resumed ${payload.Metadata.title}\n`)
          }
        }
      }

      // --- check payload.event for new content --- \\

      if (payload.event === 'library.new') {

        // --- Embeds for library.new --- \\

        let addedDate = new Date(`${payload.Metadata.addedAt}`).toUTCString();

        var episodeEmbed = new MessageEmbed()
          .setColor('#e5a00d')
          .setTitle(`${payload.Metadata.grandparentTitle} | ${payload.Metadata.title}`)
          .setURL('https://app.plex.tv/desktop')
          .setDescription(`${payload.Metadata.summary}`)
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
          }, {
            name: 'Original Release:',
            value: `${payload.Metadata.OriginallyAvailableAt}`,
            inline: true
          }, {
            name: 'Content Rating:',
            value: `${payload.Metadata.contentRating}`,
            inline: true
          }, {
            name: 'Added to server on:',
            value: `${addedDate}`,
            inline: true
          });

        var movieEmbed = new MessageEmbed()
          .setColor('#e5a00d')
          .setTitle(` ${payload.Metadata.title} (${payload.Metadata.year})`)
          .setURL('https://app.plex.tv/desktop')
          .setDescription(`${payload.Metadata.summary}`)
          .addFields({
            name: 'Added:',
            value: `${addedDate}`,
            inline: true
          }, {
            name: 'Original Release:',
            value: `${payload.Metadata.OriginallyAvailableAt}`,
            inline: true
          }, {
            name: 'Content Rating:',
            value: `${payload.Metadata.contentRating}`,
            inline: true
          });

        var trackEmbed = new MessageEmbed()
          .setColor('#e5a00d')
          .setTitle(` ${payload.Metadata.title} (${payload.Metadata.year})`)
          .setURL('https://app.plex.tv/desktop')
          .setDescription(`${payload.Metadata.summary}`)
          .addFields({
            name: 'Added:',
            value: `${addedDate}`,
            inline: true
          }, {
            name: 'Server:',
            value: `${payload.Server.title}`,
            inline: true
          },);


        // --- Check library.new for movies --- \\

        if (payload.Metadata.type === 'movie') {

          // Sends embed to discord
          client.channels.cache.get(`${newContentChannel}`).send({
            content: `A new movie has been added to the Plex server! ${payload.Metadata.title}`,
            embeds: [movieEmbed]
          });

          console.log("lirary.new: new movie has been added/message sent")
        }

        // --- check library.new for episodes --- \\

        if (payload.Metadata.type === 'episode') {

          client.channels.cache.get(`${newContentChannel}`).send({
            content: `A new episode of ${payload.Metadata.grandparentTitle} has been added!`,
            embeds: [episodeEmbed]
          });

          console.log("lirary.new: new episode has been added/message sent")
        }

        // --- check library.new for tracks --- \\

        if (payload.Metadata.type === 'track') {
          // Havent started touching this event yet.
          console.log("lirary.new: new track has been added/message sent")
        }
      }

    } else {
      
      console.log(`\n========\nAn Unknown or Uncaught event has ran! I recommend reporting this on the github so we can update the script to support it!\nPlease copy the infromation from the next data log!\n========\n `)
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

// Logs internal and exteneral network IPs with selected port for Plex2Discord to run on to the console
client.once('ready', () => {
  app.listen(webhookport, () => console.log(`\n========\n- Plex2Discord.Js is now active on the following address: -\n- Local Address: ${localip}:${webhookport} -\n- Extenral Address: ${externalip}:${webhookport} -\n========`));
});

// ------ Script Error Handling -------- \\

process.on('unhandledRejection', (reason, p) => {

  //saves the reason above to a string
  var realReason = String(reason);
  // Check for error related to incorrect IDs
  var channelCheck = `${realReason.includes("TypeError: Cannot read property 'send' of undefined")}`
  // Check for error related to incorrect tokens
  var tokenCheck = `${realReason.includes("[TOKEN_INVALID]")}`

  if (channelCheck == "true") {
    console.log('\n========\nExiting Plex2Discord.JS - Reason: Invalid channel IDs \n========');

    console.log('\n========\nSeem like your put the Invalid channel IDs in the "eventsChannel" & "newContentChannel" feilds in the config.json, please check them!\n========\n');

    if (FileEventLogging) {
      logstream.end(Date().toLocaleString + " Plex2Discord closed due to Invalid Channel IDs.");
    }

    process.exit();
  }

  if (tokenCheck == "true") {
    console.log('\n========\nExiting Plex2Discord.JS - Reason: Bot Token Invalid \n========');

    console.log('\n========\nIt seems like you are using an invalid or incorrect bot token! please recheck your bot token!\n========\n');

    if (FileEventLogging) {
      logstream.end(Date().toLocaleString + " Plex2Discord closed due to Invalid Channel IDs.");
    }
    process.exit();
  } else {
    console.log('\n========\nUNKNOWN ERROR! PLEASE REPORT THIS ON THE GITHUB!\n========\n\n', reason, '\n\n========\nUNKNOWN ERROR! PLEASE REPORT THIS ON THE GITHUB!!\n========\n\n');
  };
});
