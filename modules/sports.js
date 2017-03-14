'use strict';
var request = require('request');
const searchText = require('./search.js');
const thread = require('./thread.js');
var googleTrends = require('google-trends-api');
const errors = require('../contentjson/errormsg.json');
const jokes = require('../contentjson/jokes.json');
const fbRquest = require('./fbapi.js');
const mysqlconfig = require('./mysqlconfig.js');
//var app = express();
var mysql = require('mysql');
var pool = mysql.createPool({connectionLimit: 1, host: 'ap-cdbr-azure-southeast-a.cloudapp.net', user: 'bb603e8108da6e', password: '3e384329', database: 'rankworlddev'});
var fbpage_access_token = 'EAADV2VT6AuUBAHyUBL8zV5dYdRCBE7ZCKYQvOWCu2kkWQSV1RCllfvMymjDhXZCBQ93IkOFDpVYjN1E8jCHYpHKdH6uwNuhYAyCGdHOv6VgVZCwI6BZCc3AwAc7CW17yNTXe1YE7GkegMHHz36ax5JZC01zllTmTnAQRe0ZB0U3wZDZD';
var quickreply = [
    {
        "content_type": "text",
        "title": "Movies 🎬",
        "payload": "Movies"
    }, {
        "content_type": "text",
        "title": "Sports 🏆",
        "payload": "Sports"
    }, {
        "content_type": "text",
        "title": "Music 🎶",
        "payload": "Music"
    }, {
        "content_type": "text",
        "title": "TV Shows 📺",
        "payload": "TV Shows"
    }
];

//function tvshowsinfo(messagingEvent, moviename)
const sportsqrintro = (messagingEvent, qrtitle) => {
    var senderID = messagingEvent.sender.id;
    //var img = 'https://fankickdev.blob.core.windows.net/images/home_logo.png';
    //var msg = 'Amazing talent! Here is what I know about '+img+'';
    var messageData = {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": "Here you go👉..."
            //"text":msg
        }
        // "message": {
        //     "attachment": {
        //         "type": "audio",
        //         "payload": {
        //             "url": "https://petersapparel.com/bin/clip.mp3"
        //         }
        //     }
        // }
    };
    fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
    sportsqrdetails(messagingEvent, qrtitle);
}
const sportsintro = (messagingEvent, tvshowsmsg) => {
    var senderID = messagingEvent.sender.id;
    //var img = 'https://fankickdev.blob.core.windows.net/images/home_logo.png';
    //var msg = 'Amazing talent! Here is what I know about '+img+'';
    var messageData = {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": tvshowsmsg
        }
    };
    fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
    sportsmenu(messagingEvent);
}
const sportscelbrityintro = (messagingEvent, sportscelname) => {
    var senderID = messagingEvent.sender.id;
    var msg = 'Amazing talent👏! Here is what I know about ' + sportscelname + '';
    var messageData = {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": msg
        }
    };
    fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
    sportscelbritydetails(messagingEvent, sportscelname);
}




function sportsmenu(messagingEvent){
  var quickList = [];
    pool.getConnection(function(err, connection) {
        connection.query('select * from cc_sports_preference', function(err, rows) {
            console.log("*************************sportsmenu", rows);
            if (err) {
                console.log("Error While retriving content pack data from database:", err);
            }
            else if (rows.length) {
                var senderID = messagingEvent.sender.id;
                var contentList = [];
                if (rows.length > 10) {
                    var rowslenth = 10;
                    console.log("more than 10 Rows", rowslenth);
                } else {
                    var rowslenth = rows.length;
                    console.log("less than 10 Rows", rowslenth);
                }
                for (var i = 0; i < rowslenth; i++) { //Construct request body
                    var keyMap = {
                        "title": rows[i].celebrity,
                        "image_url": rows[i].imageUrl,
                        "subtitle": rows[i].title,
                        // "buttons": [
                        //   {
                        //       "type": "web_url",
                        //       "url": rows[i].articleUrl,
                        //       "title": "View Article"
                        //   },
                        // ]
                    };
                    var quick_reply = {
                        "content_type": "text",
                        "title": rows[i].quickReplyTitle,
                        "payload": rows[i].quickReplyTitle+ ' %sportsQRtitle%'
                    };
                    contentList.push(keyMap);
                    quickList.push(quick_reply);
                }
                var messageData = {
                    "recipient": {
                        "id": senderID
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": contentList
                            }
                        },
                        "quick_replies": quickList
                    }
                }
                fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
            }
             else {
                console.log("No Data Found From Database");
                sendHelpMessage(messagingEvent);
            }
            connection.release();
        });
    });

}


function sportsqrdetails(messagingEvent, qrtitle){
  var qr1;
  var qr2;
  var qr3;
  var qr4;
  var qr5;
    pool.getConnection(function(err, connection) {
        connection.query('select * from cc_sports_preference where quickReplyTitle = ?',[qrtitle], function(err, rows) {
            console.log("*************************sportsmenu", rows);
            if (err) {
                console.log("Error While retriving content pack data from database:", err);
            }
            else if (rows.length) {
                var senderID = messagingEvent.sender.id;
                var contentList = [];
                if (rows.length > 10) {
                    var rowslenth = 10;
                    console.log("more than 10 Rows", rowslenth);
                } else {
                    var rowslenth = rows.length;
                    console.log("less than 10 Rows", rowslenth);
                }
                for (var i = 0; i < rowslenth; i++) { //Construct request body
                    var keyMap = {
                        "title": rows[i].celebrity,
                        "image_url": rows[i].imageUrl,
                        "subtitle": rows[i].title,
                        "buttons": [
                          {
                              "type": "web_url",
                              "url": rows[i].articleUrl,
                              "title": "View Article"
                          },
                        ]
                    };
                    qr1 = rows[i].suggestedQuickReply1;
                    qr2 = rows[i].suggestedQuickReply2;
                    qr3 = rows[i].suggestedQuickReply3;
                    qr4 = rows[i].suggestedQuickReply4;
                    qr5 = rows[i].suggestedQuickReply5;
                    contentList.push(keyMap);
                    //quickList.push(quick_reply);
                }
                var messageData = {
                    "recipient": {
                        "id": senderID
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": contentList
                            }
                        },
                        "quick_replies": [
                            {
                                "content_type": "text",
                                "title": qr1,
                                "payload": qr1+ ' ,%sportscel%'
                            }, {
                                "content_type": "text",
                                "title": qr2,
                                "payload": qr2+ ' ,%sportscel%'
                            }, {
                                "content_type": "text",
                                "title": qr3,
                                "payload": qr3+ ' ,%sportscel%'
                            }, {
                                "content_type": "text",
                                "title": qr4,
                                "payload": qr4+ ' ,%sportscel%'
                            }, {
                                "content_type": "text",
                                "title": qr5,
                                "payload": qr5+ ' ,%sportscel%'
                            }, {
                                "content_type": "text",
                                "title": "Jokes",
                                "payload": "Jokes"
                            }, {
                                "content_type": "text",
                                "title": "Home 🏠",
                                "payload": "home"
                            }
                        ]
                    }
                }
                fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
            }
             else {
                console.log("No Data Found From Database");
                sendHelpMessage(messagingEvent);
            }
            connection.release();
        });
    });

}

function sportscelbritydetails(messagingEvent, sportscelname){
  var quickList = [];
    pool.getConnection(function(err, connection) {
        connection.query('select * from cc_sports_celebrity_preference where name= ?',[sportscelname], function(err, rows) {
            console.log("*************************sportscelebrity", rows);
            if (err) {
                console.log("Error While retriving content pack data from database:", err);
            }
            // else if (rows.length) {
            //     var senderID = messagingEvent.sender.id;
            //     var contentList = [];
            //     if (rows.length > 10) {
            //         var rowslenth = 10;
            //         console.log("more than 10 Rows", rowslenth);
            //     } else {
            //         var rowslenth = rows.length;
            //         console.log("less than 10 Rows", rowslenth);
            //     }
            //     for (var i = 0; i < rowslenth; i++) { //Construct request body
            //         var keyMap = {
            //             "title": rows[i].celebrity,
            //             "image_url": rows[i].imageUrl,
            //             "subtitle": rows[i].title,
            //             // "buttons": [
            //             //   {
            //             //       "type": "web_url",
            //             //       "url": rows[i].articleUrl,
            //             //       "title": "View Article"
            //             //   },
            //             // ]
            //         };
            //         var quick_reply = {
            //             "content_type": "text",
            //             "title": rows[i].quickReplyTitle,
            //             "payload": rows[i].quickReplyTitle+ ' %sportsQRtitle%'
            //         };
            //         contentList.push(keyMap);
            //         quickList.push(quick_reply);
            //     }
            //     var messageData = {
            //         "recipient": {
            //             "id": senderID
            //         },
            //         "message": {
            //             "attachment": {
            //                 "type": "template",
            //                 "payload": {
            //                     "template_type": "generic",
            //                     "elements": contentList
            //                 }
            //             },
            //             "quick_replies": quickList
            //         }
            //     }
            //     fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
            // }
             else {
                console.log("No Data Found From Database");
                sendHelpMessage(messagingEvent);
            }
            connection.release();
        });
    });

}



function sendHelpMessage(event) {
    var errorString = "";
    while (errorString === "") {
        var random = Math.floor(Math.random() * errors.length);
        if (errors[random].error.length < 320) // better be a least one good joke :)
            errorString = errors[random].error;
        }
    var senderID = event.sender.id;
    var messageData = {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": errorString,
            //"text":"msg",
            "quick_replies": quickreply
        }
    }
    fbRquest.callFBAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
}


module.exports = {
    sportsintro: sportsintro,
    sportscelbrityintro: sportscelbrityintro,
    sportsqrintro:sportsqrintro
};
