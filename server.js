import express from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";
import ejs from "ejs"

const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"MyMDb",
    password:"patospapados",
    port:"5432"
})

db.connect();

async function getReviews(){
 
    try{
        const result = await db.query("SELECT * FROM reviews ORDER BY id ASC")
        const data = result.rows;
        return data
    }catch(error){
        console.log("failed to get the reviews from db", error)
    }

}

const app = express();
const port = 3000;
const API_KEY = '943d49bb';

function encodeForApi(str) {
     return encodeURIComponent(str).replace(/%20/g, '+');
     }

async function movieById(id){
    try {
      const  response = await axios.get('https://www.omdbapi.com/?i='+ id +'&apikey='+API_KEY)
      const result = response.data
      return result
      
    }catch(error){
        console.log("failed to fetch movie from api",error)
    }
}

async function reviewByID(id){
    try{
        const response = await db.query("SELECT * FROM reviews WHERE id = $1",[id])
        const data = response.rows
        return data
    }catch(error){
        console.log("failed to retrieve review from db", error)
    }
}



app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))



app.get("/", async (req,res)=>{
    const movies = await getReviews()
    res.render("index.ejs",{movies})
    
})

app.post("/add-movie",(req,res)=>{
   res.render("add-movie.ejs")
})


app.post("/select-movie", async (req,res)=>{
    
const TitleSearch = encodeForApi(req.body.movieName);

    try {
      const  response = await axios.get('https://www.omdbapi.com/?t='+ TitleSearch +'&apikey='+API_KEY)
      const result = response.data
      const moviePoster = result.Poster;
      console.log(result)
      if (result.Response === 'False'){
        res.render("add-movie.ejs", {error: "Movie not found!"})
      }else{
         res.render("add-movie.ejs",{poster: moviePoster, result})
      }
     
    }catch(error){
        console.log("failed to fetch movie from api",error)
    }

})

app.post("/post-review", async (req,res)=>{
  const movieId = req.body.movieId
  const review = req.body.review
  const username = req.body.username
  const info = await movieById(movieId)
 
  if (username && review){
     try {
  await db.query("INSERT INTO reviews (movie_id, user_review, user_name, poster, title, year) VALUES ($1,$2,$3,$4,$5,$6)",[movieId, review, username, info.Poster, info.Title, info.Year]);
  }catch(error){
    console.log("failed to send info to db", error)
  }
    res.redirect("/")
  }else{
    res.send("A Review and Username are required before posting!")
  }

 
})

app.post("/edit-review", async (req,res)=>{
const id = req.body.id
const review = (await reviewByID(id))[0]
const info = await movieById(review.movie_id)
res.render("edit-review.ejs", {review, info})
})


app.post("/update-review", async (req,res)=>{
   
    const id = parseInt(req.body.movieId)
    
try{
  await db.query("UPDATE reviews SET user_review = $1, user_name = $2 WHERE id = $3", [req.body.review, req.body.username, id])
}catch(error){
    console.log("failed to update data base", error)
}finally{
    res.redirect("/")
}

})

app.post("/delete-review", async (req,res)=>{
    const id = req.body.id
try{
    await db.query("DELETE FROM reviews WHERE id= $1 ",[id])
}catch(error){
    console.log("failed to delete review from database",error)
} finally{
    res.redirect("/")
}

})




app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})