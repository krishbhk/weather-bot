const { ActivityHandler } = require('botbuilder');
const validator = require('validator');
const { CardFactory } = require('botbuilder');

// The accessor names for the conversation flow and user profile state property accessors.
const CONVERSATION_FLOW_PROPERTY = 'CONVERSATION_FLOW_PROPERTY';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const FlightDetail = require('../resources/AdaptiveCards/flightDetail.json');

const question = {
    name: 'name',
    startCity: 'startCity',
    destCity: 'destCity',
    phone: 'phone',
    none: 'none'
};

let endDialog = '';

class BookFlightDialog extends ActivityHandler {
    constructor(conversationState, userState) {
        super();
        // The state property accessors for conversation flow and user profile.
        this.conversationFlow = conversationState.createProperty(CONVERSATION_FLOW_PROPERTY);
        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);

        // The state management objects for the conversation and user.
        this.conversationState = conversationState;
        this.userState = userState;

        this.onMessage(async (turnContext, next) => {
            const flow = await this.conversationFlow.get(turnContext, { lastQuestionAsked: question.none });
            const profile = await this.userProfile.get(turnContext, {});

            await BookFlightDialog.fillOutTravelProfile(flow, profile, turnContext);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    static async fillOutTravelProfile(flow, profile, turnContext) {
        const input = turnContext.activity.text;
        let result;
        switch (flow.lastQuestionAsked) {
        case question.none:
            endDialog = false;
            await turnContext.sendActivity("Let's get started. What is your name?");
            flow.lastQuestionAsked = question.name;
            break;

        case question.name:
            result = await this.validateName(input);
            if (result.success) {
                profile.name = result.name;
                await turnContext.sendActivity(`Greetings, ${ profile.name }`);
                await turnContext.sendActivity('Please enter your starting city');
                flow.lastQuestionAsked = question.startCity;
            } else {
                await turnContext.sendActivity(result.message);
            }
            break;

        case question.startCity:
            result = await this.ValidateCity(input);
            if (result.success) {
                profile.startCity = result.city;
                await turnContext.sendActivity(`Your flight will start from ${ profile.startCity }`);
                await turnContext.sendActivity('Please enter your destination city');
                flow.lastQuestionAsked = question.destCity;
            } else {
                await turnContext.sendActivity(result.message);
            }
            break;

        case question.destCity:
            result = await this.ValidateCity(input);
            if (result.success) {
                profile.destCity = result.city;
                await turnContext.sendActivity(`Your destination is ${ profile.destCity }`);
                await turnContext.sendActivity('Please enter your phone number to complete the registration');
                flow.lastQuestionAsked = question.phone;
            } else {
                await turnContext.sendActivity(result.message);
            }
            break;

        case question.phone:
            result = await this.ValidatePhone(input);
            if (result.success) {
                endDialog = true;
                profile.phone = result.phone;
                await turnContext.sendActivity(`Your flight reservation has been made with the following details:\n Name: ${ profile.name }\n Starting City: ${ profile.startCity }\n Destination: ${ profile.destCity }\n Phone no: ${ profile.phone }`);
                await turnContext.sendActivity({
                    attachments: [CardFactory.adaptiveCard(FlightDetail)]
                });
            }
        }
    }

    static async validateName(input) {
        const name = input && input.trim();
        return name !== undefined ? { success: true, name: name } : { success: false, message: 'Please enter a name that contains at least one character.' };
    }

    static async ValidateCity(input) {
        const validate = input;
        console.log(validate);
        return validate !== undefined ? { success: true, city: input }
            : { success: false, message: 'Please enter a city name that contains at least one character.' };
    }

    static async ValidatePhone(input) {
        const validate = validator.isMobilePhone(input);
        console.log(validate);
        if (validate) {
            return { success: true, phone: input };
        } else {
            return { success: false, message: 'Please enter a valid phone number' };
        }
    }

    async isDialogComplete() {
        return await endDialog;
    }
}
module.exports.BookFlightDialog = BookFlightDialog;
