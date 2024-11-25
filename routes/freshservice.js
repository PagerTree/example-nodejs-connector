var express = require('express');
var router = express.Router();
const axios = require('axios').default;
const _ = require('lodash');

const COMMENTER_ID = 123456789;

// Process all the webhooks from PagerTree and update Freshservice tickets accordingly
router.post('/', function(req, res, next) {
  pagertree_payload = req.body;

  console.log(pagertree_payload);

  switch(req.body.type){
    case 'alert.open':
      processAlertOpen(req, res, next);
      break;
    case 'alert.acknowledged':
      processAlertAcknowledged(req, res, next);
      break;
    case 'alert.resolved':
      processAlertResolved(req, res, next);
      break;
    default:
      console.log('Unknown Event Type');
      break;
  }
});

// Post a comment to a Freshservice ticket when an alert is opened in PagerTree
async function processAlertOpen(req, res, next){
  res.send('OK');

  console.log('Processing Alert Open');
  let freshserviceTicketId = _.get(req.body, 'data.s_log.content.params.freshdesk_webhook.ticket_id');

  if(!freshserviceTicketId){
    console.log('No Freshservice Ticket ID found in PagerTree payload');
    return;
  }

  let freshserviceTicketIdTokens = freshserviceTicketId.split('-');
  let freshserviceTicketIdNumber = _.last(freshserviceTicketIdTokens);

  let freshserviceApiUrl = `https://demo.freshservice.com/api/v2/tickets/${freshserviceTicketIdNumber}`;

  try {
    freshserviceResponse = await axios({
      method: 'post',
      url: freshserviceApiUrl,
      data: {
        "body": "Alert Opened in PagerTree",
        "private": true,
        "user_id": 1
      },
      auth: {
        username: process.env.FRESHSERVICE_API_KEY,
        password: ''
      }
    });
    console.log(freshserviceResponse.data);
  } catch (error) {
    console.log(error);
  }
}

// Add a note on the Freshservice ticket when an alert is acknowledged in PagerTree
async function processAlertAcknowledged(req, res, next){
  res.send('OK');
  // find out who acknowledged the alert in pagertree
  let pagertreeAcknowledgedBy = req.body.data.d_user;
  let pagertreeAcknowledgedByName = pagertreeAcknowledgedBy.name;
  let pagertreeAcknowledgedByEmail = _.first(pagertreeAcknowledgedBy.emails).email;

  // map that to a user in freshservice
  // https://api.freshservice.com/#filter_agents
  let freshserviceApiUrl = `https://demo.freshservice.com/api/v2/agents?query="email:'${pagertreeAcknowledgedByEmail}'"`;

  let freshserviceResponse = null;
  try {
    freshserviceResponse = await axios({
      method: 'get',
      url: freshserviceApiUrl,
      auth: {
        username: process.env.FRESHSERVICE_API_KEY,
        password: ''
      }
    });
  } catch (error) {
    console.log(error);

    
    return;
  }
  let freshserviceAgent = _.get(freshserviceResponse, 'data.agents.0');

  if(!freshserviceAgent){
    console.log('No Freshservice Agent found for PagerTree Acknowledged By');
    return;
  }

  // create a note in freshservice
  // https://api.freshservice.com/#create_note
  let freshserviceTicketId = _.get(req.body, 'data.s_log.content.params.freshdesk_webhook.ticket_id');

  if(!freshserviceTicketId){
    console.log('No Freshservice Ticket ID found in PagerTree payload');
    return;
  }

  let freshserviceTicketIdTokens = freshserviceTicketId.split('-');
  let freshserviceTicketIdNumber = _.last(freshserviceTicketIdTokens);


  freshserviceApiUrl = `https://demo.freshservice.com/api/v2/tickets/${freshserviceTicketIdNumber}?bypass_mandatory=true`;

  try {
    freshserviceResponse = await axios({
      method: 'put',
      url: freshserviceApiUrl,
      data: {
        "responder_id": freshserviceAgent.id
      },
      auth: {
        username: process.env.FRESHSERVICE_API_KEY,
        password: ''
      }
    });

    console.log(freshserviceResponse.data);
  } catch (error) {
    console.log(error);
  }

  freshserviceApiUrl = `https://demo.freshservice.com/api/v2/tickets/${freshserviceTicketIdNumber}/notes`;

  try {
    freshserviceResponse = await axios({
      method: 'post',
      url: freshserviceApiUrl,
      data: {
        "body": `Alert Acknowledged by ${pagertreeAcknowledgedByName} in PagerTree`,
        "private": true,
        "user_id": COMMENTER_ID
      },
      auth: {
        username: process.env.FRESHSERVICE_API_KEY,
        password: ''
      }
    });

    console.log(freshserviceResponse.data);
  } catch (error) {
    console.log(error);
  }
}

// Update the Freshservice ticket status to resolved when an alert is resolved in PagerTree
async function processAlertResolved(req, res, next){
  res.send('OK');
  // set ticket status to resolved in freshservice
  // https://api.freshservice.com/#update_ticket_priority
  console.log('Processing Alert Resolved');

  let freshserviceTicketId = _.get(req.body, 'data.s_log.content.params.freshdesk_webhook.ticket_id');

  if(!freshserviceTicketId){
    console.log('No Freshservice Ticket ID found in PagerTree payload');
    res.send('OK');
    return;
  }

  let freshserviceTicketIdTokens = freshserviceTicketId.split('-');
  let freshserviceTicketIdNumber = _.last(freshserviceTicketIdTokens);

  freshserviceApiUrl = `https://demo.freshservice.com/api/v2/tickets/${freshserviceTicketIdNumber}?bypass_mandatory=true`;

  try {
    freshserviceResponse = await axios({
      method: 'put',
      url: freshserviceApiUrl,
      data: {
        "status": 4
      },
      auth: {
        username: process.env.FRESHSERVICE_API_KEY,
        password: ''
      }
    });

    console.log(freshserviceResponse.data);
  } catch (error) {
    console.log(error);
  }
}

module.exports = router;
