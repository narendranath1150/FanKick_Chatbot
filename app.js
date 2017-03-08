var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var mysql = require('mysql');
const fetch = require('node-fetch');
const crypto = require('crypto');
const thread = require('./modules/thread.js');
const payloadText = require('./modules/payload.js');
const searchText = require('./modules/search.js');
var googleTrends = require('google-trends-api');
//const bot = require('./wit.js');

var pool = mysql.createPool({
    connectionLimit : 1,
    host: 'ap-cdbr-azure-southeast-a.cloudapp.net',
    user: 'bb603e8108da6e',
    password: '3e384329',
    database: 'rankworlddev'
});

var quickMenu  = [
    {
      "content_type":"text",
      "title":"Movies 🎬",
      "payload":"Movies"
    },
    {
      "content_type":"text",
      "title":"Sports 🏆",
      "payload":"Sports"
    },
    {
      "content_type":"text",
      "title":"Music 🎶",
      "payload":"Music"
    },
    {
      "content_type":"text",
      "title":"TV Shows 📺",
      "payload":"TV Shows"
    }
];
var quickreply = [
  {
    "content_type":"text",
    "title":"Movies 🎬",
    "payload":"Movies"
  },
  {
    "content_type":"text",
    "title":"Sports 🏆",
    "payload":"Sports"
  },
  {
    "content_type":"text",
    "title":"Music 🎶",
    "payload":"Music"
  },
  {
    "content_type":"text",
    "title":"TV Shows 📺",
    "payload":"TV Shows"
  }
];

app.use(bodyParser.json());
var fbpage_access_token = 'EAADV2VT6AuUBAHyUBL8zV5dYdRCBE7ZCKYQvOWCu2kkWQSV1RCllfvMymjDhXZCBQ93IkOFDpVYjN1E8jCHYpHKdH6uwNuhYAyCGdHOv6VgVZCwI6BZCc3AwAc7CW17yNTXe1YE7GkegMHHz36ax5JZC01zllTmTnAQRe0ZB0U3wZDZD';

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
                      //receivedMessage(messagingEvent);
                      if(messagingEvent.message.quick_reply == undefined){
                        console.log("1messaging quick_reply payload:------", messagingEvent.message.text);
                        receivedMessage(messagingEvent);
                      }else{
                        console.log("2messaging quick_reply payload:------", messagingEvent.message.quick_reply);
                        quickpayload(messagingEvent)
                      }
                        //receivedMessage
                    }
                    //var msgText = messagingEvent.message.text;
                    // console.log("messaging :------", messagingEvent);
                    // console.log("messaging quick_reply payload:------", messagingEvent.message.quick_reply);
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
    // var catname = categoryName.toLowerCase();
    // console.log("catname", catname);
    console.log("???????????????????????categoryName?????????????????????",categoryName);
    var movietext = categoryName.search("%mname%");
               if(movietext == -1)
               {
                   var packId = parseInt(categoryName);
                   if (isNaN(packId)) {
                       //sendContentPacks(messageText, event);
                       var res = categoryName.toLowerCase();
                       console.log("********************************************************",res);
                       //payloadText.sendContentPacks(categoryName, messagingEvent);
                       payloadText.sendContentPacks(res, messagingEvent);
                   } else {
                       //sendContentPackItems(packId, messagingEvent);
                       celebrityid(packId, messagingEvent);
                       console.log("postback_sender_id:------", packId);
                   }
                   console.log("postback_sender_id:------", userid);
               }else{
                 //console.log("Yessssssss");
                 var moviename = categoryName.replace(" %mname%","");
                 //console.log("Yessssssss", moviename);
                 actorintro(messagingEvent, moviename);
                 //celebritymovies(messagingEvent, moviename);
               }
}
// postback payload section end *****************************
// Quick_Reply payload section start
function quickpayload(messagingEvent){
  console.log("entered in the quickpayload function");
  var quicktext = messagingEvent.message.quick_reply;
  var quickpayloadtext = quicktext.payload;
  var res = quickpayloadtext.toLowerCase();
  var userid = messagingEvent.sender.id;
  var movietext = quickpayloadtext.search("%m%");
   if(movietext == -1)
   {
     console.log("Not Movie");
     //receivedMessage(messagingEvent);
     var actortext = quickpayloadtext.search("%a%");
     if(actortext == -1){
       //receivedMessage(messagingEvent);
       //payloadText.sendContentPacks(res, messagingEvent);
       console.log("Not actor");
       var action = quickpayloadtext.search("%action%");
       var comedy = quickpayloadtext.search("%comedy%");
       var romance = quickpayloadtext.search("%romance%");
       var thriller = quickpayloadtext.search("%thriller%");
       var animation = quickpayloadtext.search("%animation%");
       var sociofantasy = quickpayloadtext.search("%socio-fantasy%");
         if(action == -1 && comedy == -1 && romance == -1 && thriller == -1 && animation == -1 && sociofantasy == -1){
           //receivedMessage(messagingEvent);
           var celpics = quickpayloadtext.search("%pictures%");
           var celmovies = quickpayloadtext.search("%movies%");
           var celnetworth = quickpayloadtext.search("%networth%");
           var celnews = quickpayloadtext.search("%news%");
           var celfamily = quickpayloadtext.search("%family%");
             if(celpics == -1 && celmovies == -1 && celnetworth == -1 && celnews == -1 && celfamily == -1){
             payloadText.sendContentPacks(res, messagingEvent);
             console.log("Not filem genre");
             }else{
             //var actorpics = quickpayloadtext.replace(" %a%","");
             //console.log("actor name", actorpics);
             celebritypics(messagingEvent,quickpayloadtext);
             }
         }else{
           //var actorname = quickpayloadtext.replace(" %a%","");
          console.log("filem genre", quickpayloadtext);
          moviesgenre(messagingEvent, quickpayloadtext);
         }
     }else{
       var actorname = quickpayloadtext.replace(" %a%","");
       console.log("actor name", actorname);
      filmactor(messagingEvent, actorname);
     }
    }else{
     //console.log("Yessssssss");
     var moviename = quickpayloadtext.replace(" %m%","");
     console.log("Yessssssss", moviename);
     quickmovies(messagingEvent, moviename);
   }
}
// Quick_Reply payload section start *********************************
// wit.ai function for verify the text in wit.ai
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
    var msgwit = messageText;
    console.log("*************messageText*************",messageText);
        request({
            uri: 'https://api.wit.ai/message?v=20161020&q='+ msgwit,
            headers: {
                //"Authorization": "Bearer USTWU2HGSIYGK3JBQX6EM2UGEQOS26ZX"
              "Authorization":  "Bearer LZ7DCQVUW3FWMSF4MAD35CSYUCMOW2W4"
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
              msgwit_value = td3.toLowerCase();
              console.log('******msgwit_value', msgwit_value);
             //bot.getwitmsg(wit_res_msg_id,msgwit_value,msgwit);
              receivedtextmessage(msgwit_value, event);
            //  bot.wittest(msgwit_value);
            }
            }
        });
}


//selected celebrity images***************************
function celebritypics(messagingEvent,quickpayloadtext){
  var genrearray = quickpayloadtext.split(',');
  var actername = genrearray[0];
  var subCategory = genrearray[1];
  console.log("actername",actername);
  console.log("type",subCategory);
  pool.getConnection(function(err, connection) {
  connection.query('select * from cc_film_celebrity_preference where name = ?',[actername], function(err, rows) {
    console.log("********filmactor*********", actername);
      //console.log("*************************-after", categoryName);
      console.log("*************************filmactor", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = messagingEvent.sender.id;
          var contentList = [];
          var quickList = [];
          var movieslist;
          var celebrityname;
          var keyMap;
          for (var i = 0; i < rows.length; i++) { //Construct request body
            celebrityname = rows[i].name;
            if(subCategory == "%pictures%"){
              keyMap = {
                    "type": "template",
                    "payload": {
                     "template_type": "generic",
                      "elements": [
                      {
                        "title": rows[i].name,
                        "image_url": rows[i].picture1,
                        "buttons": [
                        {
            			   "type":"web_url",
                           "url": rows[i].picture5,
                           "title":"More Pics"
                        }
                        ]
                      },
            		        {
                         "title": rows[i].name,
                        "image_url": rows[i].picture2,
                        "buttons": [
                        {
                          "type":"web_url",
                          "url": rows[i].picture5,
                          "title":"More Pics"
                        }
                        ]
                      },
                      {
                         "title": rows[i].name,
                        "image_url": rows[i].picture3,
                        "buttons": [
                        {
            				        "type":"web_url",
                           "url": rows[i].picture5,
                           "title":"More Pics"
                        }
                        ]
                      },
                      {
                        "title": rows[i].name,
                        "image_url": rows[i].picture4,
                        "buttons": [
                        {
                           "type":"web_url",
                           "url": rows[i].picture5,
                           "title":"More Pics"
                        }
                        ]
                      }
                      ]
                    }
                  }
                }else if (subCategory == "%movies%") {
                  console.log("celebrity Movies");
                  selectedactorfilems(messagingEvent,celebrityname);
                }else if (subCategory == "%networth%") {
                  console.log("celebrity networth");
                  var msg = ''+rows[i].name+' has earned '+rows[i].netWorth+' so far..';
                  keyMap = {
                        "type": "template",
                        "payload": {
                         "template_type": "generic",
                          "elements": [
                          {
                            "title": rows[i].netWorth,
                            "image_url": rows[i].picture3,
                            "subtitle":msg,
                            // "buttons": [
                            // // {
                            // //     "type":"web_url",
                            // //    "url": rows[i].picture5,
                            // //    "title":"More Pics"
                            // // }
                            // // {
                            // //   "type":"element_share"
                            // // }
                            // ]
                          }]
                        }
                      }
                }else if (subCategory == "%news%") {
                  console.log("celebrity news");
                  keyMap = {
                        "type": "template",
                        "payload": {
                         "template_type": "generic",
                          "elements": [{
                            "title": rows[i].name,
                            "image_url": rows[i].picture2,
                            "subtitle":rows[i].name,
                            "buttons": [{
                                "type":"web_url",
                                "url": rows[i].newslink,
                                "title":"Click for News"
                                }]
                            }]
                        }
                      }
                }else if (subCategory == "%family%") {
                  console.log("celebrity Family");
                  keyMap = {
                        "type": "template",
                        "payload": {
                         "template_type": "generic",
                          "elements": [
                          {
                            "title":rows[i].family,
                            "image_url":rows[i].picture4,
                            "subtitle":rows[i].name
                            // "buttons": [
                            // {
                            //     "type":"web_url",
                            //    "url": rows[i].picture5,
                            //    "title":"More Pics"
                            // }
                            // ]
                          }]
                        }
                      }
                }
              //contentList.push(keyMap);
          }

          var messageData = {
              "recipient": {
                  "id": senderID
              },
              "message": {
                  "attachment": keyMap,
                  "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Pictures",
                  "payload":celebrityname+' ,%pictures%'
                },
                {
                  "content_type":"text",
                  "title":"Movies",
                  "payload":celebrityname+' ,%movies%'
                },
                {
                  "content_type":"text",
                  "title":"Songs",
                  "payload":"Songs"
                },
                {
                  "content_type":"text",
                  "title":"Net Worth",
                  "payload":celebrityname+' ,%networth%'
                },
                {
                  "content_type":"text",
                  "title":"News",
                  "payload":celebrityname+' ,%news%'
                },
                {
                  "content_type":"text",
                  "title":"Family",
                  "payload":celebrityname+' ,%family%'
                },
                {
                  "content_type":"text",
                  "title":"Personal",
                  "payload":"Personal"
                },
                {
                  "content_type":"text",
                  "title":"Home 🏠",
                  "payload":"home"
                }]
              }
          }
          callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(messagingEvent);
      }
      connection.release();
  });
  });
}


//Selected actor filems from movies list
function selectedactorfilems(messagingEvent,celebrityname){
  console.log("*********Movies Genre***********",celebrityname);
  pool.getConnection(function(err, connection) {
  connection.query('select  * from cc_movies_preference where leadActor= ?',[celebrityname], function(err, rows) {
    console.log("*************************moviesgenre", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = messagingEvent.sender.id;
          var contentList = [];
          if(rows.length > 10){
            var rowslenth = 10;
            console.log("more than 10 Rows",rowslenth);
          }else{
          var rowslenth = rows.length;
          console.log("less than 10 Rows",rowslenth);
          }
          for (var i = 0; i < rowslenth; i++) { //Construct request body
              var keyMap = {
                  "title": rows[i].movieName,
                  "image_url": rows[i].picture1,
                  "buttons": [
                  //   {
                  //     "type": "web_url",
                  //     "url": rows[i].trailerUrl,
                  //     "title": "Trailer"
                  // },{
                  //     "type": "web_url",
                  //     "url": rows[i].movieDescriptionUrl,
                  //     "title": "Audio"
                  // },
                  {
                    "type": "postback",
                    "title": "More Info",
                    "payload": rows[i].movieName+' %mname%'
                    }]
              };
              contentList.push(keyMap);
          }
          var messageData = {
              "recipient": {
                  "id": senderID
              },
              "message":{
                "attachment": {
                  "type": "template",
                  "payload": {
                      "template_type": "generic",
                      "elements": contentList
                      }
                  },
                  "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Pictures",
                  "payload":celebrityname+' ,%pictures%'
                },
                {
                  "content_type":"text",
                  "title":"Movies",
                  "payload":celebrityname+' ,%movies%'
                },
                {
                  "content_type":"text",
                  "title":"Songs",
                  "payload":"Songs"
                },
                {
                  "content_type":"text",
                  "title":"Net Worth",
                  "payload":celebrityname+' ,%networth%'
                },
                {
                  "content_type":"text",
                  "title":"News",
                  "payload":celebrityname+' ,%news%'
                },
                {
                  "content_type":"text",
                  "title":"Family",
                  "payload":celebrityname+' ,%family%'
                },
                {
                  "content_type":"text",
                  "title":"Personal",
                  "payload":"Personal"
                },
                {
                  "content_type":"text",
                  "title":"Home 🏠",
                  "payload":"home"
                }
              ]
                }
          }
         callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(messagingEvent);
      }
      connection.release();
  });
  });

}

function moviesgenre(messagingEvent, quickpayloadtext){
  console.log("*********Movies Genre***********",quickpayloadtext);
  // var genre;
  // var subCategory;
  var genrearray = quickpayloadtext.split(',');
  var genre = genrearray[0];
  var subCategory = genrearray[1];
  console.log("Genre",genre);
  console.log("SubCategory",subCategory);
  pool.getConnection(function(err, connection) {
  connection.query('select * from cc_movies_preference where subCategory = (select id from cc_subcategories where subCategoryName = ?) and genre = ?',[subCategory,genre], function(err, rows) {
    console.log("*************************moviesgenre", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = messagingEvent.sender.id;
          var contentList = [];
          if(rows.length > 10){
            var rowslenth = 10;
            console.log("more than 10 Rows",rowslenth);
          }else{
          var rowslenth = rows.length;
          console.log("less than 10 Rows",rowslenth);
          }
          for (var i = 0; i < rowslenth; i++) { //Construct request body
              var keyMap = {
                  "title": rows[i].movieName,
                  "image_url": rows[i].picture1,
                  "buttons": [
                  //   {
                  //     "type": "web_url",
                  //     "url": rows[i].trailerUrl,
                  //     "title": "Trailer"
                  // },{
                  //     "type": "web_url",
                  //     "url": rows[i].movieDescriptionUrl,
                  //     "title": "Audio"
                  // },
                  {
                    "type": "postback",
                    "title": "More Info",
                    "payload": rows[i].movieName+' %mname%'
                    }]
              };
              contentList.push(keyMap);
          }
          var messageData = {
              "recipient": {
                  "id": senderID
              },
              "message":{
                "attachment": {
                  "type": "template",
                  "payload": {
                      "template_type": "generic",
                      "elements": contentList
                      }
                  },
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":"Action",
                      "payload":'Action,'+subCategory+',%action%'
                    },
                    {
                      "content_type":"text",
                      "title":"Animation",
                      "payload":'Animation,'+subCategory+',%animation%'
                    },
                    {
                      "content_type":"text",
                      "title":"Comedy",
                      "payload":'Comedy,'+subCategory+',%comedy%'
                    },
                    {
                      "content_type":"text",
                      "title":"Romance",
                      "payload":'Romance,'+subCategory+',%romance%'
                    },
                    {
                      "content_type":"text",
                      "title":"Thriller",
                      "payload":'Thriller,'+subCategory+',%thriller%'
                    },
                    {
                      "content_type":"text",
                      "title":"Socio-fantasy",
                      "payload":'Socio-fantasy,'+subCategory+',%socio-fantasy%'
                    },
                    {
                      "content_type":"text",
                      "title":"Latest News",
                      "payload":'Latest News,'+subCategory+',%news%'
                    },
                    {
                      "content_type":"text",
                      "title":"Jokes",
                      "payload":"Jokes"
                    },
                    {
                      "content_type":"text",
                      "title":"home 🏠",
                      "payload":"home"
                    }
                  ]
                }
          }
         callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(messagingEvent);
      }
      connection.release();
  });
  });

}




function actorintro(messagingEvent, moviename){
  var senderID = messagingEvent.sender.id;
  //var img = 'https://fankickdev.blob.core.windows.net/images/home_logo.png';
  //var msg = 'Amazing talent! Here is what I know about '+img+'';
  var messageData = {
      "recipient": {
          "id": senderID
      },
      // "message":{
      //     "text":"Here you go👉..."
      //     //"text":msg
      //   }
      "message":{
      "attachment":{
        "type":"audio",
        "payload":{
          "url":"https://petersapparel.com/bin/clip.mp3"
          }
        }
        }
      };
  callSendAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
  celebritymovies(messagingEvent, moviename);
}

//Getting the celebrity related movies from selected celebrity
function celebritymovies(messagingEvent, moviename){
console.log("*************Celebritymovies name************", moviename);
var Actor;
var Actress;
var director ;
var musicDirector;
pool.getConnection(function(err, connection) {
    connection.query('select  * from cc_movies_preference where movieName= ?', [moviename], function(error, rows) {
        if (error) {
            console.log('error while retriving content pack items from database', error);
        } else if (rows.length > 0) {
            var senderID = messagingEvent.sender.id;
            var contentList = [];
            for (var i = 0; i < rows.length; i++) { //Construct request body
              console.log('Getting the celebrity related movies from selected celebrity:', rows);
              var keyMap = {
                           "title": rows[i].movieName,
                           "image_url": rows[i].picture1,
                           //"item_url": rows[i].movieImageUrl,
                           "buttons": [{
                               "type": "web_url",
                               "url": rows[i].trailerUrl,
                               "title": "Trailer"
                           }
                           ,{
                               "type": "web_url",
                               "url": rows[i].songsUrl,
                               "title": "Audio"
                           },{
                               "type": "web_url",
                               "url": rows[i].reviews,
                               "title": "Review"
                           }
                         ]
                          };
                          contentList.push(keyMap);
                          actor = rows[i].leadActor;
                          actress = rows[i].leadActress;
                          director = rows[i].director;
                          musicDirector = rows[i].musicDirector;
                          console.log("actor",actor);
                          console.log("actor",actress);
                          console.log("actor",director);
                          console.log("actor",musicDirector);
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
                      "content_type":"text",
                      "title":actor,
                      "payload":actor+" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":actress,
                      "payload":actress+" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":director,
                      "payload":director+" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":musicDirector,
                      "payload":musicDirector+" %a%"
                    },{
                      "content_type":"text",
                      "title":"Similar Movie",
                      "payload":"Similar Movie"
                    },
                    {
                      "content_type":"text",
                      "title":"home 🏠",
                      "payload":"home"
                    }
                  ]
                }
            }
            callSendAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
        }
        connection.release();
    });
  });
}
//Getting the celebrity related movies from selected celebrity**************

function sendContentPackItems(packId, event) {
    //connection.query('select distinct item_id,item_name,item_type,item_image_url from fk_pack_multiple_item where pack_id = ? union all select distinct item_id,item_name,item_type,iteam_image_url from fk_pack_poll_item where pack_id = ?', [packId,packId], function(error, rows) {
pool.getConnection(function(err, connection) {
    connection.query('Select poll.item_name,poll.item_type,poll.iteam_image_url,poll.left_text,poll.right_text from rankworlddev.fk_pack_poll_item As poll Inner Join rankworlddev.fk_pack_content_items On rankworlddev.fk_pack_content_items.id = poll.item_id where rankworlddev.fk_pack_content_items.pack_id = ?', [packId], function(error, rows) {
        if (error) {
            console.log('error while retriving content pack items from database', error);
        } else if (rows.length > 0) {
            var senderID = event.sender.id;
            var contentList = [];
            for (var i = 0; i < rows.length; i++) { //Construct request body
                if (rows[i].item_type == 'Poll') {
                    //var it = 'Poll';
                    var keyMap = {
                        "title": rows[i].item_name,
                        "image_url": rows[i].iteam_image_url,
                        //"item_url": rows[i].iteam_image_url,
                        "buttons": [{
                            "type": "postback",
                            "title": rows[i].left_text,
                            "payload": rows[i].left_text
                        }, {
                            "type": "postback",
                            "title": rows[i].right_text,
                            "payload": rows[i].right_text
                        },{
                            "type": "postback",
                            "title": "No",
                            "payload": "rows[i].right_text"
                        }]
                    };
                } else {
                    var keyMap = {
                        "title": rows[i].item_name,
                        "image_url": rows[i].item_image_url,
                        "item_url": rows[i].item_image_url,
                        "buttons": [{
                            "type": "postback",
                            "title": "Read More",
                            "payload": "DEVELOPER_DEFINED_PAYLOAD"
                        }]
                    };
                }
                contentList.push(keyMap);
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
                      "quick_replies": quickMenu
                }
            }
            callSendAPI(messageData, 'https://graph.facebook.com/v2.6/592208327626213/messages');
        }
        connection.release();
    });
  });
}

//celebritiesdetails***************************************************
function celebrityid(categoryName,event){
  pool.getConnection(function(err, connection) {
    //connection.query('select * from cc_celebrity_preference where celebrityName=?',[categoryName], function(err, rows) {
    connection.query('select * from cc_celebrity_preference where id = ?',[categoryName], function(err, rows) {
        if (err) {
            console.log("Error While retriving content pack data from database:", err);
        } else if (rows.length) {
            var senderID = event.sender.id;
            var contentList = [];
            var quickList = [];
            var movieslist;
            console.log("*******cc_celebrity_preference data from database:*********", rows);
            var usercelebrityName;
            for (var i = 0; i < rows.length; i++) { //Construct request body
              usercelebrityName = rows[i].celebrityName;
              var movi = "Mov**"
              var readmorebtn = (usercelebrityName +",").concat(movi);
                var keyMap = {
                    "title": rows[i].celebrityName,
                    "image_url": rows[i].celebrityImageUrl,
                    //"subtitle":rows[i].description,
                  //  "item_url": rows[i].image_url,
                    // "buttons":[{
                    //     "type": "postback",
                    //     "title": "Read More",
                    //     "payload": readmorebtn
                    // }]
                };
                contentList.push(keyMap);
                movieslist = rows[i].lastFiveMovies;
                console.log("%%%%%%%%%%%%movieslist%%%%%%%%%%%%%",movieslist);
            }
            updateusercelebrity(usercelebrityName,senderID);
            var myarray = movieslist.split(',');
            for(var i = 0; i < myarray.length; i++)
            {
               console.log(myarray[i]);
              //  var res1 = myarray[i].concat(myarray[i]);
              //  console.log(res1);
              var moviearray = {
                 "content_type":"text",
                 "title":myarray[i],
                 "payload":myarray[i]+" %m%"
               }
               quickList.push(moviearray);
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
                    "quick_replies":quickList
                }
            }
            callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');

        } else {
            console.log("No Data Found From Database");
            sendHelpMessage(event);
            //sendImageMessage(event);
        }
        connection.release();
    });
    });
}
//celebritiesdetails ends*************************************
//updateing the celebritiesdetails in user_preforence
function updateusercelebrity(usercelebrityName,senderID){
  console.log("******************categoryName*************",usercelebrityName);
  console.log("******************senderID*************",senderID);
      pool.getConnection(function(err, connection) {
        connection.query('update cc_user_preference set favCelebrity= ? where facebookId=?',[usercelebrityName,senderID], function(err, rows) {
            if (err) {
                console.log("Error While retriving content pack data from database:", err);
            } else {
                console.log("No Data Found From Database");
                //sendHelpMessage(event);
                //sendImageMessage(event);
            }
            connection.release();
        });
        });
}
//updateing the celebritiesdetails in user_preforence******************************


function textmessage(msgwit, messagingEvent){
  var msgText = messagingEvent.message.text;
  console.log("messaging_message:------",messagingEvent.message);
  console.log("messaging_message_text:------",messagingEvent.message.text);
  console.log("messaging_msgText:------",msgText);
  console.log("messaging_msgText:------:------",msgwit);
  //payloadText.sendContentPacks(msgText, messagingEvent);
  receivedtextmessage(msgText, messagingEvent);
};

// Quick_reply payload section Start
function receivedtextmessage(categoryName, event) {
    //var categoryName = messagingEvent.message.text;
    var userid = event.sender.id;
    var categoryName = categoryName.toLowerCase();
    //var quickButton =
      console.log("quickButton_postback:------", categoryName);
      console.log("postback_sender_id:------", userid);
      payloadText.sendContentPacks(categoryName, event);
}
// Quick_reply payload section End *****************************


// get movies from the DB***********************************
function quickmovies(messagingEvent, moviename) {
  // var movie = moviename.replace(" %%","");
  console.log("quickmovies", moviename);
  var mname = moviename.trim();
  pool.getConnection(function(err, connection) {
  connection.query('select * from cc_movies_preference where movieName= ?',[mname], function(err, rows) {
    console.log("********quickmovies*********", mname);
      //console.log("*************************-after", categoryName);
      console.log("*************************quickmovies", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = messagingEvent.sender.id;
          var contentList = [];
          for (var i = 0; i < rows.length; i++) { //Construct request body
              var keyMap = {
                  "title": rows[i].movieName,
                  "image_url": rows[i].picture1,
                  //"item_url": rows[i].movieImageUrl,
                  "buttons": [{
                      "type": "web_url",
                      "url": rows[i].trailerUrl,
                      "title": "Trailer"
                  },{
                      "type": "web_url",
                      "url": rows[i].songsUrl,
                      "title": "Audio"
                  },{
                      "type": "web_url",
                      "url": rows[i].reviews,
                      "title": "Review"
                  }]
              };
              contentList.push(keyMap);
          }
          var messageData = {
              "recipient": {
                  "id": senderID
              },
              "message":{
                "attachment": {
                  "type": "template",
                  "payload": {
                      "template_type": "generic",
                      "elements": contentList
                      }
                  },
                  "quick_replies":[
                    {
                      "content_type":"text",
                      "title":rows[0].leadActor,
                      "payload":rows[0].leadActor +" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":rows[0].leadActress,
                      "payload":rows[0].leadActress +" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":rows[0].director,
                      "payload":rows[0].director +" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":rows[0].musicDirector,
                      "payload":rows[0].musicDirector +" %a%"
                    },
                    {
                      "content_type":"text",
                      "title":"home 🏠",
                      "payload":"home"
                    }
                  ]
                }
          }
          callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(messagingEvent);
      }
      connection.release();
  });
  });
}
// end get movies from the DB **************************

// get filmactor from the DB *******************************
function filmactor(messagingEvent, actorname) {
  console.log("filmactor", actorname);
  var aname = actorname.trim();
  pool.getConnection(function(err, connection) {
  connection.query('select * from cc_film_celebrity_preference where name = ?',[aname], function(err, rows) {
    console.log("********filmactor*********", aname);
      //console.log("*************************-after", categoryName);
      console.log("*************************filmactor", rows);
      if (err) {
          console.log("Error While retriving content pack data from database:", err);
      } else if (rows.length) {
          var senderID = messagingEvent.sender.id;
          var contentList = [];
          var quickList = [];
          var movieslist;
          var celebrityname;
          for (var i = 0; i < rows.length; i++) { //Construct request body
            var res1 = rows[i].id +",";
            var res2 = rows[i].celebrityName +",";
            var res3 = res2.concat(res1);
            var res5 = res3.concat(res2);
            celebrityname = rows[i].name;
              var keyMap = {
                  "title": rows[i].name,
                  "image_url": rows[i].picture1,
                  "subtitle":rows[i].name,
                //  "item_url": rows[i].image_url,
                  "buttons": [
                    {
                      "type":"web_url",
                      "url": rows[i].facebookHandle,
                      "title":"Facebook"
                  },
                  {
                    "type":"web_url",
                    "url": rows[i].twitterHandle,
                    "title":"Twitter"
                  }]
              };
              contentList.push(keyMap);
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
                  "quick_replies":[
                {
                  "content_type":"text",
                  "title":"Pictures",
                  "payload":celebrityname+' ,%pictures%'
                },
                {
                  "content_type":"text",
                  "title":"Movies",
                  "payload":celebrityname+' ,%movies%'
                },
                {
                  "content_type":"text",
                  "title":"Songs",
                  "payload":"Songs"
                },
                {
                  "content_type":"text",
                  "title":"Net Worth",
                  "payload":celebrityname+' ,%networth%'
                },
                {
                  "content_type":"text",
                  "title":"News",
                  "payload":celebrityname+' ,%news%'
                },
                {
                  "content_type":"text",
                  "title":"Family",
                  "payload":celebrityname+' ,%family%'
                },
                {
                  "content_type":"text",
                  "title":"Personal",
                  "payload":"Personal"
                },
                {
                  "content_type":"text",
                  "title":"Home 🏠",
                  "payload":"home"
                }
              ]
              }
          }
          callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
      } else {
          console.log("No Data Found From Database");
          sendHelpMessage(messagingEvent);
      }
      connection.release();
  });
  });
}
//End get filmactor name from the DB***************


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
        var senderID = event.sender.id;
        var msg = 'Hey '+username+', I am expecting a lot of noise, select the domain...';
        //var msg = 'Hey '+username+', How are you?';
        console.log("--------:Response data:--------sendHelpMessage1", msg);
        var messageData = {
            "recipient": {
                "id": senderID
            },

            "message":{
                "text":msg,
                //"text":"msg",
                "quick_replies":[
                  {
                    "content_type":"text",
                    "title":"Movies 🎬",
                    "payload":"Movies"
                  },
                  {
                    "content_type":"text",
                    "title":"Sports 🏆",
                    "payload":"Sports"
                  },
                  {
                    "content_type":"text",
                    "title":"Music 🎶",
                    "payload":"Music"
                  },
                  {
                    "content_type":"text",
                    "title":"TV Shows 📺",
                    "payload":"TV Shows"
                  }
                ]
              }
            }
         callSendAPI(messageData,'https://graph.facebook.com/v2.6/592208327626213/messages');
         //sendHelpMessageSecond(event, userid);
         if (!error && response.statusCode == 200) {
             var recipientId = body.recipient_id;
             var messageId = body.message_id;
             console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
             //searchText.sendHelpMessageSecond(event, userid);

         } else {
             console.error("Unable to send message.");
             //console.error(response);
             console.error("Error while sending message:", error);
         }
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
