import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../utils/firebaseConfig';
import config from '../configs/web.config';
import UserModel from '../models/UserModel';



const getLogin = (req: Request, res: Response) => {
    // Ваш код для обработки запроса на страницу "index" здесь
    res.render('pages/login', {
        title: req.t('labelpageTitles.labelLogin'),
    });
};
const postLogin = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const userDoc = await db.collection('users').doc(username).get();

        if (!userDoc.exists) {
            return res.redirect('/login');
        }

        const userData = userDoc.data() as UserModel;

        if (!userData || !userData.password) {
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.redirect('/login');
        }

        const payload = { username: userData.username };

        jwt.sign(payload, process.env.sesionKey || config.sesionKey, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { httpOnly: true, secure: true });
            req.session!.isAuthenticated = true;
            req.session!.token = token;
            req.session!.user = { username }; // Set your user object here
            res.redirect('/index');
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).render("error", {
            error: true,
            title: req.t("labelpageTitles.LabelError"),
            name: req.t("labelpageTitles.LabelError"),
            breadcrumbs: [
                { label: req.t("labelpageTitles.labelHome"), url: "/" },
                { label: res.statusCode.toString(), url: null },
            ],
            messages: {
                pageTitle: req.t("erorMesages.500.pageTitle"),
                status: res.statusCode,
                text: req.t("erorMesages.500.text"),
            },
        });
    }
};
export default { getLogin, postLogin }