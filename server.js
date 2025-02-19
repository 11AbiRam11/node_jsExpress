const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT;

// THIS IS TO ROUTE THE GET REQUEST FROM USER, AND THIS IS NOT A GOOD PRACTICE BECAUSE WE NEED TO EXPLICITLY METION EACH AN EVERY FILE TO LOAD
// app.get('/', (req, res) => {
//      res.sendFile(path.join(__dirname, 'public', 'index.html'));
// })
// app.get('/about', (req,res) => {
//      res.sendFile(path.join(__dirname, 'public', 'about.html'));
// })
        
// THIS IS THE TO LOAD ALL HTML FILES IN STATIC WAY(eerything is loaded to in chrom, user just move to different files)
// app.use(express.static(path.join(__dirname,'public')));
app.listen(port, () => console.log(`server is running on port ${port}`));

//lets pretend this data is stored in database
let posts = [
    { id: 1, title:"posts 1"},
    { id: 2, title:"posts 2"},
    { id: 3, title:"posts 3"}
]

//To get all posts 
app.get('/api/posts', (req, res) => {
    
    res.json(posts);
})

//To get a single particular post
app.get('/api/posts/:id', (req, res) => {

    const id = parseInt(req.params.id);
    const post = posts.find((post) => post.id === id)
    // res.status(200).json(posts.filter((post) => post.id === id));
    if (!post){
        res.status(404).json({ msg: `A post with id of ${id} was not found` });
    } else {
        res.status(200).json(post);
    }   
    // If user passes a limit parameter in browser we need to parse that too
    // const limit = parseInt(req.query.limit)
    // if (!isNaN(limit) && limit > 0)
    // {
    //     res.status(200).json(posts.slice(0, limit));
    // } else {
    //     res.json(posts);
    // }
    


    //this will handle the if there is no post in the database
})

app.get('/api/posts/:id', (req, re) => {
      const id = parseInt(req.params.id);
})
