const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()
// console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.38uxi.mongodb.net/burjAlArab?retryWrites=true&w=majority` ;

const app = express()

app.use(cors());
app.use(bodyParser.json());
const port = 5000

var serviceAccount = require("./configs/burj-al-arab-m44-firebase-adminsdk-ttpdi-a48502314c.json");
// const { CropLandscapeOutlined } = require('@material-ui/icons');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://burj-al-arab-m44.firebaseio.com"
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  
  app.post('/addBooking', (req, res) => {
      const newBooking = req.body;
      bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0); // this condition will send res when button is clicked when >0
      })
      console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
      const bearer = req.headers.authorization;

      if(bearer && bearer.startsWith('Bearer ')){  // verifying token **ppp**
        const idToken = bearer.split(' ')[1];
        console.log({ idToken });

        admin.auth().verifyIdToken(idToken)
        .then( decodedToken => {
          let tokenEmail = decodedToken.email;
          let queryEmail = req.query.email;

          if(tokenEmail === queryEmail){
            bookings.find({email: req.query.email})  // finding from database of our mongodb. {} is for filtering required objects
            .toArray((err, documents) => {
                res.send(documents);
            })
          }
          else {
            res.status(401).send('unauthorized access');
          }

        })
        .catch( error => {
          res.status(401).send('unauthorized access');
        });
      }
      else {
        res.status(401).send('unauthorized access');
      }
  })

});

app.listen(port)