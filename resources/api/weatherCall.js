const axios = require('axios');

module.exports.FetchWeather = async (city) => {
    const weather = {};

    var url = `https://api.openweathermap.org/data/2.5/weather?q=${ city }&appid=04fc7a4dafae99e95c248d7f6f4c7be2`;
    const result = await axios.get(url);
    console.log(result.data);

    weather.city = result.data.name;
    weather.weather = result.data.weather[0].main;
    weather.description = result.data.weather[0].description;
    weather.max_temp = result.data.main.temp_min;
    weather.min_temp = result.data.main.temp_max;

    return `Weather of ${ weather.city } is ${ weather.weather } and ${ weather.description } with Min Temperature : ${ weather.min_temp } and Max Temperature : ${ weather.max_temp }`;
};
