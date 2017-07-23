/**
 * Created by Yoza Wiratama on 23/07/2017.
 */


// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');

// SENDGRID SETUP
// =============================================================================

var sghelper = require('sendgrid').mail;
var sg = require('sendgrid')('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');

// MAILGUN SETUP
// =============================================================================

var mailgunAPIKey = 'key-789fd824c6de07ad2a08ebd914ee96ea';
var domain = 'sandbox1ee7780c7a57441e9f2c67b6363e1f66.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: mailgunAPIKey, domain: domain});


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port


var sendmail = {
    sendgrid : function (from, to, subject, content) {
        var fromEmail = new sghelper.Email(from);
        var toEmail = new sghelper.Email(to);
        content = new sghelper.Content('text/html',content);
        var mail = new sghelper.Mail(fromEmail, subject, toEmail, content);
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
        });

        sg.API(request, function (error, response) {
            if (error) {
                console.log('Error response received');
            }
            console.log(response.statusCode);
            console.log(response.body);
            console.log(response.headers);
        });
    },
    mailgun : function (from, to, subject, content) {
        var data = {
            from: from,
            to: to,
            subject: subject,
            text: content
        };

        mailgun.messages().send(data, function (error, body) {
            console.log(body);
        });
    }
}

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});

router.post('/sendmail', function (req, res) {

    var reqbody = req.body;
    var noreply = 'noreply@wiratama.id';

    if (!reqbody.subject) {
        res.status(400);
        res.json({message: 'Subject is required!'});
    }
    if (!reqbody.to) {
        if (reqbody.to.length == 0) {
            res.status(400);
            res.json({message: 'to is required!'});
        }
    }
    if (!reqbody.content) {
        res.status(400);
        res.json({message: 'Content is required!'});
    }


    for (var ii=0;ii<reqbody.to.length;ii++)
    {
        //split sending jobs
        if(ii % 2 == 0)
            sendmail.sendgrid(noreply, reqbody.to[ii], reqbody.subject, reqbody.content);
        else sendmail.mailgun(noreply, reqbody.to[ii], reqbody.subject, reqbody.content);

    }


    res.json({message: 'Great!'});
});


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);