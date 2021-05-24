const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const app = express();
const knex = require('knex');
// http://knexjs.org/
app.use(bodyParser.json());
app.use(cors());

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'smartbrain'
  }
});

db.select('*').from('users').then(data => {
  console.log("here!")
  console.log(data);
})

const database = {
  users:[
    {
      id: '123',
      name: 'John',
      email: 'john@gmail.com',
      password: 'cookies',
      entries: 0,
      joined: new Date()
    },
    {
      id: '124',
      name: 'Sally',
      email: 'sally@gmail.com',
      password: 'bananas',
      entries: 0,
      joined: new Date()
    }
  ],
  login:[{
    id: '987',
    hash: '',
    email: 'john@gmail.com'
  }]

}

// login:[
//   id: '987',
//   hash: '',
//   email: 'john@gmail.com'
// ]
app.get('/', (req, res)=>{
  res.send(database.users)
})

app.post('/signin', (req, res) => {
  // console.log(req.body)
  // console.log(database.users[0])
  // if(req.body.email === database.users[0].email && req.body.password === database.users[0].password)
  //   {res.json(database.users[0]);} //res.json("success")
  // else
  //   {res.status(400).json('error logging in');}
  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data =>{
    // console.log(data[0]);
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    console.log(isValid);

    // isValid ? (
    //   return db.select('*').from('users').where('email','=', req.body.email)
    //     .then(user =>{ console.log(user);res.json(user[0]); })
    //     .catch(err => res.status(400).json("unable to user"))
    //
    // ) : (
    //   res.status(400).json('wrong credentials');
    //
    // )

    if(isValid){

      return db.select('*').from('users').where('email','=', req.body.email)
        .then(user =>{ console.log(user);res.json(user[0]); })
        .catch(err => res.status(400).json("unable to user"))
    }
    else {
      res.status(400).json('wrong credentials');
    }
  })
  .catch(err => res.status(400).json("wrong credentials"))
})

app.post('/register', (req, res)=>{
  const {email, name, password} = req.body;
  const hash = bcrypt.hashSync(password);
  // bcrypt.hash(password, null, null, function(err, hash) {
  //     console.log(hash);
  // });
  // database.users.push({
  //   id: '125',
  //   name: name,
  //   email: email,
  //   entries: 0,
  //   joined: new Date()
  // })
  db.transaction(trx =>{
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {

      return trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0],
          name: name,
          joined: new Date()
        }).then( user => {
          console.log(user)
          res.json(user[0])
        })

    })
    .then(trx.commit)
    .catch(trx.rollback)

  })
  .catch(err =>{res.status(400).json("unable to register")})
  // db('users')
  // .returning('*')
  // .insert({
  //   email: email,
  //   name: name,
  //   joined: new Date()
  // }).then( user => {
  //   console.log(user)
  //   res.json(user[0])
  // })
  // .catch(err =>{res.status(400).json("unable to register")})
  // res.json(database.users[database.users.length-1]);
})

app.get('/profile/:id', (req, res)=>{
  const {id} = req.params;
  // let found = false;

  database.users.forEach(user => {
    if (user.id === id){
      found = true;
      return res.json(user);
    }
  })

  db.select('*').from('users').where({
    id: id
  })
  .then( user => {
    console.log(user[0]);
    if (user.length){
      res.json(user[0]);
    }
    else{

      res.status(400).json('Not found');
    }

  })
  .catch( err => {res.status(400).json('Error getting user');})

  // if (!found)
  // {res.status(404).json('no such user');}
})

app.put('/image', (req, res)=>{
  const {id} = req.body;
  // let found = false;
  // database.users.forEach(user => {
  //   if (user.id === id){
  //     found = true;
  //     user.entries++;
  //     return res.json(user.entries);
  //   }
  // })

  db('users').where('id', '=', id)
  .increment('entries',1)
  .returning('entries')
  .then(entries => {
    console.log(entries);
    console.log(entries[0]);
    res.json(entries[0]);
  })
  .catch(err => {res.status(400).json('Unable to get entries');})

  // if (!found)
  // {res.status(404).json('not found');}
})

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(3000, ()=>{
  console.log('app is running on port 3000')
})
