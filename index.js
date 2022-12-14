//---------- MQTT----------
const mosquitto = require("mqtt");
const mqtt = require("./mqtt_lib");
//---------- MQTT----------

//---------- dotenv ----------
require("dotenv").config();
const MQTT_SERVER = process.env.MQTT;
const MONGODB_SERVER = process.env.MongoURI;
//---------- dotenv ----------

//---------- Mongoose ----------
var mongoose = require("mongoose");
mongoose.connect(MONGODB_SERVER);
var db = mongoose.connection;

db.once("open", function () {
    console.log("DB connected");
});
db.on("error", function (err) {
    console.log("DB ERROR : ", err);
});
//---------- Mongoose ----------

//---------- Moment ----------
const moment = require("moment");
//---------- Moment ----------

//------------------------------------------ function ------------------------------------------

const BME_Schema = (collection) => {
    let model = mongoose.Schema({
        temp: { type: Number, require: true },
        humi: { type: Number, require: true },
        alti: { type: Number, require: false },
        press: { type: Number, require: false },
        date: { type: String, default: moment().format("YYYY/MM/DD HH:mm:ss")}
    });
    var BME = mongoose.model(collection, model);
    return BME;
};

const createBME = (BME, envData) => {
    return new Promise((resolve, reject) => {
        BME.create(envData, (err, post) => {
            if (err) {
                reject("MongoDB create error");
            } else {
                resolve("created!");
            }
        });
    });
};

const showBME = (BME) => {
    BME.find({})
        .sort({"date" : 1})
	.limit(3)
        .exec((err, datas) => {
            for (data of datas) {
                console.log(data);
            }
        });
};

const PMS_Schema = (collection) => {
    let model = mongoose.Schema({
        pm1: { type: Number, require: false },
        pm25: { type: Number, require: true },
        pm10: { type: Number, require: true },
        date: { type: String, default: moment().format("YYYY/MM/DD HH:mm:ss")}     // delete the dot and everything after },
    });
    var PMS = mongoose.model(collection, model);
    return PMS;
};

const createPMS = (PMS, pm) => {
    return new Promise((resolve, reject) => {
        PMS.create(pm, (err, post) => {
            if (err) {
                reject("MongoDB create error");
            } else {
                resolve("created!");
            }
        });
    });
};

const showPMS = (PMS) => {
    PMS.find({})
        .sort({"date" : 1})
	.limit(3)
        .exec((err, datas) => {
            for (data of datas) {
                console.log(data);
            }
        });
};

//------------------------------------------ Main ------------------------------------------
var PMS = PMS_Schema("PMS");
var BME = BME_Schema("BME");

mqtt.init(mosquitto);
const client = mqtt.connect(MQTT_SERVER);
mqtt.subscribe(["sensor/bme", "sensor/pms"]);

client.on("message", async (topic, message, packet) => {
    console.log("[topic] : ", topic);
    console.log("[message] : " + message);

    if (topic == "sensor/pms") {
        let PMS_data = JSON.parse(message);
        console.log(PMS_data);
        await createPMS(PMS, PMS_data)
            .then((result) => {
                console.log(result);
            })
            .catch((result) => {
                console.log(result);
            });
        showPMS(PMS);
    }

    if (topic == "sensor/bme") {
        let BME_data = JSON.parse(message);
        console.log(BME_data);
        await createBME(BME, BME_data)
            .then((result) => {
                console.log(result);
            })
            .catch((result) => {
                console.log(result);
            });
        showBME(BME);
    }
});

// mosquitto_pub -h 3.34.50.139 -t PMS7003M -m "{\"pm1\": \"1\", \"pm25\": \"25\", \"pm10\": \"10\"}"
// mosquitto_pub -h 3.34.50.139 -t BME280 -m "{\"temp\": \"26\", \"humi\": \"60\", \"alti\": \"10000\", \"press\": \"10\"}"
