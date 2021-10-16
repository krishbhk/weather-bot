const axios = require('axios');

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

module.exports.weatherAPICall = async (step) => {
    var url = `https://api.openweathermap.org/data/2.5/weather?q=${ step.values.cityName }&units=metric&appid=${ process.env.weatherAPI }`;
    const result = await axios.get(url);
    const res = JSON.parse(result.body);
    const message = `It's ${ res.main.temp } degrees in ${ res.name }!`;
    console.log(message + ' fn control data ');
    return message;
    // return data;
};
