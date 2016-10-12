var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var mysql = require('mysql');
const fetch = require('node-fetch');
const crypto = require('crypto');
const thread = require('./thread.js');
const payloadText = require('./payload.js');
const searchText = require('./search.js');
var pool = mysql.createPool({
    connectionLimit : 2,
    host: 'ap-cdbr-azure-southeast-a.cloudapp.net',
    user: 'bb603e8108da6e',
    password: '3e384329',
    database: 'rankworlddev'
});


app.use(bodyParser.json());
var fbpage_access_token = 'EAAXcJew5yNkBAAvFD3wX3RZACdvA4lZB6XStBzliKI9y4m7I1taAnWUWBezVarL8FjteZCztMBjXZCs35lAweqmc2XZARIf378LZA5lTg5xIebmBmFL4MmJGU4JrowfdkkKDbjqwuzBkCWPxQjgddrW4EZBnv6LiccAHdqoLUNcsgZDZD';

var quickMenu = payloadText.quickMenu;

app.get('/webhook', function(req, res) {
    //console.log("Validating webhook", console.log(JSON.stringify(req.body)));
    console.log("######################################", res);
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'login_type') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.post('/webhook', function(req, res) {
    var data = req.body;
    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            var pageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;
            console.log("Page Entry Details:", JSON.stringify(pageEntry));
            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.optin) {
                    //receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    if (!messagingEvent.message.hasOwnProperty('is_echo')) { // Avoiding multiple database fetches
                        receivedMessage(messagingEvent);
                        //receivedMessage
                    }
                    //var msgText = messagingEvent.message.text;
                    console.log("messaging :------", messagingEvent);
                  //  console.log("messaging :------", messagingEvent.message.quick_reply.payload);
                  //  receivedmessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    //receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedpostback(messagingEvent);
                } else if (messagingEvent.read) {
                    //console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });
        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

// postback payload section Start ********************************************
function receivedpostback(messagingEvent) {
    var categoryName = messagingEvent.postback.payload;
    var userid = messagingEvent.sender.id;
    console.log("postback_sender_id:------", userid);
    if (categoryName == "Get Started") {
        //greetingtext(messagingEvent,Get Started);
        thread.persistentMenu(fbpage_access_token);
        fbuserdetails(messagingEvent, userid);
        //sendTextMessage(userid, 'Get Started');
        console.log("categoryName", categoryName);
        //getStarted();
    }else if (categoryName == "Ok Goon") {
        mainPacks(categoryName, messagingEvent);
        console.log("categoryName", categoryName);
    }
    else if (categoryName == "Quizzes") {
        quizzesPacks(categoryName, messagingEvent);
        console.log("categoryName########", categoryName);
    }else{
      payloadText.sendContentPacks(categoryName, messagingEvent);
    }
}
// postback payload section end ********************************************

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    var messageId = message.mid;
    var msgwit_value;
    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    //getMessageFromWitAPI(messageText);
    console.log("*************messageText*************",messageText);
      var msgwit = messageText;
      //bot.getwitmessageText(msgwit);

      //var tb3;
        request({
            uri: 'https://api.wit.ai/message?v=20160526&q='+ msgwit,
            headers: {
                "Authorization": "Bearer USTWU2HGSIYGK3JBQX6EM2UGEQOS26ZX"
            }
        }, function(error, response) {
            if (error) {
                console.log("Error While geting response from Wit:", error);
            } else {
              var res = JSON.stringify(response);
              var res_data = response.body;
              var wit_res_data = JSON.parse(res_data);
              var wit_res_data_ent = wit_res_data.entities;
              var wit_res_data_intent =  wit_res_data_ent.intent;
              var wit_res_data_location = wit_res_data_ent.location;
              var wit_res_msg_id = wit_res_data.msg_id;

                console.log("Response from Wit--Res", res);
                //console.log("Response from Wit--response", response);
                console.log("Response from Wit--msg_id", wit_res_data.msg_id);
                console.log("Response from Wit************1", wit_res_data.entities);
                console.log("Response from Wit************2", wit_res_data_ent.intent);
                console.log("Response from Wit************3", wit_res_data_ent.location);
                console.log("Response from Wit************4", wit_res_data_intent);
                console.log("Response from Wit************5", wit_res_data_location);
                //console.log("Response from Wit************6", wit_res_data_intent.value);
                //var intentlength = wit_res_data_intent.length;
                if(JSON.stringify(wit_res_data_ent) === '{}') { //This will check if the object is empty
                  //sendHelpMessage(event);
                  textmessage(msgwit, event)
                  //sendContentPacks(msgwit, event)
                  console.log("wit_res_data_intent.length is Zero", wit_res_data_ent);
                  console.log("wit_res_data_intent.length is Zero", event);
                }else{
                for(var i=0;i<wit_res_data_intent.length;i++)
                {
                  var td1=wit_res_data_intent[i]["confidence"];
                  var td2=wit_res_data_intent[i]["type"];
                  var td3=wit_res_data_intent[i]["value"];
                }
                console.log("confidence************5",td1);
                console.log("type************5",td2);
              console.log("value************5", td3);
              msgwit_value = td3;
              console.log('******msgwit_value', msgwit_value);
            //  bot.getwitmsg(wit_res_msg_id,msgwit_value,msgwit);
              receivedtextmessage(msgwit_value, event);
            //  bot.wittest(msgwit_value);
            }

            }
        });
}


function mainPacks(categoryName, event){
  var senderID = event.sender.id;
  var messageData = {
      "recipient": {
          "id": senderID
      },
      "message":{
          "text":"Hey..tap what excites you more",
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Movies",
              "payload":"Movies"
            },
            {
              "content_type":"text",
              "title":"Sports",
              "payload":"Sports"
            },
            {
              "content_type":"text",
              "title":"Music",
              "payload":"Music"
            },
            {
              "content_type":"text",
              "title":"Celebrities",
              "payload":"Celebrities"
            },
            {
              "content_type":"text",
              "title":"What can you do?",
              "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
            }
          ]
        }
  }
  callSendAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
}

// Quick_reply payload section Start ********************************************
function receivedtextmessage(categoryName, event) {
    //var categoryName = messagingEvent.message.text;
    var userid = event.sender.id;
    //var quickButton =
      console.log("quickButton_postback:------", categoryName);
      console.log("postback_sender_id:------", userid);
      if (categoryName == "Quizzes") {
         quizzesPacks(categoryName, event);
         console.log("categoryName########", categoryName);
     }else if (categoryName == "Content Pack 1") {
       questionsPacks(1, event);
     }else if (categoryName == "Content Pack 2"){
       questionsPacks(2, event);
     }else if (categoryName == "Content Pack 3"){
       questionsPacks(3, event);
     }else{
       //payloadText.sendContentPacks(categoryName, event);
       searchText.googleSearchPacks(categoryName, event);
     }
}
// Quick_reply payload section End ********************************************
function textmessage(msgwit, messagingEvent){
  var msgText = messagingEvent.message.text;
  console.log("messaging_message:------",messagingEvent.message);
  console.log("messaging_message_text:------",messagingEvent.message.text);
  console.log("messaging_msgText:------",msgText);
  console.log("messaging_msgText:------:------",msgwit);
  //payloadText.sendContentPacks(msgText, messagingEvent);
  receivedtextmessage(msgText, messagingEvent);
};
// QuizzesPacks payload section Start ********************************************
function quizzesPacks(categoryName, event) {
  var senderID = event.sender.id;
  var messageData = {
      "recipient": {
          "id": senderID
      },
      "message":{
          "text":"Answer these Kicking Questions!!",
          "quick_replies":[
            {
              "content_type":"text",
              "title":"Content Pack 1",
              "payload":"Content Pack 1"
            },
            {
              "content_type":"text",
              "title":"Content Pack 2",
              "payload":"Content Pack 2"
            },
            {
              "content_type":"text",
              "title":"Content Pack 3",
              "payload":"Content Pack 3"
            },
            {
              "content_type":"text",
              "title":"What can you do?",
              "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
            }
          ]
        }
  }
  callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
}
// QuizzesPacks payload section End ********************************************
// QuestionsPacks payload section Start ********************************************
function questionsPacks(categoryName, event) {
//  var qusCategories = categoryName;
  var senderID = event.sender.id;
  // if(categoryName == "Content Pack 1"){
  //   categoryName = 1;
  // } else if (categoryName == "Content Pack 2"){
  //   categoryName = 2;
  // } else (categoryName == "Content Pack 3"){
  //   categoryName = 3;
  // }

  pool.getConnection(function(err, connection) {
  connection.query('SELECT * FROM fk_pack_multiple_item where type=? and pack_id in (select id from fk_content_pack where category_id=?)', ['Question',categoryName], function(err, rows) {
      //console.log("*************************-after", categoryName);
      console.log("*************************questionsPacks", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = event.sender.id;
          var contentList = [];
          // for (var i = 0; i < 5; i++) { //Construct request body
          //     var keyMap = {
          //         "title": rows[i].item_name,
          //         "image_url": rows[i].imageurl,
          //         "item_url": rows[i].imageurl
          //         // "buttons": [{
          //         //     "type": "postback",
          //         //     "title": "Read More",
          //         //     "payload": "USER_DEFINED_PAYLOAD"
          //         // }]
          //     };
          //     contentList.push(keyMap);
          // }
          var messageData = {
              "recipient": {
                  "id": senderID
              },
              "message":{
                  "text":rows[1].item_name,
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":rows[1].text1_content,
                      "payload":"1"
                    },
                    {
                      "content_type":"text",
                      "title":rows[1].text2_content,
                      "payload":"2"
                    },
                    {
                      "content_type":"text",
                      "title":rows[1].text3_content,
                      "payload":"3"
                    },
                    {
                      "content_type":"text",
                      "title":rows[1].text4_content,
                      "payload":"4"
                    },
                    {
                      "content_type":"text",
                      "title":"What can you do?",
                      "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                    }
                  ]
                }
          }
          callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(event);
      }
      connection.release();
  });
  });
}
// QuestionsPacks payload section End ********************************************

function sendTextMessage(recipientId, messageText) {
    var messageData = {
        "recipient": {
            "id": recipientId
        },
        "message": {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": contentList
                        }
                    }
                }
    };
    callSendAPI(messageData, 'https://graph.facebook.com/v2.6/me/messages');
}



function fbuserdetails(event, userid) {
    var url = 'https://graph.facebook.com/v2.6/' + userid + '?fields=first_name,last_name,locale,timezone,gender&access_token=' + fbpage_access_token + '';
    console.log("url", url);
    request({
        "uri": url,
        "method": 'GET'

    }, function(error, response, body) {
        var userprofiledata = JSON.parse(response.body);
        var username = userprofiledata.first_name;
        //console.log("--------:Response data:-------- ", JSON.stringify(body));
        console.log("--------:Response data:--------first_name ", userprofiledata.first_name);
        console.log("--------:Response data:--------last_name ", userprofiledata.last_name);
        console.log("--------:Response data:--------locale ", userprofiledata.locale);
        console.log("--------:Response data:-------- timezone", userprofiledata.timezone);
        console.log("--------:Response data:--------gender ", userprofiledata.gender);
        var senderID = event.sender.id;
        //var msg = 'Hi '+username+', A lot of exciting things are awaiting for you! Get kicking!';
        //var msg = 'Hi '+username+'! My name is Kicker.\n How may I come of any help to you today?';
        var msg = 'Hi '+username+'! My name is Kicker.\n \n I can help you get closer to your favorite celebrity with a lot of exciting things about them.\n\n Tap what excites you more';
        console.log("--------:Response data:--------gender ", msg);
        var messageData = {
            "recipient": {
                "id": senderID
            },
            "message":{
                "text":msg,
                "quick_replies":[
                  // {
                  //   "content_type":"text",
                  //   "title":"Politics",
                  //   "payload":"Politics"
                  // },
                  {
                    "content_type":"text",
                    "title":"Movies",
                    "payload":"Movies"
                  },
                  {
                    "content_type":"text",
                    "title":"Sports",
                    "payload":"Sports"
                  },
                  {
                    "content_type":"text",
                    "title":"Music",
                    "payload":"Music"
                  },
                  {
                    "content_type":"text",
                    "title":"Celebrities",
                    "payload":"Celebrities"
                  },
                  {
                    "content_type":"text",
                    "title":"What can you do?",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                  }
                ]
              }
            }
         callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            //console.error(response);
            console.error("Error while sending message:", error);
        }
    });
}

function sendHelpMessage(event){
    var userid = event.sender.id;
    var url = 'https://graph.facebook.com/v2.6/' + userid + '?fields=first_name,last_name,locale,timezone,gender&access_token=' + fbpage_access_token + '';
    console.log("url", url);
    request({
        "uri": url,
        "method": 'GET'

    }, function(error, response, body) {
        var userprofiledata = JSON.parse(response.body);
        var username = userprofiledata.first_name;
        //console.log("--------:Response data:-------- ", JSON.stringify(body));
        console.log("--------:Response data:--------first_name ", userprofiledata.first_name);
        console.log("--------:Response data:--------last_name ", userprofiledata.last_name);
        console.log("--------:Response data:--------locale ", userprofiledata.locale);
        console.log("--------:Response data:-------- timezone", userprofiledata.timezone);
        console.log("--------:Response data:--------gender ", userprofiledata.gender);
        var senderID = event.sender.id;
        var msg = 'Hey '+username+', How are you? \n \nDid you check these amazingly cool stuff on Fankick?';
        console.log("--------:Response data:--------gender ", msg);
        var messageData = {
            "recipient": {
                "id": senderID
            },

            "message":{
                "text":msg,
                //"text":"msg",
                "quick_replies":[
                  // {
                  //   "content_type":"text",
                  //   "title":"Politics",
                  //   "payload":"Politics"
                  // },
                  {
                    "content_type":"text",
                    "title":"Movies",
                    "payload":"Movies"
                  },
                  {
                    "content_type":"text",
                    "title":"Sports",
                    "payload":"Sports"
                  },
                  {
                    "content_type":"text",
                    "title":"Music",
                    "payload":"Music"
                  },
                  {
                    "content_type":"text",
                    "title":"Celebrities",
                    "payload":"Celebrities"
                  },
                  {
                    "content_type":"text",
                    "title":"What can you do?",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                  }
                ]
              }
            }
         callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
    });
}

function callSendAPI(body, url) {
    console.log("url", url);
    console.log("Body", body);
    request({
        uri: url,
        qs: {
            access_token: fbpage_access_token
        },
        method: 'POST',
        json: body,
        headers: {
            "Content-Type": "application/json"
        }
    }, function(error, response, body) {
        console.log("Response data: ", JSON.stringify(body));
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            //console.error(response);
            console.error("Error while sending message:", error);
        }
    });
}

app.listen(process.env.PORT);
