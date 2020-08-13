const jwt = require('jsonwebtoken');

const secret = require('./facconfig');
const db = require('../../app');

function idValidation(facultyId){
    let l = facultyId.length;
    if(l === 6){
        let setFlag = false;
        var branchName ;
        const branch = facultyId.substr(0,3).toUpperCase();
        switch (branch) {
            case 'CSE' : setFlag = true;
                         branchName = "Computer Science and Engineering".toUpperCase();
                         break;

            case 'MEE' : setFlag = true;
                         branchName = "Mechanical Engineering".toUpperCase();
                         break;

            case 'CVE' : setFlag = true;
                         branchName = "Civil Engineering".toUpperCase();
                         break;

            case "AEE" : setFlag = true;
                         branchName = "Aeronautical Engineering".toUpperCase();
                         break;

            case 'MTE' : setFlag = true;
                         branchName = "Mechatronics Engineering".toUpperCase();
                         break;

            case 'ISE' : setFlag = true;
                         branchName = "Information Science and Engineering".toUpperCase();
                         break;

            case 'ECE' : setFlag = true;
                         branchName = "Electronics and Communication Engineering".toUpperCase();
                         break;
        
            default : break;
        }
        if(setFlag){
            return {
                branchName : branchName
            };
        }
        return null;
    }
    return null;
}

module.exports.requestHandler = async(req, res, next) =>{
    
    //because in front end already login flag is set to true...
    req.alreadySignin = true;
    if(!req.body.token){
        let err = new Error('Something went wrong!!! The required data not given');
        err.status = 400;
        return next(err);
    }
    if(req.body.facultyId){
        if(!req.body.name || !req.body.email || !req.body.photoUrl ||!req.body.uid || !req.body.phone){
            const err = new Error('Something went wrong!!! Data insufficient');
            err.status = 400;
            return next(err);
        }

        //Get the branch details from the faculty ID
        var idObj = idValidation(req.body.facultyId);

        if(!idObj){
            var err = new Error('Invalid Faculty ID');
            err.status = 400;
            return next(err);
        }

        req.facultyId = req.body.facultyId;
        req.branchName = idObj.branchName;
        req.alreadySignin = false;

        return next();
    }   
    return next();
};

module.exports.requestUser = async (req, res, next) => {
    try{
        var decoded = jwt.decode(req.body.token, { complete : true });
        var user = decoded.payload;
        req.uid = user.user_id;
        if(!req.alreadySignin){
            if(user.user_id !== req.body.uid || user.email !== req.body.email || user.name !== req.body.name || user.picture !== req.body.photoUrl){
            let err = new Error('The given Data Invalid for the operation');
            err.status = 400;
            return next(err);
            }
            req.uid = req.body.uid;
        }
        return next();
    }catch(err){
        return next(err);
    }
};


module.exports.checkToken = async (req, res, next) => {
    if(!secret.AuthSecret()){
        let err = new Error('Invalid operation');
        err.status = 400;
        return next(err);
    }
    req.secret = secret.AuthSecret();
    const header = req.headers['authorization'];
    if(typeof header !== 'undefined')
    {
       const bearer = header.split(' ');
       const token = bearer[1];
       req.token=token;
       return next();
     }
    let err = new Error('Invalid Headers');
    err.status = 401;
    return next(err);
};

module.exports.authorizeToken = async (req, res, next) => {
    if(!req.secret){
        let err = new Error('Invalid operation ;Login first');
        err.status = 401;
        return next(err);
    }
    try{
        const token = jwt.verify(req.token, req.secret);
        if(!token){
            let err = new Error('No User Found');
            err.status = 404;
            return next(err);
        }
        
        const uid = token.id;
        req.uid = uid;
        const docRef = await db.collection('faculties').doc(uid);
        const docData = (await docRef.get()).data();
        const userToken = docData.token;
        if(userToken.includes(req.token)){
            return next();        
        }
        let err = new Error('not valid user');
        err.status = 401;
        return next(err);   
    }catch(err){
        return next(err);
    }
};