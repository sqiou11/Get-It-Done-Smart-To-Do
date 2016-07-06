module.exports = function (app, appEnv) {
    console.log(appEnv);
    require('./main')(app, appEnv);
    require('./tasks')(app, appEnv);
    require('./categories')(app, appEnv);
    require('./web_log')(app, appEnv);
    require('./web_preference')(app, appEnv);
    require('./app_log')(app, appEnv);
};
