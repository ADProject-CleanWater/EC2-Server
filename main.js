//---------- MQTT----------
const mosquitto = require("mqtt");
const mqtt = require("./mqtt_lib");
//---------- MQTT----------

//---------- dotenv ----------
require("dotenv").config();
const MQTT_SERVER = process.env.MQTT_SERVER;
const MONGODB_SERVER = process.env.MONGODB_SERVER;
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

//------------------------------------------ function ------------------------------------------

const BME_Schema = (collection) => {
    let model = mongoose.Schema({
        temp: { type: Number, require: true },
        humi: { type: Number, require: true },
        alti: { type: Number, require: true },
        press: { type: Number, require: true },
        createdAt: { type: Date, default: Date.now },
    });
    var BME = mongoose.model(collection, model);
    return BME;
};

const PMS_Schema = (collection) => {
    let model = mongoose.Schema({
        pm1: { type: Number, require: true },
        pm25: { type: Number, require: true },
        pm10: { type: Number, require: true },
        createdAt: { type: Date, default: Date.now },
    });
    var PMS = mongoose.model(collection, model);
    return PMS;
};

const createPMS = (PMS, pm1, pm25, pm10) => {
    return new Promise((resolve, reject) => {
        let data = { pm1: pm1, pm25: pm25, pm10: pm10 };
        console.log(data);
        PMS.create(data, (err, post) => {
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
        .sort("-createdAt")
        .exec((err, datas) => {
            for (data of datas) {
                console.log(data);
            }
        });
};

//------------------------------------------ Main ------------------------------------------
var PMS = PMS_Schema("PMS");

mqtt.init(mosquitto);
const client = mqtt.connect(MQTT_SERVER);
mqtt.subscribe(["BME280", "PMS7003M"]);

client.on("message", async (topic, message, packet) => {
    console.log("[topic] : ", topic);
    console.log("[message] : " + message);

    if (topic == "PMS7003M") {
        PMS_data = JSON.parse(message);
        console.log(PMS_data);
        await createPMS(PMS, PMS_data.pm1, PMS_data.pm25, PMS_data.pm10)
            .then((result) => {
                console.log(result);
            })
            .catch((result) => {
                console.log(result);
            });
        showPMS(PMS);
    }
});

// mosquitto_pub -h 3.34.50.139 -t PMS7003M -m "{\"pm1\": \"1\", \"pm25\": \"25\", \"pm10\": \"10\"}"
