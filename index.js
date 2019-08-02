const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const knex = require('knex');
const knexConfig = require('./knexfile.js');
const db = knex(knexConfig.development);
const KnexSessionStore = require('connect-session-knex')(session);

const Users = require('./data/db.js');

const sessionConfig = {
    name: 'something',
    secret: `it's not a secret if I tell you`,
    cookie: {
        maxAge: 7200000,
        secure: false
    },
    httpOnly: true,
    resave: false,
    saveUninitialized: false,
  
    store: new KnexSessionStore({
        knex: db,
        tablename: 'sessions',
        sidfieldname: 'sid',
        createtable: true,
        clearInterval: 720000
    }),
};

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));





server.post('/api/register', (req, res) => {
    let user = req.body;
    const hash = bcrypt.hashSync(user.password, 10);
    user.password = hash;
  
    Users.add(user)
        .then(saved => {
            req.session.user = saved;
            res.status(201).json(saved);
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

server.post('/api/login', (req, res) => {
    let {username, password} = req.body;
  
    Users.getBy({username})
        .first()
        .then(user => {
            if (user && bcrypt.compareSync(password, user.password)) {
                req.session.user = user;
                res.status(200).json({message: `Welcome ${user.username}!`});
            }
            else {
                res.status(401).json({message: 'You shall not pass!'});
            }
        })
        .catch(error => {
            res.status(500).json(error);
        });
});

function restricted(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'You shall not pass!' });
    }
  }

server.get('/api/users', restricted, (req, res) => {
    Users.get()
        .then(users => {
            res.json(users);
        })
        .catch(err => res.send(err));
});

server.get('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.send(err);
            }
            else {
                res.send('cya nerd');
            }
        });
    }
});


const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`\n** Main screen turn on ${port} **\n`));