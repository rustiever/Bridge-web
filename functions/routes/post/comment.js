const commentRouter = require('express').Router();
const firebase = require('firebase');

const db = require('../../auth/app');
const middleware = require('../../auth/authorization');

commentRouter.put('/', middleware.checkPost, middleware.checkToken, middleware.authorizeToken, async (req, res) => {
    try {
        if (!req.body.name || !req.body.data) {
            let err = new Error('Invalid Body');
            return res.status(400).send(err.toString());
        }
        const docRef = await db.collection('feeds').doc(req.body.postId);
        if (!(await docRef.get()).exists) {
            return res.status(204).send('No post data available');
        }

        const commentRef = await docRef.collection('comments').doc(req.uid);
        
        if((await commentRef.get()).exists){
            await commentRef.update({
                comment : firebase.firestore.FieldValue.arrayUnion({
                data: req.body.data,
                username: req.body.name,
                userType: req.usertype,
                time: firebase.firestore.Timestamp.now(),
                edited: false
                })
            });
        }
        else
        {
        await commentRef.set({
            comment : [{
            data: req.body.data,
            username: req.body.name,
            userType: req.usertype,
            time: firebase.firestore.Timestamp.now(),
            edited: false
            }]
        });
        }
        return res.status(200).send('done');
    } catch (err) {
        return res.send(err.toString());
    }
});

module.exports = commentRouter;