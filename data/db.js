const knex = require('knex');
const knexConfig = require('../knexfile.js');
const db = knex(knexConfig.development);

module.exports = {
    get,
    getById,
    add,
    getBy
}

function get() {
    return db('users').select('id', 'username', 'password');
}

function getById(id) {
    return db('users').where({id}).first();
}

async function add(user){
    const id = await db('users').insert(user);
    return getById(id);
}

function getBy(x) {
    return db('users').where(x);
}