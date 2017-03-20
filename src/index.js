let Router = require('express').Router;

export default function genRouter(conf) {
	let router = Router();

	if (conf.param === undefined || conf.model === undefined)
		return null;

	let genReq = (fun, route, confcallback, callback) => {
		if (!confcallback)
			confcallback = callback;
		if (confcallback.length >= 3) {
			fun.call(router, route, confcallback, callback);
		} else {
			fun.call(router, route, confcallback);
		}
	};

	let ErrHandler = (res, callback) => {
		return (err, thing) => {
			if (err)
				return res.status(500).send(err);
			if (!thing)
				return res.status(500).json(new Error("Nothing found"));

			if (callback)
				return callback(thing);
			return res.status(200).json(thing);
		};
	};

	let SubErrHandler = (res, thing) => {
		return (err) => {
			if (err)
				return res.status(500).send(err);

			return res.status(200).json(thing);
		};
	};

	// LIST
	genReq(router.get, '', conf.list, (req, res) => {
		conf.model.find({}).exec(ErrHandler(res));
	});

	// GET
	genReq(router.get, '/:' + conf.param, conf.get, (req, res) => {
		conf.model.findById(req.params[conf.param], ErrHandler(res));
	});

	// POST
	genReq(router.post, '', conf.post, (req, res) => {
		conf.model.create(req.body, ErrHandler(res));
	});

	// PUT
	genReq(router.put, '/:' + conf.param, conf.put, (req, res) => {
		delete req.body._id;
		conf.model.findByIdAndUpdate(req.params[conf.param], { $set: req.body }, ErrHandler(res));
	});

	// DELETE
	genReq(router.delete, '/:' + conf.param, conf.delete, (req, res) => {
		conf.model.findByIdAndRemove(req.params[conf.param], ErrHandler(res));
	});

	if (conf.subdocs) {
		conf.subdocs.forEach((subdoc) => {
			// LIST
			genReq(router.get, '/:' + conf.param + '/' + subdoc.path, subdoc.list, (req, res) => {
				conf.model.findById(req.params[conf.param], ErrHandler(res, (thing) => {
					res.status(200).json(thing.comments);
				}));
			});

			// GET
			genReq(router.get, '/:' + conf.param + '/' + subdoc.path + '/:' + subdoc.param, subdoc.get, (req, res) => {
				conf.model.findById(req.params[conf.param], ErrHandler(res, (thing) => {
					let subthing = subdoc.model(thing).id(req.params[subdoc.param]);
					SubErrHandler(res, subthing)(null);
				}));
			});

			// POST
			genReq(router.post, '/:' + conf.param + '/' + subdoc.path, subdoc.post, (req, res) => {
				conf.model.findById(req.params[conf.param], ErrHandler(res, (thing) => {
					subdoc.model(thing).push(req.body);
					thing.save(SubErrHandler(res, thing));
				}));
			});

			// PUT
			genReq(router.put, '/:' + conf.param + '/' + subdoc.path + '/:' + subdoc.param, subdoc.put, (req, res) => {
				conf.model.findById(req.params[conf.param], ErrHandler(res, (thing) => {
					delete req.body._id;
					Object.assign(subdoc.model(thing).id(req.params[subdoc.param]), req.body);
					thing.save(SubErrHandler(res, thing));
				}));
			});

			// DELETE
			genReq(router.delete, '/:' + conf.param + '/' + subdoc.path + '/:' + subdoc.param, subdoc.delete, (req, res) => {
				conf.model.findById(req.params[conf.param], ErrHandler(res, (thing) => {
					subdoc.model(thing).id(req.params[subdoc.param]).remove();
					thing.save(SubErrHandler(res, thing));
				}));
			});
		});
	}

	return router;
}
