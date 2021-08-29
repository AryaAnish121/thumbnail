require('dotenv').config();
const { createCanvas } = require('canvas');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');

const VIDEO_ID = process.env.VIDEO_ID;

const makeThumbnail = (text) => {
  const canvas = createCanvas(1280, 780);
  const ctx = canvas.getContext('2d');

  ctx.font = '100px Impact';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 50, 400);

  var text = ctx.measureText('Awesome!');
  ctx.strokeStyle = 'rgba(255, 255, 255)';
  ctx.lineTo(50 + text.width, 102);

  return canvas.toDataURL();
};

const main = async () => {
  try {
    const auth = authorize();
    const videoViews = await getVideoComment(auth);
    const thumb = makeThumbnail(
      videoViews[0].snippet.topLevelComment.snippet.textOriginal
    );

    var base64Data = thumb.replace(/^data:image\/png;base64,/, '');

    fs.writeFile('./out.jpeg', base64Data, 'base64', function (err) {
      if (err) {
        console.log(err);
      } else {
        updateThumbnail(auth).then(() => {
          console.log('done!!!!');
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

function authorize() {
  const credentials = JSON.parse(process.env.CLIENT_SECRET);
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  oauth2Client.credentials = JSON.parse(process.env.OAUTH_TOKEN);
  return oauth2Client;
}

const getVideoComment = (auth) => {
  const service = google.youtube('v3');
  return new Promise((resolve, reject) => {
    service.commentThreads.list(
      {
        auth,
        part: 'snippet',
        videoId: VIDEO_ID,
      },
      (err, response) => {
        if (err) return reject(err);
        resolve(response.data.items);
      }
    );
  });
};

const updateThumbnail = (auth) => {
  const service = google.youtube('v3');
  return new Promise((resolve, reject) => {
    service.thumbnails.set(
      {
        auth,
        part: 'snippet',
        media: {
          body: fs.createReadStream(__dirname + '/out.jpeg'),
        },
        videoId: VIDEO_ID,
      },
      (err, response) => {
        if (err) return reject(err);
        console.log(response);
        resolve(response.data.items);
      }
    );
  });
};

main();
setInterval(main, 600000);
