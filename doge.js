'use strict';
/* AWS Lambda ships with imageMagick out of the box */
var gm = require('gm').subClass({ imageMagick: true, binPath: "/opt/bin/"}),
    fs = require('fs'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3()

var colors = [
  "red",
  "blue",
  "yellow",
  "green"
]
const maxFontSize = 28
const minFontSize = 14

module.exports.create = (event, context, cb) => {
  
  try {
    var dogerand = Math.floor(Math.random() * 4+1) 
    var dogefile = `doge` + dogerand + `.jpg`
    var image = gm(dogefile),
        fileNum = Math.floor(Math.random() * 1000),
        fileName = `/tmp/doge-${fileNum}.jpg`,
        s3filename = `doge-${fileNum}.jpg`

    image.size((err, value) => {
      if (err) {
        return cb(err, null)
      }
      var maxWidth = value.width,
          maxHeight = value.height

      for (var bird of event.query.text.split(" ")) {
        var fontSize = Math.floor(Math.random() * (maxFontSize - minFontSize) + minFontSize + 1),
            x = Math.floor(Math.random() * (maxWidth - (fontSize * bird.length))),
            y = Math.floor(Math.random() * (maxHeight - (fontSize * 2)) + fontSize),
            color = colors[Math.floor(Math.random() * 4)]

       // image = image.fontSize(fontSize).fill(color).drawText(x, y, bird)
	 // image = image.font("Gotham", fontSize).fill(color).drawText(x, y, bird)
	  image = image.font("Papyrus", fontSize).fill(color).drawText(x, y, bird)
      }

      console.log("Writing file: ", fileName)
      image.write(fileName, (err) => {
        if (err) {
          console.log("Error writing file: ", err)
          return cb(err, image)
        }
        var imgdata = fs.readFileSync(fileName)
        var s3params = {
           Bucket: 'iopipe-workshop-doge-homework4',
           Key: s3filename,
           Body: imgdata,
           ContentType: 'image/jpeg',
           ACL: "public-read"
        }
        s3.putObject(s3params,
          (err, obj) => {
            cb(err, {
              //text: `<https://s3.amazonaws.com/${s3params.Bucket}/${s3filename}>`,
		    text: `<https://${s3params.Bucket}.s3-us-west-2.amazonaws.com/${s3filename}>`,
              unfurl_links: true,
              response_type: "in_channel"
            })
          }
        )
      })
    })
  }
  catch (err) {
    return cb(err, null)
  }
}
