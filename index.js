// =========================================================
// Best Buy Product Tracker
//
// API_KEY: api key from Best Buy Dev Account
// EMAIL_UNAME: Origin Email username
// EMAIL_PW: Origin email pw
// EMAIL_UNAME_TO: Email address to send notifications to
// =========================================================

const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();

// API Key from Best Buy
const API_KEY = process.env.API_KEY;

const mail = nodemailer.createTransport({
  service: 'gmail', // Based on an origin Gmail account
  auth: {
    user: process.env.EMAIL_UNAME, // Origin email address
    pass: process.env.EMAIL_PW // Origin email pw
  }
});

const mailOptions = {
  from: process.env.EMAIL_UNAME, // Origin email address
  to: process.env.EMAIL_UNAME_TO, // Receiving email address
  subject: 'PS5 IS IN STOCK!!',
  text: 'Go get your PS5 at Best Buy!!'
};


const requestsPerHour = 120; // Amount of API requests each hour. 
const emailsPerHour = 4; // Amount of success emails sent per hour
const totalEmailCounter = (requestsPerHour / emailsPerHour);
let currentEmailCounter = totalEmailCounter;
const sku = 6426149; // Product sku to search from website. 6426149 => PS5 Disc Version

// Request product status from Best Buy
const checkBestBuy = async () => {
  try {
    const data = await fetch(`https://api.bestbuy.com/v1/products(sku=${sku})?apiKey=${API_KEY}&sort=name.asc&show=name,sku,regularPrice,onlineAvailability,inStoreAvailabilityText,inStoreAvailability,addToCartUrl&facet=name&format=json`)
    .then(res => res.json())
    .then((data) => {
      console.log(data)
      if(data.products[0].onlineAvailability && data.products[0].inStoreAvailability) {
        mailOptions.text = 'PS5 is available online and in-store at Best Buy!!';
        sendMail();
      } else if(data.products[0].onlineAvailability) {
        mailOptions.text = 'PS5 is available online at Best Buy!!';
        sendMail();
      } else if(data.products[0].inStoreAvailability) {
        mailOptions.text = 'PS5 is available in store at Best Buy!!';
        sendMail();
      } else {
        console.log('PS5 is not available');
        currentEmailCounter = totalEmailCounter;
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// Send mail with given options
const sendMail = () => {
  // If it's time to send out mail
  if(checkMailLimit()) {
    mail.sendMail(mailOptions, (err, info) => {
      if(err) {
        console.log(err);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
};

// Checks if mail should be sent
const checkMailLimit = () => {
  if(currentEmailCounter === totalEmailCounter) {
    currentEmailCounter--;
    return true;
  }

  if(currentEmailCounter === 1) {
    currentEmailCounter = totalEmailCounter;
    return false
  }

  currentEmailCounter--;
  return false;
}

// Request interval 
setInterval(checkBestBuy, (60 / requestsPerHour * 60000));
