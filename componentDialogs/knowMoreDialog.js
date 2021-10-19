const { WaterfallDialog, ComponentDialog, DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { ConfirmPrompt, ChoicePrompt, DateTimePrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');

const path = require('path');
const dotenv = require('dotenv');
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// const request = require('request');

const { CardFactory } = require('botbuilder');
const infoCard = require('../resources/AdaptiveCards/infoCard.json');

// const { LuisRecognizer, QnAMaker } = require('botbuilder-ai');

const CHOICE_PROMPT = 'CHOICE_PROPMT';
const CONFIRM_PROMPT = 'CONFIRM_PROPMT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROPMT';
const DATETIME_PROMPT = 'DATETIME_PROPMT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

let endDialog = '';

class KnowMoreDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super('KnowMore');

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.giveChoice.bind(this),
            this.giveInfo.bind(this),
            this.askQuestion.bind(this),
            this.getAnswer.bind(this)
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

    async giveChoice(step) {
        console.log('In give Choice');
        endDialog = false;
        return await step.prompt(CHOICE_PROMPT, 'Would you like to know more?', ['Yes', 'No']);
    }

    async giveInfo(step) {
        console.log('In giveInfo');
        if (step.result) {
            await step.context.sendActivity({
                attachments: [CardFactory.adaptiveCard(infoCard)]
            });
        }
        return await step.prompt(TEXT_PROMPT, '');
    }

    async askQuestion(step) {
        return await step.prompt(TEXT_PROMPT, 'What do yo want to know about?');
    }

    async getAnswer(step) {
        step.values.question = step.result;

        await step.context.sendActivity(`You asked me, ${ step.values.question }`);

        // TODO: implement LUIS and QnA to give answers based on different questions

        await step.context.sendActivity('Yet to be implemented!!');
        endDialog = true;
        return await step.endDialog();
    }

    async isDialogComplete() { // sends end dialog signal to weather bot
        return endDialog;
    }
}

module.exports.KnowMoreDialog = KnowMoreDialog;
