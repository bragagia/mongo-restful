let Router = require('express').Router;

export default function genRouter(conf) {
	let router = Router();

	if (conf.param === undefined)
		conf.param = 'thing';

	let genReq = (fun, route, confcallback, callback) => {
		if (!confcallback)
			confcallback = callback;
		if (confcallback.length >= 3) {
			fun.call(router, route, confcallback, callback);
		} else {
			fun.call(router, route, confcallback);
		}
	};

	let ErrHandler = (res) => {
		return (err, thing) => {
			if (err)
				return res.status(500).send(err);
			if (!thing)
				return res.status(500).json(new Error("Nothing found"));

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
	genReq(router.put, '/:' + conf.param, (req, res) => {
		delete req.body._id;
		conf.model.findByIdAndUpdate(req.params[conf.param], { $set: req.body }, ErrHandler(res));
	});

	// DELETE
	genReq(router.delete, '/:' + conf.param, conf.delete, (req, res) => {
		conf.model.findByIdAndRemove(req.params[conf.param], ErrHandler(res));
	});

	return router;
}
