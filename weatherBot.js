// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

class WeatherBot extends ActivityHandler {
    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const replyText = `Echo: ${ context.activity.text }`;
            await context.sendActivity(MessageFactory.text(replyText, replyText));
            // By calling next() you ensure that the next BotHandler is run.
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
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        const reply = MessageFactory.suggestedActions(['Show weather', 'Know about me'], 'What do you want to do?');
        await turnContext.sendActivity(reply);
    }
}

module.exports.WeatherBot = WeatherBot;
