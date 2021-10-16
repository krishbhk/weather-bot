const { WaterfallDialog, ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const request = require('request');

const { CardFactory } = require('botbuilder');

const WeatherCard = require('../resources/AdaptiveCards/weatherCards.json');
// const weatherAPICall = require('../resources/api/weatherCall');

const CHOICE_PROPMT = 'CHOICE_PROPMT';
const CONFIRM_PROPMT = 'CONFIRM_PROPMT';
const TEXT_PROPMT = 'TEXT_PROPMT';
const NUMBER_PROPMT = 'NUMBER_PROPMT';
const DATETIME_PROPMT = 'DATETIME_PROPMT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
let endDialog = '';

class ShowWeatherDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super('showWeatherDialog');

        this.addDialog(new TextPrompt(TEXT_PROPMT));
        this.addDialog(new NumberPrompt(NUMBER_PROPMT));
        this.addDialog(new DateTimePrompt(DATETIME_PROPMT));
        this.addDialog(new ChoicePrompt(CHOICE_PROPMT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROPMT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            // this.firstStep.bind(this),
            this.getCityName.bind(this),
            this.getZipCode.bind(this),
            this.getStateName.bind(this),
            this.getCountryName.bind(this),
            this.confirmStep.bind(this),
            this.showResult.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);
        const dialogContext = await dialogSet.createContext(turnContext);

        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // async firstStep(step) {
    //     endDialog = false;
    //     return await step.prompt(CONFIRM_PROPMT, 'would you like to go ahead?', ['yes', 'no']);
    // }

    async getCityName(step) {
        // console.log('getCityName');
        // if (step.result === true) {
        endDialog = false;
        return await step.prompt(TEXT_PROPMT, "Enter city's name");
        // }
    }

    async getZipCode(step) {
        step.values.cityName = step.result;
        console.log('getZIPCode');
        return await step.prompt(NUMBER_PROPMT, 'Enter the Pin code:');
    }

    async getStateName(step) {
        step.values.zipCode = step.result;
        console.log('getStateName');
        return await step.prompt(TEXT_PROPMT, 'Enter state name:');
    }

    async getCountryName(step) {
        step.values.stateName = step.result;
        console.log('getCountryName');
        return await step.prompt(TEXT_PROPMT, 'Enter country name:');
    }

    async confirmStep(step) {
        step.values.countryName = step.result;

        const msg = `You have entered the following values ${ JSON.stringify(step.values.cityName) }`;
        // console.log(step);
        await step.context.sendActivity(msg);
        return await step.prompt(CONFIRM_PROPMT, 'Is this all correct?', ['Yes', 'No']);
    }

    async showResult(step) {
        if (step.result === true) {
            this.currentWeatherData(step).then((msg)=>{
                console.log(msg);
            });
            // const msg = weatherAPICall(step);
            // console.log(msg+"hihello");
            await step.context.sendActivity({
                // text: msg,
                attachments: [CardFactory.adaptiveCard(WeatherCard)]
            });
            endDialog = true;
            return await step.endDialog();
        }
    }

    async isDialogComplete() { // sends end dialog signal to weather bot
        return endDialog;
    }

    async currentWeatherData(step) {
        var url = `https://api.openweathermap.org/data/2.5/weather?q=${ step.values.cityName }&units=metric&appid=${ process.env.weatherAPI }`;
        let message = '';
        request(url, async function(err, response, body) {
            if (err) {
                console.log('error:', err);
                message = err;
                // return message;
            } else {
                console.log('body:', body);
                const res = await JSON.parse(body);
                message = `It's ${ res.main.temp } degrees in ${ res.name }!`;
                console.log(message + ' fn control data ');
                // return message;
            }
            return await message;
        });
        // return message;
    }
}

module.exports.ShowWeatherDialog = ShowWeatherDialog;
