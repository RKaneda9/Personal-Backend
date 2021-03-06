let express = require('express'),
    cors    = require('cors'),
    logging = require('../middleware/logging'),
    mailer  = require('../services/mailer'),
    status  = require('../helpers/status-codes'),
    action  = require('../helpers/action'),
    router  = express.Router(),
    models  = {
        messageMe: require('../models/contact/message-me')
    };

router.use(cors()); // https://github.com/expressjs/cors
router.use(logging);

router.post('/me', (req, res) => { 
    try {
        let check, model, data, defaultError;

        check        = models.messageMe.validateStructure(req.body);
        defaultError = "Oops...There was a problem sending your message. I have been notified of the error and will be fixing it ASAP!";

        if (!check.isValid) { 

            // TODO: there was an invalid structure response, we need to figure out why this happened.
            // log this somewhere....

            check.message = defaultError;

            return res.status(status.clientError.badRequest)
                      .json  (check);
        }

        check = models.messageMe.validateData(req.body);

        if (!check.isValid) {

            return res.status(status.clientError.badRequest)
                      .json  (check);
        }

        model = new models.messageMe(req.body);
        data  = {
            subject: `New message for raidenkaneda.com from ${model.firstname} ${model.lastname}`,
            body   : model.toTemplate()
        };

        mailer
            .send (data)
            .then (() => res.status(status.success    .noContent).send())
            .catch(e  => res.status(status.serverError.internal) .error ("An error occurred while attempting to send your message! I have been notified of the error.", e));
    }
    catch (e) {
        
        res
            .status(status.serverError.internal)
            .error ("An error occurred while attempting to send your message! I have been notified of the error.", e);
    }
});

module.exports = router;