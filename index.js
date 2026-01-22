import express from 'express'
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import path from 'path';
import { connectDB } from './lib/mongodb.js'
import Store from './models/store.js';
import session from 'express-session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/userData.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const app = express()
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 6
  }
}));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.get('/home', async (req, res) => {
  try {
    await connectDB()
    let accessToken = req.cookies.accessToken;
    console.log(accessToken);
    
    let decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'defaultjwtsecret');
    let user = await User.findOne({_id:decoded.id})
    let pages = await Store.find({username:user.username}, { page: 1, _id: 0 }).sort({ page: -1 }).limit(1)
    let pageNo;
    if (pages == '') {
      pageNo = 1
    }
    else {
      pageNo = pages[0].page + 1
    }
    res.render('index', { title: 'My Diary', page: pageNo, username: user.username })
  }
  catch (er) {
    console.log(er);
    
    res.status(500).json({ error: 'Server error' });
  }
})


app.post('/submit', async (req, res) => {
  await connectDB();
  let pages = await Store.find({ username: req.body.username }, { page: 1, _id: 0 }).sort({ page: -1 }).limit(1)
  let { pageNo: pageCurrent, date, setAction, sidebar, header, content,username } = req.body;
  let page;
  if (pages == '') {
    page = 1
    req.session.runningPage = 1
  }
  else {
    page = pages[0].page + 1
    req.session.runningPage = pages[0].page + 1;
  }
  if (setAction === 'save') {
    const newStore = new Store({
      sidebar,
      header,
      content,
      page,
      date,
      username
    });
    newStore.save()
    res.redirect('/home');
  }
  else if (setAction === 'prevpage') {
    req.session.pageChange = Number(JSON.parse(pageCurrent).page) - 1;
    res.redirect('/Pages')
  }
  else {
    req.session.pageChange = Number(JSON.parse(pageCurrent).page) + 1;
    if (req.session.pageChange >= req.session.runningPage) {
      return res.redirect('/home');
    }
    res.redirect('/Pages')
  }
})

app.get('/Pages', async (req, res) => {
  try {
    await connectDB()
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.redirect('/')
    }
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'defaultjwtsecret');
    let user = await User.findById(decoded.id);
    
    let pageData = await Store.findOne({ $and: [{ page: req.session.pageChange },{username:user.username}] });
    let date = JSON.parse(pageData.date);
    if (!pageData) {
      return res.status(404).send('Page not found');
    }
    res.render('pages', { title: 'My Diary', pageData: pageData, date: date })
  }
  catch (er) {
    console.log(er);
    res.status(500).json({ error: 'Server error' });
  }
})

app.get('/',(req,res)=>{
   res.render('login')
})

app.get('/signup',(req,res)=>{
  res.render('signup')
})

app.post('/signupData', async (req, res) => {
  const data = req.body;

  if (!data || !data.username || !data.password || !data.repassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (data.password !== data.repassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (data.username.length < 4 || data.username.length > 12) {
    return res.status(400).json({ message: 'Username must be 4-12 characters' });
  }

  if (data.password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  await connectDB();

  const existingUser = await User.findOne({ username: data.username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username allready taken' });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = new User({
    username: data.username,
    password: hashedPassword,
    occupation: data.occupation
  });

  await newUser.save();

  const accessToken = jwt.sign(
    { id: newUser._id },
    process.env.JWT_SECRET || 'defaultjwtsecret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: newUser._id },
    process.env.REFRESH_JWT_SECRET || 'defaultrefreshsecret',
    { expiresIn: '1d' }
  );
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 1 * 24 * 60 * 60 * 1000
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 1000
  });
  return res.status(201).json({
    message: 'User registered successfully',
    accessToken,
    refreshToken
  });
});

app.post('/autoLogin', async (req, res) => {
  await connectDB();
  const { accessToken, refreshToken } = req.cookies;
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'defaultjwtsecret');
    const user = await User.findById(decoded.id);
    return res.status(200).json({ message: 'Auto login successful', username: user.username });
  } catch (err) {
    // accessToken expired or invalid → try refresh token
    try {
      const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET || 'defaultrefreshsecret');
      const user = await User.findById(decodedRefresh.id);      
      if (!user) return res.status(401).json({ message: 'User not found' });
      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'defaultjwtsecret',
        { expiresIn: '1h' }
      );

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 60 * 60 * 1000
      });

      return res.status(200).json({ message: 'Access token refreshed', userId: user._id });
    } catch (refreshErr) {
      console.log(refreshErr);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
});


app.post('/loginData', async (req, res) => {
  const data = req.body;

  if (!data || !data.username || !data.password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  await connectDB();
  const user = await User.findOne({ username: data.username });
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'defaultjwtsecret',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_JWT_SECRET || 'defaultrefreshsecret',
    { expiresIn: '1d' }
  );
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 1 * 24 * 60 * 60 * 1000
  });
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 60 * 60 * 1000
  });
  return res.status(200).json({
    message: 'Login successful',
    accessToken,
    refreshToken
  });
})

app.post('/logout',(req,res)=>{
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json('logout');
})

app.get('/forgotPassword',(req,res)=>{
  res.render('forgotPassword')
})

app.post('/fetchData',async(req,res)=>{
  let { username } = await req.body
  console.log(username);
  
  await connectDB()
  await User.findOne({username:username})
  .then((data)=>{
    if(data){
      res.json({status:'ok',message:'User found'})
    }
    else{
      res.json({status:'error',message:'User not found'})
    }
  })
  .catch((er)=>{
    console.log(er);
    res.json({status:'error',message:'Server error'})
  })
})

app.post('/resetPassword',async(req,res)=>{
  let {username,password} = await req.body
  console.log('username',username,'password',password);
  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 10);
  let check = await User.updateOne({username:username},{password:hashedPassword})
  console.log(check);
  if(check.modifiedCount===1){
    res.json({status:'ok',message:'Password reset successfully'})
  }
  else{
    res.json({status:'error',message:'Password reset failed'})
  }
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
