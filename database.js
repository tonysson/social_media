const mongoose = require('mongoose');

class Database {

    constructor(){
        this.connect()
    }

    connect() {
            mongoose.connect(process.env.DATABASE_URL , {
            useNewUrlParser : true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        }).then(() => {
            console.log(`Connect succesfully to mongo db`.yellow.bold)
        }).catch(err => console.log("Db connection error" , err));
    }
    
}

module.exports = new Database();