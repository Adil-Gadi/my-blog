import express from "express";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();
const PORT = 8000;
const exe = "my-blog";

async function withDB(connect, doThis, errorFunction) {
      try {
            const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true,  useUnifiedTopology: true });
            const db = client.db(connect);

            await doThis(db);

            client.close();
      } catch(error) {
            errorFunction(error);
      }
}

app.use(express.static(path.join(__dirname, "/build")));
app.use(express.json());

app.get('/api/articles/:name', async (req, res) => {
      withDB("my-blog", async (db) => {
            const articleName = req.params.name;
            const articleInfo = await db.collection('articles').findOne({ name: articleName });
            res.status(200).json(articleInfo);
      }, (error) => {
            res.status(500).json({ message: 'Error connecting to db', error });
      });
});

app.post("/api/articles/:name/comments", (req,res) => {
      const { username, text } = req.body;
      const article = req.params.name;
      withDB(exe, async (db) => {
            const action = await db.collection("articles");
            const articleData = await action.findOne({name: article});
            const comments = articleData.comments;
            comments.push({
                  "username": username,
                  "text": text
            });

            await db.collection("articles").updateOne({ name: article }, {
                  "$set": {
                        "comments": comments
                  }
            });
            res.status(500).send(articleData);
      }, (error) => {
            res.status(500).json({ message: 'Error connecting to db', error });
      });
});

app.post("/api/articles/:name/upvotes", async (req,res) => {
      withDB(exe, async (db) => {
            const articleName = req.params.name;
            const action = await db.collection("articles");
            const article = await action.findOne({ name: articleName });
            action.updateOne({ name: articleName }, {
                  "$set": {
                        "upvotes": article.upvotes + 1
                  }
            });
            res.status(200).json(article);
      }, (error) => {
            res.status(500).json({ message: 'Error connecting to db', error });
      });
});

app.get("*", (req,res) => {
      res.sendFile(path.join(__dirname + "/build/index.html"));
})

app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));