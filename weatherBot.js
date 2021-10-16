// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { ShowWeatherDialog } = require('./componentDialogs/showWeatherDialog');

class WeatherBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = conversationState.createProperty('dialogState');
        this.showWeatherDialog = new ShowWeatherDialog(this.conversationState, this.userState);

        this.previousIntent = this.conversationState.createProperty('previousIntent');
        this.conversationData = this.conversationState.createProperty('conversationData');

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await this.dispatchToIntentAsync(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save state changes. The load happened during the execution of the dialog
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMsg(context);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMsg(turnContext) {
        const { activity } = turnContext;
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMsg = `Welcome to weather bot. ${ activity.membersAdded[idx].name }.`;
                await turnContext.sendActivity(welcomeMsg);
                await this.sendDemoMsg(turnContext);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        const reply = MessageFactory.suggestedActions(['Show weather', 'Know about me'], 'What do you want to do?');
        await turnContext.sendActivity(reply);
    }

    async sendDemoMsg(turnContext) {
        const reply = 'This bot is still learning  feel free to send suggestions';
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context) {
        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});

        if (previousIntent.intentName && conversationData.endDialog === false) {
            currentIntent = previousIntent.intentName;
        } else if (previousIntent.intentName && conversationData.endDialog === true) {
            currentIntent = context.activity.text;
        } else {
            currentIntent = context.activity.text;
            await this.previousIntent.set(context, { intentName: context.activity.text });
        }
        switch (currentIntent) {
        case 'Show weather':
            console.log('In show weather case');
            await this.conversationData.set(context, { endDialog: false });
            await this.showWeatherDialog.run(context, this.dialogState);
            conversationData.endDialog = await this.showWeatherDialog.isDialogComplete(); // receives endDialog from showWeaterDialog
            if (conversationData.endDialog) {
                await this.previousIntent.set(context, { intentName: null });
                await this.sendSuggestedActions(context);
            }
            break;
        default:
            console.log('in default case');
        }
    }
}

module.exports.WeatherBot = WeatherBot;
