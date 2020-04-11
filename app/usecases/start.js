const Markup = require("telegraf/markup");
const preferences = require("../services/preferences")();
const vvs = require("../services/vvs/vvs.js")();
const gplaces = require("../services/gplaces")();

module.exports = (db, oAuth2Client) => {
  const cal = require("../services/gcalendar")(db, oAuth2Client);
  this.onUpdate = (ctx, waRes) => {
    console.log("use case", waRes.generic[0].text);

    ctx.reply(waRes.generic[0].text);

    // const response = waRes.context.name;
    // console.log("Antwort", response);

    switch (waRes.generic[0].text) {
      case "start":
        ctx.reply("Hallo ich bin James!");
        ctx.reply("Erzähl mir doch ein bisschen was über dich.");
        ctx.reply("Wie heißt du?");
        break;

      case "start_name":
        preferences.set("name", waRes.context.name);
        ctx.reply("Hallo " + waRes.context.name + "\n Sag mir deine Email");
        break;

      case "start_email":
        preferences.set("email", waRes.context.email);
        ctx.reply(waRes.context.email + "\n Sag mir deine Adresse");
        break;

      case "start_address":
        preferences.set("home_address", waRes.context.address);
        vvs.getStopByKeyword(waRes.context.address).then((data) => {
          if (Array.isArray(data)) {
            const buttons = data.map((stop) => [Markup.callbackButton(stop.name, "start_sid_" + stop.stopID)]);
            ctx.reply("Wähle deine Haltstelle zuhause aus:", Markup.inlineKeyboard(buttons).extra());
          } else {
            preferences.set("home_stop", data.stopID);
            ctx.reply(`Ich habe deine Haltestelle: "${data.name}" gespeichert`);
          }
        });

        gplaces.getPlaces({query: waRes.context.address}).then((data) => {
          const location = data.results[0].geometry.location;
          const coordinates = location.lat+", "+location.lng;
          preferences.set("home_address_coordinates", coordinates);
        }).catch((err) => {
          console.log(err);
        });

        ctx.reply(waRes.context.address + "\n Sag mir deine Uni");
        break;

      case "start_uni":
        // preferences.set("home_address", waRes.context.address);
        ctx.reply(waRes.context.uni + "\n Sag mir deine Uni Email");
        break;

      case "start_uni_email":
        ctx.reply(waRes.context.uni_email);
        ctx.reply("So... jetzt richten wir deinen Kalender ein");

        cal.authenticateUser(ctx);
        break;

      case "start_oauth":
        cal.authenticateUser(ctx);
        break;

      case "start_is_authenticated":
        ctx.reply("Authentifiziert");

        cal.getCalendars().then((cals) => {
          const buttons = cals.map((resCal) => [Markup.callbackButton(resCal.summary, "start_cid_" + resCal.id)]);
          ctx.reply("Wähle deinen Vorlesungskalender aus:", Markup.inlineKeyboard(buttons).extra());
        }).catch((err) => {
          ctx.reply("Sorry, es gab einen Fehler!");
        });
        break;
    }
  };
  this.onCallbackQuery = (ctx) => {
    // remove "start_" prefix
    const buttonData = ctx.callbackQuery.data.split("_").slice(1).join("_");
    const indicator = buttonData.split("_")[0];
    const data = buttonData.split("_")[1];

    switch (indicator) {
      case "cid":
        preferences.set("lecture_cal_id", data);
        ctx.reply("Danke! Das war's.");
        break;
      case "sid":
        preferences.set("home_stop_id", data);
        ctx.reply("Wie ist deine Uni Adresse?");
        break;
    }
  };
  return this;
};
