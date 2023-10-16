import { Express } from 'express';
import { Session } from 'express-session';

import jwt from 'jsonwebtoken';
import config from './configs/web.config';
import authMiddleware from './middlewares/authMiddleware';
import sessionMiddleware from './middlewares/sessionMiddleware';


interface CustomSession extends Session {
  isAuthenticated: boolean;
  user: any; // Replace with your user type
  token: any;
}
export default function (app: Express) {
  app.get('/', sessionMiddleware, (req, res) => {
    res.redirect('/index');
  });

  app.route('/index').get(authMiddleware, sessionMiddleware, (req, res) => {
    const session = req.session as CustomSession;
    console.log(session);
    res.render('pages/index', {
      session,
      title: req.t('labelpageTitles.labelHome'),
      name: req.t('labelpageTitles.labelHome'),
      breadcrumbs: [{ label: req.t('labelpageTitles.labelHome'), url: '/' }],
    });
  });

  app.route('/login').get(sessionMiddleware, (req, res) => {
    const session = req.session as CustomSession;
    console.log(session);
    res.render('pages/login', { title: req.t('labelpageTitles.labelLogin'), session });
  }).post((req, res) => {
    const { username, password } = req.body;
    const session = req.session as CustomSession;

    if ((username === 'admin' && password === 'admin') || (username === 'user' && password === 'password')) {
      const token = jwt.sign({ username }, process.env.sesionKey || config.sesionKey, { expiresIn: '1h' });

      // Assign values to session properties
      session.isAuthenticated = true;
      session.token = token;
      session.user = { username }; // Set your user object here

      res.redirect('/index');
    } else {
      res.redirect('/login');
    }
  });

  app.route('*').get(sessionMiddleware, (req, res) => {
    res.status(404).render('error', {
      title: req.t('labelpageTitles.LabelError'),
      name: req.t('labelpageTitles.LabelError'),
      breadcrumbs: [{ label: req.t('labelpageTitles.labelHome'), url: '/' }, { label: res.statusCode, url: null }],
      messages: {
        pageTitle: req.t('erorMesages.404.pageTitle'),
        status: res.statusCode,
        text: req.t('erorMesages.404.text'),
      },
    });
  });
}
